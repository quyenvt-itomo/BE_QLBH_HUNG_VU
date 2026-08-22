import { BaseRepository } from "@/shared/base/BaseRepository";
import { ProductVariant } from "@/database/models/ProductVariant";
import {
  ProductVariantSelectFull,
  ProductVariantRelations,
} from "./productVariant.select";
import { injectable } from "inversify";
import { ProductOption } from "@/database/models/ProductOption";
import { EntityManager } from "typeorm";
import { Product } from "@/database/models/Product";

/**
 * ProductVariant Repository - Tenant Entity
 * Sử dụng BaseRepository để truy vấn trên tenant schemas
 */
@injectable()
export class ProductVariantRepository extends BaseRepository<ProductVariant> {
  protected entityClass = ProductVariant;
  protected selectedFields = ProductVariantSelectFull;
  protected relations = ProductVariantRelations;
  protected enableFileAttachment = true;

  private buildVariantSignature(options: ProductOption[]): string {
    return options
      .slice()
      .sort((a, b) => a.typeIndex - b.typeIndex)
      .map((o) => o.id)
      .join("|");
  }

  private compareVariantPriority(a: ProductVariant, b: ProductVariant): number {
    // 1. createdAt (null-safe)
    const aTime = a.createdAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bTime = b.createdAt?.getTime() ?? Number.MAX_SAFE_INTEGER;

    if (aTime !== bTime) return aTime - bTime;

    // 2. fallback cuối cùng → id (đảm bảo deterministic)
    return a.id.localeCompare(b.id);
  }

  // Cập nhật lại các variant khi có sự thay đổi về product options
  async updateVariantsOnOptionChange({
    productId,
    newOption,
    manager,
  }: {
    productId: string;
    newOption?: ProductOption;
    manager: EntityManager;
  }): Promise<void> {
    const variantRepo = manager.getRepository(ProductVariant);

    const variants = await variantRepo.find({
      where: { productId },
      relations: { options: { type: true } },
    });

    // if (!variants.length) return;

    // ===== LOG: Tổng hợp units và types để kiểm tra =====
    const productRepo = manager.getRepository(Product);
    const product = await productRepo.findOne({
      where: { id: productId },
      relations: { options: { type: true } },
    });

    if (product) {
      // Tổng hợp types từ options
      const typeMap = new Map<
        string,
        { typeId: string; typeName: string; index: number; values: string[] }
      >();

      for (const opt of product.options || []) {
        const key = opt.typeId;
        if (!typeMap.has(key)) {
          typeMap.set(key, {
            typeId: opt.typeId,
            typeName: opt.type?.name || "Unknown",
            index: opt.typeIndex,
            values: [],
          });
        }
        if (!typeMap.get(key)!.values.includes(opt.value)) {
          typeMap.get(key)!.values.push(opt.value);
        }
      }

      const types = Array.from(typeMap.values()).sort(
        (a, b) => a.index - b.index,
      );

      // Tính expected variant count
      const valuesCounts = types.map((t) => t.values.length);
      const expectedVariantCount = valuesCounts.reduce((acc, c) => acc * c, 1);

      // Kiểm tra variants có đủ options không
      const invalidVariants = variants.filter(
        (v) => v.options.length !== types.length,
      );

      // ===== XÓA NGAY các variants SAI (số lượng options không đúng) =====
      let deletedCount = 0;
      for (const invalidVariant of invalidVariants) {
        await variantRepo.softDelete(invalidVariant.id);
        deletedCount++;
      }
      // Reload variants sau khi xóa
      const reloadedVariants = await variantRepo.find({
        where: { productId },
        relations: ["options"],
      });

      // Cập nhật danh sách variants để xử lý tiếp
      variants.length = 0;
      variants.push(...reloadedVariants);
    }

    // Nếu không có variants hiện tại, tạo tất cả các variants từ options hiện có
    if (variants.length === 0 && product) {
      if (product.options.length === 0) {
        // Sản phẩm đơn giản - tạo 1 variant rỗng
        const newVariant = variantRepo.create({
          productId,
          options: [],
        });

        const saved = await variantRepo.save(newVariant);
        variants.push(saved);
      } else {
        // Sản phẩm có variants - tạo tất cả combinations
        // Tổng hợp tất cả options theo type
        const optionsByType = new Map<string, ProductOption[]>();
        for (const opt of product.options) {
          if (!optionsByType.has(opt.typeId)) {
            optionsByType.set(opt.typeId, []);
          }
          optionsByType.get(opt.typeId)!.push(opt);
        }

        // Sắp xếp types theo typeIndex
        const sortedTypes = Array.from(optionsByType.entries()).sort(
          (a, b) => a[1][0].typeIndex - b[1][0].typeIndex,
        );

        // Tạo tất cả các combinations
        const generateCombinations = (
          types: [string, ProductOption[]][],
          index: number,
          current: ProductOption[],
        ): ProductOption[][] => {
          if (index === types.length) {
            return [current];
          }

          const results: ProductOption[][] = [];
          const [, options] = types[index];

          for (const opt of options) {
            results.push(
              ...generateCombinations(types, index + 1, [...current, opt]),
            );
          }

          return results;
        };

        const allCombinations = generateCombinations(sortedTypes, 0, []);

        for (const optionCombo of allCombinations) {
          const newVariant = variantRepo.create({
            productId,
            options: optionCombo,
          });

          const saved = await variantRepo.save(newVariant);
          variants.push(saved);
        }
      }
    }
    // Nếu có newOption, tạo variants mới cho option đó (incremental)
    else if (newOption) {
      const typeId = newOption.typeId;

      // Lấy tất cả unique combinations của otherOptions
      // otherOptions = tất cả options KHÔNG thuộc typeId của newOption
      const uniqueCombos = new Map<
        string,
        {
          otherOptions: ProductOption[];
          templateVariant: ProductVariant;
        }
      >();

      for (const variant of variants) {
        const otherOptions = variant.options
          .filter((o) => o.typeId !== typeId)
          .sort((a, b) => a.typeIndex - b.typeIndex);

        // Key = otherOptions IDs only
        const key = otherOptions.map((o) => o.id).join("|");

        if (!uniqueCombos.has(key)) {
          uniqueCombos.set(key, {
            otherOptions,
            templateVariant: variant,
          });
        }
      }

      // Tạo variant mới cho mỗi unique combination
      let addedCount = 0;
      for (const [, combo] of uniqueCombos) {
        const newOptions = [...combo.otherOptions, newOption].sort(
          (a, b) => a.typeIndex - b.typeIndex,
        );

        const signature = this.buildVariantSignature(newOptions);

        // Kiểm tra duplicate
        const exists = variants.some(
          (v) => this.buildVariantSignature(v.options) === signature,
        );

        if (exists) continue;

        const newVariant = variantRepo.create({
          productId,
          options: newOptions,
        });

        const saved = await variantRepo.save(newVariant);
        variants.push(saved);
        addedCount++;
      }
    }
    // Nếu có options nhưng variants không đủ → regenerate toàn bộ (case: createMany)
    else if (product && product.options.length > 0) {
      // Tính expected variant count
      const optionsByType = new Map<string, ProductOption[]>();
      for (const opt of product.options) {
        if (!optionsByType.has(opt.typeId)) {
          optionsByType.set(opt.typeId, []);
        }
        optionsByType.get(opt.typeId)!.push(opt);
      }

      const expectedCount = Array.from(optionsByType.values()).reduce(
        (acc, opts) => acc * opts.length,
        1,
      );

      // Nếu số lượng không khớp → xóa hết và tạo lại
      if (variants.length !== expectedCount) {
        // Xóa tất cả variants cũ
        for (const variant of variants) {
          await variantRepo.softDelete(variant.id);
        }
        variants.length = 0;

        // Sắp xếp types theo typeIndex
        const sortedTypes = Array.from(optionsByType.entries()).sort(
          (a, b) => a[1][0].typeIndex - b[1][0].typeIndex,
        );

        // Tạo tất cả các combinations
        const generateCombinations = (
          types: [string, ProductOption[]][],
          index: number,
          current: ProductOption[],
        ): ProductOption[][] => {
          if (index === types.length) {
            return [current];
          }

          const results: ProductOption[][] = [];
          const [, options] = types[index];

          for (const opt of options) {
            results.push(
              ...generateCombinations(types, index + 1, [...current, opt]),
            );
          }

          return results;
        };

        const allCombinations = generateCombinations(sortedTypes, 0, []);

        for (const optionCombo of allCombinations) {
          const newVariant = variantRepo.create({
            productId,
            options: optionCombo,
          });

          const saved = await variantRepo.save(newVariant);
          variants.push(saved);
        }
      }
    }

    // ===== Xóa duplicates (các variants có cùng signature) =====
    const variantMap = new Map<string, ProductVariant[]>();

    for (const variant of variants) {
      const signature = this.buildVariantSignature(variant.options);

      if (!variantMap.has(signature)) {
        variantMap.set(signature, []);
      }

      variantMap.get(signature)!.push(variant);
    }

    let duplicateDeletedCount = 0;
    for (const [, list] of variantMap) {
      if (list.length <= 1) continue;

      list.sort(this.compareVariantPriority);

      const [, ...duplicates] = list;

      for (const dup of duplicates) {
        await variantRepo.softDelete(dup.id);
        duplicateDeletedCount++;
      }
    }

    // ===== AUTO DEACTIVATE INVALID ACTIVE VARIANTS (missing SKU) =====
    // const result = await variantRepo
    //   .createQueryBuilder()
    //   .update(ProductVariant)
    //   .set({ isActive: false })
    //   .where("productId = :productId", { productId })
    //   .andWhere("isActive = true")
    //   .andWhere("(sku IS NULL OR TRIM(sku) = '')")
    //   .execute();

    if (product && !product.hasVariant) {
      await variantRepo
        .createQueryBuilder()
        .update(ProductVariant)
        .set({ isActive: true })
        .where("productId = :productId", { productId })
        .andWhere("deletedAt IS NULL")
        .execute();
    }

    // ===== LOG: Kết quả sau khi xử lý =====
    // const finalVariants = await variantRepo.find({
    //   where: { productId },
    //   relations: ["options"],
    // });

    // Kiểm tra lại lần cuối
    // if (product) {
    //   const typeMap = new Map<string, any>();
    //   for (const opt of product.options || []) {
    //     if (!typeMap.has(opt.typeId)) {
    //       typeMap.set(opt.typeId, { index: opt.typeIndex, values: [] });
    //     }
    //     if (!typeMap.get(opt.typeId).values.includes(opt.value)) {
    //       typeMap.get(opt.typeId).values.push(opt.value);
    //     }
    //   }
    // }
  }

  async handleFiles(entityId: string, tempId?: string): Promise<void> {
    return this.handleFilesOnCreate(entityId, tempId);
  }

  /**
   * 🚀 Update stockMetadata JSONB field for a variant
   * Called after any stock_trackings changes
   * Uses the latest inventory_transaction per store (quantityAfter / inventoryValueAfter)
   * as the single source of truth — no re-aggregation needed.
   */
  async updateStockMetadata(
    variantId: string,
    manager: EntityManager,
  ): Promise<void> {
    // Lấy transaction mới nhất mỗi store — quantityAfter & inventoryValueAfter
    // đã là running state chuẩn theo bình quân gia quyền, không cần SUM lại.
    const result = await manager.query(
      `
      SELECT
        latest."storeId",
        latest."quantityAfter"::float AS qty,
        latest."inventoryValueAfter"::float AS value
      FROM (
        SELECT DISTINCT ON (it."storeId")
          it."storeId",
          it."quantityAfter",
          it."inventoryValueAfter"
        FROM inventory_transactions it
        WHERE it."productVariantId" = $1
          AND it."deletedAt" IS NULL
        ORDER BY it."storeId", it."occurredAt" DESC, it."createdAt" DESC
      ) latest
    `,
      [variantId],
    );

    // Build metadata — giữ nguyên giá trị âm, không normalize, không filter.
    const byStore: Record<string, { qty: number; value: number }> = {};
    let totalQty = 0;
    let totalValue = 0;

    for (const row of result) {
      const qty = parseFloat(row.qty) || 0;
      const value = parseFloat(row.value) || 0;

      byStore[row.storeId] = { qty, value };
      totalQty += qty;
      totalValue += value;
    }

    const stockMetadata = {
      total: { qty: totalQty, value: totalValue },
      byStore,
    };

    // Update variant with new metadata
    await manager.query(
      `
      UPDATE product_variants
      SET "stockMetadata" = $1
      WHERE id = $2
    `,
      [JSON.stringify(stockMetadata), variantId],
    );
  }

  /**
   * 🔄 Batch update stockMetadata for multiple variants
   * More efficient for bulk operations
   */
  async batchUpdateStockMetadata(
    variantIds: string[],
    manager: EntityManager,
  ): Promise<void> {
    if (!variantIds.length) return;

    // Update sequentially to avoid complexity
    // Could be optimized with parallel execution if needed
    for (const variantId of variantIds) {
      await this.updateStockMetadata(variantId, manager);
    }
  }
}
