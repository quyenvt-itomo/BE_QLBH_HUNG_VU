import { Cron } from "croner";
import DatabaseConfig from "@/config/database";
import logger from "@/shared/utils/logger";

let job: Cron | null = null;

const countDeleted = async (sql: string): Promise<number> => {
  const rows = await DatabaseConfig.query(sql);
  return Number(rows?.[0]?.count || 0);
};

const clearOrphanTransactions = async (): Promise<void> => {
  const inventoryDeleted = await countDeleted(`
    WITH deleted AS (
      DELETE FROM inventory_transactions it
      WHERE
        NOT EXISTS (
          SELECT 1
          FROM product_variants pv
          INNER JOIN products p ON p.id = pv."productId" AND p."deletedAt" IS NULL
          WHERE pv.id = it."productVariantId"
            AND pv."deletedAt" IS NULL
        )
        OR NOT EXISTS (
          SELECT 1
          FROM stores s
          WHERE s.id = it."storeId"
            AND s."deletedAt" IS NULL
        )
      RETURNING id
    )
    SELECT COUNT(*)::int as count FROM deleted;
  `);

  const fundDeleted = await countDeleted(`
    WITH deleted AS (
      DELETE FROM fund_transactions ft
      WHERE NOT EXISTS (
        SELECT 1
        FROM funds f
        WHERE f.id = ft."fundId"
          AND f."deletedAt" IS NULL
      )
      RETURNING id
    )
    SELECT COUNT(*)::int as count FROM deleted;
  `);

  const partnerDebtDeleted = await countDeleted(`
    WITH deleted AS (
      DELETE FROM debt_transactions pdt
      WHERE
        NOT EXISTS (
          SELECT 1
          FROM partners p
          WHERE p.id = pdt."partnerId"
            AND p."deletedAt" IS NULL
        )
        OR NOT EXISTS (
          SELECT 1
          FROM stores s
          WHERE s.id = pdt."storeId"
            AND s."deletedAt" IS NULL
        )
      RETURNING id
    )
    SELECT COUNT(*)::int as count FROM deleted;
  `);

  const vatDebtDeleted = await countDeleted(`
    WITH deleted AS (
      DELETE FROM vat_debt_transactions vdt
      WHERE NOT EXISTS (
        SELECT 1
        FROM stores s
        WHERE s.id = vdt."storeId"
          AND s."deletedAt" IS NULL
      )
      RETURNING id
    )
    SELECT COUNT(*)::int as count FROM deleted;
  `);

  const loyaltyDeleted = await countDeleted(`
    WITH deleted AS (
      DELETE FROM loyalty_point_transactions lpt
      WHERE NOT EXISTS (
        SELECT 1
        FROM partners p
        WHERE p.id = lpt."partnerId"
          AND p."deletedAt" IS NULL
      )
      RETURNING id
    )
    SELECT COUNT(*)::int as count FROM deleted;
  `);

  logger.info(
    `[OrphanTransactionCleanupJob] Deleted orphan rows: inventory=${inventoryDeleted}, fund=${fundDeleted}, partnerDebt=${partnerDebtDeleted}, vatDebt=${vatDebtDeleted}, loyaltyPoint=${loyaltyDeleted}`,
  );
};

export const OrphanTransactionCleanupJob = {
  start: () => {
    if (!job) {
      job = new Cron(
        "0 0 0 * * *",
        { timezone: "Asia/Ho_Chi_Minh" },
        async () => {
          try {
            await clearOrphanTransactions();
          } catch (error) {
            logger.error(
              `[OrphanTransactionCleanupJob] Failed to clear orphan transactions: ${error}`,
            );
          }
        },
      );

      logger.info("[OrphanTransactionCleanupJob] Job started");
    }
  },

  stop: () => {
    if (job) {
      job.stop();
      job = null;
      logger.info("[OrphanTransactionCleanupJob] Job stopped");
    }
  },
};
