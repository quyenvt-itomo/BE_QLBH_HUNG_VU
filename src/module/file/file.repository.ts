import { injectable } from "inversify";
import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { File } from "@/database/models/File";
import { FileSelectFull, FileRelations } from "./file.select";
import { Brackets, IsNull, LessThan, SelectQueryBuilder } from "typeorm";
import { StorageStats } from "./file.types";
import {
  EntityType,
  FileCategory,
  FileStatus,
  FileType,
} from "@/database/models/File";

/**
 * File Repository -  scoped
 * Query files trong schema tenant_{code}
 */
@injectable()
export class FileRepository extends BaseRepository<File> {
  protected entityClass = File;
  protected selectedFields = FileSelectFull;
  protected relations = FileRelations;

  // protected async extendQueryBuilder(
  //   qb: SelectQueryBuilder<File>,
  //   options: IFindPaginationOptions<File>,
  // ): Promise<void> {
  //   super.extendQueryBuilder?.(qb, options);
  //   if (options?.moreQuery?.groupId) {
  //     qb.andWhere("entity.groupId = :groupId", {
  //       groupId: options.moreQuery.groupId,
  //     });
  //   }

  //   if (options.type === FileType.IMAGE)
  //     qb.andWhere("entity.type = :image", { image: FileType.IMAGE });
  //   else qb.andWhere("entity.type <> :image", { image: FileType.IMAGE });

  //   qb.andWhere("entity.status = :active", { active: FileStatus.ACTIVE });
  // }

  // Set main file (đặt isMain=true, còn lại=false)
  async setMainFile(
    fileId: string,
    entityType: EntityType,
    entityId: string,
    category: FileCategory,
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
        status: FileStatus.ACTIVE,
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
      category?: FileCategory;
      status?: FileStatus;
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

  async findFilesMissingThumbnail(limit = 200): Promise<File[]> {
    const repo = this.getRepository();

    return repo
      .createQueryBuilder("file")
      .where("file.deletedAt IS NULL")
      .andWhere("file.type = :type", { type: FileType.IMAGE })
      .andWhere("file.category = :category", {
        category: FileCategory.IMAGE,
      })
      .andWhere("file.path IS NOT NULL")
      .andWhere(
        new Brackets((qb) => {
          qb.where("file.thumbnailPath IS NULL").orWhere(
            "file.thumbnailUrl IS NULL",
          );
        }),
      )
      .orderBy("file.createdAt", "ASC")
      .limit(limit)
      .getMany();
  }

  async updateThumbnailInfo(
    fileId: string,
    thumbnailPath: string,
    thumbnailUrl: string,
  ): Promise<void> {
    const repo = this.getRepository();
    await repo.update(
      { id: fileId, deletedAt: IsNull() },
      { thumbnailPath, thumbnailUrl },
    );
  }

  // Find pending files by entityId
  async findPendingFilesByEntity(entityId: string): Promise<File[]> {
    const repo = this.getRepository();
    return repo.find({
      where: {
        entityId,
        status: FileStatus.PENDING,
        deletedAt: IsNull(),
      },
    });
  }

  // Delete multiple files by IDs
  async deleteByIds(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const repo = this.getRepository();
    const result = await repo.softDelete(ids);
    return result.affected ?? 0;
  }
}
