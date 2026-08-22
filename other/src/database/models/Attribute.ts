import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { AttributeTypeEnum } from "@/shared/constants/enum";
import { FundCategory } from "./FundCategory";

// ============================== ATTRIBUTE ENTITIES ==============================
@Entity("attributes")
export class Attribute extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", enum: AttributeTypeEnum })
  type: AttributeTypeEnum;

  // Phân cấp category (parent-child relationship)
  @Column({ type: "uuid", nullable: true })
  parentId?: string | null;

  @ManyToOne(() => Attribute, (attr) => attr.children, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "parentId" })
  parent?: Attribute;

  @OneToMany(() => Attribute, (attr) => attr.parent)
  children?: Attribute[];

  //
  @OneToMany(
    () => FundCategory,
    (fundCategory) => fundCategory.fundCategoryGroup,
    {
      cascade: true,
    },
  )
  fundCategories?: FundCategory[];
}
