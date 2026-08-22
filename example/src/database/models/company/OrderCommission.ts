import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { Order } from "./Order";
import { PartnerContact, PartnerContactSnapshot } from "./PartnerContact";
import { OrderCommissionDetail } from "./OrderCommissionDetail";

@Entity("order_commissions")
export class OrderCommission extends BaseEntity {
  @Column({ type: "uuid" })
  orderId: string;

  // Người hưởng (là người liên hệ bên phía đối tác)
  @Column({ type: "uuid", nullable: true, default: null })
  partnerContactId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  partnerContactSnapshot: PartnerContactSnapshot | null;

  @Column(BaseNumericColumnOptions)
  totalAmount: number;

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => Order, (order) => order.commissions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "orderId" })
  order: Order;

  @ManyToOne(() => PartnerContact, { onDelete: "SET NULL" })
  @JoinColumn({ name: "partnerContactId" })
  partnerContact: PartnerContact | null;

  @OneToMany(() => OrderCommissionDetail, (detail) => detail.orderCommission, {
    cascade: true,
  })
  details: OrderCommissionDetail[];
}
