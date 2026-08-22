import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { ProductRepository } from "./product.repository";
import { PRODUCT_TYPES } from "./product.types";
import { Product } from "@/database/models/company/Product";
import { ProductPriceHistory } from "@/database/models/company/ProductPriceHistory";
import { ProductExtraUnit } from "@/database/models/company/ProductExtraUnit";
import { InventoryTransaction } from "@/database/models/company/InventoryTransaction";
import inventoryRecalculateQueue from "@/job/inventoryRecalculate.queue";
import { DeepPartial, EntityManager } from "typeorm";
import { ProductQueryDto } from "./product.validator";
import { withTransaction } from "@/shared/base/TransactionManager";

interface UnitPricePair {
  unitId: string;
  pricePerUnit: number;
  isBaseUnit: boolean;
}

@injectable()
export class ProductService extends BaseService<Product> {
  protected repository: ProductRepository;
  protected uniqueFields: (keyof Product)[] = ["code"];
  protected uniqueScope?: (keyof Product)[] = ["companyId"];
  protected searchableFields = ["name", "code", "note"];

  constructor(
    @inject(PRODUCT_TYPES.ProductRepository)
    repository: ProductRepository,
  ) {
    super();
    this.repository = repository;
  }

  // ======================== HOOKS ========================

  async validateBeforeCreate(
    data: DeepPartial<Product>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {}

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<Product>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    // Price history is appended by update() after extraUnits are persisted.
  }

  async actionAfterCreate(
    data: Product,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const current = await this.loadProduct(data.id, manager);
    if (current) await this.appendPriceHistories(current, manager);
  }

  async actionAfterUpdate(
    data: Product,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    // Price history is handled by update().
  }

  // ======================== PRICE HISTORY SYNC ========================

  /**
   * Override update: super.update() xử lý files + hooks, sau đó sync extraUnits riêng.
   */
  async update(
    id: string,
    data: DeepPartial<Product>,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<Product | null> {
    const { extraUnits, priceHistories, ...safeData } = data as any;
    const run = async (trxManager: EntityManager) => {
      const oldProduct = await this.loadProduct(id, trxManager);
      const result = await super.update(
        id,
        safeData as DeepPartial<Product>,
        trxManager,
        req,
      );
      if (!result) return result;

      if (extraUnits !== undefined) {
        const euRepo = trxManager.getRepository(ProductExtraUnit);
        const existing = await euRepo.find({ where: { productId: id } as any });
        const incomingIds = new Set(
          (extraUnits as any[]).map((eu: any) => eu.id).filter(Boolean),
        );
        const removedIds = existing
          .map((eu) => eu.id)
          .filter((euid) => !incomingIds.has(euid));
        if (removedIds.length > 0) await euRepo.softDelete(removedIds);
        const toSave = (extraUnits as any[]).map((eu: any) => ({
          ...eu,
          productId: id,
        }));
        if (toSave.length > 0) await euRepo.save(toSave);
      }

      const currentProduct = await this.loadProduct(id, trxManager);
      if (currentProduct) {
        await this.appendPriceHistories(currentProduct, trxManager, oldProduct);
      }
      return currentProduct || result;
    };

    return manager ? run(manager) : withTransaction(run);
  }

  /** Gom tất cả cặp (unitId, giá) từ product (baseUnit + extraUnits) */
  private collectUnitPrices(product: Product): UnitPricePair[] {
    const pairs: UnitPricePair[] = [];

    if (product.baseUnitId) {
      pairs.push({
        unitId: product.baseUnitId,
        pricePerUnit: product.price ?? 0,
        isBaseUnit: true,
      });
    }

    if (product.extraUnits?.length) {
      for (const eu of product.extraUnits) {
        pairs.push({
          unitId: eu.unitId,
          pricePerUnit: eu.pricePerUnit ?? 0,
          isBaseUnit: false,
        });
      }
    }

    return pairs;
  }

  /** Append-only price event used by inventory rebuild. */
  private async appendPriceHistories(
    product: Product,
    manager: EntityManager,
    oldProduct?: Product | null,
  ): Promise<void> {
    const repo = manager.getRepository(ProductPriceHistory);
    const currentPairs = this.collectUnitPrices(product);
    const oldPairs = oldProduct ? this.collectUnitPrices(oldProduct) : [];
    const oldByUnit = new Map(oldPairs.map((pair) => [pair.unitId, pair]));
    const currentByUnit = new Map(
      currentPairs.map((pair) => [pair.unitId, pair]),
    );
    const unitIds = new Set([...oldByUnit.keys(), ...currentByUnit.keys()]);

    for (const unitId of unitIds) {
      const previous = oldByUnit.get(unitId)?.pricePerUnit || 0;
      const current = currentByUnit.get(unitId)?.pricePerUnit || 0;
      const priceDifference = current - previous;
      if (!oldProduct && current <= 0) continue;
      if (Math.abs(priceDifference) < 0.000001) continue;

      const history = await repo.save(
        repo.create({
          productId: product.id,
          unitId,
          pricePerUnit: current,
          priceDifference,
          isBaseUnit: product.baseUnitId === unitId,
        }),
      );

      // Giá vốn thay đổi phải rebuild tồn ở mọi kho đang có lịch sử của sản phẩm.
      // Queue được gọi sau khi transaction nguồn commit (worker có delay), vì vậy
      // không làm chậm request và vẫn đọc được bản ghi lịch sử vừa tạo.
      if (history.isBaseUnit) {
        const pairs = await manager
          .getRepository(InventoryTransaction)
          .createQueryBuilder("it")
          .select('DISTINCT it."warehouseId"', "warehouseId")
          .where('it."productId" = :productId', { productId: product.id })
          .andWhere('it."deletedAt" IS NULL')
          .getRawMany<{ warehouseId: string }>();
        if (pairs.length) {
          try {
            await inventoryRecalculateQueue.enqueueMany(
              pairs.map((pair) => ({
                productId: product.id,
                warehouseId: pair.warehouseId,
                fromDate: history.createdAt,
                source: { sourceType: "product_price_history", refId: history.id },
              })),
            );
          } catch {
            // Queue có thể chưa khởi động trong worker/test; lần recalculate
            // tiếp theo vẫn đọc lịch sử giá và rebuild đúng dữ liệu.
          }
        }
      }
    }
  }

  private async loadProduct(
    id: string,
    manager: EntityManager,
  ): Promise<Product | null> {
    return manager.getRepository(Product).findOne({
      where: { id } as any,
      relations: { extraUnits: true },
    });
  }

  /** Đồng bộ giá nhập từ phiếu mua và ghi history cho các ĐVT thay đổi. */
  async applyPurchasePrice(
    productId: string,
    unitId: string,
    unitPrice: number,
    manager: EntityManager,
  ): Promise<void> {
    const oldProduct = await this.loadProduct(productId, manager);
    if (!oldProduct) return;

    const extraUnit = oldProduct.extraUnits?.find(
      (unit) => unit.unitId === unitId,
    );
    if (oldProduct.baseUnitId === unitId) {
      await manager.getRepository(Product).update(productId, {
        price: unitPrice,
      });
    } else if (extraUnit && extraUnit.conversionRate > 0) {
      await manager.getRepository(Product).update(productId, {
        price: unitPrice / extraUnit.conversionRate,
      });
      await manager.getRepository(ProductExtraUnit).update(extraUnit.id, {
        pricePerUnit: unitPrice,
      });
    } else {
      return;
    }

    const currentProduct = await this.loadProduct(productId, manager);
    if (currentProduct) {
      await this.appendPriceHistories(currentProduct, manager, oldProduct);
    }
  }

  // ======================== QUERY LỊCH SỬ GIÁ ========================

  /**
   * Lấy danh sách hàng hóa kèm priceHistories trong khoảng [startAt, endAt],
   * cộng thêm bản ghi gần nhất TRƯỚC startAt cho mỗi unit.
   */
  async getPriceHistories(
    query: ProductQueryDto,
    req?: RequestContext,
  ): Promise<Product[]> {
    const { keyword, page, size, startAt, endAt, type, types } = query;

    // 1. Query sản phẩm (paginated, không join priceHistories)
    const productQb = await this.repository.createQueryBuilder("product");
    productQb
      .leftJoinAndSelect("product.baseUnit", "baseUnit")
      .leftJoinAndSelect("product.extraUnits", "eu")
      .leftJoinAndSelect("eu.unit", "euUnit");

    const companyId = req?.companyContext?.companyId;
    if (companyId) {
      productQb.andWhere("product.companyId = :companyId", { companyId });
    }
    if (type) {
      productQb.andWhere("product.type = :type", { type });
    } else if (types?.length) {
      productQb.andWhere("product.type IN (:...types)", { types });
    }
    if (keyword) {
      productQb.andWhere("(product.name ILIKE :kw OR product.code ILIKE :kw)", {
        kw: `%${keyword}%`,
      });
    }

    productQb.orderBy("product.code", "ASC");

    if (page && size) {
      productQb.skip((page - 1) * size).take(size);
    }

    const products = await productQb.getMany();
    if (!products.length) return [];

    // 2. Query priceHistories cho các product đã lấy được
    const productIds = products.map((p) => p.id);
    const ds = (this.repository as any).dataSource;
    const phRepo = ds.getRepository(ProductPriceHistory);
    const phQb = phRepo
      .createQueryBuilder("ph")
      .leftJoinAndSelect("ph.unit", "unit")
      .where(`ph."productId" IN (:...productIds)`, { productIds });

    if (startAt) {
      if (endAt) {
        phQb.andWhere(
          `(ph."createdAt" >= :startAt AND ph."createdAt" <= :endAt
            OR ph.id IN (
              SELECT DISTINCT ON (ph2."unitId") ph2.id
              FROM product_price_histories ph2
              WHERE ph2."productId" = ph."productId"
                AND ph2."createdAt" < :startAt
              ORDER BY ph2."unitId", ph2."createdAt" DESC
            ))`,
          { startAt, endAt },
        );
      } else {
        phQb.andWhere(
          `(ph."createdAt" >= :startAt
            OR ph.id IN (
              SELECT DISTINCT ON (ph2."unitId") ph2.id
              FROM product_price_histories ph2
              WHERE ph2."productId" = ph."productId"
                AND ph2."createdAt" < :startAt
              ORDER BY ph2."unitId", ph2."createdAt" DESC
            ))`,
          { startAt },
        );
      }
    } else if (endAt) {
      phQb.andWhere(`ph."createdAt" <= :endAt`, { endAt });
    }

    phQb.orderBy(`ph."createdAt"`, "DESC");
    const allHistories = await phQb.getMany();

    // 3. Map priceHistories về từng product
    const historyMap = new Map<string, ProductPriceHistory[]>();
    for (const h of allHistories) {
      const list = historyMap.get(h.productId) || [];
      list.push(h);
      historyMap.set(h.productId, list);
    }

    for (const product of products) {
      (product as any).priceHistories = historyMap.get(product.id) || [];
    }

    return products;
  }
}
