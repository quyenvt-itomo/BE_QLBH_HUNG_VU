import { StoreTransferStatus } from "@/database/models/StoreTransfer";
import { BaseCreateSchema, BaseQuerySchema, BaseUpdateSchema, zArrayable } from "@/shared/base/BaseValidator";
import { z } from "zod";

export const CreateStoreTransferSchema = BaseCreateSchema;
export const UpdateStoreTransferSchema = BaseUpdateSchema;
export const StoreTransferQuerySchema = BaseQuerySchema.extend({
  statuses: zArrayable(z.enum(StoreTransferStatus)),
  fromStoreIds: zArrayable(z.uuid()),
  toStoreIds: zArrayable(z.uuid()),
});
