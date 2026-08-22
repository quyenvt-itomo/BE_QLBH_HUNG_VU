import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { Attribute, AttributeSnapshot } from "../Attribute";
import { BOMOperation } from "./BOMOperation";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Product, ProductType } from "./Product";

@Entity("bom_operation_materials")
export class BOMOperationMaterial extends BaseEntity {
  @Column({ type: "uuid" })
  bomOperationId: string;
  @Column({ type: "varchar", length: 20 })
  type: ProductType; // Không lấy FINISHED

  @Column({ type: "uuid", nullable: true, default: null })
  materialGroupId: string | null; // Nhóm nguyên vật liệu chính (nếu type là MAIN_MATERIAL)
  @Column({ type: "uuid", nullable: true, default: null })
  materialId: string | null; // Nguyên vật liệu cụ thể (nếu type là SUB_MATERIAL)

  @Column({ type: "uuid", nullable: true, default: null })
  unitId: string | null; // Đơn vị tính
  @Column({ type: "jsonb", nullable: true, default: null })
  unitSnapshot: AttributeSnapshot | null; // Lưu snapshot tên đơn vị để tránh join khi tính toán

  @Column(BaseNumericColumnOptions)
  quantity: number; // Số lượng nguyên vật liệu cần cho công đoạn này

  // * ========================= RELATIONS ========================= * //
  @ManyToOne(() => BOMOperation, (bo) => bo.materials, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  bomOperation: BOMOperation;

  @ManyToOne(() => Attribute, { onDelete: "CASCADE" })
  @JoinColumn({ name: "materialGroupId" })
  materialGroup: Attribute | null;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "materialId" })
  material: Product | null;
}
