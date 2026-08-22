import { Cron } from "croner";
import fs from "fs/promises";
import path from "path";
import logger from "@/shared/utils/logger";

const TEMP_UPLOAD_PATH = "uploads/temp";

async function clearTempFolder() {
  try {
    const files = await fs.readdir(TEMP_UPLOAD_PATH);

    for (const file of files) {
      const filePath = path.join(TEMP_UPLOAD_PATH, file);
      await fs.rm(filePath, { recursive: true, force: true });
    }

    logger.info(`[AutoClearTemp] Đã xóa toàn bộ file trong ${TEMP_UPLOAD_PATH}`);
  } catch (error) {
    logger.error(`[AutoClearTemp] Lỗi khi xóa temp folder: ${error}`);
  }
}

let job: Cron | null = null;

export const AutoClearTempJob = {
  start: () => {
    if (!job) {
      job = new Cron(
        "0 0 0 * * *", // 0h mỗi ngày
        { timezone: "Asia/Ho_Chi_Minh" },
        async () => {
          logger.info("[AutoClearTemp] Bắt đầu chạy job");
          await clearTempFolder();
        },
      );
      logger.info("[AutoClearTemp] Job đã được khởi động");
    }
  },

  stop: () => {
    if (job) {
      job.stop();
      job = null;
      logger.info("[AutoClearTemp] Job đã dừng");
    }
  },
};
