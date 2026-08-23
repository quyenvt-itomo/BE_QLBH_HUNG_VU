import { BaseEntity } from "@/shared/base/BaseEntity";
import { Column, Index, ManyToOne, JoinColumn } from "typeorm";
import { Store } from "../Store";

/**
 * Base Entity with Soft Delete Support
 * Tất cả entities nên extend từ class này để có soft delete functionality
 */
export abstract class StoreEntity extends BaseEntity {
  @Index()
  @Column({ type: "uuid" })
  storeId: string;
  @ManyToOne(() => Store, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "storeId" })
  store: Store;
}
