# Hướng Dẫn: Kết Hợp TypeORM Entity với Zod Validator

## Tổng Quan

Utility `entity-to-zod` cho phép tự động tạo Zod validation schemas từ TypeORM entities, giúp:

- **DRY (Don't Repeat Yourself)**: Không cần define schema 2 lần
- **Type Safety**: Đảm bảo consistency giữa database và validation
- **Auto-sync**: Tự động cập nhật khi entity thay đổi
- **Custom Validation**: Vẫn cho phép thêm validation logic riêng

## 🛠️ Cách Sử Dụng

### 1. Basic Usage

```typescript
import { z } from "zod";
import { CheckIn } from "@/database/entities/CheckIn";
import {
  createCreateSchema,
  createUpdateSchema,
  createQuerySchema,
  createParamsSchema,
} from "@/shared/utils/entity-to-zod";

// Tạo Create schema (exclude id, timestamps)
export const CreateCheckInSchema = createCreateSchema(CheckIn);

// Tạo Update schema (all optional)
export const UpdateCheckInSchema = createUpdateSchema(CheckIn);

// Query schema với pagination
export const CheckInQuerySchema = createQuerySchema(["keyword", "userId"]);

// Params schema cho ID
export const CheckInParamsSchema = createParamsSchema("id");
```

### 2. Custom Validations

```typescript
// Thêm custom validations
export const CreateCheckInSchema = createCreateSchema(CheckIn, {
  customValidations: {
    userId: z.number().positive("User ID must be positive"),
    courtId: z.number().positive("Court ID must be positive"),
    creditsUsed: z.number().min(0, "Credits used cannot be negative"),
    checkInTime: z.date().optional(), // Override default behavior
  },
});

// Exclude thêm fields
export const UpdateCheckInSchema = createUpdateSchema(CheckIn, {
  exclude: ["someField"],
  customValidations: {
    userId: z.number().positive("User ID must be positive").optional(),
  },
});
```

### 3. Advanced Options

```typescript
// Include only specific fields
const schema = createZodSchemaFromEntity(CheckIn, {
  include: ["userId", "courtId"], // Chỉ include những field này
  optional: ["courtId"], // Make these optional
  customValidations: {
    userId: z.number().positive(),
  },
});
```

## 📊 Type Mapping

Utility tự động map TypeORM types sang Zod types:

| TypeORM Type        | Zod Type                | Example                          |
| ------------------- | ----------------------- | -------------------------------- |
| `int`, `integer`    | `z.number().int()`      | `@Column({ type: "int" })`       |
| `varchar`, `text`   | `z.string()`            | `@Column({ type: "varchar" })`   |
| `timestamp`, `date` | `z.date()`              | `@Column({ type: "timestamp" })` |
| `boolean`           | `z.boolean()`           | `@Column({ type: "boolean" })`   |
| `json`, `jsonb`     | `z.record(z.unknown())` | `@Column({ type: "json" })`      |

## 🚀 Auto-Generator

### Tạo Validator cho Tất Cả Entities

```bash
# Tạo tất cả validators
npm run validator:auto-gen

# Chỉ tạo report analysis
npm run validator:auto-gen -- --report-only

# Xem help
npm run validator:auto-gen -- --help
```

### Generated Files

```
src/modules/
├── checkIn/
│   ├── checkIn.validator.ts          # Manual validator (existing)
│   └── checkIn.validator.auto.ts     # Auto-generated validator
├── user/
│   ├── user.validator.ts
│   └── user.validator.auto.ts
└── ...
```

## 🔄 So Sánh: Manual vs Auto

### Manual Schema (Trước đây)

```typescript
export const CreateCheckInSchema = z.object({
  userId: z.number({ message: "userId.required" }),
  courtId: z.number({ message: "courtId.required" }),
  creditsUsed: z.number({ message: "creditsUsed.required" }),
  checkInTime: z.date({ message: "checkInTime.required" }),
});
```

### Auto-generated Schema (Bây giờ)

```typescript
// Tự động từ CheckIn entity
export const CreateCheckInSchema = createCreateSchema(CheckIn, {
  customValidations: {
    userId: z.number().positive("User ID must be positive"),
    courtId: z.number().positive("Court ID must be positive"),
    creditsUsed: z.number().min(0, "Credits used cannot be negative"),
  },
});
```

## ✅ Ưu Điểm

### 1. **DRY Principle**

- Không cần define field types 2 lần
- Single source of truth: Entity
- Giảm code duplication

### 2. **Type Safety**

- TypeScript types tự động sync
- Compile-time error checking
- IntelliSense support

### 3. **Maintenance**

- Thêm field vào entity → validator tự cập nhật
- Đổi type trong entity → validation tự thay đổi
- Ít risk khi refactor

### 4. **Flexibility**

- Vẫn cho phép custom validation
- Override default behavior
- Mix manual + auto schemas

## 🎯 Best Practices

### 1. **Naming Convention**

```typescript
// Good
export const CreateUserSchema = createCreateSchema(User);
export const UpdateUserSchema = createUpdateSchema(User);

// Consistent với existing patterns
```

### 2. **Custom Validations**

```typescript
// Thêm business logic validation
export const CreateUserSchema = createCreateSchema(User, {
  customValidations: {
    email: z.email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    age: z.number().min(18, "Must be 18 or older"),
  },
});
```

### 3. **Conditional Fields**

```typescript
// Make fields optional based on context
export const CreateUserSchema = createCreateSchema(User, {
  customValidations: {
    profilePicture: z.string().url().optional(), // Optional for creation
  },
});
```

### 4. **Error Messages**

```typescript
// Meaningful error messages
export const CreateProductSchema = createCreateSchema(Product, {
  customValidations: {
    price: z
      .number()
      .positive("Price must be positive")
      .max(999999, "Price cannot exceed $999,999"),
    stock: z
      .number()
      .int("Stock must be a whole number")
      .min(0, "Stock cannot be negative"),
  },
});
```

## 🔧 Configuration

### 1. **Global Type Mapping**

Customize trong `src/shared/utils/entity-to-zod.ts`:

```typescript
const typeMapping: Record<string, () => z.ZodTypeAny> = {
  varchar: () => z.string().min(1), // Require non-empty strings
  int: () => z.number().int().safe(), // Use safe integers
  // Add more custom mappings
};
```

### 2. **Default Excludes**

```typescript
// Default excluded fields cho create schema
const defaultExclude = ["id", "createdAt", "updatedAt", "deletedAt"];
```

## 🧪 Testing

### Validation Testing

```typescript
describe("CheckIn Validation", () => {
  it("should validate correct create data", () => {
    const validData = {
      userId: 1,
      courtId: 2,
      creditsUsed: 10,
    };

    const result = CreateCheckInSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject invalid data", () => {
    const invalidData = {
      userId: -1, // Invalid: negative
      courtId: "invalid", // Invalid: wrong type
    };

    const result = CreateCheckInSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
```

## 🚨 Limitations

### 1. **Complex Relationships**

- Không tự động handle nested objects
- Cần manual validation cho relations

### 2. **Custom Decorators**

- Chỉ support standard TypeORM decorators
- Custom decorators cần manual mapping

### 3. **Runtime Dependencies**

- Cần TypeORM metadata được load
- Require reflect-metadata

## 🛡️ Migration Strategy

### 1. **Gradual Migration**

```typescript
// Giữ cả 2 để transition
export const CreateUserSchema = createCreateSchema(User); // New
export const CreateUserSchemaLegacy = z.object({...}); // Old

// Gradually replace usage
```

### 2. **Backward Compatibility**

```typescript
// Export both types
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type CreateUserDtoLegacy = z.infer<typeof CreateUserSchemaLegacy>;
```

## 🎉 Kết Luận

Entity-to-Zod utility giúp:

- ✅ Giảm code duplication
- ✅ Tăng type safety
- ✅ Dễ dàng maintenance
- ✅ Flexible và customizable
- ✅ Consistent validation across app

**Recommendation**: Sử dụng cho tất cả new validators và gradually migrate existing ones.
