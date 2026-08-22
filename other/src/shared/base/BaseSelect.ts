import { FindOptionsSelect } from "typeorm";
import { BaseEntity } from "./BaseEntity";

export const BaseSelect: FindOptionsSelect<BaseEntity> = {
  id: true,
  createdAt: true,
  updatedAt: true,
  note: true,
  isDefault: true,
};
