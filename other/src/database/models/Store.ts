import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { IAddress } from "@/shared/base/BaseValidator";
import { Role } from "./store/Role";

// ============================== ATTRIBUTE ENTITIES ==============================
@Entity("stores")
export class Store extends BaseEntity {
  @Column({ type: "varchar", length: 50 })
  code: string;
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  email: string | null;
  @Column({ type: "varchar", length: 15, nullable: true, default: null })
  phone: string | null;

  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  taxCode: string | null;

  @Column({ type: "jsonb", nullable: true, default: null })
  address: IAddress | null;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  // ============================== RELATIONSHIPS ==============================
  @OneToMany(() => Role, (role) => role.store, {
    cascade: true,
  })
  roles: Role[];
}
