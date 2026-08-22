import { GateLog } from "@/database/models/company/GateLog";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const GateLogSelectFull: FindOptionsSelect<GateLog> = {
  ...BaseSelect,
  companyId: true,
  code: true,
  timeAt: true,
  type: true,
  status: true,
  stockDocumentId: true,
  stockDocumentSnapshot: true,
  partnerId: true,
  partnerSnapshot: true,
  warehouseId: true,
  warehouseSnapshot: true,
  shippingPlanId: true,
  shippingPlanSnapshot: true,
  vehicleType: true,
  vehiclePlate: true,
  entryTime: true,
  entryNote: true,
  exitTime: true,
  exitNote: true,
};

export const GateLogRelations: FindOptionsRelations<GateLog> = {
  stockDocument: true,
  partner: true,
  warehouse: true,
  shippingPlan: true,
};
