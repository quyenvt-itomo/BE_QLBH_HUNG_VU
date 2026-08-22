# 📖 Ví dụ sử dụng Module Excel Import/Export

## 🎯 Kịch bản 1: Export danh sách sản phẩm

### Request

```http
POST /api/v1/excel/export
Content-Type: application/json
Authorization: Bearer <your-token>

{
  "entityType": "product",
  "columns": [
    {
      "field": "code",
      "header": "Mã sản phẩm (*)",
      "width": 20,
      "required": true
    },
    {
      "field": "name",
      "header": "Tên sản phẩm (*)",
      "width": 30,
      "required": true
    },
    {
      "field": "categoryName",
      "header": "Danh mục",
      "width": 25
    },
    {
      "field": "unitName",
      "header": "Đơn vị tính",
      "width": 15
    },
    {
      "field": "variantSku",
      "header": "SKU",
      "width": 20
    },
    {
      "field": "variantCostPrice",
      "header": "Giá vốn",
      "width": 15
    },
    {
      "field": "variantPrice",
      "header": "Giá bán",
      "width": 15
    },
    {
      "field": "variantIsActive",
      "header": "Trạng thái",
      "width": 12
    }
  ],
  "filters": {
    "categoryId": "550e8400-e29b-41d4-a716-446655440000"
  },
  "filename": "san_pham_thoi_trang_2026.xlsx"
}
```

### Response

File Excel được tải về với tên `san_pham_thoi_trang_2026.xlsx`

---

## 🎯 Kịch bản 2: Tải template và nhập sản phẩm mới

### Bước 1: Tải template

```bash
# Lấy URL template
curl -X GET \
  -H "Authorization: Bearer <your-token>" \
  http://localhost:4000/api/v1/excel/template/product

# Response:
{
  "statusCode": 200,
  "success": true,
  "message": "Template đã được tạo thành công",
  "data": {
    "url": "/uploads/temp/templates/product_template_1738252885123.xlsx",
    "filename": "product_template_1738252885123.xlsx",
    "expiresAt": "2026-01-31T11:21:25.123Z"
  }
}

# Sau đó tải file từ URL được trả về
curl -o product_template.xlsx \
  http://localhost:4000/uploads/temp/templates/product_template_1738252885123.xlsx
```

### Bước 1.1: Template động cho đối soát kho

```bash
# Tạo template với danh sách sản phẩm của kho cụ thể
curl -X GET \
  -H "Authorization: Bearer <your-token>" \
  "http://localhost:4000/api/v1/excel/template/inventory_check?storeId=550e8400-e29b-41d4-a716-446655440000"

# Response tương tự, nhưng file sẽ chứa danh sách sản phẩm có trong kho đó
```

### Bước 2: Điền dữ liệu vào Excel

**Ví dụ dữ liệu trong file Excel:**

| Mã SP (\*) | Tên SP (\*)   | Danh mục | Đơn vị | Thuế | SKU      | Barcode       | Giá vốn (\*) | Giá bán (\*) | Kích hoạt | Thuộc tính 1 | Giá trị 1 | Thuộc tính 2 | Giá trị 2 |
| ---------- | ------------- | -------- | ------ | ---- | -------- | ------------- | ------------ | ------------ | --------- | ------------ | --------- | ------------ | --------- |
| SP001      | Áo thun basic | Áo       | Cái    | 10   | AT-S-RED | 8934567890123 | 50000        | 120000       | Có        | Size         | S         | Màu          | Đỏ        |
| SP001      | Áo thun basic | Áo       | Cái    | 10   | AT-M-RED | 8934567890124 | 50000        | 120000       | Có        | Size         | M         | Màu          | Đỏ        |
| SP001      | Áo thun basic | Áo       | Cái    | 10   | AT-L-RED | 8934567890125 | 50000        | 120000       | Có        | Size         | L         | Màu          | Đỏ        |
| SP001      | Áo thun basic | Áo       | Cái    | 10   | AT-S-BLU | 8934567890126 | 50000        | 120000       | Có        | Size         | S         | Màu          | Xanh      |
| SP002      | Quần jean     | Quần     | Cái    | 10   | QJ-M     | 8934567890201 | 150000       | 350000       | Có        |              |           |              |           |

### Bước 3: Upload file Excel

```bash
curl -X POST http://localhost:3000/api/v1/file/upload \
  -H "Authorization: Bearer <your-token>" \
  -F "files=@product_import.xlsx" \
  -F "entityType=temp" \
  -F "category=excel"
```

**Response:**

```json
{
  "statusCode": 201,
  "success": true,
  "message": "Upload thành công",
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "fileName": "product_import.xlsx",
      "path": "uploads/temp/excel/1234567890_product_import.xlsx"
    }
  ]
}
```

### Bước 4: Validate file (tùy chọn)

```http
POST /api/v1/excel/validate
Content-Type: application/json
Authorization: Bearer <your-token>

{
  "fileId": "123e4567-e89b-12d3-a456-426614174000",
  "entityType": "product"
}
```

**Response thành công:**

```json
{
  "statusCode": 200,
  "success": true,
  "message": "File hợp lệ",
  "data": {
    "valid": true,
    "errors": []
  }
}
```

**Response lỗi:**

```json
{
  "statusCode": 400,
  "success": false,
  "message": "File không hợp lệ",
  "errors": ["Thiếu các cột bắt buộc: Mã sản phẩm (*), Giá vốn (*)"]
}
```

### Bước 5: Import dữ liệu

```http
POST /api/v1/excel/import
Content-Type: application/json
Authorization: Bearer <your-token>

{
  "entityType": "product",
  "fileId": "123e4567-e89b-12d3-a456-426614174000",
  "errorHandling": "skip_error",
  "duplicateHandling": "skip",
  "uniqueFields": ["code"]
}
```

**Response:**

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Import hoàn tất: 4/5 dòng thành công",
  "data": {
    "totalRows": 5,
    "successRows": 4,
    "errorRows": 0,
    "skippedRows": 1,
    "errors": [],
    "data": [
      {
        "id": "product-uuid-1",
        "code": "SP001",
        "name": "Áo thun basic",
        "variants": [
          { "sku": "AT-S-RED", "price": 120000 },
          { "sku": "AT-M-RED", "price": 120000 },
          { "sku": "AT-L-RED", "price": 120000 },
          { "sku": "AT-S-BLU", "price": 120000 }
        ]
      },
      {
        "id": "product-uuid-2",
        "code": "SP002",
        "name": "Quần jean"
      }
    ]
  }
}
```

---

## 🎯 Kịch bản 3: Cập nhật thông tin sản phẩm hàng loạt

### Bước 1: Export danh sách hiện tại

```http
POST /api/v1/excel/export
Content-Type: application/json
Authorization: Bearer <your-token>

{
  "entityType": "product",
  "columns": [
    { "field": "code", "header": "Mã sản phẩm (*)", "width": 20 },
    { "field": "name", "header": "Tên sản phẩm (*)", "width": 30 },
    { "field": "variantSku", "header": "SKU", "width": 20 },
    { "field": "variantPrice", "header": "Giá bán (*)", "width": 15 }
  ],
  "filename": "products_for_update.xlsx"
}
```

### Bước 2: Chỉnh sửa giá trong Excel

Mở file và cập nhật giá bán mới:

| Mã SP (\*) | Tên SP (\*)   | SKU      | Giá bán (\*) |
| ---------- | ------------- | -------- | ------------ |
| SP001      | Áo thun basic | AT-S-RED | 150000       |
| SP001      | Áo thun basic | AT-M-RED | 150000       |
| SP001      | Áo thun basic | AT-L-RED | 150000       |

### Bước 3: Upload và import với UPDATE mode

```bash
# Upload file
curl -X POST http://localhost:3000/api/v1/file/upload \
  -F "files=@products_updated.xlsx" \
  -H "Authorization: Bearer <token>"

# Import với duplicateHandling = "update"
curl -X POST http://localhost:3000/api/v1/excel/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "entityType": "product",
    "fileId": "new-file-uuid",
    "errorHandling": "stop_on_error",
    "duplicateHandling": "update",
    "uniqueFields": ["code"]
  }'
```

**Response:**

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Import hoàn tất: 3/3 dòng thành công",
  "data": {
    "totalRows": 3,
    "successRows": 3,
    "errorRows": 0,
    "skippedRows": 0,
    "errors": []
  }
}
```

---

## 🎯 Kịch bản 4: Xử lý lỗi khi import

### File Excel có lỗi

| Mã SP (\*) | Tên SP (\*) | Giá vốn (\*) | Giá bán (\*) |
| ---------- | ----------- | ------------ | ------------ |
| SP001      | Áo thun     | 50000        | 120000       |
|            | Quần jean   | 150000       | 350000       |
| SP003      | Váy         |              | 250000       |
| SP001      | Áo thun     | 50000        | 120000       |

**Lỗi:**

- Dòng 2: Thiếu mã sản phẩm
- Dòng 3: Thiếu giá vốn
- Dòng 4: Trùng mã SP001

### Import với stop_on_error

```json
{
  "entityType": "product",
  "fileId": "file-uuid",
  "errorHandling": "stop_on_error",
  "duplicateHandling": "stop"
}
```

**Response:**

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Import hoàn tất: 1/4 dòng thành công",
  "data": {
    "totalRows": 4,
    "successRows": 1,
    "errorRows": 3,
    "skippedRows": 0,
    "errors": [
      {
        "row": 2,
        "field": "code",
        "message": "Mã sản phẩm không được để trống"
      },
      {
        "row": 3,
        "field": "variantCostPrice",
        "message": "Giá vốn không được để trống"
      },
      {
        "row": 4,
        "field": "code",
        "message": "Mã sản phẩm 'SP001' đã tồn tại",
        "value": "SP001"
      }
    ]
  }
}
```

### Import với skip_error

```json
{
  "entityType": "product",
  "fileId": "file-uuid",
  "errorHandling": "skip_error",
  "duplicateHandling": "skip"
}
```

**Response:**

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Import hoàn tất: 1/4 dòng thành công",
  "data": {
    "totalRows": 4,
    "successRows": 1,
    "errorRows": 2,
    "skippedRows": 1,
    "errors": [
      {
        "row": 2,
        "field": "code",
        "message": "Mã sản phẩm không được để trống"
      },
      {
        "row": 3,
        "field": "variantCostPrice",
        "message": "Giá vốn không được để trống"
      }
    ]
  }
}
```

---

## 💡 Tips

### 1. Export hiệu quả

- Chỉ export các cột cần thiết
- Dùng filters để giới hạn data
- Export theo batch nếu có nhiều data

### 2. Import an toàn

- Luôn validate trước
- Backup database trước khi import lớn
- Test với file nhỏ trước
- Chọn `skip_error` cho bulk import

### 3. Xử lý duplicate

- `stop`: Dùng khi cần kiểm soát chặt chẽ
- `skip`: Dùng khi chỉ muốn thêm mới
- `update`: Dùng khi cần sync dữ liệu

### 4. Performance

- File < 5000 rows: Import trực tiếp
- File > 5000 rows: Chia nhỏ hoặc dùng background job (future)

---

## 🔗 Postman Collection

Import collection này vào Postman để test nhanh:

```json
{
  "info": {
    "name": "Excel Import/Export API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Export Products",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"entityType\": \"product\",\n  \"columns\": [\n    {\"field\": \"code\", \"header\": \"Mã sản phẩm\", \"width\": 20},\n    {\"field\": \"name\", \"header\": \"Tên sản phẩm\", \"width\": 30}\n  ]\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/excel/export",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "excel", "export"]
        }
      }
    },
    {
      "name": "Get Template",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/v1/excel/template/product",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "excel", "template", "product"]
        }
      }
    },
    {
      "name": "Validate File",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"fileId\": \"{{fileId}}\",\n  \"entityType\": \"product\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/excel/validate",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "excel", "validate"]
        }
      }
    },
    {
      "name": "Import Products",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"entityType\": \"product\",\n  \"fileId\": \"{{fileId}}\",\n  \"errorHandling\": \"skip_error\",\n  \"duplicateHandling\": \"update\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/excel/import",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "excel", "import"]
        }
      }
    }
  ]
}
```
