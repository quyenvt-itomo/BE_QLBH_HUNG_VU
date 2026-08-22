import { inject, injectable } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { File } from "@/database/models/File";
import { FileRepository } from "./file.repository";
import { FILE_TYPES } from "./file.types";
import logger from "@/shared/utils/logger";
import fs from "fs/promises";
import path from "path";
import { constants as fsConstants } from "fs";
import { NotFoundError } from "@/shared/types/errors";
import {
  EntityType,
  FileCategory,
  FileStatus,
  FileType,
} from "@/database/models/File";
import sharp from "sharp";
import { deleteFromS3 } from "@/shared/utils/s3Helper";

/**
 * File Service -  scoped
 * 3 methods chính: uploadMultiple, deleteFile, setMainFile
 * + cleanupPendingFiles cho background job
 */
@injectable()
export class FileService extends BaseService<File> {
  protected repository: FileRepository;
  protected searchableFields = ["originalName", "path", "url"];

  constructor(
    @inject(FILE_TYPES.FileRepository) private fileRepository: FileRepository,
  ) {
    super();
    this.repository = fileRepository;
  }

  async resizeAvatar(inputPath: string, outputPath: string) {
    await sharp(inputPath)
      .resize(256, 256, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
  }

  async generateThumbnail(inputPath: string, outputPath: string) {
    await sharp(inputPath)
      .resize(360, 360, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 82 })
      .toFile(outputPath);
  }

  /**
   * Upload multiple files
   * 1. Nhận files từ temp (upload middleware)
   * 2. Insert vào DB
   * 3. Move files vào thư mục tenant: uploads/{tenantCode}/
   */
  async uploadMultiple(
    files: Express.Multer.File[],
    options: {
      entityId?: string;
      entityType?: EntityType;
      category?: FileCategory;
      isActive?: boolean;
      isPublic?: boolean;
      metadata?: Record<string, any>;
      groupId?: string;
    },
  ): Promise<File[]> {
    const { entityId, entityType, category } = options;
    const results: File[] = [];

    for (const file of files) {
      try {
        // Tạo đường dẫn đích trong thư mục tenant
        const destDir = path.join(
          process.cwd(),
          "uploads",
          entityType || "other",
          entityId || "temp",
          category || "files",
        );
        const destPath = path.join(destDir, file.filename);

        // Extract extension và type
        const extension = path.extname(file.originalname);
        const type = this.detectFileType(file.mimetype);

        const shouldGenerateThumbnail =
          type === FileType.IMAGE &&
          (category === FileCategory.IMAGE ||
            category === FileCategory.AVATAR ||
            category === FileCategory.ALBUM);
        const thumbnailFileName = `${path.parse(file.filename).name}_thumb.jpg`;
        const thumbnailDir = path.join(destDir, "thumb");
        const thumbnailPath = path.join(thumbnailDir, thumbnailFileName);
        const thumbnailUrl = `/uploads/${entityType || "other"}/${entityId || "temp"}/${category || "files"}/thumb/${thumbnailFileName}`;

        await fs.mkdir(destDir, { recursive: true });

        if (category === FileCategory.AVATAR) {
          await this.resizeAvatar(file.path, destPath);
          await fs.unlink(file.path);
        } else {
          await fs.rename(file.path, destPath);
        }

        if (shouldGenerateThumbnail) {
          await fs.mkdir(thumbnailDir, { recursive: true });
          await this.generateThumbnail(destPath, thumbnailPath);
        }

        // Tạo file record trong DB với status PENDING
        const fileData: Partial<File> = {
          fileName: file.filename,
          originalName: file.originalname,
          path: destPath,
          url: `/uploads/${entityType || "other"}/${entityId || "temp"}/${category || "files"}/${file.filename}`,
          storageKey: `${entityType || "other"}/${entityId || "temp"}/${category || "files"}/${file.filename}`,
          size: file.size,
          type,
          entityId: entityId || null,
          entityType: entityType || null,
          thumbnailPath: shouldGenerateThumbnail ? thumbnailPath : undefined,
          thumbnailUrl: shouldGenerateThumbnail ? thumbnailUrl : undefined,
          thumbnailStorageKey: shouldGenerateThumbnail
            ? `${entityType}_thumb/${thumbnailFileName}`
            : undefined,
          category,
          isPublic: true,
          isMain: false,
          status: options.isActive ? FileStatus.ACTIVE : FileStatus.PENDING,
        };

        const dbFile = await this.create(fileData);

        results.push(dbFile);
      } catch (error) {
        logger.error(`Failed to upload file ${file.originalname}`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Delete file — Xóa trong DB trước, sau đó thử xóa trên S3.
   * Nếu S3 xóa thất bại → giữ isUploadedToS3 = true để cleanup job thử lại.
   */
  async deleteFile(fileId: string): Promise<void> {
    const file = await this.findById(fileId);

    if (!file) {
      throw new NotFoundError("Không tìm thấy file");
    }

    const wasUploadedToS3 = (file as any).isUploadedToS3 === true;

    // Xóa file vật lý (nếu còn local)
    try {
      if ((file as any).path) {
        await fs.unlink((file as any).path);
      }
      if ((file as any).thumbnailPath) {
        await fs.unlink((file as any).thumbnailPath);
      }
    } catch (error) {
      logger.error(
        `Failed to delete physical file ${(file as any).path}`,
        error,
      );
    }

    // Xóa trong DB (soft-delete)
    await this.delete(fileId);

    // Thử xóa trên S3
    if (wasUploadedToS3 && (file as any).storageKey) {
      try {
        await deleteFromS3((file as any).storageKey);
        if ((file as any).thumbnailStorageKey) {
          await deleteFromS3((file as any).thumbnailStorageKey).catch(() => {});
        }
      } catch (error) {
        logger.warn(
          `[File] S3 delete failed for ${(file as any).storageKey}, will retry via cleanup job`,
        );
      }
    }
  }

  /**
   * Set file as main file
   * Đặt file làm main, các file khác trong cùng category thành false
   */
  async setMainFile(fileId: string): Promise<boolean> {
    const file = await this.findById(fileId);
    if (!file) {
      throw new NotFoundError("Không tìm thấy file");
    }

    if (!file.entityType || !file.entityId || !file.category) {
      throw new Error("File must have entityType, entityId, and category");
    }

    return await this.fileRepository.setMainFile(
      fileId,
      file.entityType,
      file.entityId,
      file.category,
    );
  }

  /**
   * Cleanup pending files (background job)
   * Xóa các file PENDING đã hết hạn (expiresAt < now)
   */
  async cleanupPendingFiles(): Promise<{
    deleted: number;
    failed: number;
  }> {
    const expiredFiles = await this.fileRepository.findExpiredFiles();

    let deleted = 0;
    let failed = 0;

    for (const file of expiredFiles) {
      try {
        await this.deleteFile(file.id);
        deleted++;
      } catch (error) {
        logger.error(`Failed to cleanup file ${file.id}`, error);
        failed++;
      }
    }

    logger.info(`Cleanup pending files: ${deleted} deleted, ${failed} failed`);

    return { deleted, failed };
  }

  /**
   * Confirm files: Update tempEntityId -> realEntityId
   * Gọi sau khi tạo entity thành công
   */
  async confirmFiles(
    tempEntityId: string,
    realEntityId: string,
  ): Promise<number> {
    return await this.fileRepository.batchUpdateEntityId(
      tempEntityId,
      realEntityId,
    );
  }

  /**
   * Get files by entity, grouped by category
   * Returns: { avatar: [...], album: [...], documents: [...] }
   */
  async getFilesByEntityGrouped(
    entityId: string,
    options?: { includeInactive?: boolean },
  ): Promise<Record<string, File[]>> {
    const files = await this.fileRepository.findByEntity(entityId, {
      status: options?.includeInactive ? undefined : FileStatus.ACTIVE,
    });

    // Group by category
    const grouped: Record<string, File[]> = {};
    for (const file of files) {
      const category = file.category || "other";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(file);
    }

    return grouped;
  }

  async getFilesByEntity(entityId: string): Promise<File[]> {
    const files = await this.fileRepository.findByEntity(entityId, {
      status: FileStatus.ACTIVE,
    });
    return files;
  }

  async backfillMissingThumbnails(options?: {
    batchSize?: number;
    maxBatches?: number;
  }): Promise<{
    scanned: number;
    updated: number;
    skippedMissingSource: number;
    failed: number;
  }> {
    const batchSize = Math.max(1, options?.batchSize ?? 200);
    const maxBatches = Math.max(1, options?.maxBatches ?? 50);

    let scanned = 0;
    let updated = 0;
    let skippedMissingSource = 0;
    let failed = 0;

    for (let batchIndex = 0; batchIndex < maxBatches; batchIndex++) {
      const candidates =
        await this.fileRepository.findFilesMissingThumbnail(batchSize);

      if (candidates.length === 0) {
        break;
      }

      scanned += candidates.length;

      for (const file of candidates) {
        try {
          if (!file.path) {
            skippedMissingSource++;
            continue;
          }
          await fs.access(file.path, fsConstants.F_OK);

          const fileName = file.fileName || path.basename(file.path);
          const thumbnailFileName = `${path.parse(fileName).name}_thumb.jpg`;
          const sourceDir = path.dirname(file.path);
          const thumbnailDir = path.join(sourceDir, "thumb");
          const thumbnailPath = path.join(thumbnailDir, thumbnailFileName);

          const fileUrl = file.url || "";
          const urlDir = path.posix.dirname(fileUrl);
          const thumbnailUrl = `${urlDir}/thumb/${thumbnailFileName}`;

          await fs.mkdir(thumbnailDir, { recursive: true });
          await this.generateThumbnail(file.path, thumbnailPath);

          await this.fileRepository.updateThumbnailInfo(
            file.id,
            thumbnailPath,
            thumbnailUrl,
          );
          updated++;
        } catch (error: any) {
          if (error?.code === "ENOENT") {
            skippedMissingSource++;
            continue;
          }

          failed++;
          logger.error(
            `Failed to backfill thumbnail for file ${file.id}`,
            error,
          );
        }
      }
    }

    logger.info(
      `Backfill thumbnails completed: scanned=${scanned}, updated=${updated}, skippedMissingSource=${skippedMissingSource}, failed=${failed}`,
    );

    return { scanned, updated, skippedMissingSource, failed };
  }

  /**
   * Detect file type từ MIME type
   */
  private detectFileType(mimeType: string): FileType {
    if (mimeType.startsWith("image/")) return FileType.IMAGE;
    if (mimeType.startsWith("video/")) return FileType.VIDEO;
    if (mimeType.startsWith("audio/")) return FileType.AUDIO;
    if (
      mimeType.includes("pdf") ||
      mimeType.includes("document") ||
      mimeType.includes("text") ||
      mimeType.includes("sheet") ||
      mimeType.includes("presentation")
    ) {
      return FileType.DOCUMENT;
    }
    return FileType.OTHER;
  }

  /**
   * Delete all pending files for a given entityId
   * Called when user closes form without saving
   */
  async deletePendingFilesByEntity(entityId: string): Promise<{
    deleted: number;
    failed: number;
  }> {
    const pendingFiles =
      await this.fileRepository.findPendingFilesByEntity(entityId);

    let deleted = 0;
    let failed = 0;

    for (const file of pendingFiles) {
      try {
        await this.deleteFile(file.id);
        deleted++;
      } catch (error) {
        logger.error(
          `Failed to delete pending file ${file.id} for entity ${entityId}`,
          error,
        );
        failed++;
      }
    }

    logger.info(
      `Deleted ${deleted} pending files for entity ${entityId}, ${failed} failed`,
    );

    return { deleted, failed };
  }

  /**
   * Xóa các file trong __trashFileIds (gọi khi update entity thành công).
   */
  async deleteTrashFiles(fileIds: string[]): Promise<void> {
    for (const id of fileIds) {
      try {
        await this.deleteFile(id);
      } catch (error) {
        logger.error(`Failed to delete trash file ${id}`, error);
      }
    }
  }
}
