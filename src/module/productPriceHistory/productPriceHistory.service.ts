import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { BaseService } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { Product } from "@/database/models/Product";
import { ProductPriceHistory } from "@/database/models/store/ProductPriceHistory";
import { StoreProduct } from "@/database/models/store/StoreProduct";
import { ProductPriceHistoryRepository } from "./productPriceHistory.repository";
import { PRODUCT_PRICE_HISTORY_TYPES } from "./productPriceHistory.types";
import { INVENTORY_TYPES } from "../inventory/inventory.types";
import { InventoryRecalculateService } from "../inventory/inventoryRecalculate.service";
import { generateCode } from "@/shared/utils/code.utils";

@injectable()
export class ProductPriceHistoryService extends BaseService<ProductPriceHistory> {
  protected repository: ProductPriceHistoryRepository;

  constructor(
    @inject(PRODUCT_PRICE_HISTORY_TYPES.Repository)
    repository: ProductPriceHistoryRepository,
    @inject(INVENTORY_TYPES.InventoryRecalculateService)
    private readonly inventory: InventoryRecalculateService,
  ) {
    super();
    this.repository = repository;
    this.searchableFields = ["code"];
    this.timeField = "createdAt";
  }

  async findById(
    id: string,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<ProductPriceHistory | null> {
    const storeId = req?.storeContext?.storeId || req?.storeContext?.storeId;
    return this.repository.findOne(
      { where: { id, ...(storeId ? { storeId } : {}) } as any },
      manager,
    );
  }

  async validateBeforeCreate(
    data: DeepPartial<ProductPriceHistory>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const payload = data as Partial<ProductPriceHistory>;
    const contextStoreId =
      req?.storeContext?.storeId || req?.storeContext?.storeId;
    const storeId = payload.storeId || contextStoreId;
    if (!storeId) throw new Error("productPriceHistory.store.required");
    if (contextStoreId && payload.storeId && payload.storeId !== contextStoreId)
      throw new Error("store.scope.mismatch");
    if (!payload.productId)
      throw new Error("productPriceHistory.product.required");

    const costPrice = Number(payload.costPrice);
    if (!Number.isFinite(costPrice) || costPrice < 0) {
      throw new Error("productPriceHistory.costPrice.invalid");
    }

    const product = await manager
      .getRepository(Product)
      .findOne({ where: { id: payload.productId } as any });
    if (!product) throw new Error("product.not_found");
    const storeProduct = await manager
      .getRepository(StoreProduct)
      .findOne({ where: { productId: payload.productId, storeId } as any });
    const before = Number(storeProduct?.costPrice) || 0;

    payload.storeId = storeId;
    payload.productSnapshot = {
      id: product.id,
      code: product.code,
      name: product.name,
    };
    payload.deltaCostPrice = costPrice - before;
    payload.code =
      payload.code || (await generateCode("pricehistory", storeId));
  }

  async actionAfterCreate(
    data: ProductPriceHistory,
    manager: EntityManager,
  ): Promise<void> {
    const storeProductRepository = manager.getRepository(StoreProduct);
    const current = await storeProductRepository.findOne({
      where: { productId: data.productId!, storeId: data.storeId } as any,
    });
    await storeProductRepository.save(
      storeProductRepository.create({
        ...(current || {}),
        productId: data.productId!,
        storeId: data.storeId,
        costPrice: data.costPrice,
      }),
    );
    await this.inventory.recalculateProductStoreFromDate(
      data.productId!,
      data.storeId,
      data.createdAt,
      manager,
    );
  }

  async validateBeforeUpdate(): Promise<void> {
    throw new Error("productPriceHistory.immutable");
  }

  async validateBeforeDelete(): Promise<void> {
    throw new Error("productPriceHistory.immutable");
  }
}
