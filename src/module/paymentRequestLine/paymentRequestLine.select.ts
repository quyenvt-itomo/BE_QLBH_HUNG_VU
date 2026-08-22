import { PaymentRequestLine } from "@/database/models/company/PaymentRequestLine";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const PaymentRequestLineSelectFull: FindOptionsSelect<PaymentRequestLine> =
  {
    ...BaseSelect,
    paymentRequestId: true,
    code: true,
    invoiceId: true,
    invoiceSnapshot: true,
    orderId: true,
    orderSnapshot: true,
    amount: true,
    isPaid: true,
    invoice: { id: true, invoiceNumber: true, invoiceDate: true },
    order: { id: true, code: true },
  };

export const PaymentRequestLineRelations: FindOptionsRelations<PaymentRequestLine> =
  {
    invoice: true,
    order: true,
  };
