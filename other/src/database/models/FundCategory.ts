import { BaseEntity } from "@/shared/base/BaseEntity";
import { Column, Entity, ManyToOne } from "typeorm";
import { Attribute } from "./Attribute";

@Entity("fund_categories")
export class FundCategory extends BaseEntity {
  @Column({ type: "uuid" })
  fundCategoryGroupId: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @ManyToOne(
    () => Attribute,
    (fundCategoryGroup) => fundCategoryGroup.fundCategories,
    {
      onDelete: "CASCADE",
    },
  )
  fundCategoryGroup: Attribute;
}
