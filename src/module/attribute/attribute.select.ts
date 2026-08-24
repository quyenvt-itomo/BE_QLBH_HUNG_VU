import { Attribute } from "@/database/models/Attribute";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const AttributeSelectBasic: FindOptionsSelect<Attribute> = {
  ...BaseSelect,
  name: true,
  type: true,
  parentId: true,
};

export const AttributeSelectFull: FindOptionsSelect<Attribute> = {
  ...AttributeSelectBasic,
  parent: {
    id: true,
    name: true,
    type: true,
    parentId: true,
  },
};

export const AttributeRelations: FindOptionsRelations<Attribute> = {
  parent: true,
};
