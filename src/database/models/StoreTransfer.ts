import { BaseEntity } from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { StoreTransferLine } from "./StoreTransferLine";
import { Store, StoreSnapshot } from "./Store";

@Entity("store_transfers")
export class StoreTransfer extends BaseEntity {
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  occurredAt: Date;

  @Column({ type: "varchar", length: 50 })
  code: string;

  @Column({ type: "uuid", nullable: true, default: null })
  fromStoreId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  fromStoreSnapshot: StoreSnapshot | null;
  @ManyToOne(() => Store, { onDelete: "SET NULL" })
  @JoinColumn({ name: "fromStoreId" })
  fromStore: Store | null;

  @Column({ type: "uuid", nullable: true, default: null })
  toStoreId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  toStoreSnapshot: StoreSnapshot | null;
  @ManyToOne(() => Store, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "toStoreId" })
  toStore: Store;

  @Column({ type: "text", nullable: true })
  reason: string | null;

  @OneToMany(() => StoreTransferLine, (line) => line.transfer, {
    cascade: true,
  })
  lines: StoreTransferLine[];
}
