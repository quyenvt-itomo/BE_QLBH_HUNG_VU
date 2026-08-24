import { inject, injectable } from "inversify";
import { DeepPartial, EntityManager, In } from "typeorm";
import { BaseService } from "@/shared/base/BaseService";
import { AttributeType, Product } from "@/database/models";
import { ProductPriceHistory } from "@/database/models/store/ProductPriceHistory";
import { StoreProduct } from "@/database/models/store/StoreProduct";
import { ProductRepository } from "./product.repository";
import { PRODUCT_TYPES } from "./product.types";
import { ProductQueryDto } from "./product.validator";
import { RequestContext } from "@/shared/types/interfaces";
import { generateCode } from "@/shared/utils/code.utils";
import { InventoryRecalculateService } from "../inventory/inventoryRecalculate.service";
import { INVENTORY_TYPES } from "../inventory/inventory.types";
import { withTransaction } from "@/shared/base/TransactionManager";
import { ValidationError } from "@/shared/types/errors";
import { AttributeRepository } from "../attribute/attribute.repository";
import { ATTRIBUTE_TYPES } from "../attribute/attribute.types";
import { STORE_PRODUCT_TYPES } from "../storeProduct/storeProduct.types";
import { StoreProductRepository } from "../storeProduct/storeProduct.repository";
import { PRODUCT_PRICE_HISTORY_TYPES } from "../productPriceHistory/productPriceHistory.types";
import { ProductPriceHistoryRepository } from "../productPriceHistory/productPriceHistory.repository";

@injectable()
export class ProductService extends BaseService<Product> {
  protected repository: ProductRepository;
  protected uniqueFields: (keyof Product)[] = ["code"];
  protected searchableFields = ["name", "code", "note"];
  constructor(
    @inject(PRODUCT_TYPES.ProductRepository) repository: ProductRepository,
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    private attributeRepository: AttributeRepository,
    @inject(INVENTORY_TYPES.InventoryRecalculateService)
    private inventory: InventoryRecalculateService,
    @inject(STORE_PRODUCT_TYPES.Repository)
    private storeProductRepository: StoreProductRepository,
    @inject(PRODUCT_PRICE_HISTORY_TYPES.Repository)
    private priceHistoryRepository: ProductPriceHistoryRepository,
  ) {
    super();
    this.repository = repository;
  }
  async validateBeforeCreate(
    data: DeepPartial<Product>,
    _manager: EntityManager,
    _req?: RequestContext,
  ): Promise<void> {
    if (data.salePrice == null) data.salePrice = 0;
    if (!data.code) data.code = await generateCode("product");
    await this.validateProductGroup(data.groupId, _manager);
    await this.validateProductBrand(data.brandId, _manager);
  }
  async validateBeforeUpdate(
    _id: string,
    data: DeepPartial<Product>,
    manager: EntityManager,
  ): Promise<void> {
    await this.validateProductGroup(data.groupId, manager);
    await this.validateProductBrand(data.brandId, manager);
  }

  private async validateProductGroup(
    groupId: string | null | undefined,
    manager: EntityManager,
  ): Promise<void> {
    if (!groupId) return;
    const group = await this.attributeRepository.getById(groupId, manager);
    if (group.type !== AttributeType.PRODUCT_GROUP) {
      throw new ValidationError("product.group_invalid", [
        { field: "groupId", message: "Nhóm sản phẩm không hợp lệ" },
      ]);
    }
  }

  private async validateProductBrand(
    brandId: string | null | undefined,
    manager: EntityManager,
  ): Promise<void> {
    if (!brandId) return;
    const brand = await this.attributeRepository.getById(brandId, manager);
    if (brand.type !== AttributeType.BRAND) {
      throw new ValidationError("product.brand_invalid", [
        { field: "brandId", message: "Thương hiệu không hợp lệ" },
      ]);
    }
  }
  async updateStoreCost(
    productId: string,
    storeId: string,
    costPrice: number,
    manager?: EntityManager,
  ): Promise<void> {
    const run = async (em: EntityManager) => {
      const repo = this.storeProductRepository.getRepository(em);
      const current = await repo.findOne({
        where: { productId, storeId } as any,
      });
      const before = Number(current?.costPrice) || 0;
      const delta = costPrice - before;
      if (Math.abs(delta) < 0.000001) return;
      const productSnapshot = await this.repository.getSnapshot(productId, em);
      if (!productSnapshot) throw new Error("product.not_found");
      await repo.save(
        repo.create({ ...(current || {}), productId, storeId, costPrice }),
      );
      const history = await this.priceHistoryRepository.getRepository(em).save(
        this.priceHistoryRepository.getRepository(em).create({
          storeId,
          productId,
          productSnapshot,
          code: await generateCode("pricehistory", storeId),
          costPrice,
          deltaCostPrice: delta,
        }),
      );
      await this.inventory.recalculateProductStoreFromDate(
        productId,
        storeId,
        history.createdAt,
        em,
      );
    };
    if (manager) await run(manager);
    else await withTransaction(run);
  }
  async getPriceHistories(
    query: ProductQueryDto,
    req?: RequestContext,
  ): Promise<Product[]> {
    const options: any = {
      where: { deletedAt: null },
      relations: { extraUnits: true },
    };
    if (query.productCategoryIds?.length) {
      const categoryIds = await this.attributeRepository.getDescendantIds(
        query.productCategoryIds,
        AttributeType.PRODUCT_GROUP,
      );
      if (!categoryIds.length) return [];
      options.where.groupId = In(categoryIds);
    } else if (query.groupId) {
      options.where.groupId = query.groupId;
    }
    const products = await this.repository.find(options);
    const storeId = (query as any).storeId || req?.storeContext?.storeId;
    if (!storeId || !products.length) return products;
    const histories = await this.priceHistoryRepository.getRepository().find({
        where: {
          storeId,
          productId: (products as any).map((p: Product) => p.id),
        } as any,
        order: { createdAt: "DESC" } as any,
      });
    const map = new Map<string, ProductPriceHistory[]>();
    for (const history of histories)
      map.set(history.productId || "", [
        ...(map.get(history.productId || "") || []),
        history,
      ]);
    for (const product of products)
      product.priceHistories = map.get(product.id) || [];
    return products;
  }
}
