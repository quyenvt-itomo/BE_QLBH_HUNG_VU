-- Fix duplicate FundTransactions
-- Xóa các bản duplicate, giữ lại bản có id nhỏ nhất

BEGIN;

-- Hiển thị số lượng duplicate trước khi xóa
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

-- Xóa duplicate, giữ lại record có id nhỏ nhất
DELETE FROM fund_transaction ft1
WHERE
    ft1."refType" = 'transfer'
    AND EXISTS (
        SELECT 1
        FROM fund_transaction ft2
        WHERE
            ft1."refId" = ft2."refId"
            AND ft1."fundId" = ft2."fundId"
            AND ft1."refType" = ft2."refType"
            AND ft1.id > ft2.id
    );

-- Hiển thị kết quả sau khi xóa
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
ORDER BY "refCode";

COMMIT;