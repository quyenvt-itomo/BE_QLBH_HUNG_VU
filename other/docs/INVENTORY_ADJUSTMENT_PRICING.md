# Hướng dẫn xử lý giá vốn trong Điều chỉnh Tồn kho

## Vấn đề

Khi điều chỉnh tồn kho, có 2 trường hợp:

### 1. Điều chỉnh TĂNG (Counted > Expected)

- ✅ Cho phép người dùng **nhập giá vốn**
- Backend tạo lô mới với giá này
- `totalAdjustmentValue = deltaQty × userCost`

### 2. Điều chỉnh GIẢM (Counted < Expected)

- ⚠️ **KHÔNG thể dùng giá từ người dùng**
- Lý do: Không xác định được hao hụt từ lô nào
- Backend sử dụng **FIFO** (trừ từ lô cũ nhất)
- `totalAdjustmentValue = SUM(lô1 + lô2 + ...)` ← Khác với `deltaQty × userCost`

## UI Implementation

### Form Điều chỉnh

```tsx
interface AdjustmentLine {
  productVariantId: string;
  expectedQty: number; // Tồn kho hệ thống
  countedQty: number; // Kiểm kê thực tế
  costPrice?: number; // Giá vốn (chỉ dùng khi tăng)
}

// Component
function AdjustmentForm() {
  const [lines, setLines] = useState<AdjustmentLine[]>([]);
  const [preview, setPreview] = useState<PreviewData | null>(null);

  const deltaQty = Math.abs(line.expectedQty - line.countedQty);
  const isIncrease = line.countedQty > line.expectedQty;
  const isDecrease = line.countedQty < line.expectedQty;

  return (
    <Table>
      <thead>
        <tr>
          <th>Sản phẩm</th>
          <th>Tồn HT</th>
          <th>Kiểm kê</th>
          <th>Chênh lệch</th>
          <th>Giá vốn</th>
          <th>Giá trị</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <tr key={line.productVariantId}>
            <td>{line.productName}</td>
            <td>{line.expectedQty}</td>
            <td>
              <Input
                value={line.countedQty}
                onChange={(e) =>
                  handleCountedQtyChange(line.id, e.target.value)
                }
              />
            </td>
            <td className={getDeltaClass(line)}>
              {deltaQty > 0 && (isIncrease ? "+" : "-")}
              {deltaQty}
            </td>
            <td>
              {isIncrease ? (
                // TĂNG: Cho phép nhập giá
                <Input
                  type="number"
                  value={line.costPrice}
                  onChange={(e) =>
                    handleCostPriceChange(line.id, e.target.value)
                  }
                  placeholder="Nhập giá vốn"
                />
              ) : isDecrease ? (
                // GIẢM: Hiển thị giá FIFO ước tính (readonly)
                <Tooltip content="Giá vốn được tính theo FIFO từ các lô nhập cũ nhất">
                  <Input
                    value={formatCurrency(
                      preview?.lines[line.id]?.averageUnitCost || 0,
                    )}
                    disabled
                    suffix={
                      <InfoIcon onClick={() => showFifoDetails(line.id)} />
                    }
                  />
                </Tooltip>
              ) : (
                <span>-</span>
              )}
            </td>
            <td>
              {preview?.lines[line.id]?.estimatedValue
                ? formatCurrency(preview.lines[line.id].estimatedValue)
                : "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
```

### Preview API

```typescript
// Gọi trước khi submit để preview
async function previewAdjustment(lines: AdjustmentLine[]) {
  const response = await api.post('/inventory-adjustment/preview', {
    storeId: selectedStore.id,
    occurredAt: new Date(),
    lines: lines.map(line => ({
      productVariantId: line.productVariantId,
      expectedQty: line.expectedQty,
      countedQty: line.countedQty,
      costPrice: line.costPrice, // Chỉ dùng khi tăng
    }))
  });

  // Response:
  {
    lines: [
      {
        productVariantId: "xxx",
        deltaQty: 30,
        direction: "out",
        estimatedCost: 1650000,      // Tổng giá vốn FIFO
        averageUnitCost: 55000,       // Giá TB = 1650000 / 30
        fifoDetails: [                // Chi tiết các lô
          { quantity: 20, unitCost: 50000 },
          { quantity: 10, unitCost: 65000 }
        ]
      }
    ],
    totalAdjustmentValue: -1650000
  }
}
```

### FIFO Details Modal

```tsx
function FifoDetailsModal({ line, preview }) {
  return (
    <Modal>
      <h3>Chi tiết FIFO - {line.productName}</h3>
      <p>Số lượng giảm: {line.deltaQty}</p>

      <Table>
        <thead>
          <tr>
            <th>Lô</th>
            <th>SL lấy</th>
            <th>Giá vốn/đvt</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {preview.fifoDetails.map((detail, idx) => (
            <tr key={idx}>
              <td>Lô {idx + 1}</td>
              <td>{detail.quantity}</td>
              <td>{formatCurrency(detail.unitCost)}</td>
              <td>{formatCurrency(detail.quantity * detail.unitCost)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2}>
              <strong>Tổng</strong>
            </td>
            <td>
              <strong>{formatCurrency(preview.averageUnitCost)}</strong>
            </td>
            <td>
              <strong>{formatCurrency(preview.estimatedCost)}</strong>
            </td>
          </tr>
        </tfoot>
      </Table>

      <Alert type="info">
        <InfoIcon />
        Giá vốn được tính theo phương pháp FIFO (First In First Out) - Trừ từ lô
        nhập cũ nhất trước.
      </Alert>
    </Modal>
  );
}
```

## Backend Endpoints Cần Thêm

### 1. Preview Adjustment

```typescript
// POST /api/client/inventory-adjustment/preview
async previewAdjustment(req: Request, res: Response) {
  const { storeId, lines } = req.body;

  const result = await Promise.all(
    lines.map(async (line) => {
      const deltaQty = Math.abs(line.expectedQty - line.countedQty);
      const isDecrease = line.countedQty < line.expectedQty;

      if (isDecrease && deltaQty > 0) {
        // Gọi previewFifoCostForAdjustment
        const fifoPreview = await inventoryRecalculateService.previewFifoCostForAdjustment(
          line.productVariantId,
          storeId,
          deltaQty,
          manager
        );

        return {
          productVariantId: line.productVariantId,
          deltaQty,
          direction: 'out',
          ...fifoPreview
        };
      } else if (deltaQty > 0) {
        // Điều chỉnh tăng - dùng giá từ user
        return {
          productVariantId: line.productVariantId,
          deltaQty,
          direction: 'in',
          estimatedCost: deltaQty * (line.costPrice || 0),
          averageUnitCost: line.costPrice || 0,
          fifoDetails: []
        };
      }

      return null;
    })
  );

  res.json({
    success: true,
    data: result.filter(Boolean)
  });
}
```

### 2. Get Weighted Average Cost

```typescript
// GET /api/client/inventory/:variantId/weighted-average-cost?storeId=xxx
async getWeightedAverageCost(req: Request, res: Response) {
  const { variantId } = req.params;
  const { storeId } = req.query;

  const avgCost = await inventoryRecalculateService.getWeightedAverageCost(
    variantId,
    storeId,
    manager
  );

  res.json({
    success: true,
    data: {
      productVariantId: variantId,
      storeId,
      weightedAverageCost: avgCost
    }
  });
}
```

## Flow hoàn chỉnh

```
1. User nhập countedQty
   ↓
2. Frontend detect: increase/decrease?
   ↓
3. Nếu DECREASE:
   → Gọi API preview
   → Hiển thị giá FIFO ước tính (readonly)
   → Show icon info để xem chi tiết FIFO
   ↓
4. Nếu INCREASE:
   → Enable input giá vốn
   → User nhập giá
   ↓
5. Gọi preview API toàn bộ form
   → Hiển thị tổng giá trị điều chỉnh
   ↓
6. User confirm → Submit
```

## Messages cho User

### Warning khi điều chỉnh giảm

```
ℹ️ Lưu ý:
Giá vốn hao hụt được tính tự động theo phương pháp FIFO
(trừ từ lô nhập cũ nhất). Bạn không thể chỉnh sửa giá vốn
cho điều chỉnh giảm.

Nhấn vào icon (i) để xem chi tiết các lô được trừ.
```

### Tooltip

```
"Giá vốn FIFO: Tính từ các lô nhập cũ nhất còn tồn"
```

## Validation Rules

```typescript
// Frontend validation
if (line.countedQty < line.expectedQty) {
  // Điều chỉnh giảm
  if (line.costPrice !== undefined) {
    showWarning("Giá vốn sẽ được tính tự động theo FIFO");
    line.costPrice = undefined; // Clear giá nhập tay
  }
}

if (line.countedQty > line.expectedQty) {
  // Điều chỉnh tăng
  if (!line.costPrice || line.costPrice <= 0) {
    showError("Vui lòng nhập giá vốn cho hàng tăng");
    return false;
  }
}
```

## Example Response

```json
{
  "success": true,
  "data": {
    "lines": [
      {
        "productVariantId": "abc-123",
        "productName": "Quần âu xịn",
        "sku": "SP000008",
        "expectedQty": 100,
        "countedQty": 70,
        "deltaQty": 30,
        "direction": "out",
        "estimatedCost": 1650000,
        "averageUnitCost": 55000,
        "fifoDetails": [
          { "quantity": 20, "unitCost": 50000 },
          { "quantity": 10, "unitCost": 65000 }
        ]
      }
    ],
    "summary": {
      "totalIncreaseQty": 0,
      "totalIncreaseValue": 0,
      "totalDecreaseQty": 30,
      "totalDecreaseValue": 1650000,
      "netAdjustmentValue": -1650000
    }
  }
}
```

## Checklist Implementation

- [ ] Backend: Thêm `previewFifoCostForAdjustment()` ✅
- [ ] Backend: Thêm `getWeightedAverageCost()` ✅
- [ ] Backend: API endpoint `/inventory-adjustment/preview`
- [ ] Frontend: Disable input giá khi điều chỉnh giảm
- [ ] Frontend: Gọi preview API on change
- [ ] Frontend: Hiển thị FIFO details modal
- [ ] Frontend: Validation rules
- [ ] Frontend: Warning messages
- [ ] Testing: Test với nhiều lô khác giá
- [ ] Documentation: User guide

## Notes

- ⚠️ Điều chỉnh giảm **LUÔN** dùng FIFO, không có exception
- ✅ Điều chỉnh tăng cho phép user nhập giá tùy ý
- 📊 Preview giúp user hiểu rõ giá trị trước khi save
- 🔍 FIFO details giúp audit và debugging
