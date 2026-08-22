# 📋 Hướng dẫn implement Template động

## 🎯 Mục đích

Hướng dẫn cách tạo template Excel động dựa trên context (ví dụ: đối soát kho với danh sách sản phẩm của kho cụ thể).

## 🏗️ Kiến trúc

### 1. Template Types

**Static Template:**

- Không phụ thuộc vào context
- Có thể cache hoặc tạo sẵn
- Ví dụ: Product import template

**Dynamic Template:**

- Phụ thuộc vào context (storeId, filters, etc.)
- Phải tạo mới mỗi lần request
- Ví dụ: Inventory check template với danh sách sản phẩm trong kho

### 2. Template Options

```typescript
export interface TemplateOptions {
  entityType: ExcelEntityType;
  storeId?: string; // Cho các template cần context (đối soát kho, etc.)
  filters?: Record<string, any>; // Các filters khác
  metadata?: Record<string, any>; // Metadata bổ sung
}

export interface TemplateResult {
  url: string; // URL để tải template
  filename: string; // Tên file
  expiresAt?: Date; // Thời gian hết hạn (cho temp files)
}
```

## 📝 Ví dụ: Inventory Check Template

### Bước 1: Tạo Entity Type

Thêm vào `excel.types.ts`:

```typescript
export enum ExcelEntityType {
  PRODUCT = "product",
  PARTNER = "partner",
  EMPLOYEE = "employee",
  INVENTORY_CHECK = "inventory_check", // ✅ Thêm mới
}
```

### Bước 2: Tạo Template Class

Tạo file `src/modules/excel/templates/inventory.template.ts`:

```typescript
import { injectable, inject } from "inversify";
import ExcelJS from "exceljs";
import { INVENTORY_TYPES, InventoryService } from "@/modules/inventory";
import { PRODUCT_TYPES, ProductService } from "@/modules/product";

@injectable()
export class InventoryCheckTemplate {
  constructor(
    @inject(INVENTORY_TYPES.InventoryService)
    private inventoryService: InventoryService,
    @inject(PRODUCT_TYPES.ProductService)
    private productService: ProductService,
  ) {}

  /**
   * Tạo template đối soát kho với danh sách sản phẩm hiện tại
   */
  async generateTemplate(storeId: string): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Đối soát kho");

    // Lấy danh sách tồn kho hiện tại
    const inventories = await this.inventoryService.findAll({
      where: { storeId },
      relations: ["product", "product.variants"],
    });

    // Headers
    sheet.columns = [
      { header: "Mã sản phẩm", key: "productCode", width: 20 },
      { header: "Tên sản phẩm", key: "productName", width: 30 },
      { header: "SKU", key: "sku", width: 20 },
      { header: "Tồn hệ thống", key: "systemQuantity", width: 15 },
      { header: "Tồn thực tế (*)", key: "actualQuantity", width: 15 },
      { header: "Chênh lệch", key: "difference", width: 15 },
      { header: "Ghi chú", key: "note", width: 30 },
    ];

    // Style header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Thêm dữ liệu hiện tại
    inventories.forEach((inv) => {
      sheet.addRow({
        productCode: inv.product.code,
        productName: inv.product.name,
        sku: inv.variant?.sku || "",
        systemQuantity: inv.quantity,
        actualQuantity: "", // Để trống để người dùng điền
        difference: `=E${sheet.rowCount + 1}-D${sheet.rowCount + 1}`, // Formula tính chênh lệch
        note: "",
      });
    });

    // Add instructions sheet
    this.addInstructions(workbook, storeId);

    return workbook;
  }

  private addInstructions(workbook: ExcelJS.Workbook, storeId: string) {
    const sheet = workbook.addWorksheet("Hướng dẫn");

    sheet.getColumn(1).width = 100;

    sheet.addRow(["📋 HƯỚNG DẪN ĐỐI SOÁT KHO"]);
    sheet.addRow([""]);
    sheet.addRow([`Kho: ${storeId}`]);
    sheet.addRow([`Ngày tạo: ${new Date().toLocaleString("vi-VN")}`]);
    sheet.addRow([""]);
    sheet.addRow(["CÁCH SỬ DỤNG:"]);
    sheet.addRow(["1. Kiểm tra số lượng thực tế của từng sản phẩm trong kho"]);
    sheet.addRow(["2. Điền số lượng thực tế vào cột 'Tồn thực tế'"]);
    sheet.addRow(["3. Cột 'Chênh lệch' sẽ tự động tính = Thực tế - Hệ thống"]);
    sheet.addRow(["4. Thêm ghi chú nếu cần (hư hỏng, mất mát, sai sót, etc.)"]);
    sheet.addRow(["5. Lưu file và upload để import"]);

    sheet.getRow(1).font = { bold: true, size: 14 };
  }
}
```

### Bước 3: Register vào Container

Thêm vào `excel.container.ts`:

```typescript
import { InventoryCheckTemplate } from "./templates/inventory.template";

export const excelModule = new ContainerModule((bind) => {
  // ... existing bindings

  // Templates
  bind(EXCEL_TYPES.InventoryCheckTemplate)
    .to(InventoryCheckTemplate)
    .inSingletonScope();
});

// Thêm vào excel.types.ts
export const EXCEL_TYPES = {
  // ... existing
  InventoryCheckTemplate: Symbol.for("InventoryCheckTemplate"),
};
```

### Bước 4: Cập nhật Service

Trong `excel.service.ts`, thêm case mới:

```typescript
import { InventoryCheckTemplate } from "./templates/inventory.template";

@injectable()
export class ExcelService {
  constructor(
    // ... existing injections
    @inject(EXCEL_TYPES.InventoryCheckTemplate)
    private inventoryCheckTemplate: InventoryCheckTemplate,
  ) {}

  async generateTemplate(
    req: Request,
    options: TemplateOptions,
  ): Promise<TemplateResult> {
    let workbook: ExcelJS.Workbook;
    const { entityType, storeId, filters } = options;

    switch (entityType) {
      case ExcelEntityType.PRODUCT:
        workbook = await this.productTemplate.generateTemplate();
        break;

      case ExcelEntityType.INVENTORY_CHECK:
        if (!storeId) {
          throw new Error("storeId là bắt buộc cho inventory check template");
        }
        workbook = await this.inventoryCheckTemplate.generateTemplate(storeId);
        break;

      default:
        throw new Error(`Entity type '${entityType}' không được hỗ trợ`);
    }

    // Lưu workbook vào temp folder
    const filename = `${entityType}_template_${Date.now()}.xlsx`;
    const tempDir = path.join(process.cwd(), "uploads", "temp", "templates");

    await fs.mkdir(tempDir, { recursive: true });
    const filePath = path.join(tempDir, filename);
    await workbook.xlsx.writeFile(filePath);

    const url = `/uploads/temp/templates/${filename}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    return { url, filename, expiresAt };
  }
}
```

## 🔄 Flow hoàn chỉnh

### 1. Client gọi API tạo template

```typescript
GET /api/v1/excel/template/inventory_check?storeId=abc-123

Response:
{
  "url": "/uploads/temp/templates/inventory_check_template_1738252885123.xlsx",
  "filename": "inventory_check_template_1738252885123.xlsx",
  "expiresAt": "2026-01-31T11:21:25.123Z"
}
```

### 2. Client tải file từ URL

```bash
curl -o inventory_check.xlsx \
  http://localhost:4000/uploads/temp/templates/inventory_check_template_1738252885123.xlsx
```

### 3. User điền dữ liệu và upload

```typescript
POST / api / v1 / file / upload;
Files: inventory_check_filled.xlsx;
```

### 4. Import dữ liệu

```typescript
POST /api/v1/excel/import
Body: {
  "entityType": "inventory_check",
  "fileId": "file-uuid-from-upload",
  "errorHandling": "skip_errors",
  "duplicateHandling": "update"
}
```

## 🎨 Best Practices

### 1. Template Naming

- Static: `{entityType}_template.xlsx`
- Dynamic: `{entityType}_template_{timestamp}.xlsx`

### 2. File Storage

- Static templates: Có thể lưu permanent trong `uploads/templates/static/`
- Dynamic templates: Lưu temp trong `uploads/temp/templates/` và auto-delete

### 3. Error Handling

```typescript
// Validate storeId exists
if (entityType === ExcelEntityType.INVENTORY_CHECK && !storeId) {
  throw new Error("storeId là bắt buộc cho inventory check template");
}

// Validate store belongs to user
const store = await storeService.findOne(storeId);
if (!store) {
  throw new NotFoundError("Kho không tồn tại");
}
```

### 4. Performance

- Cache static templates
- Use streaming for large datasets
- Limit rows in dynamic templates (pagination)

```typescript
// Giới hạn số dòng
const MAX_ROWS = 10000;
const inventories = await this.inventoryService.findAll({
  where: { storeId },
  take: MAX_ROWS,
});

if (inventories.length === MAX_ROWS) {
  console.warn(`Template bị giới hạn ${MAX_ROWS} dòng`);
}
```

## 📊 Monitoring

### Log template generation

```typescript
logger.info(`Template created: ${entityType}`, {
  storeId,
  filename,
  rowCount: sheet.rowCount,
  fileSize: buffer.length,
});
```

### Track template downloads

```typescript
// Có thể track qua middleware
app.use("/uploads/temp/templates", (req, res, next) => {
  logger.info("Template downloaded", {
    filename: req.path,
    userId: req.user?.id,
  });
  next();
});
```

## 🔐 Security

### 1. Validate permissions

```typescript
// Chỉ cho phép user xem template của kho mình quản lý
const userStores = await storeUserService.findStoresByUserId(req.user.id);
if (!userStores.some((s) => s.id === storeId)) {
  throw new ForbiddenError("Bạn không có quyền truy cập kho này");
}
```

### 2. Rate limiting

```typescript
// Giới hạn số lần tạo template
app.use(
  "/api/v1/excel/template",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per 15 minutes
  }),
);
```

### 3. File cleanup

AutoClearTemp job sẽ tự động xóa templates sau 1 giờ:

```typescript
// jobs/autoClearTemp.job.ts đã handle
const tempDir = path.join(process.cwd(), "uploads", "temp");
// Xóa files cũ hơn 1 giờ
```

## 🚀 Extensions

### Custom filters

```typescript
// Hỗ trợ filters phức tạp hơn
interface InventoryCheckFilters {
  categoryIds?: string[];
  minQuantity?: number;
  maxQuantity?: number;
  tags?: string[];
}

async generateTemplate(
  storeId: string,
  filters?: InventoryCheckFilters
): Promise<ExcelJS.Workbook> {
  const query = this.inventoryService.createQueryBuilder("inv")
    .where("inv.storeId = :storeId", { storeId });

  if (filters?.categoryIds?.length) {
    query.andWhere("inv.product.categoryId IN (:...categoryIds)", {
      categoryIds: filters.categoryIds,
    });
  }

  if (filters?.minQuantity !== undefined) {
    query.andWhere("inv.quantity >= :minQuantity", {
      minQuantity: filters.minQuantity,
    });
  }

  // ... more filters

  const inventories = await query.getMany();
  // ... generate template
}
```

### Template versioning

```typescript
// Lưu template version để track changes
interface TemplateMetadata {
  version: string;
  createdAt: Date;
  createdBy: string;
  entityType: string;
  context?: Record<string, any>;
}

// Thêm metadata vào instructions sheet
sheet.addRow([`Version: ${TEMPLATE_VERSION}`]);
sheet.addRow([`Created: ${new Date().toISOString()}`]);
```
