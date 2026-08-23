import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";

export enum EntityType {
  AUTH = "auth",
  USER = "user",
  NOTIFICATION = "notification",
  ROLE = "role",
  ITEM = "item",
  SUPPLIER = "supplier",
  CUSTOMER = "customer",
  ATTRIBUTE = "attribute",
  ORDER = "order",
  WAREHOUSE = "warehouse",
  STORE = "store",
  FUND = "fund",
  EMPLOYEE = "employee",
  EMPLOYEE_CONTRACT = "employeeContract",
  EXCEL_IMPORT = "excelImport",
  PRODUCT = "product",
  SERVICE = "service",
  PARTNER = "partner",
  ORGANIZATION = "organization",
  JOB_POSITION = "jobPosition",
  // Purchase
  PURCHASE_REQUISITION = "purchaseRequisition",
  PURCHASE_QUOTATION = "purchaseQuotation",
  PURCHASE = "purchase",
  SHIPPING_PLAN = "shippingPlan",
  // Sales
  QUOTATION = "quotation",
  QUOTATION_REQUEST = "quotationRequest",
  // Inventory
  STOCK_DOCUMENT = "stockDocument",
  INVENTORY_ADJUSTMENT = "inventoryAdjustment",
  INVENTORY_CONVERSION = "inventoryConversion",
  WAREHOUSE_TRANSFER = "warehouseTransfer",
  // Production
  PRODUCTION = "production",
  BILL_OF_MATERIAL = "billOfMaterial",
  // Accounting
  INVOICE = "invoice",
  PAYMENT_REQUEST = "paymentRequest",
  INCOME_EXPENSE = "incomeExpense",
  FUND_ADJUSTMENT = "fundAdjustment",
  FUND_TRANSFER = "fundTransfer",
  PARTNER_DEBT_ADJUSTMENT = "partnerDebtAdjustment",
  PARTNER_DEBT_OFFSET = "partnerDebtOffset",
  COMMISSION_DEBT_ADJUSTMENT = "commissionDebtAdjustment",
  VAT_DEBT_ADJUSTMENT = "vatDebtAdjustment",
  // Gate
  GATE_LOG = "gateLog",
  // Referral
  REFERRAL_CODE = "referralCode",
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
