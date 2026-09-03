import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { withTransaction } from "@/shared/base/TransactionManager";
import { BaseService } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { generateCode } from "@/shared/utils/code.utils";
import { Order, OrderLine, OrderStatus, OrderType, PartnerType, Product } from "@/database/models";
import { OrderRepository } from "./order.repository";
import { ORDER_TYPES } from "./order.types";
import { OrderLineRepository } from "./orderLine.repository";
import { INVENTORY_TYPES } from "@/module/inventory/inventory.types";
import { InventoryRecalculateService } from "@/module/inventory/inventoryRecalculate.service";
import { PARTNER_TYPES } from "../partner/partner.types";
import { PartnerRepository } from "../partner/partner.repository";
import { PRODUCT_TYPES } from "../product/product.types";
import { ProductRepository } from "../product/product.repository";
import { ATTRIBUTE_TYPES } from "../attribute/attribute.types";
import { AttributeRepository } from "../attribute/attribute.repository";
import { RateType } from "@/shared/constants/enum";
import { DEBT_TYPES } from "@/module/debt/debt.types";
import { DebtRecalculateService } from "@/module/debt/debt.recalculate.service";

const calculateRateAmount = (
  baseAmount: number,
  type: RateType | undefined,
  value: number | null | undefined,
): number => {
  const normalizedValue = Math.max(0, Number(value) || 0);
  if (type === RateType.PERCENT) return (baseAmount * normalizedValue) / 100;
  return normalizedValue;
};

@injectable()
export class OrderService extends BaseService<Order> {
  protected repository: OrderRepository;
  protected uniqueFields: (keyof Order)[] = ["code"];
  protected searchableFields = ["code", "note"];
  protected timeField: keyof Order = "orderAt";

  constructor(
    @inject(ORDER_TYPES.OrderRepository) repository: OrderRepository,
    @inject(PARTNER_TYPES.PartnerRepository) private partnerRepository: PartnerRepository,
    @inject(PRODUCT_TYPES.ProductRepository) private productRepository: ProductRepository,
    @inject(ATTRIBUTE_TYPES.AttributeRepository) private attributeRepository: AttributeRepository,
    @inject(ORDER_TYPES.OrderLineRepository) private orderLineRepository: OrderLineRepository,
    @inject(INVENTORY_TYPES.InventoryRecalculateService) private inventory: InventoryRecalculateService,
    @inject(DEBT_TYPES.DebtRecalculateService)
    private debtService: DebtRecalculateService,
  ) { super(); this.repository = repository; }

  private isPurchaseOrderType(type?: OrderType): boolean {
    return type === OrderType.PURCHASE || type === OrderType.PURCHASE_RETURN;
  }

  private isReturnOrderType(type?: OrderType): boolean {
    return type === OrderType.PURCHASE_RETURN || type === OrderType.SALE_RETURN;
  }

  private async validateShippingInfo(
    data: DeepPartial<Order>,
    manager: EntityManager,
  ): Promise<number> {
    const shippingFee = Number(data.shippingFee || 0);
    if (!Number.isFinite(shippingFee) || shippingFee < 0) {
      throw new Error("order.shipping_fee.invalid");
    }

    data.shippingFee = shippingFee > 0 ? shippingFee : null;
    data.isFreeShipping = data.isFreeShipping ?? true;

    const isPurchase = this.isPurchaseOrderType(data.type);
    if (isPurchase && data.isFreeShipping && shippingFee > 0 && !data.shipperId) {
      throw new Error("order.shipping.shipper_required");
    }
    if (isPurchase && !data.isFreeShipping && data.shipperId) {
      throw new Error("order.shipping.shipper_not_allowed");
    }

    if (!data.shipperId) {
      data.shipperSnapshot = null;
      return shippingFee;
    }

    const shipper = await this.partnerRepository.getRepository(manager).findOne({
      where: { id: data.shipperId, deletedAt: null } as any,
    });
    if (!shipper) throw new Error("order.shipping.shipper_not_found");
    if (shipper.type !== PartnerType.SHIPPER) {
      throw new Error("order.shipping.shipper_invalid");
    }
    if (!data.shipperSnapshot || data.shipperSnapshot.id !== data.shipperId) {
      data.shipperSnapshot = await this.partnerRepository.getSnapshot(data.shipperId, manager);
    }
    return shippingFee;
  }

  private async attachInfo(data: DeepPartial<Order>, manager: EntityManager): Promise<void> {
    await this.partnerRepository.attachInfo(data as any, manager);
    const shippingFee = await this.validateShippingInfo(data, manager);
    const prepareLines = async (lines: DeepPartial<OrderLine>[]) => {
      let grossAmount = 0;
      let totalCost = 0;

      for (const line of lines) {
      if (!line.productId) throw new Error("order.line.product_required");
      let rawProduct: Product | null = null;
      if (data.type === OrderType.PURCHASE && !line.unitId) {
        rawProduct = await this.productRepository.getRepository(manager).findOne({
          where: { id: line.productId },
          relations: { extraUnits: true },
        });
        if (rawProduct) {
          line.unitId =
            rawProduct.extraUnits?.find((unit) => unit.isPurchaseUnit)?.unitId ||
            rawProduct.baseUnitId;
        }
      }
      await this.productRepository.attachInfo(line, manager, rawProduct);
      if (!line.productSnapshot) throw new Error("product.not_found");
      await this.attributeRepository.attachUnitInfo(line, manager);
      if (line.unitId && !line.unitSnapshot) throw new Error("unit.not_found");
      line.conversionRateAtTime = Number(line.conversionRateAtTime) || 1;
      line.subTotal = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
      line.totalCost = (Number(line.quantity) || 0) * Number(line.conversionRateAtTime) * (Number(line.costPriceAtTime) || 0);
      grossAmount += Number(line.subTotal);
      totalCost += Number(line.totalCost);
      }

      return { grossAmount, totalCost };
    };

    const sale = await prepareLines((data.lines || []) as DeepPartial<OrderLine>[]);
    const returned = await prepareLines((data.returnLines || []) as DeepPartial<OrderLine>[]);

    const discountAmount = Math.min(
      sale.grossAmount,
      calculateRateAmount(sale.grossAmount, data.discountType, data.discountValue),
    );
    const netAmount = Math.max(0, sale.grossAmount - discountAmount);
    const taxAmount = calculateRateAmount(netAmount, data.taxType, data.taxValue);
    const returnDiscountAmount = Math.min(
      returned.grossAmount,
      calculateRateAmount(
        returned.grossAmount,
        data.returnDiscountType,
        data.returnDiscountValue,
      ),
    );
    const returnNetAmount = Math.max(0, returned.grossAmount - returnDiscountAmount);
    const returnTaxAmount = calculateRateAmount(
      returnNetAmount,
      data.returnTaxType,
      data.returnTaxValue,
    );

    data.grossAmount = sale.grossAmount;
    data.discountAmount = discountAmount;
    data.netAmount = netAmount;
    data.taxAmount = taxAmount;
    const shippingIncluded = shippingFee > 0 && data.isFreeShipping === false;
    const totalAmount = netAmount + taxAmount + (shippingIncluded ? shippingFee : 0);
    const returnTotalAmount =
      returnNetAmount + returnTaxAmount + (shippingIncluded ? shippingFee : 0);
    data.totalAmount = this.isReturnOrderType(data.type)
      ? netAmount + taxAmount
      : totalAmount;
    data.totalCost = sale.totalCost;
    data.returnGrossAmount = returned.grossAmount;
    data.returnDiscountAmount = returnDiscountAmount;
    data.returnNetAmount = returnNetAmount;
    data.returnTaxAmount = returnTaxAmount;
    data.returnTotalAmount = this.isReturnOrderType(data.type)
      ? returnTotalAmount
      : returnNetAmount + returnTaxAmount;
    data.returnTotalCost = returned.totalCost;
    data.settlementAmount = Number(data.totalAmount) - Number(data.returnTotalAmount);
  }

  async validateBeforeCreate(data: DeepPartial<Order>, manager: EntityManager, req?: RequestContext): Promise<void> {
    data.storeId = data.storeId || req?.storeContext?.storeId;
    if (!data.storeId) throw new Error("store.required");
    data.code = data.code || await generateCode(String(data.type || "sale"), data.storeId);
    data.status = data.status || OrderStatus.DRAFT;
    await this.attachInfo(data, manager);
  }

  async validateBeforeUpdate(id: string, data: DeepPartial<Order>, manager: EntityManager, req?: RequestContext): Promise<void> {
    const current = await this.repository.findById(id, manager);
    if (!current) throw new Error("order.not_found");
    if (req?.storeContext?.storeId && current.storeId !== req.storeContext.storeId) throw new Error("store.scope.mismatch");
    const merged = { ...current, ...data } as DeepPartial<Order>;
    await this.attachInfo(merged, manager);
    Object.assign(data, {
      type: current.type,
      storeId: current.storeId,
      lines: merged.lines,
      returnLines: merged.returnLines,
      shipperId: merged.shipperId,
      partnerSnapshot: merged.partnerSnapshot,
      shipperSnapshot: merged.shipperSnapshot,
      shippingFee: merged.shippingFee,
      isFreeShipping: merged.isFreeShipping,
      grossAmount: merged.grossAmount,
      discountAmount: merged.discountAmount,
      netAmount: merged.netAmount,
      taxAmount: merged.taxAmount,
      totalAmount: merged.totalAmount,
      totalCost: merged.totalCost,
      returnGrossAmount: merged.returnGrossAmount,
      returnDiscountAmount: merged.returnDiscountAmount,
      returnNetAmount: merged.returnNetAmount,
      returnTaxAmount: merged.returnTaxAmount,
      returnTotalAmount: merged.returnTotalAmount,
      returnTotalCost: merged.returnTotalCost,
      settlementAmount: merged.settlementAmount,
    });
  }

  private async recalculate(data: Order, manager: EntityManager): Promise<void> {
    if (data.status !== OrderStatus.COMPLETED || !data.occurredAt) return;
    const lines = await this.orderLineRepository.getRepository(manager).find({ where: [{ orderId: data.id }, { returnOrderId: data.id }] as any });
    for (const productId of new Set(lines.map((line) => line.productId).filter((id): id is string => Boolean(id)))) await this.inventory.recalculateProductStoreFromDate(productId, data.storeId, data.occurredAt, manager);
  }

  async actionAfterCreate(data: Order, manager: EntityManager): Promise<void> {
    await this.debtService.syncForOrder(data, manager);
    await this.recalculate(data, manager);
  }
  async actionAfterUpdate(data: Order, manager: EntityManager): Promise<void> {
    await this.debtService.syncForOrder(data, manager);
    await this.recalculate(data, manager);
  }

  async actionAfterDelete(data: Order, manager: EntityManager): Promise<void> {
    await this.debtService.removeForOrder(data, manager);
  }

  async update(id: string, data: DeepPartial<Order>, manager?: EntityManager, req?: RequestContext): Promise<Order | null> {
    const hasLines = data.lines !== undefined || data.returnLines !== undefined;
    const payload = { ...data } as any;
    const run = async (em: EntityManager): Promise<Order | null> => {
      await this.validateBeforeUpdate(id, payload, em, req);
      const current = await this.repository.findById(id, em);
      if (!current) throw new Error("order.not_found");
      if (current.status === OrderStatus.COMPLETED && hasLines) throw new Error("order.completed_locked");
      const preparedLines = hasLines ? { lines: (payload.lines || []).map((line: any) => ({ ...line, id: undefined, orderId: id, returnOrderId: null })), returnLines: (payload.returnLines || []).map((line: any) => ({ ...line, id: undefined, orderId: null, returnOrderId: id })) } : undefined;
      delete payload.lines; delete payload.returnLines;
      const updated = await this.repository.update(id, payload, em);
      if (!updated) return null;
      const lineRepository = this.orderLineRepository.getRepository(em);
      if (preparedLines) {
        await lineRepository.delete([{ orderId: id }, { returnOrderId: id }] as any);
        if (preparedLines.lines.length) await lineRepository.save(lineRepository.create(preparedLines.lines as any));
        if (preparedLines.returnLines.length) await lineRepository.save(lineRepository.create(preparedLines.returnLines as any));
      }
      const result = await this.repository.findById(id, em);
      if (result) await this.actionAfterUpdate(result, em);
      return result;
    };
    return manager ? run(manager) : withTransaction(run);
  }

  async complete(id: string, req?: RequestContext): Promise<Order | null> { return this.update(id, { status: OrderStatus.COMPLETED, occurredAt: new Date() }, undefined, req); }
  async cancel(id: string, req?: RequestContext): Promise<Order | null> { return this.update(id, { status: OrderStatus.CANCELED, canceledAt: new Date() }, undefined, req); }
}
