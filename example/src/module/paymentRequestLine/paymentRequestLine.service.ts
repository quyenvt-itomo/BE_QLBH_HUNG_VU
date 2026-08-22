import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { PaymentRequestLineRepository } from "./paymentRequestLine.repository";
import { PAYMENT_REQUEST_LINE_TYPES } from "./paymentRequestLine.types";
import { PaymentRequestLine } from "@/database/models/company/PaymentRequestLine";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import { INVOICE_TYPES, InvoiceRepository } from "@/module/invoice";
import { ORDER_TYPES, OrderRepository } from "@/module/order";

@injectable()
export class PaymentRequestLineService extends BaseService<PaymentRequestLine> {
  protected repository: PaymentRequestLineRepository;
  protected searchableFields = [];

  constructor(
    @inject(PAYMENT_REQUEST_LINE_TYPES.PaymentRequestLineRepository)
    repository: PaymentRequestLineRepository,
    @inject(INVOICE_TYPES.InvoiceRepository)
    private invoiceRepository: InvoiceRepository,
    @inject(ORDER_TYPES.OrderRepository)
    private orderRepository: OrderRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<PaymentRequestLine>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.invoiceId) {
      data.invoiceSnapshot = await this.invoiceRepository.getSnapshot(
        data.invoiceId,
        manager,
      );
    }
    if (data.orderId) {
      data.orderSnapshot = await this.orderRepository.getSnapshot(
        data.orderId,
        manager,
      );
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<PaymentRequestLine>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.invoiceId !== undefined) {
      data.invoiceSnapshot = data.invoiceId
        ? await this.invoiceRepository.getSnapshot(data.invoiceId, manager)
        : null;
    }
    if (data.orderId !== undefined) {
      data.orderSnapshot = data.orderId
        ? await this.orderRepository.getSnapshot(data.orderId, manager)
        : null;
    }
  }
}
