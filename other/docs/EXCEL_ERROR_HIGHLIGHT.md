# Excel Error Highlighting Feature

## Tổng quan

Tính năng tự động **highlight lỗi** trong file Excel import với:

- ✅ Bôi đỏ các ô có lỗi
- ✅ Thêm comment/note giải thích lỗi vào từng ô
- ✅ Trả về file Excel đã đánh dấu để người dùng sửa

## Cách hoạt động

### 1. Flow xử lý

```
User upload file Excel
    ↓
Backend process import
    ↓
Nếu có lỗi → Generate error file
    ↓
Highlight các ô lỗi (màu đỏ + comment)
    ↓
Save vào /uploads/temp/errors/
    ↓
Trả về URL trong response
```

### 2. Format lỗi

Mỗi lỗi bao gồm:

- `row`: Số dòng trong Excel (1-indexed)
- `field`: Tên field bị lỗi (ProductKey enum)
- `message`: Thông báo lỗi
- `value`: Giá trị gây lỗi (optional)
- `column`: Column letter trong Excel (A, B, C...) - tự động map

### 3. Highlight rules

#### Field-specific error (có `field`)

- Chỉ highlight ô tương ứng với field đó
- Ví dụ: `field: "taxRate"` → Chỉ bôi đỏ ô thuế suất

#### General error (không có `field`)

- Highlight toàn bộ dòng
- Ví dụ: Lỗi duplicate product

## Ví dụ sử dụng

### Response khi import thành công nhưng có lỗi

```json
{
  "jobId": "abc-123",
  "status": "completed",
  "progress": 100,
  "totalRows": 100,
  "successRows": 95,
  "errorRows": 5,
  "errors": [
    {
      "row": 10,
      "field": "taxRate",
      "message": "Thuế suất phải từ 0 đến 100",
      "value": 150
    },
    {
      "row": 25,
      "field": "codeOrSKU",
      "message": "Mã hàng hóa không được để trống"
    }
  ],
  "errorFileUrl": "/uploads/temp/errors/errors_1234567890.xlsx"
}
```

### Download error file

```typescript
// Frontend
if (result.errorFileUrl) {
  // Hiển thị link download
  const downloadUrl = `${API_BASE_URL}${result.errorFileUrl}`;
  window.open(downloadUrl, "_blank");
}
```

### File Excel lỗi

```
Row 10: Ô "Thuế suất" → Background đỏ, text trắng, có comment "Thuế suất phải từ 0 đến 100"
Row 25: Ô "Mã hàng hóa" → Background đỏ, text trắng, có comment "Mã hàng hóa không được để trống"
```

## Implementation details

### 1. Excel formatting

```typescript
// Cell với lỗi
cell.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFF0000" }, // Đỏ
};

cell.font = {
  color: { argb: "FFFFFFFF" }, // Trắng
  bold: true,
};

// Comment
cell.note = {
  texts: [
    {
      font: { size: 10, name: "Arial" },
      text: "Thông báo lỗi ở đây",
    },
  ],
};
```

### 2. Column mapping

System tự động map field name → column letter:

```typescript
ProductKey.CODE_OR_SKU → Column A
ProductKey.NAME_OR_OPTION → Column B
ProductKey.TAX_RATE → Column H
...
```

### 3. File storage

Error files được lưu tại:

- Path: `/uploads/temp/errors/errors_{timestamp}.xlsx`
- Auto cleanup: Sau 1 giờ (bởi autoClearTemp job)
- File gốc không bị modify

## Customize

### 1. Thay đổi màu highlight

Edit trong [product.processor.ts](../src/modules/excel/product/product.processor.ts):

```typescript
private highlightCell(cell: ExcelJS.Cell, errors: ImportError[]): void {
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFFF00" }, // Đổi sang màu vàng
  };
}
```

### 2. Customize comment format

```typescript
private highlightCell(cell: ExcelJS.Cell, errors: ImportError[]): void {
  const commentText = errors.map((e, i) =>
    `${i + 1}. ${e.message}\n   Giá trị: ${e.value || 'N/A'}`
  ).join("\n\n");

  cell.note = {
    texts: [{
      font: { size: 10, name: "Arial", bold: true },
      text: commentText
    }]
  };
}
```

### 3. Thêm field mới

Update [product.types.ts](../src/modules/excel/product/product.types.ts):

```typescript
export enum ProductKey {
  NEW_FIELD = "newField",
  // ...
}

export const PRODUCT_COLUMNS: ExportColumnConfig<ProductKey>[] = [
  {
    field: ProductKey.NEW_FIELD,
    header: "Tên cột mới",
    width: 20,
  },
  // ...
];
```

## Testing

### Test case 1: Field-specific error

```typescript
const errors = [{ row: 5, field: "taxRate", message: "Invalid rate" }];

// Expected: Chỉ ô thuế suất ở row 5 bị đỏ
```

### Test case 2: General error

```typescript
const errors = [{ row: 10, message: "Product already exists" }];

// Expected: Toàn bộ row 10 bị đỏ
```

### Test case 3: Multiple errors on same row

```typescript
const errors = [
  { row: 8, field: "codeOrSKU", message: "Code empty" },
  { row: 8, field: "taxRate", message: "Invalid rate" },
];

// Expected: Cả 2 ô bị đỏ với comment riêng
```

## Troubleshooting

### Lỗi: "Cannot find column for field"

- **Nguyên nhân**: Field name không match với PRODUCT_COLUMNS
- **Fix**: Kiểm tra ProductKey enum và PRODUCT_COLUMNS

### Lỗi: "Failed to generate error file"

- **Nguyên nhân**: Không có quyền write vào /uploads/temp/errors/
- **Fix**: `chmod 755 uploads/temp/errors/` hoặc tạo folder

### Comment không hiển thị

- **Nguyên nhân**: Excel version cũ không support note
- **Fix**: Dùng Excel 2016+ hoặc export sang .xls format

## References

- [ExcelJS Documentation](https://github.com/exceljs/exceljs)
- [Cell Comments](https://github.com/exceljs/exceljs#cell-comments)
- [Cell Styles](https://github.com/exceljs/exceljs#styles)
