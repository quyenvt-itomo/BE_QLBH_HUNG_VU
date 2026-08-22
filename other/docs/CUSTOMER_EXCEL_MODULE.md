# Module Nhập Xuất Excel Khách Hàng

Module này cung cấp chức năng nhập và xuất khách hàng từ/ra file Excel với validation và error handling realtime.

## Cấu trúc

```
customer/
├── customer.types.ts       # Định nghĩa type, enum, columns cho Customer Excel
├── customer.validator.ts   # Zod schema validation (Layer 1)
├── customer.template.ts    # Template generator và export handler
└── customer.processor.ts   # Import processor với realtime progress (Layer 2)
```

## Tính năng

### 1. Export khách hàng ra Excel

- Xuất danh sách khách hàng (Partner type = CUSTOMER)
- Hỗ trợ filter theo các tiêu chí
- Format số liệu (doanh số, điểm tích lũy, công nợ)
- Auto-filter và freeze header row

### 2. Tạo template Excel

- Template rỗng để nhập khách hàng
- Data validation cho các cột (loại khách hàng, email, số tiền)
- Sheet hướng dẫn chi tiết

### 3. Import khách hàng từ Excel

- **Realtime progress tracking** qua SSE
- **Layer 1 validation** với Zod schema
- **Layer 2 processing** với error handling
- **Error file generation** - File Excel highlight các dòng lỗi
- Hỗ trợ xử lý duplicate: Skip, Stop, hoặc Update
- Tự động tạo mã khách hàng nếu không có

## API Endpoints

### Export Customer

```http
POST /api/v1/excel/export
Content-Type: application/json

{
  "entityType": "customer",
  "columns": [], // Optional, default: tất cả columns
  "filters": {} // Optional
}
```

### Get Template

```http
GET /api/v1/excel/template/customer
```

### Import Customer

```http
POST /api/v1/excel/import
Content-Type: application/json

{
  "entityType": "customer",
  "fileId": "uuid-of-uploaded-file",
  "errorHandling": "skip_error", // "stop_on_error" | "skip_error"
  "duplicateHandling": "skip" // "stop" | "skip" | "update"
}

Response:
{
  "jobId": "uuid"
}
```

### Track Import Progress (SSE)

```http
GET /api/v1/excel/import/:jobId/progress
```

## Cấu trúc file Excel

### Các cột bắt buộc:

- **Tên khách hàng** (required)

### Các cột tùy chọn:

- Loại khách hàng: "Cá nhân" hoặc "Tổ chức"
- Mã khách hàng (tự động tạo nếu trống)
- Số điện thoại
- Email
- Địa chỉ: Tỉnh/Thành phố - Phường/Xã
- Địa chỉ chi tiết
- Mã số thuế
- Nhóm khách hàng
- Ghi chú
- Doanh số hiện tại (>= 0)
- Điểm tích lũy (>= 0)
- Số tiền đang nợ

## Layer 1: Validation

File: `customer.validator.ts`

Sử dụng Zod schema với `z.preprocess` để:

- Transform dữ liệu từ Excel (trim, normalize)
- Validate format (email, phone, số tiền)
- Coerce types (string → boolean, string → number)

```typescript
CustomerExcelRowSchema = z.object({
  _rowNumber: z.number(),
  type: z.preprocess(..., z.boolean()),
  name: z.string().min(1).max(255),
  email: z.string().email().nullable().optional(),
  // ...
})
```

## Layer 2: Processing & Error Handling

File: `customer.processor.ts`

### Flow xử lý:

1. **Parse worksheet** → RawCustomerRow[]
2. **Validate từng row** với Zod schema
3. **Check duplicate** (code, email, phone)
4. **Create/Update** customer
5. **Track progress** và emit qua callback
6. **Generate error file** nếu có lỗi

### Error File

- Chỉ chứa các dòng lỗi
- Cột "LỖI" mô tả chi tiết lỗi
- Highlight màu đỏ
- Lưu tại `/uploads/temp/errors/`

## Duplicate Handling

### STOP

Dừng import khi gặp khách hàng trùng, báo lỗi

### SKIP

Bỏ qua khách hàng trùng, tiếp tục import

### UPDATE

Cập nhật thông tin khách hàng đã tồn tại

## Tự động tạo mã khách hàng

Nếu cột "Mã khách hàng" để trống:

- Prefix: `KH`
- Format: `KH0001`, `KH0002`, ...
- Tự động increment dựa trên mã cuối cùng

## Realtime Progress

### Via SSE:

```javascript
const eventSource = new EventSource(`/api/v1/excel/import/${jobId}/progress`);

eventSource.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  console.log(`Progress: ${progress.progress}%`);
  console.log(`Success: ${progress.successRows}`);
  console.log(`Errors: ${progress.errorRows}`);

  if (progress.status === "completed") {
    console.log("Error file:", progress.errorFileUrl);
    eventSource.close();
  }
};
```

### Frequency:

- < 100 rows: emit mỗi 10%
- 100-1000 rows: emit mỗi 5%
- > 1000 rows: emit mỗi 1%

## Ví dụ sử dụng

### 1. Export khách hàng

```typescript
const response = await fetch("/api/v1/excel/export", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    entityType: "customer",
    filters: {
      groupId: "uuid-of-group",
      keyword: "search term",
    },
  }),
});

const { url } = await response.json();
window.open(url, "_blank");
```

### 2. Import khách hàng

```typescript
// 1. Upload file
const formData = new FormData();
formData.append("file", fileInput.files[0]);
const uploadRes = await fetch("/api/v1/files/upload", {
  method: "POST",
  body: formData,
});
const { fileId } = await uploadRes.json();

// 2. Start import job
const importRes = await fetch("/api/v1/excel/import", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    entityType: "customer",
    fileId,
    errorHandling: "skip_error",
    duplicateHandling: "update",
  }),
});
const { jobId } = await importRes.json();

// 3. Track progress
const eventSource = new EventSource(`/api/v1/excel/import/${jobId}/progress`);
eventSource.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  updateProgressBar(progress.progress);

  if (progress.status === "completed") {
    if (progress.errorFileUrl) {
      showErrorFile(progress.errorFileUrl);
    }
    eventSource.close();
  }
};
```

## Validation Rules

### Email

- Phải đúng format email
- Max 255 ký tự
- Unique (khuyến nghị)

### Phone

- Max 50 ký tự
- Tự động xóa spaces, dashes, parentheses
- Unique (khuyến nghị)

### Số tiền (doanh số, điểm, công nợ)

- Phải >= 0
- Tự động convert sang number

### Loại khách hàng

- "Cá nhân" hoặc "Tổ chức"
- Default: "Cá nhân"

## Xử lý lỗi

### Validation Errors

Lỗi từ Zod schema:

- Field name
- Error message
- Row number
- Received value

### Processing Errors

Lỗi khi xử lý:

- Database errors
- Duplicate errors
- Business logic errors

### Error File Structure

| Loại khách hàng | Mã    | Tên          | ... | LỖI                                          |
| --------------- | ----- | ------------ | --- | -------------------------------------------- |
| Cá nhân         | KH001 | Nguyễn Văn A | ... | Email không hợp lệ; Số điện thoại đã tồn tại |

## Best Practices

1. **Validate file trước khi import**

   ```typescript
   const validation = await fetch(`/api/v1/excel/validate/${fileId}/customer`);
   ```

2. **Handle errors gracefully**
   - Download error file
   - Fix errors
   - Re-import

3. **Use appropriate duplicate handling**
   - `STOP`: Initial import, cần data sạch
   - `SKIP`: Import bổ sung
   - `UPDATE`: Cập nhật thông tin

4. **Monitor progress**
   - Show progress bar
   - Allow cancel
   - Show statistics

## Troubleshooting

### File không đọc được

- Kiểm tra format (.xlsx, .xls)
- Kiểm tra sheet name: "Customers"
- Kiểm tra headers

### Import chậm

- Giảm số lượng rows
- Tối ưu validation
- Check database indexes

### Lỗi duplicate không được catch

- Kiểm tra `uniqueFields` setting
- Verify database constraints

### Error file không được tạo

- Check write permissions: `uploads/temp/errors/`
- Check disk space
- Check error logging
