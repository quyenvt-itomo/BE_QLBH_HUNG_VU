-- Manual loyalty sync (no FK relation required)
-- Purpose:
-- 1) Audit mismatch between partners.loyaltyPoints and transaction ledger
-- 2) Optionally soft-delete orphan ORDER transactions
-- 3) Sync partners.loyaltyPoints/totalRevenue from ledger state
--
-- IMPORTANT:
-- - Run on a backup first.
-- - Keep FK-free pattern as requested. This script does only data sync.

BEGIN;

-- =========================================
-- A) AUDIT MISMATCH (before sync)
-- =========================================
WITH ledger_points AS (
  SELECT
    t."partnerId" AS partner_id,
    COALESCE(SUM(
      CASE
        WHEN t.type = 'increase' THEN t.points
        WHEN t.type = 'decrease' THEN -t.points
        ELSE 0
      END
    ), 0) AS ledger_points
  FROM loyalty_point_transactions t
  WHERE t."deletedAt" IS NULL
  GROUP BY t."partnerId"
),
ledger_revenue AS (
  SELECT DISTINCT ON (t."partnerId")
    t."partnerId" AS partner_id,
    COALESCE(t."accumulatedRevenue", 0) AS ledger_revenue
  FROM loyalty_point_transactions t
  WHERE t."deletedAt" IS NULL
  ORDER BY t."partnerId", t."occurredAt" DESC, t."createdAt" DESC
)
SELECT
  p.id,
  p.code,
  p.name,
  p.type,
  COALESCE(p."loyaltyPoints", 0) AS partner_points,
  COALESCE(lp.ledger_points, 0) AS ledger_points,
  COALESCE(p."loyaltyPoints", 0) - COALESCE(lp.ledger_points, 0) AS point_diff,
  COALESCE(p."totalRevenue", 0) AS partner_revenue,
  COALESCE(lr.ledger_revenue, 0) AS ledger_revenue,
  COALESCE(p."totalRevenue", 0) - COALESCE(lr.ledger_revenue, 0) AS revenue_diff
FROM partners p
LEFT JOIN ledger_points lp ON lp.partner_id = p.id
LEFT JOIN ledger_revenue lr ON lr.partner_id = p.id
WHERE p."deletedAt" IS NULL
  AND p.type = 'customer'
  AND (
    COALESCE(p."loyaltyPoints", 0) <> COALESCE(lp.ledger_points, 0)
    OR COALESCE(p."totalRevenue", 0) <> COALESCE(lr.ledger_revenue, 0)
  )
ORDER BY ABS(COALESCE(p."loyaltyPoints", 0) - COALESCE(lp.ledger_points, 0)) DESC;

-- =========================================
-- B) ORPHAN ORDER TRANSACTIONS (audit)
-- =========================================
SELECT
  t.id,
  t."partnerId",
  t."refId",
  t."refCode",
  t."occurredAt",
  t.type,
  t.points
FROM loyalty_point_transactions t
LEFT JOIN orders o ON o.id = t."refId"
WHERE t."deletedAt" IS NULL
  AND t."refType" = 'order'
  AND o.id IS NULL
ORDER BY t."occurredAt" DESC;

-- =========================================
-- C) OPTIONAL: SOFT-DELETE ORPHAN TRANSACTIONS
-- Uncomment this block only when you confirm these rows are invalid.
-- =========================================
-- UPDATE loyalty_point_transactions t
-- SET
--   "deletedAt" = NOW(),
--   "updatedAt" = NOW(),
--   note = COALESCE(t.note, '') || ' [AUTO_SOFT_DELETE_ORPHAN_ORDER_TX]'
-- WHERE t."deletedAt" IS NULL
--   AND t."refType" = 'order'
--   AND NOT EXISTS (
--     SELECT 1
--     FROM orders o
--     WHERE o.id = t."refId"
--   );

-- =========================================
-- D) SYNC PARTNER BALANCES FROM LEDGER
-- =========================================
WITH ledger_points AS (
  SELECT
    t."partnerId" AS partner_id,
    COALESCE(SUM(
      CASE
        WHEN t.type = 'increase' THEN t.points
        WHEN t.type = 'decrease' THEN -t.points
        ELSE 0
      END
    ), 0) AS ledger_points
  FROM loyalty_point_transactions t
  WHERE t."deletedAt" IS NULL
  GROUP BY t."partnerId"
),
ledger_revenue AS (
  SELECT DISTINCT ON (t."partnerId")
    t."partnerId" AS partner_id,
    COALESCE(t."accumulatedRevenue", 0) AS ledger_revenue
  FROM loyalty_point_transactions t
  WHERE t."deletedAt" IS NULL
  ORDER BY t."partnerId", t."occurredAt" DESC, t."createdAt" DESC
)
UPDATE partners p
SET
  "loyaltyPoints" = COALESCE(lp.ledger_points, 0),
  "totalRevenue" = COALESCE(lr.ledger_revenue, 0),
  "updatedAt" = NOW()
FROM (
  SELECT id
  FROM partners
  WHERE "deletedAt" IS NULL
    AND type = 'customer'
) pc
LEFT JOIN ledger_points lp ON lp.partner_id = pc.id
LEFT JOIN ledger_revenue lr ON lr.partner_id = pc.id
WHERE p.id = pc.id
  AND (
    COALESCE(p."loyaltyPoints", 0) <> COALESCE(lp.ledger_points, 0)
    OR COALESCE(p."totalRevenue", 0) <> COALESCE(lr.ledger_revenue, 0)
  );

-- =========================================
-- E) POST-SYNC CHECK
-- =========================================
WITH ledger_points AS (
  SELECT
    t."partnerId" AS partner_id,
    COALESCE(SUM(
      CASE
        WHEN t.type = 'increase' THEN t.points
        WHEN t.type = 'decrease' THEN -t.points
        ELSE 0
      END
    ), 0) AS ledger_points
  FROM loyalty_point_transactions t
  WHERE t."deletedAt" IS NULL
  GROUP BY t."partnerId"
),
ledger_revenue AS (
  SELECT DISTINCT ON (t."partnerId")
    t."partnerId" AS partner_id,
    COALESCE(t."accumulatedRevenue", 0) AS ledger_revenue
  FROM loyalty_point_transactions t
  WHERE t."deletedAt" IS NULL
  ORDER BY t."partnerId", t."occurredAt" DESC, t."createdAt" DESC
)
SELECT COUNT(*)::int AS remaining_mismatch_count
FROM partners p
LEFT JOIN ledger_points lp ON lp.partner_id = p.id
LEFT JOIN ledger_revenue lr ON lr.partner_id = p.id
WHERE p."deletedAt" IS NULL
  AND p.type = 'customer'
  AND (
    COALESCE(p."loyaltyPoints", 0) <> COALESCE(lp.ledger_points, 0)
    OR COALESCE(p."totalRevenue", 0) <> COALESCE(lr.ledger_revenue, 0)
  );

COMMIT;
