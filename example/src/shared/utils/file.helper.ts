import fs from "fs/promises";
import path from "path";
import { In, IsNull, Repository } from "typeorm";
import { File, FileStatus } from "@/database/models/File";
import DatabaseConfig from "@/config/database";
import logger from "@/shared/utils/logger";
import { getPresignedUrl, isS3Enabled } from "@/shared/utils/s3Helper";

/**
 * Resolve URL của file để FE có thể truy cập được.
 * Nếu file đã upload lên S3 → tạo presigned URL (có hạn 24h).
 * Nếu chưa → giữ nguyên url local.
 */
async function resolveFileUrl(file: File): Promise<string> {
  if (
    (file as any).isUploadedToS3 &&
    (file as any).storageKey &&
    isS3Enabled()
  ) {
    const presigned = await getPresignedUrl((file as any).storageKey, 86400); // 24h
    if (presigned) return presigned;
  }
  return file.url;
}

async function resolveThumbnailUrl(file: File): Promise<string | undefined> {
  if (
    (file as any).isUploadedToS3 &&
    (file as any).thumbnailStorageKey &&
    isS3Enabled()
  ) {
    const presigned = await getPresignedUrl(
      (file as any).thumbnailStorageKey,
      86400,
    );
    if (presigned) return presigned;
  }
  return file.thumbnailUrl || file.url;
}

/**
 * File Helper - Utility functions để xử lý files trong services
 */
export class FileHelper {
  private static async getFileRepo(): Promise<Repository<File>> {
    return DatabaseConfig.getRepository<File>(File as any);
  }

  /**
   * Confirm files sau khi tạo entity thành công
   * Update tempEntityId -> realEntityId
   *
   * @example
   * // Trong employee.service.ts - sau khi create employee
   * await FileHelper.confirmEntityFiles(tempId, employee.id);
   */
  static async confirmEntityFiles(
    tempEntityId: string,
    realEntityId: string,
  ): Promise<number> {
    const fileRepo = await this.getFileRepo();
    const result = await fileRepo.update(
      { entityId: tempEntityId, deletedAt: IsNull() },
      {
        entityId: realEntityId,
        status: FileStatus.ACTIVE,
        expiresAt: null,
      },
    );
    return result.affected ?? 0;
  }

  /**
   * Attach files vào single entity
   * Lấy files theo entityId và gom theo category
   *
   * @example
   * // Trong employee.service.ts - findById
   * const employee = await this.findById(id);
   * return await FileHelper.attachFilesToEntity(employee);
   */
  static async attachFilesToEntity<T extends { id: string } | null>(
    entity: T,
  ): Promise<T> {
    if (!entity) return entity;

    const grouped = await this.getEntityFiles(entity.id);
    return {
      ...entity,
      ...grouped,
    };
  }

  /**
   * Attach files vào array of entities
   * Tối ưu với 1 query cho tất cả entities
   *
   * @example
   * // Trong employee.service.ts - findAll
   * const employees = await this.findAll(options);
   * return await FileHelper.attachFilesToEntities(employees);
   */
  static async attachFilesToEntities<T extends { id: string }>(
    entities: T[],
  ): Promise<(T & Record<string, File[]>)[]> {
    if (!entities || entities.length === 0) return [];

    if (!entities || entities.length === 0) return [];

    const fileRepo = await this.getFileRepo();
    const entityIds = entities.map((e) => e.id);

    const allFiles = await fileRepo.find({
      where: {
        entityId: In(entityIds as any),
        status: FileStatus.ACTIVE,
        deletedAt: IsNull(),
      } as any,
      order: { isMain: "DESC", createdAt: "DESC" } as any,
    });

    const filesByEntity: Record<string, Record<string, File[]>> = {};

    for (const file of allFiles) {
      if (!file.entityId) continue;
      // Resolve S3 presigned URLs
      (file as any).url = await resolveFileUrl(file);
      if (!file.thumbnailUrl) {
        (file as any).thumbnailUrl =
          (await resolveThumbnailUrl(file)) || (file as any).url;
      }
      if (!file.thumbnailPath) {
        (file as any).thumbnailPath = file.path || "";
      }
      if (!filesByEntity[file.entityId]) filesByEntity[file.entityId] = {};
      const category = file.category || "other";
      if (!filesByEntity[file.entityId][category])
        filesByEntity[file.entityId][category] = [];
      filesByEntity[file.entityId][category].push(file);
    }

    return entities.map((entity) => {
      const entityFiles = filesByEntity[entity.id] || {};
      return {
        ...entity,
        ...entityFiles,
      };
    });
  }

  /**
   * Get files grouped by category cho 1 entity
   *
   * @example
   * const files = await FileHelper.getEntityFiles(employeeId);
   * // Returns: { avatar: [...], documents: [...] }
   */
  static async getEntityFiles(
    entityId: string,
  ): Promise<Record<string, File[]>> {
    const fileRepo = await this.getFileRepo();
    const files = await fileRepo.find({
      where: {
        entityId,
        status: FileStatus.ACTIVE,
        deletedAt: IsNull(),
      } as any,
      order: { isMain: "DESC", createdAt: "DESC" } as any,
    });

    const grouped: Record<string, File[]> = {};
    for (const file of files) {
      // Resolve S3 presigned URLs
      (file as any).url = await resolveFileUrl(file);
      if (!file.thumbnailUrl) {
        (file as any).thumbnailUrl =
          (await resolveThumbnailUrl(file)) || (file as any).url;
      }
      if (!file.thumbnailPath) {
        (file as any).thumbnailPath = file.path || "";
      }
      const category = file.category || "other";
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(file);
    }
    return grouped;
  }

  static async deleteFilesByEntityId(entityId: string): Promise<void> {
    try {
      const fileRepo = await this.getFileRepo();
      await fileRepo.softDelete({
        entityId,
      });
    } catch (error) {
      console.error(`Error deleting files for entityId ${entityId}:`, error);
    }
  }

  static async deleteFilesByIds(fileIds: string[]): Promise<void> {
    const uniqueFileIds = Array.from(new Set(fileIds.filter(Boolean)));
    if (uniqueFileIds.length === 0) return;

    try {
      const fileRepo = await this.getFileRepo();
      const files = await fileRepo.find({
        where: {
          id: In(uniqueFileIds),
        } as any,
      });

      for (const file of files) {
        if (file.path) {
          await fs.unlink(path.resolve(file.path)).catch(() => undefined);
        }

        if (file.thumbnailPath) {
          await fs
            .unlink(path.resolve(file.thumbnailPath))
            .catch(() => undefined);
        }
      }

      await fileRepo.delete({
        id: In(uniqueFileIds),
      } as any);
    } catch (error) {
      logger.error(
        `Failed to delete files by ids: ${uniqueFileIds.join(", ")}`,
        error,
      );
    }
  }
}
