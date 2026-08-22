import { QuotationRequestLine } from "@/database/models/company/QuotationRequestLine";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const QuotationRequestLineSelectFull: FindOptionsSelect<QuotationRequestLine> =
  {
    ...BaseSelect,
    quotationRequestId: true,
    productId: true,
    productSnapshot: true,
    unitId: true,
    unitSnapshot: true,
    quantity: true,
    product: { id: true, name: true, code: true },
    unit: { id: true, name: true },
  };

export const QuotationRequestLineRelations: FindOptionsRelations<QuotationRequestLine> =
  {
    product: true,
    unit: true,
  };
