import { QuotationCommission } from "@/database/models/company/QuotationCommission";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const QuotationCommissionSelectFull: FindOptionsSelect<QuotationCommission> =
  {
    ...BaseSelect,
    quotationId: true,
    partnerContactId: true,
    partnerContactSnapshot: true,
    totalAmount: true,
    partnerContact: {
      id: true,
      name: true,
      phone: true,
      email: true,
    },
  };

export const QuotationCommissionRelations: FindOptionsRelations<QuotationCommission> =
  {
    partnerContact: true,
  };
