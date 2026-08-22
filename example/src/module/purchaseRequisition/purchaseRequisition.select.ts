import { PurchaseRequisition } from "@/database/models/company/PurchaseRequisition";
import { BaseSelect, RelationSelectConfig } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const PurchaseRequisitionSelectList: FindOptionsSelect<PurchaseRequisition> =
  {
    ...BaseSelect,
    companyId: true,
    timeAt: true,
    code: true,

    departmentId: true,
    departmentSnapshot: true,

    requesterId: true,
    requesterSnapshot: true,

    orderId: true,
    orderSnapshot: true,

    productionId: true,
    productionSnapshot: true,

    approvedAt: true,
    approveStatus: true,

    approverId: true,
    approverSnapshot: true,

    rejectReason: true,
  };

export const PurchaseRequisitionSelectFull: FindOptionsSelect<PurchaseRequisition> =
  {
    ...PurchaseRequisitionSelectList,
    production: true,
    order: true,
    department: true,
    requester: true,
    approver: true,
    lines: {
      id: true,
      productId: true,
      productSnapshot: true,
      unitId: true,
      unitSnapshot: true,
      quantity: true,
    },
  };

export const PurchaseRequisitionRelationsList: FindOptionsRelations<PurchaseRequisition> =
  {
    department: true,
    requester: true,
    approver: true,
  };

export const PurchaseRequisitionRelations: FindOptionsRelations<PurchaseRequisition> =
  {
    ...PurchaseRequisitionRelationsList,
    lines: { product: true, unit: true },
  };

export const PurchaseRequisitionRelationSelectsForList: RelationSelectConfig<PurchaseRequisition> =
  {
    department: ["id", "name"],
    requester: ["id", "name", "code"],
    approver: ["id", "name", "code"],
  };

export const PurchaseRequisitionRelationSelects: RelationSelectConfig<PurchaseRequisition> =
  {
    ...PurchaseRequisitionRelationSelectsForList,
    lines: { product: ["id", "code", "name"], unit: ["id", "name"] },
  };
