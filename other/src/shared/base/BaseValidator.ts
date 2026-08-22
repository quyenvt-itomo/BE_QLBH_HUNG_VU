import { z } from "zod";

export const DateTransform = z.coerce.date();

const TRUE_VALUES = ["true", "1", "yes", "y", "x", "có", "co", "on"];

const FALSE_VALUES = ["false", "0", "no", "n", "off", "không", "khong"];

export const zBooleanLike = (defaultValue?: boolean) => {
  const schema = z.preprocess((val) => {
    // boolean
    if (typeof val === "boolean") return val;

    // number
    if (typeof val === "number") {
      return val !== 0;
    }

    // string
    if (typeof val === "string") {
      const lower = val.toLowerCase().trim();

      if (TRUE_VALUES.includes(lower)) return true;

      if (FALSE_VALUES.includes(lower)) return false;
    }

    return val;
  }, z.boolean());

  return defaultValue !== undefined
    ? schema.optional().default(defaultValue)
    : schema.optional();
};

/**
 * Cho phép:
 * - 1 giá trị
 * - hoặc mảng giá trị
 * => luôn transform thành array
 */
export const zArrayable = <T extends z.ZodTypeAny>(schema: T) =>
  z
    .union([schema, z.array(schema)])
    .optional()
    .transform((val) => {
      if (val == null) return undefined;
      return Array.isArray(val) ? val : [val];
    });

export const zEnumFromTsEnum = <T extends Record<string, string | number>>(
  enumObj: T,
) => z.enum(Object.values(enumObj) as [string, ...string[]]);

export const BaseCreateSchema = z.object({
  tempId: z.uuid().nullish(),
  createdBy: z.uuid().nullish(),
  createdBySnapshot: z.any().nullish(),
  note: z.string().nullish(),
  isDefault: z.boolean().optional(),
});

export const BaseUpdateSchema = z.object({
  updatedBy: z.uuid().nullish(),
  updatedBySnapshot: z.any().nullish(),
  note: z.string().nullish(),
});

export const BaseQuerySchema = z.object({
  page: z.coerce.number().optional(),
  size: z.coerce.number().optional(),
  keyword: z.string().trim().optional(),
  startAt: DateTransform.optional(),
  endAt: DateTransform.optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["ASC", "DESC"]).optional(),
  isFinished: z.boolean().optional(),
  // Common array ID filters
  storeId: z.uuid().optional(),
  fundIds: zArrayable(z.uuid()),
  productIds: zArrayable(z.uuid()),
  storeIds: zArrayable(z.uuid()),
  employeeIds: zArrayable(z.uuid()),
  userIds: zArrayable(z.uuid()),
  partnerIds: zArrayable(z.uuid()),
  supplierIds: zArrayable(z.uuid()),
  customerIds: zArrayable(z.uuid()),
  shipperIds: zArrayable(z.uuid()),
  productCategoryIds: zArrayable(z.uuid()),
  unitIds: zArrayable(z.uuid()),
});

export const BaseParamsSchema = z.object({
  id: z.uuid(),
});

export const AddressSchema = z.object({
  state: z.string().optional(),
  ward: z.string().optional(),
  detail: z.string().nullish(),
});

export const SettingSchema = z.object({
  region: z
    .object({
      country: z.string().nullish(),
      language: z.string().nullish(),
      timezone: z.string().nullish(),
    })
    .optional(),
  dateFormat: z
    .object({
      date: z.string().nullish(),
      time: z.string().nullish(),
      displayTime: z.string().nullish(),
    })
    .optional(),
  numberFormat: z
    .object({
      decimal: z.string().nullish(),
      thousand: z.string().nullish(),
      fraction: z.string().nullish(),
    })
    .optional(),
  currencyFormat: z
    .object({
      symbol: z.string().nullish(),
      fraction: z.string().nullish(),
      position: z.enum(["before", "after"]).optional(),
    })
    .optional(),
});

export type ISetting = z.infer<typeof SettingSchema>;

export const BankAccountSchema = z.object({
  bankName: z.string(),
  accountNumber: z.string(),
  accountHolder: z.string(),
  branch: z.string().nullish(),
});

export const CitizenIdentificationSchema = z.object({
  id: z.string(),
  name: z.string(),
  dob: z.date().nullish(),
  gender: z.string().nullish(),
  issuedDate: z.date().nullish(),
  expirationDate: z.date().nullish(),
  placeOfIssue: z.string().nullish(),
  issuedBy: z.string().nullish(),
  files: z.array(z.string()).optional().default([]),
});

export const RepresentativeSchema = z.object({
  name: z.string().nullish(),
  position: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
});

export type IAddress = z.infer<typeof AddressSchema>;
export type IBankAccount = z.infer<typeof BankAccountSchema>;
export type ICitizenIdentification = z.infer<
  typeof CitizenIdentificationSchema
>;
export type BaseQueryDto = z.infer<typeof BaseQuerySchema>;
export type BaseParamsDto = z.infer<typeof BaseParamsSchema>;
export type IRepresentative = z.infer<typeof RepresentativeSchema>;
