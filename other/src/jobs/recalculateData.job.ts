import { Cron } from "croner";
import logger from "@/shared/utils/logger";

import { container } from "@/config/container";
import DatabaseConfig from "@/config/database";
import { Store } from "@/database/models/Store";
import {
  FUND_TRANSACTION_TYPES,
  FundTransactionRecalculate,
} from "@/modules/fundTransaction";
import { INVENTORY_TYPES, StockMetadataHelper } from "@/modules/inventory";
import {
  LOYALTY_POINT_TYPES,
  LoyaltyPointRecalculateService,
} from "@/modules/loyaltyPoint";
import {
  PARTNER_DEBT_TYPES,
  PartnerDebtRecalculateService,
} from "@/modules/partnerDebt";
import { VAT_DEBT_TYPES, VatDebtRecalculateService } from "@/modules/vatDebt";

const stockMetadataHelper = container.get<StockMetadataHelper>(
  INVENTORY_TYPES.StockMetadataHelper,
);
const fundRecaculateService = container.get<FundTransactionRecalculate>(
  FUND_TRANSACTION_TYPES.FundTransactionRecalculate,
);
const partnerDebtRecaculateService =
  container.get<PartnerDebtRecalculateService>(
    PARTNER_DEBT_TYPES.PartnerDebtRecalculateService,
  );
const vatDebtRecaculateService = container.get<VatDebtRecalculateService>(
  VAT_DEBT_TYPES.VatDebtRecalculateService,
);
const loyaltyPointRecalculateService =
  container.get<LoyaltyPointRecalculateService>(
    LOYALTY_POINT_TYPES.LoyaltyPointRecalculateService,
  );

// Chạy các hàm tính lại dữ liệu mỗi 0h hàng ngày
export const RecalculateDataJob = {
  start: () => {
    new Cron("0 0 0 * * *", { timezone: "Asia/Ho_Chi_Minh" }, async () => {
      try {
      } catch (error) {
        logger.error(`[RecalculateDataJob] Lỗi khi chạy job: ${error}`);
      }
    });

    // Chạy hàm kiểm tra công việc chưa cập nhật cuối ngày lúc 16:50h hàng ngày
    new Cron("0 50 16 * * *", { timezone: "Asia/Ho_Chi_Minh" }, async () => {
      try {
      } catch (error) {
        logger.error(
          `[RecalculateDataJob] Lỗi khi kiểm tra [công việc chưa cập nhật cuối ngày]: ${error}`,
        );
      }
    });

    // Ghi snapshot mỗi cuối ngày đầu tháng theo múi giờ VN
    new Cron("0 0 23 28-31 * *", { timezone: "Asia/Ho_Chi_Minh" }, async () => {
      const manager = DatabaseConfig.manager;
      const today = new Date();
      const lastDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
      ).getDate();
      if (today.getDate() === lastDayOfMonth) {
        try {
          await fundRecaculateService.createMonthlySnapshot(today, manager);
          const allStores = await manager.find(Store);

          for (const store of allStores) {
            await partnerDebtRecaculateService.createMonthlySnapshot(
              store.id,
              today,
              manager,
            );
            await vatDebtRecaculateService.createMonthlySnapshot(
              store.id,
              today,
              manager,
            );
            await loyaltyPointRecalculateService.createMonthlySnapshot(
              today,
              manager,
            );
          }
        } catch (error) {
          logger.error(
            `[RecalculateDataJob] Lỗi khi ghi snapshot cuối tháng: ${error}`,
          );
        }
      }
    });

    // Job 23:30: rebuild stock_trackings cũ và đồng bộ lại stockMetadata để đảm bảo dữ liệu đầu ngày hôm sau
    new Cron("0 30 23 * * *", { timezone: "Asia/Ho_Chi_Minh" }, async () => {
      const manager = DatabaseConfig.manager;
      try {
        logger.info(
          "[RecalculateDataJob] Bắt đầu job đồng bộ stockMetadata định kỳ...",
        );

        await stockMetadataHelper.reSyncAllStockMetadata(manager);
      } catch (error) {
        logger.error(
          `[RecalculateDataJob] Lỗi khi rebuild stock_trackings hoặc đồng bộ stockMetadata định kỳ: ${error}`,
        );
      }
    });

    logger.info("[RecalculateDataJob] Bắt đầu chạy job");
  },

  stop: () => {},
};
