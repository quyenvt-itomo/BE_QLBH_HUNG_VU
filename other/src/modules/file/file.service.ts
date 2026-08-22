import { inject, injectable } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { File } from "@/database/models/File";
import { FileRepository } from "./file.repository";
import { FILE_TYPES } from "./file.types";
import logger from "@/shared/utils/logger";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { NotFoundError } from "@/shared/types/errors";
import { ErrorsMessages } from "@/shared/constants/errors";
import {
  EntityTypeEnum,
  FileCategoryEnum,
  FileStatusEnum,
  FileTypeEnum,
} from "@/shared/constants/enum";

/**
 * File Service -  scoped
 * 3 methods chính: uploadMultiple, deleteFile, setMainFile
 * + cleanupPendingFiles cho background job
 */
@injectable()
export class FileService extends BaseService<File> {
  protected repository: FileRepository;
  protected searchableFields = [
    "filename",
    "originalName",
    "path",
    "url",
    "mimeType",
    "type",
    "thumbnailUrl",
    "thumbnailPath",
    "entityType",
    "category",
    "alt",
    "note",
  ];

  constructor(
    @inject(FILE_TYPES.FileRepository) private fileRepository: FileRepository,
  ) {
    super();
    this.repository = fileRepository;
  }

  /**
   * Upload multiple files
   * 1. Nhận files từ temp (upload middleware)
   * 2. Insert vào DB
   */
  async uploadMultiple(
    files: Express.Multer.File[],
    options: {
      entityId?: string;
      entityType?: EntityTypeEnum;
      category?: FileCategoryEnum;
      isActive?: boolean;
      isPublic?: boolean;
      metadata?: Record<string, any>;
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

        // Tạo file record trong DB với status PENDING
        const fileData: Partial<File> = {
          fileName: file.filename,
          originalName: file.originalname,
          path: destPath,
          url: `/uploads/${entityType || "other"}/${
            entityId || "temp"
          }/${category || "files"}/${file.filename}`,
          size: file.size,
          type,
          entityId: entityId || null,
          entityType: entityType || null,
          thumbnailPath: null,
          thumbnailUrl: null,
          category,
          isPublic: true,
          isMain: false,
          status: options.isActive
            ? FileStatusEnum.ACTIVE
            : FileStatusEnum.PENDING,
        };

        const dbFile = await this.create(fileData);

        // Move file từ temp vào thư mục tenant
        await fs.mkdir(destDir, { recursive: true });
        await fs.rename(file.path, destPath);

        // Generate thumbnail nếu là image
        if (type === FileTypeEnum.IMAGE) {
          try {
            const thumbnailData = await this.generateThumbnail(
              destPath,
              entityType,
              entityId,
              category,
            );
            if (thumbnailData) {
              await this.update(dbFile.id, {
                thumbnailPath: thumbnailData.path,
                thumbnailUrl: thumbnailData.url,
              });
              dbFile.thumbnailPath = thumbnailData.path;
              dbFile.thumbnailUrl = thumbnailData.url;
            }
          } catch (error) {
            logger.error(
              `Failed to generate thumbnail for ${file.originalname}`,
              error,
            );
          }
        }

        results.push(dbFile);
      } catch (error) {
        logger.error(`Failed to upload file ${file.originalname}`, error);
      }
    }

    return results;
  }

  /**
   * Delete file - Xóa trong DB và file vật lý
   */
  async deleteFile(fileId: string): Promise<void> {
    // Lấy thông tin file từ DB
    const file = await this.findById(fileId);

    if (!file) {
      throw new NotFoundError(`File not found: ${fileId}`, {
        field: "id",
        code: ErrorsMessages.not_found,
      });
    }

    // Xóa file vật lý
    try {
      await fs.unlink(file.path);
      if (file.thumbnailPath) {
        await fs.unlink(file.thumbnailPath);
      }
    } catch (error) {
      logger.error(`Failed to delete physical file ${file.path}`, error);
    }

    // Xóa trong DB
    await this.delete(fileId);
  }

  /**
   * Set file as main file
   * Đặt file làm main, các file khác trong cùng category thành false
   */
  async setMainFile(fileId: string): Promise<boolean> {
    const file = await this.findById(fileId);
    if (!file) {
      throw new NotFoundError(`File not found: ${fileId}`, {
        field: "id",
        code: ErrorsMessages.not_found,
      });
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
      status: options?.includeInactive ? undefined : FileStatusEnum.ACTIVE,
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

  /**
   * Detect file type từ MIME type
   */
  private detectFileType(mimeType: string): FileTypeEnum {
    if (mimeType.startsWith("image/")) return FileTypeEnum.IMAGE;
    if (mimeType.startsWith("video/")) return FileTypeEnum.VIDEO;
    if (mimeType.startsWith("audio/")) return FileTypeEnum.AUDIO;
    if (
      mimeType.includes("pdf") ||
      mimeType.includes("document") ||
      mimeType.includes("text") ||
      mimeType.includes("sheet") ||
      mimeType.includes("presentation")
    ) {
      return FileTypeEnum.DOCUMENT;
    }
    return FileTypeEnum.OTHER;
  }

  /**
   * Generate thumbnail cho image
   * Tạo ảnh nhỏ 300x300 (hoặc giữ tỷ lệ nếu ảnh nhỏ hơn)
   */
  private async generateThumbnail(
    imagePath: string,
    entityType?: EntityTypeEnum | null,
    entityId?: string | null,
    category?: FileCategoryEnum,
  ): Promise<{ path: string; url: string } | null> {
    try {
      const parsedPath = path.parse(imagePath);
      const thumbnailFilename = `${parsedPath.name}_thumb${parsedPath.ext}`;
      const thumbnailPath = path.join(parsedPath.dir, thumbnailFilename);

      // Generate thumbnail với sharp (max 300x300, giữ tỷ lệ)
      await sharp(imagePath)
        .resize(300, 300, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      const thumbnailUrl = `/uploads/${entityType || "other"}/${
        entityId || "temp"
      }/${category || "files"}/${thumbnailFilename}`;

      return {
        path: thumbnailPath,
        url: thumbnailUrl,
      };
    } catch (error) {
      logger.error("Failed to generate thumbnail", error);
      return null;
    }
  }
}
