import { injectable } from "inversify";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { File } from "@/database/models/File";
import { FileSelectFull, FileRelations } from "./file.select";
import { IsNull, LessThan } from "typeorm";
import { StorageStats } from "./file.types";
import {
  EntityTypeEnum,
  FileCategoryEnum,
  FileStatusEnum,
} from "@/shared/constants/enum";

/**
 * File Repository -  scoped
 * Query files trong schema tenant_{code}
 */
@injectable()
export class FileRepository extends BaseRepository<File> {
  protected entityClass = File;
  protected selectedFields = FileSelectFull;
  protected relations = FileRelations;

  // Set main file (đặt isMain=true, còn lại=false)
  async setMainFile(
    fileId: string,
    entityType: EntityTypeEnum,
    entityId: string,
    category: FileCategoryEnum,
  ): Promise<boolean> {
    const repo = this.getRepository();

    await repo.update(
      { entityType, entityId, category, deletedAt: IsNull() },
      { isMain: false },
    );

    const result = await repo.update(fileId, { isMain: true });
    return (result.affected ?? 0) > 0;
  }

  // Batch update entityId (confirm flow)
  async batchUpdateEntityId(
    tempEntityId: string,
    realEntityId: string,
  ): Promise<number> {
    const repo = this.getRepository();

    const result = await repo.update(
      { entityId: tempEntityId, deletedAt: IsNull() },
      {
        entityId: realEntityId,
        status: FileStatusEnum.ACTIVE,
      },
    );

    return result.affected ?? 0;
  }

  // Find expired files
  async findExpiredFiles(): Promise<File[]> {
    const repo = this.getRepository();
    return repo.find({
      where: { expiresAt: LessThan(new Date()), deletedAt: IsNull() },
    });
  }

  // Find files by entity
  async findByEntity(
    entityId: string,
    options?: {
      category?: FileCategoryEnum;
      status?: FileStatusEnum;
      includeDeleted?: boolean;
    },
  ): Promise<File[]> {
    const repo = this.getRepository();
    const where: any = { entityId };

    if (options?.category) where.category = options.category;
    if (options?.status) where.status = options.status;
    if (!options?.includeDeleted) where.deletedAt = IsNull();

    return repo.find({
      where,
      order: { isMain: "DESC", createdAt: "DESC" },
    });
  }

  // Get storage statistics
  async getStorageStats(): Promise<StorageStats> {
    const repo = this.getRepository();

    const [files, total] = await repo.findAndCount({
      where: { deletedAt: IsNull() },
    });

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    const byType: Record<string, { count: number; size: number }> = {};
    const byCategory: Record<string, { count: number; size: number }> = {};

    files.forEach((file) => {
      if (!byType[file.type]) byType[file.type] = { count: 0, size: 0 };
      byType[file.type].count++;
      byType[file.type].size += file.size;

      if (file.category) {
        if (!byCategory[file.category])
          byCategory[file.category] = { count: 0, size: 0 };
        byCategory[file.category].count++;
        byCategory[file.category].size += file.size;
      }
    });

    return {
      totalFiles: total,
      totalSize,
      byType,
      byCategory,
    };
  }
}
