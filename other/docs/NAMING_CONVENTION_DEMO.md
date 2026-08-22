# 🎯 Naming Convention Demo

Tool đã được cập nhật để sử dụng **camelCase naming convention** cho file và thư mục.

## 📝 Quy tắc Naming

| Entity (PascalCase) | Module Folder        | Generated Files                                                        |
| ------------------- | -------------------- | ---------------------------------------------------------------------- |
| `User`              | `user/`              | `user.controller.ts`, `user.service.ts`, ...                           |
| `Product`           | `product/`           | `product.controller.ts`, `product.service.ts`, ...                     |
| `ProductAttribute`  | `productAttribute/`  | `productAttribute.controller.ts`, `productAttribute.service.ts`, ...   |
| `OrderDetail`       | `orderDetail/`       | `orderDetail.controller.ts`, `orderDetail.service.ts`, ...             |
| `ConsignmentDetail` | `consignmentDetail/` | `consignmentDetail.controller.ts`, `consignmentDetail.service.ts`, ... |

## 🔧 Implementation

Sử dụng helper method `toCamelCase()`:

```typescript
private toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}
```

## ✅ Generated Structure

```
src/modules/
├── user/
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── user.repository.ts
│   ├── user.route.ts
│   ├── user.select.ts
│   └── user.validator.ts
├── productAttribute/
│   ├── productAttribute.controller.ts
│   ├── productAttribute.service.ts
│   ├── productAttribute.repository.ts
│   ├── productAttribute.route.ts
│   ├── productAttribute.select.ts
│   └── productAttribute.validator.ts
└── orderDetail/
    ├── orderDetail.controller.ts
    ├── orderDetail.service.ts
    ├── orderDetail.repository.ts
    ├── orderDetail.route.ts
    ├── orderDetail.select.ts
    └── orderDetail.validator.ts
```

## 📊 Benefits

- ✅ **Consistent**: Đồng nhất với JavaScript/TypeScript naming conventions
- ✅ **Readable**: Dễ đọc và phân biệt với class names (PascalCase)
- ✅ **Standard**: Tuân theo industry best practices
- ✅ **IDE Friendly**: Tốt hơn cho auto-completion và file navigation
