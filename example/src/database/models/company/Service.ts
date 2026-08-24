import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntityWithStore } from "./BaseEntityWithStore";
import { BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { ServiceUnit } from "./ServiceUnit";

export interface ServiceSnapshot {
  id: string;
  code: string;
  name: string;
}

export enum ServiceTypeEnum {
  IN_HOUSE = "in_house", // Dịch vụ nội bộ (do công ty tự thực hiện)
  OUTSOURCED = "outsourced", // Dịch vụ thuê ngoài (do bên thứ 3 thực hiện)
}

@Entity("services")
export class Service extends BaseEntityWithStore {
  @Column({
    type: "enum",
    enum: ServiceTypeEnum,
    default: ServiceTypeEnum.IN_HOUSE,
  })
  type: ServiceTypeEnum;

  @Column({ type: "varchar", length: 20 })
  code: string;
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column(BaseNumericColumnOptions)
  taxRate: number;

  // ============================== RELATIONSHIPS ==============================
  @OneToMany(() => ServiceUnit, (su) => su.service, {
    cascade: true,
  })
  units: ServiceUnit[];
}
