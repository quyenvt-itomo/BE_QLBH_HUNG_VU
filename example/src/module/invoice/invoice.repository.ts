import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { Invoice, InvoiceSnapshot } from "@/database/models/company/Invoice";
import { InvoiceSelectFull, InvoiceRelations } from "./invoice.select";
import { injectable } from "inversify";
import { EntityManager, SelectQueryBuilder } from "typeorm";
import { InvoiceQueryDto } from "./invoice.validator";

@injectable()
export class InvoiceRepository extends BaseRepository<Invoice> {
  protected entityClass = Invoice;
  protected selectedFields = InvoiceSelectFull;
  protected relations = InvoiceRelations;

  protected multipleFile: boolean = true;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Invoice>,
    options: IFindPaginationOptions<Invoice>,
  ): Promise<void> {
    const alias = qb.alias;
    const { type, sourceType, partnerId, orderId, purchaseId, shippingPlanId } =
      (options?.moreQuery as InvoiceQueryDto) || {};

    if (type) {
      qb.andWhere(`${alias}.type = :type`, { type });
    }
    if (sourceType) {
      qb.andWhere(`${alias}.sourceType = :sourceType`, { sourceType });
    }
    if (partnerId) {
      qb.andWhere(`${alias}.partnerId = :partnerId`, { partnerId });
    }
    if (orderId) {
      qb.andWhere(`${alias}.orderId = :orderId`, { orderId });
    }
    if (purchaseId) {
      qb.andWhere(`${alias}.purchaseId = :purchaseId`, { purchaseId });
    }
    if (shippingPlanId) {
      qb.andWhere(`${alias}.shippingPlanId = :shippingPlanId`, {
        shippingPlanId,
      });
    }
  }

  async getSnapshot(
    id?: string | null,
    manager?: EntityManager,
  ): Promise<InvoiceSnapshot | null> {
    if (!id) return null;
    const invoice = await this.findById(id, manager);
    if (!invoice) return null;
    return {
      id: invoice.id,
      invoiceDate: invoice.invoiceDate,
      invoiceNumber: invoice.invoiceNumber,
      type: invoice.type,
      sourceType: invoice.sourceType,
      partnerId: invoice.partnerId,
      partnerSnapshot: invoice.partnerSnapshot,
      orderId: invoice.orderId,
      orderSnapshot: invoice.orderSnapshot,
      purchaseId: invoice.purchaseId,
      purchaseSnapshot: invoice.purchaseSnapshot,
      stockDocumentId: invoice.stockDocumentId,
      stockDocumentSnapshot: invoice.stockDocumentSnapshot,
      shippingPlanId: invoice.shippingPlanId,
      shippingPlanSnapshot: invoice.shippingPlanSnapshot,
      subTotal: invoice.subTotal,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
    };
  }
}
