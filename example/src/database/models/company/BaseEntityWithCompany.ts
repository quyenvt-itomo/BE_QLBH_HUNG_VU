import { BaseEntity } from "@/shared/base/BaseEntity";
import { Column, Index, ManyToOne, JoinColumn } from "typeorm";
import type { Organization } from "../Organization";

/**
 * Base Entity with Soft Delete Support
 * Tất cả entities nên extend từ class này để có soft delete functionality
 */
export abstract class BaseEntityWithCompany extends BaseEntity {
  @Index()
  @Column({ type: "uuid" })
  storeId: string;

  @ManyToOne("Organization", { onDelete: "CASCADE" })
  @JoinColumn({ name: "storeId" })
  company: Organization;
}
