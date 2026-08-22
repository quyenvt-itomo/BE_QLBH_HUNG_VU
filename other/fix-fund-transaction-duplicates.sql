-- Fix duplicate FundTransactions và thêm unique constraint

-- Bước 1: Kiểm tra duplicate hiện tại
SELECT
    "refId",
    "refCode",
    "fundId",
    "refType",
    COUNT(*) as count
FROM fund_transaction
WHERE
    "refType" = 'transfer'
GROUP BY
    "refId",
    "refCode",
    "fundId",
    "refType"
HAVING
    COUNT(*) > 1
ORDER BY count DESC;

-- Bước 2: Xóa duplicate (giữ lại record đầu tiên theo createdAt)
WITH
    duplicate_records AS (
        SELECT id, ROW_NUMBER() OVER (
                PARTITION BY
                    "refId", "fundId", "refType"
                ORDER BY "createdAt" ASC, id ASC
            ) as rn
        FROM fund_transaction
        WHERE
            "refType" = 'transfer'
    )
DELETE FROM fund_transaction
WHERE
    id IN (
        SELECT id
        FROM duplicate_records
        WHERE
            rn > 1
    );

-- Bước 3: Thêm unique constraint để ngăn duplicate trong tương lai
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_fund_transaction_ref" ON fund_transaction ("refId", "fundId", "refType");

-- Bước 4: Kiểm tra kết quả sau khi fix
SELECT
    "refCode",
    "refId",
    "fundId",
    "type",
    "amount",
    "occurredAt",
    COUNT(*) as count
FROM fund_transaction
WHERE
    "refType" = 'transfer'
GROUP BY
    "refCode",
    "refId",
    "fundId",
    "type",
    "amount",
    "occurredAt"
ORDER BY "refCode", "fundId";