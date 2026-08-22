# Module Generator Tool

Tool này sẽ tự động tạo các module từ các Entity có sẵn trong dự án.

## Tính năng

- Đọc tất cả Entity files trong `src/database/entities`
- Tự động tạo thư mục module tương ứng trong `src/modules`
- Generate 6 file cơ bản cho mỗi module:
  - `{entity}.controller.ts` - Controller với BaseController pattern
  - `{entity}.service.ts` - Service với BaseService pattern
  - `{entity}.repository.ts` - Repository với BaseRepository pattern
  - `{entity}.route.ts` - Routes với express router
  - `{entity}.select.ts` - TypeORM select options
  - `{entity}.validator.ts` - Zod validation schemas

## Cách sử dụng

### Cách 1: Sử dụng script

```bash
# Generate tất cả modules
./scripts/generate-modules.sh
```

### Cách 2: Chạy trực tiếp với CLI

```bash
# Generate tất cả modules
npx ts-node src/shared/utils/generateModuleAuto.utils.ts

# Xem danh sách entities có sẵn
npx ts-node src/shared/utils/generateModuleAuto.utils.ts list

# Generate module cho entity cụ thể
npx ts-node src/shared/utils/generateModuleAuto.utils.ts generate User
npx ts-node src/shared/utils/generateModuleAuto.utils.ts generate Product
```

### Cách 3: Sử dụng trong code

```typescript
import { ModuleGenerator } from "@/shared/utils/generateModuleAuto.utils";

const generator = new ModuleGenerator();

// Generate tất cả modules
await generator.generateAllModules();

// Generate module cụ thể
await generator.generateModuleByName("User");

// Lấy danh sách entities
const entities = generator.listEntities();
console.log(entities); // ['User', 'Product', 'Order', ...]
```

## Cấu trúc được tạo

Tool sử dụng **camelCase naming convention** cho file và thư mục:

**Entity**: `ProductAttribute` (PascalCase) → **Module**: `productAttribute` (camelCase)

```
src/modules/productAttribute/
├── productAttribute.controller.ts
├── productAttribute.service.ts
├── productAttribute.repository.ts
├── productAttribute.route.ts
├── productAttribute.select.ts
└── productAttribute.validator.ts
```

**Entity**: `User` (PascalCase) → **Module**: `user` (camelCase)

```
src/modules/user/
├── user.controller.ts
├── user.service.ts
├── user.repository.ts
├── user.route.ts
├── user.select.ts
└── user.validator.ts
```

## Lưu ý

- Tool sẽ **không ghi đè** các file đã tồn tại
- Nếu file đã tồn tại, tool sẽ bỏ qua và thông báo
- Tool tự động phân tích Entity để tạo validator schemas phù hợp
- Hỗ trợ các kiểu dữ liệu cơ bản: string, number, boolean, date
- Tự động thêm validation cho email, phone, password patterns

## Customization

Bạn có thể tùy chỉnh đường dẫn entities và modules:

```typescript
const generator = new ModuleGenerator(
  "custom/entities/path", // entities path
  "custom/modules/path" // modules output path
);
```

## Sau khi generate

Sau khi chạy tool, bạn cần:

1. **Cập nhật Container Types**: Thêm các service, repository, controller types vào `src/shared/types/container.types.ts`

2. **Đăng ký Dependencies**: Thêm binding vào `src/config/container.ts`

3. **Cập nhật Routes**: Import và đăng ký routes mới vào `src/routes.ts`

4. **Review và tùy chỉnh**: Kiểm tra và tùy chỉnh các file được generate theo nhu cầu cụ thể

## Ví dụ cập nhật sau khi generate

### 1. Container Types (`src/shared/types/container.types.ts`)

```typescript
export const TYPES = {
  // ... existing types
  AttributeController: Symbol.for("AttributeController"),
  AttributeService: Symbol.for("AttributeService"),
  AttributeRepository: Symbol.for("AttributeRepository"),
};
```

### 2. Container Binding (`src/config/container.ts`)

```typescript
// Repositories
container.bind<AttributeRepository>(TYPES.AttributeRepository).to(AttributeRepository);

// Services
container.bind<AttributeService>(TYPES.AttributeService).to(AttributeService);

// Controllers
container.bind<AttributeController>(TYPES.AttributeController).to(AttributeController);
```

### 3. Routes Registration (`src/routes.ts`)

```typescript
import { AttributeRouter } from "@/modules/attribute/attribute.route";

// Register routes
const attributeRouter = container.get<AttributeRouter>(AttributeRouter);
app.use("/api/attributes", attributeRouter.getRouter());
```
