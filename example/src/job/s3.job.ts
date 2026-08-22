import cron from "node-cron";
import { DataSource } from "typeorm";
import { File, FileStatus } from "@/database/models/File";
import { IsNull, Not } from "typeorm";
import { deleteFromS3, uploadToS3, isS3Enabled } from "@/shared/utils/s3Helper";
import logger from "@/shared/utils/logger";
import fs from "fs";

let dataSource: DataSource | null = null;

export function setS3JobDataSource(ds: DataSource) {
  dataSource = ds;
}

/**
 * Job: Upload local files lên S3 (1h sáng mỗi ngày).
 * Chỉ upload các file ACTIVE chưa được upload lên S3.
 */
async function uploadFilesToS3() {
  if (!dataSource) {
    logger.warn("[S3Upload] DataSource not initialized");
    return;
  }
  if (!isS3Enabled()) {
    logger.info("[S3Upload] S3 not configured, skipping");
    return;
  }

  try {
    const fileRepo = dataSource.getRepository(File);

    const files = await fileRepo.find({
      where: {
        isUploadedToS3: false,
        status: FileStatus.ACTIVE,
        deletedAt: IsNull() as any,
      },
      take: 100,
    });

    if (files.length === 0) return;

    logger.info(`[S3Upload] Found ${files.length} files to upload`);

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      try {
        if (!file.path || !fs.existsSync(file.path)) {
          logger.warn(`[S3Upload] File not found: ${file.path}`);
          continue;
        }

        const storageKey = await uploadToS3({
          filePath: file.path,
          entityType: file.entityType || "other",
          entityId: file.entityId || "temp",
          category: file.category || "files",
          fileName: file.fileName,
          mimeType:
            file.type === "image" ? "image/jpeg" : "application/octet-stream",
        });

        if (storageKey) {
          await fileRepo.update(file.id, {
            isUploadedToS3: true,
            storageKey,
          } as any);
          successCount++;
        } else {
          failCount++;
        }

        // Upload thumbnail if exists
        if (file.thumbnailPath && fs.existsSync(file.thumbnailPath)) {
          const thumbKey = await uploadToS3({
            filePath: file.thumbnailPath,
            entityType: `${file.entityType || "other"}_thumb`,
            entityId: file.entityId || "temp",
            category: file.category || "files",
            fileName: `thumb_${file.fileName}`,
            mimeType: "image/jpeg",
          });
          if (thumbKey) {
            await fileRepo.update(file.id, {
              thumbnailStorageKey: thumbKey,
            } as any);
          }
        }
      } catch (error) {
        failCount++;
        logger.error(`[S3Upload] Failed for ${file.fileName}:`, error);
      }
    }

    logger.info(
      `[S3Upload] Done: ${successCount} uploaded, ${failCount} failed`,
    );
  } catch (error) {
    logger.error("[S3Upload] Error:", error);
  }
}

/**
 * Job: Xóa S3 files cho các file đã bị soft-delete.
 */
async function cleanupS3DeletedFiles() {
  if (!dataSource) return;
  if (!isS3Enabled()) return;

  try {
    const fileRepo = dataSource.getRepository(File);

    const files = await fileRepo.find({
      where: {
        isUploadedToS3: true,
        deletedAt: Not(IsNull()),
      } as any,
      withDeleted: true,
      take: 500,
    });

    if (files.length === 0) return;

    logger.info(
      `[S3Cleanup] Found ${files.length} soft-deleted files to clean up`,
    );

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      try {
        if (file.storageKey) {
          await deleteFromS3(file.storageKey);
          if (file.thumbnailStorageKey) {
            await deleteFromS3(file.thumbnailStorageKey).catch(() => {});
          }
        }
        await fileRepo.update(file.id, { isUploadedToS3: false } as any);
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    logger.info(
      `[S3Cleanup] Done: ${successCount} deleted, ${failCount} failed`,
    );
  } catch (error) {
    logger.error("[S3Cleanup] Error:", error);
  }
}

let uploadJob: ReturnType<typeof cron.schedule> | null = null;
let cleanupJob: ReturnType<typeof cron.schedule> | null = null;

export const S3Jobs = {
  start: () => {
    // Upload job: 1h sáng mỗi ngày
    uploadJob = cron.schedule(
      "0 1 * * *",
      async () => {
        logger.info("[S3Jobs] Starting upload job");
        await uploadFilesToS3();
        await cleanupS3DeletedFiles();
      },
      { timezone: "Asia/Ho_Chi_Minh" },
    );
    logger.info(`[S3Jobs] Upload job registered`);

    // Cleanup job: 2h sáng mỗi ngày
    cleanupJob = cron.schedule(
      "0 2 * * *",
      async () => {
        logger.info("[S3Jobs] Starting cleanup job");
        await cleanupS3DeletedFiles();
      },
      { timezone: "Asia/Ho_Chi_Minh" },
    );
    logger.info(`[S3Jobs] Cleanup job registered`);
  },
  stop: () => {
    if (uploadJob) {
      uploadJob.stop();
      uploadJob = null;
    }
    if (cleanupJob) {
      cleanupJob.stop();
      cleanupJob = null;
    }
  },
};
