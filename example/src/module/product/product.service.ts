import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { ProductRepository } from "./product.repository";
import { PRODUCT_TYPES } from "./product.types";
import { Product } from "@/database/models/company/Product";
import { ProductPriceHistory } from "@/database/models/company/ProductPriceHistory";
import { ProductExtraUnit } from "@/database/models/company/ProductExtraUnit";
import { DeepPartial, EntityManager, Between } from "typeorm";
import { ProductQueryDto } from "./product.validator";
import { appDayjs } from "@/shared/utils/dayjs.util";
import { withTransaction } from "@/shared/base/TransactionManager";

interface UnitPricePair {
  unitId: string;
  pricePerUnit: number;
}

@injectable()
export class ProductService extends BaseService<Product> {
  protected repository: ProductRepository;
  protected uniqueFields: (keyof Product)[] = ["code"];
  protected uniqueScope?: (keyof Product)[] = ["storeId"];
  protected searchableFields = ["name", "code", "note"];

  private _oldProductForPriceHistory: Product | null = null;

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
    // Lưu trạng thái cũ để so sánh giá khi update
    this._oldProductForPriceHistory = await this.repository.findById(
      id,
      manager,
    );
  }

  async actionAfterCreate(
    data: Product,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.syncPriceHistories(data, manager);
  }

  async actionAfterUpdate(
    data: Product,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.syncPriceHistories(
      data,
      manager,
      this._oldProductForPriceHistory,
    );
    this._oldProductForPriceHistory = null;
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

    const result = await super.update(
      id,
      safeData as DeepPartial<Product>,
      manager,
      req,
    );

    if (extraUnits !== undefined && result) {
      const run = async (trxManager: EntityManager) => {
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
      };
      if (manager) await run(manager);
      else await withTransaction(run);
    }

    return result;
  }

  // ======================== PRICE HISTORY SYNC ========================

  /**
   * Đồng bộ ProductPriceHistory khi tạo / sửa product:
   * - Xoá toàn bộ bản ghi của product trong ngày hôm nay (giờ HCM)
   * - Tạo mới bản ghi cho mỗi unit đang có giá > 0
   * - Với unit cũ từng có giá > 0 nhưng giờ về 0 hoặc bị xoá → tạo bản ghi price = 0
   */
  private async syncPriceHistories(
    product: Product,
    manager: EntityManager,
    oldProduct?: Product | null,
  ): Promise<void> {
    const todayStart = appDayjs().startOf("day").toDate();
    const todayEnd = appDayjs(todayStart).endOf("day").toDate();

    const repo = manager.getRepository(ProductPriceHistory);

    // 1. Xoá tất cả bản ghi hôm nay của product này
    await repo.delete({
      productId: product.id,
      createdAt: Between(todayStart, todayEnd) as any,
    });

    // 2. Gom các cặp (unitId, price) hiện tại & cũ
    const currentPairs = this.collectUnitPrices(product);
    const oldPairs = oldProduct ? this.collectUnitPrices(oldProduct) : [];
    const currentUnitIds = new Set(currentPairs.map((p) => p.unitId));

    // 3. Tạo bản ghi cho từng unit hiện tại có giá > 0
    for (const pair of currentPairs) {
      if (pair.pricePerUnit > 0) {
        await repo.save(
          repo.create({
            productId: product.id,
            unitId: pair.unitId,
            pricePerUnit: pair.pricePerUnit,
          }),
        );
      }
    }

    // 4. Unit cũ từng có giá > 0 nhưng giờ không còn / giá về 0 → ghi price = 0
    if (oldProduct) {
      for (const oldPair of oldPairs) {
        if (oldPair.pricePerUnit <= 0) continue;

        const stillExists = currentUnitIds.has(oldPair.unitId);
        const newPair = currentPairs.find((p) => p.unitId === oldPair.unitId);

        if (!stillExists || (newPair && newPair.pricePerUnit === 0)) {
          await repo.save(
            repo.create({
              productId: product.id,
              unitId: oldPair.unitId,
              pricePerUnit: 0,
            }),
          );
        }
      }
    }
  }

  /** Gom tất cả cặp (unitId, giá) từ product (baseUnit + extraUnits) */
  private collectUnitPrices(product: Product): UnitPricePair[] {
    const pairs: UnitPricePair[] = [];

    if (product.baseUnitId) {
      pairs.push({
        unitId: product.baseUnitId,
        pricePerUnit: product.price ?? 0,
      });
    }

    if (product.extraUnits?.length) {
      for (const eu of product.extraUnits) {
        pairs.push({
          unitId: eu.unitId,
          pricePerUnit: eu.pricePerUnit ?? 0,
        });
      }
    }

    return pairs;
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

    const storeId = req?.storeContext?.storeId;
    if (storeId) {
      productQb.andWhere("product.storeId = :storeId", { storeId });
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
