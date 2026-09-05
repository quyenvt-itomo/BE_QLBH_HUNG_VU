import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { withTransaction } from "@/shared/base/TransactionManager";
import { BaseService } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { generateCode } from "@/shared/utils/code.utils";
import {
  IncomeExpense,
  IncomeExpenseType,
  ATTRIBUTE_NAMES,
  AttributeType,
  Order,
  OrderLine,
  OrderStatus,
  OrderType,
  PartnerType,
  Product,
} from "@/database/models";
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
import { FUND_TYPES } from "@/module/fund/fund.types";
import { FundRepository } from "@/module/fund/fund.repository";

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
    @inject(FUND_TYPES.Repository)
    private fundRepository: FundRepository,
  ) { super(); this.repository = repository; }

  protected async attachActions(entity: Order & { _actions?: any }): Promise<void> {
    const isDraft = entity.status === OrderStatus.DRAFT;
    const isCanceled = entity.status === OrderStatus.CANCELED;
    entity._actions = {
      ...(this.getDefaultAction() as any),
      update: { can: !isCanceled },
      delete: { can: isDraft },
      cancel: { can: !isCanceled },
      complete: { can: isDraft },
      export: { can: true },
    };
  }

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

  private async prepareIncomeExpenses(
    data: DeepPartial<Order>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.incomeExpenses === undefined) return;

    const isIncome =
      data.type === OrderType.SALE || data.type === OrderType.PURCHASE_RETURN;
    const prepared: DeepPartial<IncomeExpense>[] = [];
    const orderAmount = Math.max(
      0,
      Number(
        isIncome && data.returnTotalAmount != null
          ? data.returnTotalAmount
          : data.totalAmount,
      ) || 0,
    );

    const defaultCategory = this.getDefaultIncomeExpenseCategory(data.type);
    const defaultCategoryId = defaultCategory
      ? await this.attributeRepository.findOrCreateAttribute(
          { ...defaultCategory, isDefault: true },
          req,
          manager,
        )
      : null;

    for (const item of data.incomeExpenses || []) {
      const amount = Math.min(orderAmount, Math.max(0, Number(item.amount || 0)));
      if (amount <= 0) continue;
      if (!item.fundId) throw new Error("order.payment.fund_required");

      const fundSnapshot = await this.fundRepository.getSnapshot(item.fundId, manager);
      if (!fundSnapshot) throw new Error("fund.not_found");

      const categoryId = item.categoryId || defaultCategoryId;
      const categorySnapshot = categoryId
        ? await this.attributeRepository.getSnapshot(categoryId, manager)
        : null;
      if (categoryId && !categorySnapshot) throw new Error("category.not_found");

      prepared.push({
        storeId: data.storeId as string,
        code: item.code || (await generateCode("incomeExpense", data.storeId)),
        occurredAt: item.occurredAt || data.occurredAt || data.orderAt || new Date(),
        type: isIncome ? IncomeExpenseType.INCOME : IncomeExpenseType.EXPENSE,
        fundId: item.fundId,
        fundSnapshot,
        categoryId,
        categorySnapshot,
        partnerId: item.partnerId || data.partnerId || null,
        partnerSnapshot: data.partnerSnapshot || null,
        amount,
        description:
          item.description ||
          (data.type === OrderType.PURCHASE
            ? `Thanh toán phiếu nhập ${data.code || ""}`
            : `Thanh toán cho đơn hàng ${data.code || ""}`
          ).trim(),
      });
    }

    data.incomeExpenses = prepared;
  }

  private getDefaultIncomeExpenseCategory(
    type?: OrderType,
  ): { name: string; type: AttributeType } | null {
    switch (type) {
      case OrderType.SALE:
        return {
          name: ATTRIBUTE_NAMES.INCOME_CUSTOMER,
          type: AttributeType.INCOME_CATEGORY,
        };
      case OrderType.PURCHASE_RETURN:
        return {
          name: ATTRIBUTE_NAMES.INCOME_SUPPLIER,
          type: AttributeType.INCOME_CATEGORY,
        };
      case OrderType.PURCHASE:
        return {
          name: ATTRIBUTE_NAMES.EXPENSE_SUPPLIER,
          type: AttributeType.EXPENSE_CATEGORY,
        };
      case OrderType.SALE_RETURN:
        return {
          name: ATTRIBUTE_NAMES.EXPENSE_CUSTOMER,
          type: AttributeType.EXPENSE_CATEGORY,
        };
      default:
        return null;
    }
  }

  private async syncOrderIncomeExpenses(orderId: string, status: OrderStatus, manager: EntityManager): Promise<void> {
    const incomeExpenseRepository = manager.getRepository(IncomeExpense);
    const incomeExpenses = await incomeExpenseRepository.find({
      where: { orderId, deletedAt: null } as any,
    });

    for (const incomeExpense of incomeExpenses) {
      if (status === OrderStatus.COMPLETED) {
        await this.debtService.syncForIncomeExpense(incomeExpense, manager);
      } else {
        await this.debtService.removeIncomeExpenseReferences(incomeExpense.id, manager);
      }
    }
  }

  private async replaceOrderIncomeExpenses(
    orderId: string,
    incomeExpenses: DeepPartial<IncomeExpense>[] | undefined,
    manager: EntityManager,
  ): Promise<void> {
    const repository = manager.getRepository(IncomeExpense);
    const existing = await repository.find({ where: { orderId, deletedAt: null } as any });
    for (const item of existing) {
      await this.debtService.removeIncomeExpenseReferences(item.id, manager);
    }

    await repository.softDelete({ orderId } as any);
    if (!incomeExpenses?.length) return;

    await repository.save(
      repository.create(
        incomeExpenses.map((item) => ({
          ...item,
          id: undefined,
          orderId,
        })) as DeepPartial<IncomeExpense>[],
      ),
    );
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
    const completeImmediately = (data as any).completeImmediately === true;
    data.status = completeImmediately ? OrderStatus.COMPLETED : OrderStatus.DRAFT;
    if (completeImmediately) {
      data.occurredAt = data.occurredAt || new Date();
      data.completerId = data.completerId || req?.userContext?.userId || null;
      data.completerSnapshot = data.completerSnapshot || req?.userContext?.userSnapshot || null;
    } else {
      data.occurredAt = null;
      data.completerId = null;
      data.completerSnapshot = null;
    }
    delete (data as any).completeImmediately;
    await this.attachInfo(data, manager);
    await this.prepareIncomeExpenses(data, manager, req);
  }

  async validateBeforeUpdate(id: string, data: DeepPartial<Order>, manager: EntityManager, req?: RequestContext): Promise<void> {
    const current = await this.repository.findById(id, manager);
    if (!current) throw new Error("order.not_found");
    if (req?.storeContext?.storeId && current.storeId !== req.storeContext.storeId) throw new Error("store.scope.mismatch");
    const targetStatus = (data.status || current.status) as OrderStatus;
    if (targetStatus === OrderStatus.COMPLETED && current.status === OrderStatus.CANCELED) {
      throw new Error("order.canceled_locked");
    }
    if (targetStatus === OrderStatus.COMPLETED && current.status !== OrderStatus.COMPLETED) {
      data.occurredAt = data.occurredAt || new Date();
      data.completerId = data.completerId || req?.userContext?.userId || current.completerId || null;
      data.completerSnapshot = data.completerSnapshot || req?.userContext?.userSnapshot || current.completerSnapshot || null;
    }
    if (targetStatus === OrderStatus.CANCELED && current.status !== OrderStatus.CANCELED) {
      data.canceledAt = data.canceledAt || new Date();
      data.cancelerId = data.cancelerId || req?.userContext?.userId || null;
      data.cancelerSnapshot = data.cancelerSnapshot || req?.userContext?.userSnapshot || null;
    }
    const merged = { ...current, ...data } as DeepPartial<Order>;
    await this.attachInfo(merged, manager);
    await this.prepareIncomeExpenses(merged, manager, req);
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
    if (data.incomeExpenses !== undefined) data.incomeExpenses = merged.incomeExpenses;
  }

  private async recalculate(
    data: Order,
    manager: EntityManager,
    previous?: Order,
  ): Promise<void> {
    const wasCompleted = previous?.status === OrderStatus.COMPLETED;
    const isCompleted = data.status === OrderStatus.COMPLETED;
    if ((!isCompleted && !wasCompleted) || !data.storeId) return;

    const fromDate = previous?.occurredAt || data.occurredAt || data.orderAt;
    if (!fromDate) return;

    const lines = [
      ...(previous?.lines || []),
      ...(data.lines || []),
    ];
    for (const productId of new Set(
      lines.map((line) => line.productId).filter((id): id is string => Boolean(id)),
    )) {
      await this.inventory.recalculateProductStoreFromDate(
        productId,
        data.storeId,
        fromDate,
        manager,
      );
    }
  }

  async actionAfterCreate(data: Order, manager: EntityManager): Promise<void> {
    await this.debtService.syncForOrder(data, manager);
    await this.syncOrderIncomeExpenses(data.id, data.status, manager);
    await this.recalculate(data, manager);
  }
  async actionAfterUpdate(
    data: Order,
    manager: EntityManager,
    _req?: RequestContext,
    inputData?: DeepPartial<Order>,
  ): Promise<void> {
    const previous = (inputData as any)?.__previousOrder as Order | undefined;
    await this.debtService.syncForOrder(data, manager);
    await this.syncOrderIncomeExpenses(data.id, data.status, manager);
    await this.recalculate(data, manager, previous);
  }

  async actionAfterDelete(data: Order, manager: EntityManager): Promise<void> {
    await this.debtService.removeForOrder(data, manager);
    await this.syncOrderIncomeExpenses(data.id, OrderStatus.CANCELED, manager);
  }

  async validateBeforeDelete(data: Order): Promise<void> {
    if (data.status !== OrderStatus.DRAFT) {
      throw new Error("order.completed_locked");
    }
  }

  async update(id: string, data: DeepPartial<Order>, manager?: EntityManager, req?: RequestContext): Promise<Order | null> {
    const hasLines = data.lines !== undefined || data.returnLines !== undefined;
    const inputData = { ...data };
    const payload = { ...data } as any;
    const run = async (em: EntityManager): Promise<Order | null> => {
      await this.validateBeforeUpdate(id, payload, em, req);
      const current = await this.repository.findById(id, em);
      if (!current) throw new Error("order.not_found");
      const hasIncomeExpenses = payload.incomeExpenses !== undefined;
      const preparedLines = hasLines ? { lines: (payload.lines || []).map((line: any) => ({ ...line, id: undefined, orderId: id, returnOrderId: null })), returnLines: (payload.returnLines || []).map((line: any) => ({ ...line, id: undefined, orderId: null, returnOrderId: id })) } : undefined;
      delete payload.lines; delete payload.returnLines;
      const incomeExpenses = hasIncomeExpenses ? payload.incomeExpenses : undefined;
      delete payload.incomeExpenses;
      const updated = await this.repository.update(id, payload, em);
      if (!updated) return null;
      const lineRepository = this.orderLineRepository.getRepository(em);
      if (preparedLines) {
        await lineRepository.delete([{ orderId: id }, { returnOrderId: id }] as any);
        if (preparedLines.lines.length) await lineRepository.save(lineRepository.create(preparedLines.lines as any));
        if (preparedLines.returnLines.length) await lineRepository.save(lineRepository.create(preparedLines.returnLines as any));
      }
      if (hasIncomeExpenses) await this.replaceOrderIncomeExpenses(id, incomeExpenses, em);
      const result = await this.repository.findById(id, em);
      if (result) {
        await this.actionAfterUpdate(
          result,
          em,
          req,
          { ...inputData, __previousOrder: current } as any,
        );
      }
      return result;
    };
    return manager ? run(manager) : withTransaction(run);
  }

  async complete(id: string, req?: RequestContext): Promise<Order | null> { return this.update(id, { status: OrderStatus.COMPLETED, occurredAt: new Date() }, undefined, req); }
  async cancel(id: string, req?: RequestContext): Promise<Order | null> { return this.update(id, { status: OrderStatus.CANCELED, canceledAt: new Date() }, undefined, req); }
}
