# Loyalty Point Accumulated State - Implementation Guide

## Vấn đề trước đây

Model `LoyaltyPointTransaction` chỉ lưu điểm tăng/giảm mà **không lưu trạng thái tích lũy**:

- Để biết tổng revenue tại 1 thời điểm → phải query + sum tất cả orders
- Để biết điểm hiện tại → phải query + sum tất cả transactions
- **Chậm** và dễ **sai số** khi có nhiều giao dịch

## Giải pháp: Accumulated State

Lưu trạng thái tích lũy vào **mỗi transaction** (giống FIFO của inventory):

### Các trường mới trong `LoyaltyPointTransaction`

```typescript
@Column(BaseNumericColumnOptions)
revenueChange: number; // Biến động doanh thu trong giao dịch này

@Column(BaseNumericColumnOptions)
accumulatedRevenue: number; // Tổng doanh thu tích lũy SAU transaction này

@Column(BaseNumericColumnOptions)
revenueForPointsMilestone: number; // Mốc doanh thu đã tính điểm

@Column(BaseNumericColumnOptions)
pointEarnRate: number; // Tỷ lệ tích điểm (lưu lại để audit)
```

## Ví dụ thực tế (theo yêu cầu của bạn)

### Khách hàng A:

**Ngày 01/01 - Đơn ĐH1 (netAmount: 1,150,000₫)**

```
Transaction 1 (INCREASE):
  - Type: INCREASE
  - Points: 11
  - revenueChange: 1,150,000
  - accumulatedRevenue: 1,150,000        ← Tổng revenue sau trans
  - revenueForPointsMilestone: 1,100,000  ← floor(1,150,000 / 100,000) * 100,000
  - pointEarnRate: 100,000
```

**Ngày 02/01 - Đơn ĐH2 (netAmount: 485,000₫)**

```
Transaction 2 (INCREASE):
  - Type: INCREASE
  - Points: 5
  - revenueChange: 485,000
  - accumulatedRevenue: 1,635,000        ← 1,150,000 + 485,000
  - revenueForPointsMilestone: 1,600,000  ← floor(1,635,000 / 100,000) * 100,000
  - pointEarnRate: 100,000
```

**Ngày 03/01 - Đơn ĐH3 (netAmount: 1,475,000₫, dùng 16 điểm)**

Tạo ra **2 transactions** (phải tiêu hao điểm TRƯỚC, cộng điểm SAU):

```
Transaction 3 (DECREASE - Tiêu điểm):
  - Type: DECREASE
  - Points: 16
  - revenueChange: 0                     ← Tiêu điểm KHÔNG thay đổi revenue
  - accumulatedRevenue: 1,635,000        ← Giữ nguyên revenue
  - revenueForPointsMilestone: 1,600,000  ← Giữ nguyên mốc
  - pointEarnRate: 100,000

Transaction 4 (INCREASE - Tích điểm):
  - Type: INCREASE
  - Points: 5
  - revenueChange: 1,475,000
  - accumulatedRevenue: 3,110,000        ← 1,635,000 + 1,475,000 = 3,110,000
  - revenueForPointsMilestone: 3,100,000  ← floor(3,110,000 / 100,000) * 100,000
  - pointEarnRate: 100,000
```

**Tổng kết:**

- Khách A có: `3,110,000₫` revenue, đã dùng `16` điểm, tích được `11 + 5 + 5 = 21` điểm
- Điểm còn lại: `21 - 16 = 5` điểm

## Công thức tính toán

### 1. Tích điểm từ doanh số (khi có order mới)

```typescript
// Lấy revenue trước đó
const revenueBefore = cache.get(partnerId) || 0;

// Tính revenue sau
const revenueAfter = revenueBefore + order.netAmount;

// Tính điểm ĐÚNG: floor(after) - floor(before)
const pointsBefore = Math.floor(revenueBefore / pointEarnRate);
const pointsAfter = Math.floor(revenueAfter / pointEarnRate);
const pointsDelta = pointsAfter - pointsBefore;

// Lưu transaction
if (pointsDelta > 0) {
  {
    revenueChange: order.netAmount,
    accumulatedRevenue: revenueAfter,
    revenueForPointsMilestone: pointsAfter * pointEarnRate,
    pointEarnRate,
    points: pointsDelta,
    type: INCREASE
  }
}
```

### 2. Tiêu điểm thanh toán

```typescript
// KHÔNG thay đổi revenue, chỉ giảm điểm
{
  revenueChange: 0,
  accumulatedRevenue: revenueBefore,  // Giữ nguyên
  revenueForPointsMilestone: Math.floor(revenueBefore / pointEarnRate) * pointEarnRate,
  pointEarnRate,
  points: loyaltyPointsUsed,
  type: DECREASE
}
```

## Lợi ích

### 1. Query nhanh hơn nhiều

**Trước:**

```typescript
// Phải query + sum tất cả orders
const orders = await findOrders(partnerId, fromDate, toDate);
const totalRevenue = orders.reduce((sum, o) => sum + o.netAmount, 0);
```

**Sau:**

```typescript
// Chỉ cần lấy 1 transaction gần nhất
const lastTx = await findLastTransaction(partnerId, atDate);
const totalRevenue = lastTx.accumulatedRevenue; // ✅ Instant!
```

### 2. Tính điểm chính xác

```typescript
// Điểm hiện tại = sum(tất cả transactions)
const pointsTx = await findTransactions(partnerId);
const currentPoints = pointsTx.reduce((sum, tx) => {
  return tx.type === "INCREASE" ? sum + tx.points : sum - tx.points;
}, 0);

// Revenue hiện tại = từ transaction gần nhất
const lastTx = await findLastTransaction(partnerId, now);
const currentRevenue = lastTx.accumulatedRevenue;
```

### 3. Audit trail đầy đủ

Mỗi transaction có đủ thông tin:

- Revenue thay đổi bao nhiêu?
- Tổng revenue sau transaction là bao nhiêu?
- Mốc revenue dùng để tính điểm là bao nhiêu?
- Rate tích điểm lúc đó là bao nhiêu?

## Migration

Chạy migration để thêm các trường mới:

```bash
yarn db:migrate
```

## Recalculate sau khi migration

Sau khi migrate, **BẮT BUỘC** phải recalculate để điền data cho các trường mới:

```typescript
// Recalculate từ đầu năm
await loyaltyPointRecalculateService.recalculateFromDate(
  new Date("2025-01-01"),
  manager,
);
```

Log sẽ hiển thị chi tiết:

```
[LOYALTY_TX] ĐH1 | Partner: abc12345... | Type: INCREASE | Points: 11 |
  Revenue Δ: 1,150,000₫ | Accumulated: 1,150,000₫ | Milestone: 1,100,000₫

[LOYALTY_TX] ĐH2 | Partner: abc12345... | Type: INCREASE | Points: 5 |
  Revenue Δ: 485,000₫ | Accumulated: 1,635,000₫ | Milestone: 1,600,000₫

[LOYALTY_TX] ĐH3 | Partner: abc12345... | Type: DECREASE | Points: 16 |
  Revenue Δ: 0₫ | Accumulated: 1,635,000₫ | Milestone: 1,600,000₫

[LOYALTY_TX] ĐH3 | Partner: abc12345... | Type: INCREASE | Points: 5 |
  Revenue Δ: 1,475,000₫ | Accumulated: 3,110,000₫ | Milestone: 3,100,000₫
```

## So sánh với Inventory FIFO

Cùng một approach:

| Inventory                 | Loyalty Points                               |
| ------------------------- | -------------------------------------------- |
| `StockTracking.remaining` | `LoyaltyPointTransaction.accumulatedRevenue` |
| `StockTracking.refCode`   | `LoyaltyPointTransaction.refCode`            |
| `fifo.service.ts` logs    | `loyaltyPointRecalculate.service.ts` logs    |
| Query stock nhanh         | Query revenue nhanh                          |
| Audit batches             | Audit transactions                           |

## Kết luận

✅ **Model hợp lý hơn** - Lưu đủ thông tin để không phải tính lại

✅ **Performance tốt hơn** - 1 query thay vì N queries + sum

✅ **Audit trail đầy đủ** - Biết chính xác revenue tại mỗi thời điểm

✅ **Dễ debug** - Log chi tiết mọi thay đổi

✅ **Giống inventory** - Cùng pattern, dễ maintain
