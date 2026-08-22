import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Service } from "./Service";
import { Attribute } from "../Attribute";

export interface ServiceUnitSnapshot {
  id: string;
  code: string;
  name: string;
}

@Entity("service_units")
export class ServiceUnit extends BaseEntity {
  @Column({ type: "uuid" })
  serviceId: string;

  @Column({ type: "uuid" })
  unitId: string;

  @Column(BaseNumericColumnOptions)
  costPrice: number;

  @Column(BaseNumericColumnOptions)
  unitPrice: number; // Giá đầu ra của dịch vụ (Tính cho đơn bán hàng)

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => Service, (service) => service.units, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "serviceId" })
  service: Service;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL" })
  @JoinColumn({ name: "unitId" })
  unit: Attribute | null;
}
