import { PartnerDebtOffset } from "@/database/models/store/PartnerDebtOffset";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const PartnerDebtOffsetSelectBasic: FindOptionsSelect<PartnerDebtOffset> =
  {
    ...BaseSelect,
    code: true,
    occurredAt: true,
    partnerId: true,
    offsetById: true,
    offsetBySnapshot: true,
    payableDebtAmount: true,
    receivableDebtAmount: true,
    offsetAmount: true,
    reason: true,
    storeId: true,
  };

export const PartnerDebtOffsetSelectFull: FindOptionsSelect<PartnerDebtOffset> =
  {
    ...PartnerDebtOffsetSelectBasic,
    offsetBy: true,
    partner: true,
    store: true,
  };

export const PartnerDebtOffsetRelations: FindOptionsRelations<PartnerDebtOffset> =
  {
    offsetBy: true,
    partner: true,
    store: true,
  };
