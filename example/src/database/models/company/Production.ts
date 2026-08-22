import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntityWithCompany } from "./BaseEntityWithCompany";
import { Order, OrderSnapshot } from "./Order";
import { Employee, EmployeeSnapshot } from "./Employee";
import { BaseQuantityNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Attribute } from "../Attribute";
import { MeshSpec, MeshSpecSnapshot } from "./MeshSpec";
import { ProductionMaterial } from "./ProductionMaterial";
import { Organization, OrganizationSnapshot } from "../Organization";
import { ProductionReceiver } from "./ProductionReceiver";
import { AdditionalInfo } from "@/shared/base/BaseValidator";
import { ProductionMeshLine } from "./ProductionMeshLine";
import { ProductionSteelDrawingLine } from "./ProductionSteelDrawingLine";
import { ProductionNormalLine } from "./ProductionNormalLine";

export enum ProductionTypeEnum {
  MESH = "MESH", // Sản xuất lưới thép
  STEEL_DRAWING = "STEEL_DRAWING", // Sản xuất thép rút
  NORMAL = "NORMAL", // Sản xuất bình thường
}

export enum ProductionStatusEnum {
  PLANNING = "PLANNING", // Lên kế hoạch
  IN_PROGRESS = "IN_PROGRESS", // Đang sản xuất
  COMPLETED = "COMPLETED", // Hoàn thành
  CANCELLED = "CANCELLED", // Hủy bỏ
}

export interface ProductionSnapshot {
  id: string;
  type: ProductionTypeEnum;
  timeAt: Date;
  code: string;
  name: string;
  sequenceNumber: number;
  orderId: string | null;
  orderSnapshot: OrderSnapshot | null;
  meshSpecId: string | null;
  meshSpecSnapshot: MeshSpecSnapshot | null;
  staffId: string | null;
  staffSnapshot: EmployeeSnapshot | null;
  factoryId: string | null;
  factorySnapshot: OrganizationSnapshot | null;
}

@Entity("productions")
export class Production extends BaseEntityWithCompany {
  @Column({ type: "varchar", length: 20, default: ProductionTypeEnum.NORMAL })
  type: ProductionTypeEnum;
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  timeAt: Date;
  @Column({ type: "varchar", length: 50 })
  code: string;
  @Column({ type: "varchar", length: 255, default: "Lệnh sản xuất" })
  name: string;
  @Column({ type: "int", default: 1 })
  sequenceNumber: number; // Số thứ tự (Vì là theo đơn hàng)

  @Column({ type: "uuid", nullable: true, default: null })
  orderId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  orderSnapshot: OrderSnapshot | null;

  // Gắn với lưới thép hàn nếu có
  @Column({ type: "uuid", nullable: true, default: null })
  meshSpecId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  meshSpecSnapshot: MeshSpecSnapshot | null;

  // Người phụ trách tạo lệnh sản xuất
  @Column({ type: "uuid", nullable: true, default: null })
  staffId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  staffSnapshot: EmployeeSnapshot | null;

  // Số lần xuất NVL
  @Column({ type: "int", default: 0 })
  exportCount: number;

  // Số lần nhập kho thành phẩm
  @Column({ type: "int", default: 0 })
  importCount: number;

  // Bộ phận sản xuất
  @Column({ type: "uuid", nullable: true, default: null })
  factoryId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  factorySnapshot: OrganizationSnapshot | null;

  // TODO: Thông tin cho phiếu sản xuất lưới thép hàn
  // Tên cột khu vực
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  areaColumn: string | null;
  // Đơn vị tính số lượng
  @Column({ type: "uuid", nullable: true, default: null })
  quantityUnitId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  quantityUnitSnapshot: OrderSnapshot | null;
  // Đơn vị tính khối lượng
  @Column({ type: "uuid", nullable: true, default: null })
  weightUnitId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  weightUnitSnapshot: OrderSnapshot | null;
  // Đơn vị tính diện tích
  @Column({ type: "uuid", nullable: true, default: null })
  areaUnitId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  areaUnitSnapshot: OrderSnapshot | null;

  // TODO: Thông tin cho phiếu sản xuất thép rút hoặc sản xuất bình thường
  // Tên cột quy cách đóng (Đóng bó/ cuộn)
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  packingSpecColumn: string | null;
  // Tên cột đvt số lượng
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  quantityColumnName: string | null;

  // Tên cột số lượng ở bảng nguồn phôi
  @Column({ type: "varchar", length: 255, default: "Số lượng" })
  sourceMaterialQuantityColumn: string;

  // Tổng số lượng
  @Column(BaseQuantityNumericColumnOptions)
  totalQuantity: number;

  // Tổng khối lượng
  @Column(BaseQuantityNumericColumnOptions)
  totalWeight: number;

  // Tổng diện tích
  @Column(BaseQuantityNumericColumnOptions)
  totalArea: number;

  // TODO: Thông tin thêm
  @Column({ type: "jsonb", default: () => "'[]'" })
  additionalInfo: AdditionalInfo[];

  @Column({
    type: "varchar",
    length: 20,
    default: ProductionStatusEnum.PLANNING,
  })
  status: ProductionStatusEnum;

  // ============================ RELATIONS ========================= //
  @ManyToOne(() => Order, { onDelete: "SET NULL" })
  @JoinColumn({ name: "orderId" })
  order: Order | null;

  @ManyToOne(() => MeshSpec, { onDelete: "SET NULL" })
  @JoinColumn({ name: "meshSpecId" })
  meshSpec: MeshSpec | null;

  @ManyToOne(() => Employee, { onDelete: "SET NULL" })
  @JoinColumn({ name: "staffId" })
  staff: Employee | null;

  @ManyToOne(() => Organization, { onDelete: "SET NULL" })
  @JoinColumn({ name: "factoryId" })
  factory: Organization | null;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "quantityUnitId" })
  quantityUnit: Attribute | null;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "weightUnitId" })
  weightUnit: Attribute | null;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "areaUnitId" })
  areaUnit: Attribute | null;

  @OneToMany(() => ProductionMeshLine, (ml) => ml.production, {
    cascade: true,
  })
  meshLines: ProductionMeshLine[];

  @OneToMany(() => ProductionSteelDrawingLine, (sdl) => sdl.production, {
    cascade: true,
  })
  steelDrawingLines: ProductionSteelDrawingLine[];

  @OneToMany(() => ProductionNormalLine, (nl) => nl.production, {
    cascade: true,
  })
  normalLines: ProductionNormalLine[];

  @OneToMany(() => ProductionMaterial, (material) => material.production, {
    cascade: true,
  })
  materials: ProductionMaterial[];

  @OneToMany(() => ProductionReceiver, (receiver) => receiver.production, {
    cascade: true,
  })
  receivers: ProductionReceiver[];
}
