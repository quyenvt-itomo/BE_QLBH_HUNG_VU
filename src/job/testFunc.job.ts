import { container } from "@/config/container";
import logger from "@/shared/utils/logger";

// Chạy các hàm tính lại dữ liệu mỗi 0h hàng ngày
export const TestFunctionJob = {
  start: async () => {
    const occurredAt = new Date("2026-01-01T00:00:00.000Z");
    logger.info(
      `[TestFunctionJob] Bắt đầu chạy hàm tính lại từ ngày ${occurredAt.toISOString()}`,
    );

    logger.info(
      `[TestFunctionJob] Hoàn thành chạy hàm tính lại từ ngày ${occurredAt.toISOString()}`,
    );
  },

  stop: () => {},
};
