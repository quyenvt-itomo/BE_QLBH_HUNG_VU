import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager, IsNull } from "typeorm";
import { withTransaction } from "@/shared/base/TransactionManager";
import { BaseService } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { generateCode } from "@/shared/utils/code.utils";
import { Attribute, Order, OrderLine, OrderStatus, Partner, Product } from "@/database/models";
import { OrderRepository } from "./order.repository";
import { ORDER_TYPES } from "./order.types";
import { INVENTORY_TYPES } from "@/module/inventory/inventory.types";
import { InventoryRecalculateService } from "@/module/inventory/inventoryRecalculate.service";

/** Order is the aggregate root. Lines are persisted only through Order. */
@injectable()
export class OrderService extends BaseService<Order> {
  protected repository: OrderRepository;
  protected uniqueFields: (keyof Order)[] = ["code"];
  protected searchableFields = ["code", "note"];
  protected timeField: keyof Order = "orderAt";

  constructor(
    @inject(ORDER_TYPES.OrderRepository) repository: OrderRepository,
    @inject(INVENTORY_TYPES.InventoryRecalculateService) private readonly inventory: InventoryRecalculateService,
  ) {
    super();
    this.repository = repository;
  }

  private async loadSnapshots(data: DeepPartial<Order>, manager: EntityManager): Promise<void> {
    if (data.partnerId) {
      const partner = await manager.getRepository(Partner).findOne({ where: { id: data.partnerId, deletedAt: IsNull() } as any });
      if (!partner) throw new Error("partner.not_found");
      data.partnerSnapshot = { id: partner.id, type: partner.type, groupId: partner.groupId, isOrganization: partner.isOrganization, name: partner.name, code: partner.code, email: partner.email, phone: partner.phone, taxCode: partner.taxCode, addresses: partner.addresses || [], representative: partner.representative, banks: partner.banks || [] };
    }
    if (data.shipperId) {
      const shipper = await manager.getRepository(Partner).findOne({ where: { id: data.shipperId, deletedAt: IsNull() } as any });
      if (!shipper) throw new Error("shipper.not_found");
      data.shipperSnapshot = { id: shipper.id, type: shipper.type, groupId: shipper.groupId, isOrganization: shipper.isOrganization, name: shipper.name, code: shipper.code, email: shipper.email, phone: shipper.phone, taxCode: shipper.taxCode, addresses: shipper.addresses || [], representative: shipper.representative, banks: shipper.banks || [] };
    }
    const lines = [
      ...((data.lines || []) as DeepPartial<OrderLine>[]),
      ...((data.returnLines || []) as DeepPartial<OrderLine>[]),
    ];
    let grossAmount = 0;
    let totalCost = 0;
    for (const line of lines) {
      if (!line.productId) throw new Error("order.line.product_required");
      const product = await manager.getRepository(Product).findOne({ where: { id: line.productId, deletedAt: IsNull() } as any });
      if (!product) throw new Error("product.not_found");
      line.productSnapshot = { id: product.id, code: product.code, name: product.name };
      if (line.unitId) {
        const unit = await manager.getRepository(Attribute).findOne({ where: { id: line.unitId, deletedAt: IsNull() } as any });
        if (!unit) throw new Error("unit.not_found");
        line.unitSnapshot = { id: unit.id, name: unit.name };
      }
      line.conversionRateAtTime = Number(line.conversionRateAtTime) || 1;
      line.subTotal = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
      line.totalCost = (Number(line.quantity) || 0) * line.conversionRateAtTime * (Number(line.costPriceAtTime) || 0);
      grossAmount += Number(line.subTotal);
      totalCost += Number(line.totalCost);
    }
    data.grossAmount = grossAmount;
    data.discountAmount = Number(data.discountValue) || 0;
    data.netAmount = Math.max(0, grossAmount - Number(data.discountAmount));
    data.taxAmount = Number(data.taxValue) || 0;
    data.totalAmount = Number(data.netAmount) + Number(data.taxAmount);
    data.totalCost = totalCost;
    data.returnGrossAmount = Number(data.returnGrossAmount) || 0;
    data.returnDiscountAmount = Number(data.returnDiscountAmount) || 0;
    data.returnNetAmount = Number(data.returnNetAmount) || 0;
    data.returnTaxAmount = Number(data.returnTaxAmount) || 0;
    data.returnTotalAmount = Number(data.returnTotalAmount) || 0;
    data.returnTotalCost = Number(data.returnTotalCost) || 0;
    data.settlementAmount = Number(data.totalAmount) - Number(data.returnTotalAmount);
  }

  async validateBeforeCreate(data: DeepPartial<Order>, manager: EntityManager, req?: RequestContext): Promise<void> {
    data.storeId = data.storeId || req?.storeContext?.storeId;
    if (!data.storeId) throw new Error("store.required");
    data.code = data.code || await generateCode(String(data.type || "sale"), data.storeId);
    data.status = data.status || OrderStatus.DRAFT;
    await this.loadSnapshots(data, manager);
  }

  async validateBeforeUpdate(id: string, data: DeepPartial<Order>, manager: EntityManager, req?: RequestContext): Promise<void> {
    const current = await this.repository.findById(id, manager);
    if (!current) throw new Error("order.not_found");
    if (req?.storeContext?.storeId && current.storeId !== req.storeContext.storeId) throw new Error("store.scope.mismatch");
    const merged = { ...current, ...data } as DeepPartial<Order>;
    await this.loadSnapshots(merged, manager);
    Object.assign(data, { type: current.type, storeId: current.storeId, lines: merged.lines, returnLines: merged.returnLines, partnerSnapshot: merged.partnerSnapshot, shipperSnapshot: merged.shipperSnapshot, grossAmount: merged.grossAmount, discountAmount: merged.discountAmount, netAmount: merged.netAmount, taxAmount: merged.taxAmount, totalAmount: merged.totalAmount, totalCost: merged.totalCost, settlementAmount: merged.settlementAmount });
  }

  private async recalculate(data: Order, manager: EntityManager): Promise<void> {
    if (data.status !== OrderStatus.COMPLETED || !data.occurredAt) return;
    const lines = await manager.getRepository(OrderLine).find({ where: [{ orderId: data.id }, { returnOrderId: data.id }] as any });
    for (const productId of new Set(lines.map((line) => line.productId).filter((id): id is string => Boolean(id)))) {
      await this.inventory.recalculateProductStoreFromDate(productId, data.storeId, data.occurredAt, manager);
    }
  }

  async actionAfterCreate(data: Order, manager: EntityManager): Promise<void> { await this.recalculate(data, manager); }
  async actionAfterUpdate(data: Order, manager: EntityManager): Promise<void> { await this.recalculate(data, manager); }

  async update(id: string, data: DeepPartial<Order>, manager?: EntityManager, req?: RequestContext): Promise<Order | null> {
    const hasLines = data.lines !== undefined || data.returnLines !== undefined;
    const payload = { ...data } as any;

    const run = async (em: EntityManager): Promise<Order | null> => {
      await this.validateBeforeUpdate(id, payload, em, req);
      const current = await this.repository.findById(id, em);
      if (!current) throw new Error("order.not_found");
      if (current.status === OrderStatus.COMPLETED && hasLines) throw new Error("order.completed_locked");

      const preparedLines = hasLines ? {
        lines: (payload.lines || []).map((line: any) => ({ ...line, id: undefined, orderId: id, returnOrderId: null })),
        returnLines: (payload.returnLines || []).map((line: any) => ({ ...line, id: undefined, orderId: null, returnOrderId: id })),
      } : undefined;
      delete payload.lines;
      delete payload.returnLines;
      const updated = await this.repository.update(id, payload, em);
      if (!updated) return null;

      if (preparedLines) {
        await em.getRepository(OrderLine).delete([{ orderId: id }, { returnOrderId: id }] as any);
        if (preparedLines.lines.length) await em.getRepository(OrderLine).save(em.getRepository(OrderLine).create(preparedLines.lines as any));
        if (preparedLines.returnLines.length) await em.getRepository(OrderLine).save(em.getRepository(OrderLine).create(preparedLines.returnLines as any));
      }
      const result = await this.repository.findById(id, em);
      if (result) await this.actionAfterUpdate(result, em);
      return result;
    };

    return manager ? run(manager) : withTransaction(run);
  }

  async complete(id: string, req?: RequestContext): Promise<Order | null> {
    return this.update(id, { status: OrderStatus.COMPLETED, occurredAt: new Date() }, undefined, req);
  }

  async cancel(id: string, req?: RequestContext): Promise<Order | null> {
    return this.update(id, { status: OrderStatus.CANCELED, canceledAt: new Date() }, undefined, req);
  }
}
