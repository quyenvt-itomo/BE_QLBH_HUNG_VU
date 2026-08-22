import { BaseEntity } from "@/shared/base/BaseEntity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { CompanyUser } from "./CompanyUser";
import { Organization } from "./Organization";

@Entity("users")
export class User extends BaseEntity {
  @Column({ type: "varchar", length: 50 })
  code: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 100 })
  username: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  email: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  phone: string | null;

  @Column({ type: "varchar", length: 255 })
  password: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "uuid", nullable: true, default: null })
  sourceCompanyId: string | null;

  // ============================== RELATIONSHIPS ==============================
  @OneToMany(() => CompanyUser, (companyUser) => companyUser.user, {
    cascade: true,
  })
  companyUsers?: CompanyUser[];

  @ManyToOne(() => Organization, { onDelete: "SET NULL" })
  sourceCompany?: Organization;
}
