-- Fix adjustmentValue for InventoryAdjustmentLine records where deltaQty = 0
-- Bug: When recalculating, deltaQty was set to 0 but adjustmentValue was not updated to 0

BEGIN;

-- Backup table (optional, for safety)
-- CREATE TABLE IF NOT EXISTS inventory_adjustment_line_backup AS 
-- SELECT * FROM inventory_adjustment_line;

-- Update adjustmentValue to 0 where deltaQty = 0 but adjustmentValue != 0
UPDATE inventory_adjustment_line
SET 
    adjustment_value = 0,
    updated_at = NOW()
WHERE 
    delta_qty = 0 
    AND adjustment_value != 0
    AND deleted_at IS NULL;

-- Show affected records count
-- SELECT COUNT(*) as affected_records 
-- FROM inventory_adjustment_line 
-- WHERE delta_qty = 0 AND adjustment_value != 0 AND deleted_at IS NULL;

-- Recalculate totalAdjustmentValue for affected adjustments
UPDATE inventory_adjustment ia
SET 
    total_adjustment_value = (
        SELECT COALESCE(SUM(
            CASE 
                WHEN ial.direction = 'in' THEN ial.adjustment_value
                WHEN ial.direction = 'out' THEN -ial.adjustment_value
                ELSE 0
            END
        ), 0)
        FROM inventory_adjustment_line ial
        WHERE ial.adjustment_id = ia.id
        AND ial.deleted_at IS NULL
    ),
    updated_at = NOW()
WHERE 
    ia.id IN (
        SELECT DISTINCT ial.adjustment_id
        FROM inventory_adjustment_line ial
        WHERE ial.delta_qty = 0 
        AND ial.adjustment_value != 0
        AND ial.deleted_at IS NULL
    )
    AND ia.deleted_at IS NULL;

-- Verify the fix
SELECT 
    COUNT(*) as remaining_inconsistent_records
FROM inventory_adjustment_line 
WHERE 
    delta_qty = 0 
    AND adjustment_value != 0 
    AND deleted_at IS NULL;

COMMIT;

-- If you want to rollback, use: ROLLBACK;
