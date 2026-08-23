import { PaymentRequest } from "@/database/models/company/PaymentRequest";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const PaymentRequestSelectFull: FindOptionsSelect<PaymentRequest> = {
  ...BaseSelect,
  storeId: true,
  timeAt: true,
  code: true,
  type: true,
  staffId: true,
  staffSnapshot: true,
  partnerId: true,
  partnerSnapshot: true,
  partnerContactId: true,
  partnerContactSnapshot: true,
  paymentMethod: true,
  totalAmount: true,
  approveStatus: true,
  approvedAt: true,
  approverId: true,
  approverSnapshot: true,
  rejectReason: true,
  lines: {
    id: true,
    paymentRequestId: true,
    invoiceId: true,
    invoiceSnapshot: true,
    amount: true,
  },
};

export const PaymentRequestRelations: FindOptionsRelations<PaymentRequest> = {
  partner: true,
  partnerContact: true,
  staff: true,
  approver: true,
  lines: true,
};
