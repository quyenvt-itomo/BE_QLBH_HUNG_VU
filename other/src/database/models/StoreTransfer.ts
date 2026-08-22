import { BaseEntity } from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { StoreTransferLine } from "./StoreTransferLine";
import { Store } from "./Store";

@Entity("store_transfers")
export class StoreTransfer extends BaseEntity {
  @Column({ type: "timestamptz" })
  occurredAt!: Date;

  @Column({ type: "varchar", length: 50 })
  code!: string;

  @Column({ type: "uuid" })
  fromStoreId!: string;

  @Column({ type: "uuid" })
  toStoreId!: string;

  @Column({ type: "text", nullable: true })
  reason!: string | null;

  // * ========================= RELATIONS ========================= * //
  @OneToMany(() => StoreTransferLine, (line) => line.transfer, {
    cascade: true,
  })
  lines: StoreTransferLine[];

  @ManyToOne(() => Store, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "fromStoreId" })
  fromStore: Store;

  @ManyToOne(() => Store, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "toStoreId" })
  toStore: Store;
}
