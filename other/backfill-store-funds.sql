-- Backfill fund scope by store
-- 1) Attach legacy funds to the default store
-- 2) Create default funds for stores without any fund
-- 3) Ensure each store has one default fund
-- 4) Remap income_expenses.fundId by storeId + same fund type

BEGIN;

-- 1) Gán các quỹ cũ về store mặc định
UPDATE funds
SET "storeId" = '3ffe9929-4598-451e-a58d-79ae8f41e99f'
WHERE "storeId" IS NULL;

-- 2) Tạo 2 quỹ mặc định cho store chưa có quỹ nào
WITH stores_without_funds AS (
  SELECT s.id
  FROM stores s
  LEFT JOIN funds f ON f."storeId" = s.id AND f."deletedAt" IS NULL
  WHERE s."deletedAt" IS NULL
  GROUP BY s.id
  HAVING COUNT(f.id) = 0
)
INSERT INTO funds (
  code,
  name,
  type,
  "storeId",
  "isDefault",
  "createdAt",
  "updatedAt"
)
SELECT
  'TM',
  'Tiền Mặt',
  'cash'::funds_type_enum,
  sw.id,
  true,
  NOW(),
  NOW()
FROM stores_without_funds sw
UNION ALL
SELECT
  'NH',
  'Ngân hàng',
  'bank'::funds_type_enum,
  sw.id,
  false,
  NOW(),
  NOW()
FROM stores_without_funds sw;

-- 3) Chuẩn hóa cờ mặc định: mỗi store đúng 1 quỹ mặc định
WITH ranked_funds AS (
  SELECT
    f.id,
    f."storeId",
    ROW_NUMBER() OVER (
      PARTITION BY f."storeId"
      ORDER BY CASE WHEN f."isDefault" THEN 0 ELSE 1 END, f."createdAt" ASC
    ) AS rn
  FROM funds f
  WHERE f."deletedAt" IS NULL
)
UPDATE funds f
SET "isDefault" = CASE WHEN rf.rn = 1 THEN true ELSE false END
FROM ranked_funds rf
WHERE f.id = rf.id;

-- 4) Đồng bộ fundId của phiếu thu chi theo storeId hiện có + cùng loại quỹ
-- Giữ nguyên income_expenses.storeId (nguồn chuẩn đến từ order)
WITH source_fund_type AS (
  SELECT
    ie.id AS income_expense_id,
    ie."storeId" AS income_expense_store_id,
    sf.type AS source_fund_type
  FROM income_expenses ie
  INNER JOIN funds sf ON sf.id = ie."fundId"
  WHERE ie."fundId" IS NOT NULL
),
target_fund AS (
  SELECT
    sft.income_expense_id,
    tf.id AS target_fund_id,
    ROW_NUMBER() OVER (
      PARTITION BY sft.income_expense_id
      ORDER BY CASE WHEN tf."isDefault" THEN 0 ELSE 1 END, tf."createdAt" ASC
    ) AS rn
  FROM source_fund_type sft
  INNER JOIN funds tf
    ON tf."storeId" = sft.income_expense_store_id
   AND tf.type = sft.source_fund_type
   AND tf."deletedAt" IS NULL
)
UPDATE income_expenses ie
SET "fundId" = tf.target_fund_id
FROM target_fund tf
WHERE ie.id = tf.income_expense_id
  AND tf.rn = 1
  AND ie."fundId" IS DISTINCT FROM tf.target_fund_id;

COMMIT;
