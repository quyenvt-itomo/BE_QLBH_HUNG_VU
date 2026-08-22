import { container } from "@/config/container";
import DatabaseConfig from "@/config/database";
import { Store } from "@/database/models/Store";
import {
  FUND_TRANSACTION_TYPES,
  FundTransactionRecalculate,
} from "@/modules/fundTransaction";
import {
  INVENTORY_TYPES,
  InventoryRecalculateService,
  StockMetadataHelper,
} from "@/modules/inventory";
import {
  LOYALTY_POINT_TYPES,
  LoyaltyPointRecalculateService,
} from "@/modules/loyaltyPoint";
import {
  PARTNER_DEBT_TYPES,
  PartnerDebtRecalculateService,
} from "@/modules/partnerDebt";
import {
  PRODUCT_TYPES,
  PRODUCT_VARIANT_TYPES,
  ProductService,
  ProductVariantService,
} from "@/modules/product";
import { STORE_TYPES, StoreRepository } from "@/modules/store";
import { VAT_DEBT_TYPES, VatDebtRecalculateService } from "@/modules/vatDebt";
import logger from "@/shared/utils/logger";

const inventoryRecaculateService = container.get<InventoryRecalculateService>(
  INVENTORY_TYPES.InventoryRecalculateService,
);
const stockMetadataHelper = container.get<StockMetadataHelper>(
  INVENTORY_TYPES.StockMetadataHelper,
);
const loyaltyPointRecalculateService =
  container.get<LoyaltyPointRecalculateService>(
    LOYALTY_POINT_TYPES.LoyaltyPointRecalculateService,
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
const storeRepository = container.get<StoreRepository>(
  STORE_TYPES.StoreRepository,
);

// Chạy các hàm tính lại dữ liệu mỗi 0h hàng ngày
export const TestFunctionJob = {
  start: async () => {
    const occurredAt = new Date("2025-01-01T00:00:00.000Z");
    logger.info(
      `[TestFunctionJob] Bắt đầu chạy hàm tính lại từ ngày ${occurredAt.toISOString()}`,
    );
    // await inventoryRecaculateService.recalculateFromDate(occurredAt);
    const manager = DatabaseConfig.getRepository(Store).manager;
    await stockMetadataHelper.reSyncAllStockMetadata(manager);
    await loyaltyPointRecalculateService.recalculateFromDate(occurredAt);
    logger.info(
      `[TestFunctionJob] Hoàn thành chạy hàm tính lại từ ngày ${occurredAt.toISOString()}`,
    );
  },

  stop: () => {},
};
