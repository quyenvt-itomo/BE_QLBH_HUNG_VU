import { Cron } from "croner";
import logger from "@/shared/utils/logger";
import DatabaseConfig from "@/config/database";

/**
 * Orphan Transaction Cleanup Job
 * - Soft-delete các InventoryTransaction trỏ tới productId/store đã bị xóa.
 * - Soft-delete các FundTransaction trỏ tới fund hoặc phiếu nguồn đã bị xóa.
 * - Tránh kết quả tồn kho/quỹ lệch do dữ liệu mồ côi.
 * Cron: 00:00 mỗi ngày (Asia/Ho_Chi_Minh).
 */

async function cleanupOrphanInventoryTransactions(): Promise<void> {
  const ds = DatabaseConfig.isInitialized
    ? DatabaseConfig
    : await DatabaseConfig.initialize();

  try {
    const result = await ds.query(
      `
      UPDATE inventory_transactions tx
      SET "deletedAt" = NOW()
      WHERE tx."deletedAt" IS NULL
        AND (
          tx."productIdId" IS NULL
          OR tx."storeId" IS NULL
          OR NOT EXISTS (
            SELECT 1 FROM productIds i
            WHERE i.id = tx."productIdId" AND i."deletedAt" IS NULL
          )
          OR NOT EXISTS (
            SELECT 1 FROM stores s
            WHERE s.id = tx."storeId" AND s."deletedAt" IS NULL
          )
        )
      `,
    );

    const affected = Array.isArray(result) ? (result[1] ?? 0) : 0;
    logger.info(
      `[OrphanTransactionCleanup] Soft-deleted ${affected} mồ côi inventory_transactions`,
    );
  } catch (error) {
    logger.error(
      `[OrphanTransactionCleanup] Lỗi khi cleanup inventory_transactions: ${(error as Error)?.message || error}`,
    );
  }
}

async function cleanupOrphanFundTransactions(): Promise<void> {
  const ds = DatabaseConfig.isInitialized
    ? DatabaseConfig
    : await DatabaseConfig.initialize();

  try {
    const result = await ds.query(
      `
      DELETE FROM fund_transactions ft
      WHERE 
        -- Fund đã bị xóa
        NOT EXISTS (
          SELECT 1 FROM funds f
          WHERE f.id = ft."fundId" AND f."deletedAt" IS NULL
        )
        -- Hoặc phiếu nguồn đã bị xóa
        OR (
          ft."refType" = 'INCOME' AND NOT EXISTS (
            SELECT 1 FROM income_expenses ie
            WHERE ie.id = ft."refId" AND ie."deletedAt" IS NULL
          )
        )
        OR (
          ft."refType" = 'EXPENSE' AND NOT EXISTS (
            SELECT 1 FROM income_expenses ie
            WHERE ie.id = ft."refId" AND ie."deletedAt" IS NULL
          )
        )
        OR (
          ft."refType" = 'TRANSFER' AND NOT EXISTS (
            SELECT 1 FROM fund_transfers ftx
            WHERE ftx.id = ft."refId" AND ftx."deletedAt" IS NULL
          )
        )
        OR (
          ft."refType" = 'ADJUSTMENT' AND NOT EXISTS (
            SELECT 1 FROM fund_adjustments fa
            WHERE fa.id = ft."refId" AND fa."deletedAt" IS NULL
          )
        )
        OR (
          ft."refType" = 'ORDER' AND NOT EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = ft."refId" AND o."deletedAt" IS NULL
          )
        )
        OR (
          ft."refType" = 'PURCHASE' AND NOT EXISTS (
            SELECT 1 FROM purchases p
            WHERE p.id = ft."refId" AND p."deletedAt" IS NULL
          )
        )
      `,
    );

    const affected = Array.isArray(result) ? (result[1] ?? 0) : 0;
    logger.info(
      `[OrphanTransactionCleanup] Deleted ${affected} mồ côi fund_transactions`,
    );
  } catch (error) {
    logger.error(
      `[OrphanTransactionCleanup] Lỗi khi cleanup fund_transactions: ${(error as Error)?.message || error}`,
    );
  }
}

let job: Cron | null = null;

export const OrphanTransactionCleanupJob = {
  start: () => {
    if (!job) {
      job = new Cron(
        "0 0 0 * * *", // 00:00 mỗi ngày
        { timezone: "Asia/Ho_Chi_Minh" },
        async () => {
          logger.info("[OrphanTransactionCleanup] Bắt đầu chạy job");
          await cleanupOrphanInventoryTransactions();
          await cleanupOrphanFundTransactions();
        },
      );
      logger.info("[OrphanTransactionCleanup] Job đã được khởi động");
    }
  },

  stop: () => {
    if (job) {
      job.stop();
      job = null;
      logger.info("[OrphanTransactionCleanup] Job đã dừng");
    }
  },
};
