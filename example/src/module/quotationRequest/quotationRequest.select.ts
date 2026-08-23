import { QuotationRequest } from "@/database/models/company/QuotationRequest";
import { BaseSelect, RelationSelectConfig } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const QuotationRequestSelectList: FindOptionsSelect<QuotationRequest> = {
  ...BaseSelect,
  storeId: true,
  code: true,
  timeAt: true,

  staffId: true,
  staffSnapshot: true,

  customerId: true,
  customerSnapshot: true,

  requesterId: true,
  requesterSnapshot: true,

  approveStatus: true,
  approvedAt: true,

  approverId: true,
  approverSnapshot: true,

  rejectReason: true,
  lines: true,
};

export const QuotationRequestSelectFull: FindOptionsSelect<QuotationRequest> = {
  ...QuotationRequestSelectList,

  staff: true,
  customer: true,
  requester: true,
  approver: true,

  lines: {
    id: true,
    quotationRequestId: true,
    productId: true,
    productSnapshot: true,
    product: true,
    unitId: true,
    unitSnapshot: true,
    unit: true,
    quantity: true,
  },
};

export const QuotationRequestRelationsList: FindOptionsRelations<QuotationRequest> =
  {
    staff: true,
    customer: { group: true },
    requester: true,
    approver: true,
  };

export const QuotationRequestRelations: FindOptionsRelations<QuotationRequest> =
  {
    ...QuotationRequestRelationsList,
    lines: { product: true, unit: true },
  };

export const QuotationRequestRelationSelectsForList: RelationSelectConfig<QuotationRequest> =
  {
    customer: [
      "id",
      "name",
      "code",
      "taxCode",
      "phone",
      "email",
      "address",
      "group",
    ],
    staff: ["id", "name", "code", "phone", "email"],
    approver: ["id", "name", "code", "phone", "email"],
  };

export const QuotationRequestRelationSelects: RelationSelectConfig<QuotationRequest> =
  {
    ...QuotationRequestRelationSelectsForList,
    requester: ["id", "name", "phone", "email"],
    lines: { product: ["id", "code", "name"], unit: ["id", "name"] },
  };
