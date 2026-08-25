import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Attribute } from "../Attribute";
import { StoreProduct } from "./StoreProduct";

/** A location assigned to a product at a specific store. */
@Entity("store_product_locations")
@Index("UQ_store_product_locations_store_product_location", ["storeProductId", "locationId"], {
  unique: true,
})
export class StoreProductLocation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  storeProductId: string;

  @ManyToOne(() => StoreProduct, (storeProduct) => storeProduct.locations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "storeProductId" })
  storeProduct: StoreProduct;

  @Column({ type: "uuid", nullable: true, default: null })
  locationId: string | null;

  @ManyToOne(() => Attribute, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "locationId" })
  location: Attribute | null;
}
