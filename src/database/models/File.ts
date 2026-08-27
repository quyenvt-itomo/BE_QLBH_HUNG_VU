import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";

export enum EntityType {
  USER = "user",
  NOTIFICATION = "notification",
  ROLE = "role",
  ATTRIBUTE = "attribute",
  PARTNER = "partner",
  PRODUCT = "product",
  EXCEL_IMPORT = "excelImport",
  STORE = "store",
  ORDER = "order",
  INVENTORY_ADJUSTMENT = "inventoryAdjustment",
  STORE_TRANSFER = "storeTransfer",
  FUND = "fund",
  FUND_ADJUSTMENT = "fundAdjustment",
  FUND_TRANSFER = "fundTransfer",
  INCOME_EXPENSE = "incomeExpense",
  DEBT_ADJUSTMENT = "debtAdjustment",
  VAT_DEBT_ADJUSTMENT = "vatDebtAdjustment",
}

export enum FileStatus {
  PENDING = "pending",
  ACTIVE = "active",
  ARCHIVED = "archived",
}

export enum FileType {
  IMAGE = "image",
  VIDEO = "video",
  DOCUMENT = "document",
  AUDIO = "audio",
  OTHER = "other",
}

export enum FileCategory {
  AVATAR = "avatar",
  RECEIPT = "receipt",
  ATTACHMENT = "attachment",
  DOCUMENT = "document",
  LOGO = "logo",
  IMAGE = "image",
  VIDEO = "video",
  ALBUM = "album",
  MEDIA = "media",
  EDUCATION_DOC = "educationDoc", // Tài liệu học vấn, bằng cấp
}

@Entity("files")
export class File extends BaseEntity {
  @Column({ type: "varchar", length: 255, unique: true })
  fileName: string;
  @Column({ type: "varchar", length: 255 })
  originalName: string;
  @Column({ type: "varchar", length: 1024, nullable: true, default: null })
  path?: string | null;
  @Column({ type: "varchar", length: 1024 })
  url: string;

  @Column({ type: "varchar", length: 500, nullable: true, default: null })
  storageKey?: string | null;

  @Column({ type: "varchar", length: 500, nullable: true, default: null })
  thumbnailStorageKey?: string | null;

  @Column({ type: "boolean", default: false })
  isUploadedToS3: boolean;

  @Column({ type: "bigint" })
  size: number;
  @Column({ type: "enum", enum: FileType })
  type: FileType;

  @Column({ type: "enum", enum: EntityType, nullable: true })
  entityType: EntityType | null;
  @Column({ type: "uuid", nullable: true })
  entityId: string | null;

  @Column({ type: "varchar", length: 1024, nullable: true })
  thumbnailPath: string;
  @Column({ type: "varchar", length: 1024, nullable: true })
  thumbnailUrl: string;

  @Column({ type: "enum", enum: FileCategory })
  category: FileCategory;
  @Column({ type: "boolean", default: true })
  isPublic: boolean;
  @Column({ type: "boolean", default: false })
  isMain: boolean;
  @Column({ type: "varchar", length: 255, nullable: true })
  alt: string | null;

  @Index(["storeId", "status"])
  @Column({
    type: "enum",
    enum: FileStatus,
    default: FileStatus.PENDING,
  })
  status: FileStatus;

  @Column({ type: "timestamptz", nullable: true, default: null })
  expiresAt: Date | null;
}
