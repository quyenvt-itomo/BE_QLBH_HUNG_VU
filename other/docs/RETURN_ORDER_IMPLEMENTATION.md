# Return Order Implementation Guide

## 📋 Tổng quan

Implement nghiệp vụ **hoàn trả hàng** với 2 loại:

1. **SALE_RETURN**: Khách trả hàng (reverse của SALE)
2. **PURCHASE_RETURN**: Trả hàng NCC (reverse của PURCHASE)

## 🎯 Yêu cầu nghiệp vụ

### 1. FIFO Logic cho hoàn trả

- **Xuất kho**: Lưu metadata chứa thông tin FIFO `[[qty, cost], [qty, cost], ...]`
- **Hoàn trả**: Hoàn theo thứ tự **NGƯỢC LẠI** (LIFO của đợt xuất)
- **VD**: Xuất 5 = `[3@100k, 2@105k]` → Hoàn 3 = `[2@105k, 1@100k]`

### 2. Công nợ

- Dùng giá `unitPrice` trong OrderLine (không phải FIFO cost)
- **SALE_RETURN**: Giảm công nợ phải thu (như PURCHASE)
- **PURCHASE_RETURN**: Giảm công nợ phải trả (như SALE)

### 3. Thuế VAT

- **KHÔNG nhận taxRate mới** từ input
- Phải truy xuất `taxRate` từ `refOrderLineId` (đơn gốc)
- **SALE_RETURN**: Xử lý như PURCHASE (tăng tồn, giảm phải thu VAT)
- **PURCHASE_RETURN**: Xử lý như SALE (giảm tồn, giảm phải trả VAT)

### 4. Liên kết đơn

- OrderLine có `refOrderLineId` → tham chiếu đến line gốc bị hoàn
- Service tự động đắp `productVariantId` và `productVariantSnapshot`

---

## ✅ Đã hoàn thành

### 1. ✅ Update Enums

**File**: `src/shared/constants/enum.ts`

```typescript
export enum OrderTypeEnum {
  PURCHASE = "purchase",
  SALE = "sale",
  PURCHASE_RETURN = "purchase_return",
  SALE_RETURN = "sale_return",
}

export enum InventoryRefTypeEnum {
  PURCHASE = "purchase",
  SALE = "sale",
  PURCHASE_RETURN = "purchase_return",
  SALE_RETURN = "sale_return",
  TRANSFER = "transfer",
  ADJUST = "adjust",
}
```

### 2. ✅ Update FIFO Service

**File**: `src/modules/inventory/fifo.service.ts`

**Methods mới:**

- `processReturnWithMetadata()`: Xử lý hoàn trả theo metadata từ đơn gốc
- `convertToMetadata()`: Convert FifoResult → metadata format `[[qty, cost], ...]`

**Logic:**

```typescript
// Khi xuất kho
const fifoResult = await fifoService.processStockOut(...);
const metadata = fifoService.convertToMetadata(fifoResult.details);
// Lưu metadata vào InventoryTransaction

// Khi hoàn trả
const returnResult = await fifoService.processReturnWithMetadata(
  variantId, storeId, returnQty, originalMetadata, manager
);
```

---

## 🔧 Đang thực hiện

### 3. Update Order Service

#### A. validateBeforeCreate() - Xử lý Return Orders

**Logic cần thêm:**

```typescript
async validateBeforeCreate(data: DeepPartial<Order>, ...): Promise<void> {
  const errors: IError[] = [];

  // ===== XỬ LÝ RETURN ORDERS =====
  const isReturnOrder = data.type === OrderTypeEnum.SALE_RETURN ||
                        data.type === OrderTypeEnum.PURCHASE_RETURN;

  if (isReturnOrder && data.lines) {
    for (let idx = 0; idx < data.lines.length; idx++) {
      const line = data.lines[idx];

      if (!line.refOrderLineId) {
        errors.push({
          field: `lines.${idx}.refOrderLineId`,
          code: ErrorsMessages.required
        });
        continue;
      }

      // Lấy thông tin line gốc
      const refLine = await manager.findOne(OrderLine, {
        where: { id: line.refOrderLineId },
        relations: ['order']
      });

      if (!refLine) {
        errors.push({
          field: `lines.${idx}.refOrderLineId`,
          code: ErrorsMessages.not_found
        });
        continue;
      }

      // Validate order type phù hợp
      if (data.type === OrderTypeEnum.SALE_RETURN &&
          refLine.order.type !== OrderTypeEnum.SALE) {
        errors.push({
          field: `lines.${idx}.refOrderLineId`,
          message: "SALE_RETURN chỉ có thể hoàn từ đơn SALE"
        });
      }

      if (data.type === OrderTypeEnum.PURCHASE_RETURN &&
          refLine.order.type !== OrderTypeEnum.PURCHASE) {
        errors.push({
          field: `lines.${idx}.refOrderLineId`,
          message: "PURCHASE_RETURN chỉ có thể hoàn từ đơn PURCHASE"
        });
      }

      // Đắp productVariantId và snapshot từ line gốc
      line.productVariantId = refLine.productVariantId;
      line.productVariantSnapshot = refLine.productVariantSnapshot;

      // QUAN TRỌNG: Lấy taxRate từ line gốc
      line.taxRate = refLine.taxRate;

      // Validate quantity không vượt quá đơn gốc
      // TODO: Cần check tổng quantity đã hoàn trước đó
      if (line.quantity > refLine.quantity) {
        errors.push({
          field: `lines.${idx}.quantity`,
          message: `Không thể hoàn nhiều hơn số lượng gốc ${refLine.quantity}`
        });
      }
    }
  }

  // ===== XỬ LÝ NORMAL ORDERS (existing code) =====
  else if (data.lines) {
    data.lines = await Promise.all(
      data.lines.map(async (line, idx) => {
        const productVariantSnapshot = await this.productRepository
          .getProductVariantSnapshot(line.productVariantId!);

        if (!productVariantSnapshot?.isActive) {
          errors.push({
            field: `lines.${idx}.productVariantId`,
            code: ErrorsMessages.inactive
          });
        }

        return {
          ...line,
          sortOrder: (idx + 1) * config.SORT_ORDER_STEP,
          productVariantSnapshot
        };
      })
    );
  }

  if (errors.length > 0) {
    throw new BadRequestError("Validation errors", errors);
  }

  this.calculateOrder(data);
}
```

#### B. recalculateOrder() - Xử lý inventory transactions

**File**: `src/modules/order/order.service.ts`

**Cần update:**

```typescript
private async recalculateOrder(orderId: string, manager: EntityManager): Promise<void> {
  const order = await manager.findOne(Order, {
    where: { id: orderId },
    relations: ['lines']
  });

  if (!order) return;

  // ===== XÓA CÁC TRANSACTIONS CŨ =====
  await manager.delete(InventoryTransaction, {
    refType: In([
      InventoryRefTypeEnum.PURCHASE,
      InventoryRefTypeEnum.SALE,
      InventoryRefTypeEnum.PURCHASE_RETURN,
      InventoryRefTypeEnum.SALE_RETURN
    ]),
    refId: orderId
  });

  // ===== TẠO TRANSACTIONS MỚI =====
  for (const line of order.lines) {
    if (!line.productVariantId) continue;

    const isReturnOrder = order.type === OrderTypeEnum.SALE_RETURN ||
                          order.type === OrderTypeEnum.PURCHASE_RETURN;

    if (isReturnOrder) {
      // ===== XỬ LÝ RETURN ORDER =====
      await this.processReturnOrderLine(order, line, manager);
    } else {
      // ===== XỬ LÝ NORMAL ORDER (existing logic) =====
      await this.processNormalOrderLine(order, line, manager);
    }
  }
}

private async processReturnOrderLine(
  order: Order,
  line: OrderLine,
  manager: EntityManager
): Promise<void> {
  // Lấy metadata từ transaction gốc
  const originalTx = await manager.findOne(InventoryTransaction, {
    where: {
      refType: order.type === OrderTypeEnum.SALE_RETURN
        ? InventoryRefTypeEnum.SALE
        : InventoryRefTypeEnum.PURCHASE,
      refId: line.refOrderLine?.orderId,
      productVariantId: line.productVariantId
    }
  });

  const originalMetadata = originalTx?.metadata?.fifo as number[][] || null;

  // Xử lý FIFO return
  const returnResult = await this.fifoService.processReturnWithMetadata(
    line.productVariantId!,
    order.storeId,
    line.quantity,
    originalMetadata,
    manager
  );

  // Tạo inventory transaction với metadata của return
  const txType = order.type === OrderTypeEnum.SALE_RETURN
    ? InventoryTransactionTypeEnum.INCREASE // Khách trả → tăng tồn
    : InventoryTransactionTypeEnum.DECREASE; // Trả NCC → giảm tồn

  const refType = order.type === OrderTypeEnum.SALE_RETURN
    ? InventoryRefTypeEnum.SALE_RETURN
    : InventoryRefTypeEnum.PURCHASE_RETURN;

  await manager.save(InventoryTransaction, {
    occurredAt: order.orderAt,
    productVariantId: line.productVariantId,
    storeId: order.storeId,
    quantity: line.quantity,
    amount: returnResult.totalCost, // Dùng cost từ FIFO
    type: txType,
    refType: refType,
    refId: order.id,
    refCode: order.code,
    metadata: {
      fifo: returnResult.returnDetails,
      refOrderLineId: line.refOrderLineId
    }
  });
}

private async processNormalOrderLine(
  order: Order,
  line: OrderLine,
  manager: EntityManager
): Promise<void> {
  // Existing logic for PURCHASE/SALE
  if (order.type === OrderTypeEnum.PURCHASE) {
    // Nhập kho
    await this.fifoService.processStockIn(...);
    // Create transaction với metadata = null
  } else {
    // Xuất kho
    const fifoResult = await this.fifoService.processStockOut(...);
    const metadata = this.fifoService.convertToMetadata(fifoResult.details);

    // Create transaction với metadata
    await manager.save(InventoryTransaction, {
      ...
      metadata: { fifo: metadata }
    });
  }
}
```

---

### 4. Update PartnerDebt Service

**File**: `src/modules/partnerDebt/partnerDebtRecalculate.service.ts`

**Cần update method `recalculateFromDate()`:**

```typescript
// Trong query transactions, thêm filter cho return orders
const transactions = await manager
  .createQueryBuilder(PartnerDebtTransaction, "tx")
  // ... existing conditions
  .andWhere("tx.refType IN (:...refTypes)", {
    refTypes: [
      "order_purchase",
      "order_sale",
      "order_purchase_return", // Mới
      "order_sale_return", // Mới
    ],
  })
  .getMany();

// Logic tính công nợ:
// - PURCHASE / SALE_RETURN: Tăng phải trả
// - SALE / PURCHASE_RETURN: Tăng phải thu
```

**Mapping refType:**

- `order_purchase` → INCREASE payable debt
- `order_sale` → INCREASE receivable debt
- `order_purchase_return` → DECREASE payable debt (khách trả NCC)
- `order_sale_return` → DECREASE receivable debt (khách trả lại)

---

### 5. Update VatDebt Service

**File**: `src/modules/vatDebt/vatDebtRecalculate.service.ts`

**Logic thuế cho return:**

```typescript
// SALE_RETURN: Xử lý như PURCHASE
if (refType === "order_sale_return") {
  // Giảm output VAT (VAT đầu ra)
  // Tương đương việc tăng input VAT
}

// PURCHASE_RETURN: Xử lý như SALE
if (refType === "order_purchase_return") {
  // Giảm input VAT (VAT đầu vào)
  // Tương đương việc tăng output VAT
}
```

**Quan trọng**: taxRate được lấy từ `refOrderLineId`, không nhận mới

---

### 6. Update Dashboard Service

**File**: `src/modules/dashboard/dashboard.service.ts`

**Metrics mới cần thêm:**

```typescript
interface DashboardMetrics {
  // Existing
  revenue: number;
  cost: number;
  profit: number;

  // New - Return metrics
  saleReturnAmount: number; // Tổng giá trị khách trả hàng
  purchaseReturnAmount: number; // Tổng giá trị trả NCC
  netRevenue: number; // Revenue - saleReturnAmount
  netCost: number; // Cost - purchaseReturnAmount
  netProfit: number; // netRevenue - netCost
}
```

**Query cần update:**

```typescript
// Query orders với filter type
const sales = await manager
  .createQueryBuilder(Order, "o")
  .where("o.type = :type", { type: OrderTypeEnum.SALE })
  .andWhere("o.orderAt BETWEEN :startAt AND :endAt", { startAt, endAt })
  .select("SUM(o.netAmount)", "total")
  .getRawOne();

const saleReturns = await manager
  .createQueryBuilder(Order, "o")
  .where("o.type = :type", { type: OrderTypeEnum.SALE_RETURN })
  .andWhere("o.orderAt BETWEEN :startAt AND :endAt", { startAt, endAt })
  .select("SUM(o.netAmount)", "total")
  .getRawOne();

const netRevenue = (sales.total || 0) - (saleReturns.total || 0);
```

---

## 📝 Validator Schema

**File**: `src/modules/order/order.validator.ts`

```typescript
const CreateOrderLineSchema = z.object({
  productVariantId: z.string().uuid().optional(), // Optional cho return
  refOrderLineId: z.string().uuid().optional(),    // Required cho return
  unitPrice: z.number().min(0),
  quantity: z.number().positive(),
  taxRate: z.number().min(0).max(100).optional(),  // Không bắt buộc, lấy từ ref
  discountType: z.enum([...]),
  discountValue: z.number().min(0).optional(),
});

const CreateOrderSchema = z.object({
  type: z.enum([
    OrderTypeEnum.PURCHASE,
    OrderTypeEnum.SALE,
    OrderTypeEnum.PURCHASE_RETURN,
    OrderTypeEnum.SALE_RETURN
  ]),
  refOrderId: z.string().uuid().optional(), // Optional reference
  partnerId: z.string().uuid(),
  orderAt: z.string().datetime(),
  lines: z.array(CreateOrderLineSchema).min(1),
  ...
}).superRefine((data, ctx) => {
  // Validation cho return orders
  if (data.type === OrderTypeEnum.SALE_RETURN ||
      data.type === OrderTypeEnum.PURCHASE_RETURN) {
    data.lines.forEach((line, idx) => {
      if (!line.refOrderLineId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "refOrderLineId is required for return orders",
          path: [`lines`, idx, 'refOrderLineId']
        });
      }
    });
  }
});
```

---

## 🚀 Migration cần chạy

```sql
-- Đã có sẵn trong schema
ALTER TABLE order_lines
  ADD COLUMN IF NOT EXISTS ref_order_line_id UUID REFERENCES order_lines(id) ON DELETE SET NULL;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS ref_order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- Update enum
ALTER TYPE order_type_enum ADD VALUE IF NOT EXISTS 'purchase_return';
ALTER TYPE order_type_enum ADD VALUE IF NOT EXISTS 'sale_return';

ALTER TYPE inventory_ref_type_enum ADD VALUE IF NOT EXISTS 'purchase_return';
ALTER TYPE inventory_ref_type_enum ADD VALUE IF NOT EXISTS 'sale_return';
```

---

## 🧪 Test Cases

### 1. Test SALE_RETURN

```typescript
// Tạo đơn SALE
const saleOrder = await orderService.create({
  type: OrderTypeEnum.SALE,
  lines: [
    {
      productVariantId: "variant-1",
      quantity: 5,
      unitPrice: 100000,
    },
  ],
});

// Tạo đơn hoàn trả
const returnOrder = await orderService.create({
  type: OrderTypeEnum.SALE_RETURN,
  refOrderId: saleOrder.id,
  lines: [
    {
      refOrderLineId: saleOrder.lines[0].id,
      quantity: 3,
      unitPrice: 100000, // Giá hoàn = giá bán
    },
  ],
});

// Verify:
// ✅ Inventory increased by 3
// ✅ PartnerDebt receivable decreased
// ✅ VAT output decreased
// ✅ FIFO restored correctly
```

### 2. Test PURCHASE_RETURN

```typescript
// Tạo đơn PURCHASE
const purchaseOrder = await orderService.create({
  type: OrderTypeEnum.PURCHASE,
  lines: [
    {
      productVariantId: "variant-1",
      quantity: 10,
      unitPrice: 80000,
    },
  ],
});

// Trả NCC
const returnOrder = await orderService.create({
  type: OrderTypeEnum.PURCHASE_RETURN,
  refOrderId: purchaseOrder.id,
  lines: [
    {
      refOrderLineId: purchaseOrder.lines[0].id,
      quantity: 2,
      unitPrice: 80000, // Giá trả = giá mua
    },
  ],
});

// Verify:
// ✅ Inventory decreased by 2
// ✅ PartnerDebt payable decreased
// ✅ VAT input decreased
```

---

## 📊 Flow Chart

```
┌─────────────────────────────────────────┐
│  User creates RETURN order             │
│  - type: SALE_RETURN/PURCHASE_RETURN   │
│  - lines có refOrderLineId              │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  validateBeforeCreate()                │
│  - Validate refOrderLineId exists      │
│  - Validate order type match           │
│  - Auto fill productVariantId          │
│  - Auto fill taxRate từ refLine        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  calculateOrder()                       │
│  - Tính discount, tax như bình thường  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  recalculateOrder()                    │
│  - Get metadata từ transaction gốc     │
│  - processReturnWithMetadata()         │
│  - Create InventoryTransaction         │
│    + type: INCREASE/DECREASE           │
│    + metadata: return details          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Recalculate Services                  │
│  - inventoryRecalculate                │
│  - partnerDebtRecalculate              │
│  - vatDebtRecalculate                  │
└─────────────────────────────────────────┘
```

---

## ⚠️ Lưu ý quan trọng

1. **Metadata format**: `[[qty, cost], [qty, cost], ...]`
2. **TaxRate**: Bắt buộc lấy từ `refOrderLineId`, không nhận mới
3. **Quantity validation**: Cần check tổng đã hoàn không vượt quá gốc
4. **FIFO reverse**: Hoàn theo thứ tự NGƯỢC LẠI (LIFO của đợt xuất)
5. **UnitPrice**: Dùng giá đơn hàng, không phải FIFO cost
6. **Dashboard**: Phải tính cả net metrics (revenue - returns)

---

## 📅 Timeline ước tính

- ✅ **Phase 1**: Enum + FIFO Service (Hoàn thành)
- 🔄 **Phase 2**: Order Service (40% - Đang làm)
- ⏳ **Phase 3**: PartnerDebt Service (Chưa bắt đầu)
- ⏳ **Phase 4**: VatDebt Service (Chưa bắt đầu)
- ⏳ **Phase 5**: Dashboard Service (Chưa bắt đầu)
- ⏳ **Phase 6**: Testing & Bug fixes (Chưa bắt đầu)

---

**Status**: 🚧 Work in Progress
**Last Updated**: 2026-02-02
