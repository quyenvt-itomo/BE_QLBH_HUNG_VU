import "reflect-metadata";
import fs from "fs/promises";
import path from "path";
import { config } from "@/config/env";
import DatabaseConfig from "@/config/database";
import { File } from "@/database/models/File";
import { IsNull, Not } from "typeorm";
import { uploadToS3, getS3Url, isS3Enabled } from "@/shared/utils/s3Helper";
import logger from "@/shared/utils/logger";

/**
 * Script: Đẩy các file chưa nằm trên cloud (isUploadedToS3 = false) lên S3.
 *
 * Vì nhiều máy local cùng connect 1 DB nên cột `path` (đường dẫn tuyệt đối) có thể
 * chỉ hợp lệ trên máy đã upload — script này KHÔNG dùng `path`, mà tìm file vật lý
 * trong thư mục uploads của dự án theo TÊN FILE (fileName) rồi đẩy lên cloud.
 *
 * Chạy: npm run upload:files
 */
const UPLOAD_DIR = config.UPLOAD_DIR;

/** Quét toàn bộ thư mục uploads một lần → index { fileName(thường) -> fullPath } */
async function buildFileNameIndex(): Promise<Map<string, string>> {
  const index = new Map<string, string>();
  const stack: string[] = [UPLOAD_DIR];

  while (stack.length) {
    const dir = stack.pop()!;
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      continue; // Thư mục không tồn tại / không đọc được → bỏ qua
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else {
        const key = entry.name.toLowerCase();
        // Giữ path đầu tiên nếu trùng tên (tránh trường hợp duplicate file name)
        if (!index.has(key)) index.set(key, fullPath);
      }
    }
  }

  return index;
}

async function main(): Promise<void> {
  if (!isS3Enabled()) {
    logger.warn(
      "[UploadFilesToCloud] S3 chưa được cấu hình (thiếu S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY / S3_BUCKET). Thoát.",
    );
    process.exit(1);
  }

  try {
    await DatabaseConfig.initialize();
    logger.info("[UploadFilesToCloud] Đã kết nối database");

    const fileRepo = DatabaseConfig.getRepository(File);

    // Các file chưa upload lên cloud (có entityId, chưa bị xóa)
    const pendingFiles = await fileRepo.find({
      where: {
        isUploadedToS3: false,
        entityId: Not(IsNull()),
        deletedAt: IsNull(),
      } as any,
    });

    logger.info(
      `[UploadFilesToCloud] Tìm thấy ${pendingFiles.length} file chưa lên cloud`,
    );

    if (pendingFiles.length === 0) {
      logger.info("[UploadFilesToCloud] Không có file nào cần xử lý");
      await DatabaseConfig.destroy();
      process.exit(0);
    }

    // Index toàn bộ file local một lần
    logger.info("[UploadFilesToCloud] Đang quét thư mục uploads...");
    const fileIndex = await buildFileNameIndex();
    logger.info(`[UploadFilesToCloud] Indexed ${fileIndex.size} file local`);

    let successCount = 0;
    let notFoundCount = 0;
    let failCount = 0;

    for (const file of pendingFiles) {
      try {
        const localPath = fileIndex.get(file.fileName.toLowerCase());
        if (!localPath) {
          notFoundCount++;
          logger.warn(
            `[UploadFilesToCloud] Không thấy file "${file.fileName}" (id=${file.id}) trong uploads`,
          );
          continue;
        }

        // Derive MIME type from file type enum
        const mimeType = (() => {
          switch (file.type) {
            case "image":
              return "image/jpeg";
            case "video":
              return "video/mp4";
            case "audio":
              return "audio/mpeg";
            case "document":
              return "application/pdf";
            default:
              return "application/octet-stream";
          }
        })();

        // Upload main file lên S3
        const s3Key = await uploadToS3({
          filePath: localPath,
          entityType: file.entityType || "other",
          entityId: file.entityId || "unknown",
          category: file.category,
          fileName: file.fileName,
          mimeType,
        });

        if (!s3Key) {
          failCount++;
          logger.error(
            `[UploadFilesToCloud] Upload thất bại: ${file.fileName}`,
          );
          continue;
        }

        const displayUrl = getS3Url(s3Key);

        // Upload thumbnail nếu có (tên quy ước: {basename}_thumb.jpg)
        let thumbnailS3Key: string | null = null;
        let thumbnailDisplayUrl: string | null = null;
        let thumbLocalPath: string | null = null;
        const thumbFileName = `${path.parse(file.fileName).name}_thumb.jpg`;
        thumbLocalPath = fileIndex.get(thumbFileName.toLowerCase()) ?? null;
        if (thumbLocalPath) {
          try {
            thumbnailS3Key = await uploadToS3({
              filePath: thumbLocalPath,
              entityType: file.entityType || "other",
              entityId: file.entityId || "unknown",
              category: `${file.category}/thumb`,
              fileName: thumbFileName,
              mimeType: "image/jpeg",
            });
            if (thumbnailS3Key) thumbnailDisplayUrl = getS3Url(thumbnailS3Key);
          } catch {
            // thumbnail không upload được → vẫn giữ main file
          }
        }

        // Cập nhật thông tin trên DB
        const updateData: any = {
          storageKey: s3Key,
          isUploadedToS3: true,
          path: null,
          url: displayUrl,
        };
        if (thumbnailS3Key) {
          updateData.thumbnailStorageKey = thumbnailS3Key;
          updateData.thumbnailUrl = thumbnailDisplayUrl;
          updateData.thumbnailPath = null;
        }
        await fileRepo.update(file.id, updateData);

        // Xóa file local sau khi đã đẩy lên cloud (giống retryS3Uploads)
        await fs.unlink(localPath).catch(() => {});
        if (thumbnailS3Key && thumbLocalPath) {
          await fs.unlink(thumbLocalPath).catch(() => {});
        }

        successCount++;
        logger.info(
          `[UploadFilesToCloud] ✅ Đã đẩy "${file.fileName}" lên cloud`,
        );
      } catch (err) {
        failCount++;
        logger.error(
          `[UploadFilesToCloud] Lỗi xử lý "${file.fileName}" (id=${file.id}):`,
          err,
        );
      }
    }

    logger.info(
      `[UploadFilesToCloud] Hoàn tất: ${successCount} đã đẩy lên cloud, ${notFoundCount} không thấy file local, ${failCount} lỗi`,
    );

    await DatabaseConfig.destroy();
    process.exit(0);
  } catch (error) {
    logger.error("[UploadFilesToCloud] Lỗi tổng:", error);
    await DatabaseConfig.destroy().catch(() => {});
    process.exit(1);
  }
}

main();
