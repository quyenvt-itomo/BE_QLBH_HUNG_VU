import {
  BaseCreateSchema,
  BaseParamsSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const CreateProductOptionSchema = BaseCreateSchema.extend({
  typeId: z.uuid(),
  value: z.string().nonempty().max(255),
  typeIndex: z.number().min(0),
});

export const CreateManyProductOptionSchema = BaseCreateSchema.extend({
  typeId: z.uuid(),
  values: z.array(z.string().nonempty().max(255)).min(1),
  typeIndex: z.number().min(0),
});

export const SortProductOptionSchema = z.object({
  data: z.array(
    z.object({
      typeId: z.uuid(),
      index: z.number().min(0),
    }),
  ),
});

export const ProductOptionParamsSchema = BaseParamsSchema.extend({
  productId: z.uuid(),
});

export const DeleteProductOptionByTypeIdSchema = z.object({
  productId: z.uuid(),
  typeId: z.uuid(),
});

export type CreateProductOptionDto = z.infer<typeof CreateProductOptionSchema>;
export type CreateManyProductOptionDto = z.infer<
  typeof CreateManyProductOptionSchema
>;
export type SortProductOptionDto = z.infer<typeof SortProductOptionSchema>;
export type ProductOptionParamsDto = z.infer<typeof ProductOptionParamsSchema>;
export type DeleteProductOptionByTypeIdDto = z.infer<
  typeof DeleteProductOptionByTypeIdSchema
>;
