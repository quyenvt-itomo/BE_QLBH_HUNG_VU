# Hướng Dẫn Tạo Schema Từ Entity Classes

## Tổng Quan

TypeORM cho phép tạo database schema trực tiếp từ các class entity thông qua nhiều cách khác nhau. Dưới đây là hướng dẫn chi tiết cho dự án Qlbh.

## 1. Synchronization (Đồng Bộ Tự Động)

### Cấu Hình Hiện Tại

Trong file `src/config/database.ts`:

```typescript
synchronize: config.NODE_ENV === "development",
```

**Ưu điểm:**

- Tự động cập nhật schema khi entity thay đổi
- Tiện lợi trong development
- Không cần tạo migration thủ công

**Nhược điểm:**

- Có thể gây mất dữ liệu
- Không phù hợp cho production
- Khó kiểm soát thay đổi

### Cách Sử Dụng

- Chỉ cần chạy ứng dụng trong môi trường development
- Schema sẽ được tự động tạo/cập nhật

## 2. Tạo Schema Thủ Công

### Script Có Sẵn

#### A. Tạo/Cập Nhật Schema (Giữ Dữ Liệu)

```bash
npm run db:schema:create
```

#### B. Tạo Lại Schema (Xóa Dữ Liệu Cũ)

```bash
npm run db:schema:recreate
```

#### C. Script Tương Tác

```bash
npm run db:schema:generate
# hoặc
./scripts/generate-schema.sh
```

### Các Tùy Chọn

1. **Tạo/cập nhật schema** - Chỉ thêm bảng/cột mới, không xóa dữ liệu
2. **Tạo lại toàn bộ** - Drop database và tạo lại (⚠️ Mất dữ liệu)
3. **Kiểm tra trạng thái** - So sánh entity vs database hiện tại

## 3. Ví Dụ Thực Tế

### Entity CheckIn Hiện Tại

```typescript
@Entity("check_ins")
export class CheckIn extends BaseEntity {
  @Column({ type: "int" })
  userId: number;

  @Column({ type: "int" })
  courtId: number;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  checkInTime: Date;

  @Column({ type: "int" })
  creditsUsed: number;

  @ManyToOne(() => User, (user) => user.checkIns)
  @JoinColumn({ name: "user_id" })
  user: User;
}
```

### SQL Được Tạo

```sql
CREATE TABLE "check_ins" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
    "deleted_at" TIMESTAMP,
    "user_id" integer NOT NULL,
    "court_id" integer NOT NULL,
    "check_in_time" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credits_used" integer NOT NULL,
    CONSTRAINT "PK_check_ins" PRIMARY KEY ("id")
);
```

## 4. Best Practices

### Development

✅ **Nên làm:**

- Sử dụng `synchronize: true` cho development
- Backup dữ liệu trước khi thay đổi entity lớn
- Test thay đổi schema trên database development

❌ **Không nên:**

- Dùng synchronize trong production
- Thay đổi entity mà không backup dữ liệu

### Production

✅ **Nên làm:**

- Sử dụng migrations cho production
- Tạo migration từ entity changes
- Review migration trước khi apply

❌ **Không nên:**

- Bật synchronize trong production
- Thay đổi schema trực tiếp

## 5. Workflow Khuyến Nghị

### Development Workflow

1. Thay đổi entity
2. Chạy app (synchronize tự động)
3. Test tính năng
4. Tạo migration cho production

### Production Workflow

1. Tạo migration từ entity changes
2. Review migration
3. Apply migration trong production
4. Deploy code

## 6. Troubleshooting

### Lỗi Thường Gặp

#### Schema Mismatch

```bash
npm run db:schema:check
```

#### Cannot Connect

- Kiểm tra database connection
- Kiểm tra environment variables

#### Permission Denied

```bash
chmod +x ./scripts/generate-schema.sh
```

## 7. Commands Tham Khảo

```bash
# Kiểm tra schema hiện tại
npm run db:schema:check

# Tạo schema từ entities
npm run db:schema:create

# Tạo lại schema (mất dữ liệu)
npm run db:schema:recreate

# Script tương tác
npm run db:schema:generate

# Tạo migration
npm run db:migrate:generate -- src/database/migrations/YourMigrationName

# Chạy migration
npm run db:migrate

# Rollback migration
npm run db:migrate:revert
```

## 8. Kết Luận

- **Development**: Sử dụng synchronize để tạo schema tự động
- **Production**: Sử dụng migrations để kiểm soát thay đổi
- **Backup**: Luôn backup dữ liệu trước khi thay đổi schema
- **Testing**: Test kỹ trước khi apply lên production
