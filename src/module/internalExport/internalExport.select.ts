import { FindOptionsRelations, FindOptionsSelect } from "typeorm";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { InternalExport } from "@/database/models/store/InternalExport";
import { InternalExportLine } from "@/database/models/store/InternalExportLine";

export const InternalExportSelectList: FindOptionsSelect<InternalExport> = {
  ...BaseSelect,
  type: true,
  storeId: true,
  occurredAt: true,
  code: true,
  reason: true,
  lines: true,
} as any;

export const InternalExportSelectFull: FindOptionsSelect<InternalExport> = {
  ...InternalExportSelectList,
  lines: {
    id: true,
    internalExportId: true,
    productId: true,
    productSnapshot: true,
    unitId: true,
    unitSnapshot: true,
    conversionRateAtTime: true,
    quantity: true,
    product: { id: true, code: true, name: true, baseUnitId: true },
    unit: { id: true, name: true, type: true },
  },
} as any;

export const InternalExportRelationsList: FindOptionsRelations<InternalExport> = {};
export const InternalExportRelations: FindOptionsRelations<InternalExport> = {
  lines: { product: true, unit: true },
} as any;

export const InternalExportLineSelectList: FindOptionsSelect<InternalExportLine> = {
  ...BaseSelect,
  internalExportId: true,
  productId: true,
  productSnapshot: true,
  unitId: true,
  unitSnapshot: true,
  conversionRateAtTime: true,
  quantity: true,
} as any;

export const InternalExportLineRelationsList: FindOptionsRelations<InternalExportLine> = {
  product: true,
  unit: true,
};
export const InternalExportLineRelations: FindOptionsRelations<InternalExportLine> = {
  ...InternalExportLineRelationsList,
  internalExport: true,
} as any;
