/**
 * StockMetadata Helper
 * Centralized helper to update stockMetadata after stock_trackings changes
 *
 * Usage: Call updateStockMetadata() after ANY operation that modifies stock_trackings
 */

import { inject, injectable } from "inversify";
import { EntityManager } from "typeorm";
import {
  PRODUCT_VARIANT_TYPES,
  ProductVariantRepository,
} from "../product/productVariant";
import { PRODUCT_TYPES, ProductRepository } from "../product";
import logger from "@/shared/utils/logger";

@injectable()
export class StockMetadataHelper {
  constructor(
    @inject(PRODUCT_VARIANT_TYPES.ProductVariantRepository)
    private productVariantRepository: ProductVariantRepository,
    @inject(PRODUCT_TYPES.ProductRepository)
    private productRepository: ProductRepository,
  ) {}

  /**
   * 🔄 Update stockMetadata for a single variant
   * Call this after EVERY stock_trackings modification
   *
   * @param variantId Product variant ID
   * @param manager Transaction manager (optional)
   */
  async updateStockMetadata(
    variantId: string,
    manager: EntityManager,
  ): Promise<void> {
    try {
      await this.productVariantRepository.updateStockMetadata(
        variantId,
        manager,
      );
    } catch (error: any) {
      logger.error(
        `[StockMetadataHelper] Failed to update stockMetadata for variant ${variantId}:`,
        error.message,
      );
      // Don't throw - stock metadata is denormalized data, failure shouldn't break main operation
      // Will be fixed by next update or recalculate script
    }
  }

  /**
   * 🔄 Update stockMetadata for multiple variants (batch)
   * More efficient when updating many variants
   *
   * @param variantIds Array of variant IDs
   * @param manager Transaction manager (optional)
   */
  async batchUpdateStockMetadata(
    variantIds: string[],
    manager: EntityManager,
  ): Promise<void> {
    if (!variantIds.length) return;

    try {
      await this.productVariantRepository.batchUpdateStockMetadata(
        variantIds,
        manager,
      );
    } catch (error: any) {
      logger.error(
        `[StockMetadataHelper] Failed to batch update stockMetadata for ${variantIds.length} variants: ${error.message || ""}`,
      );
    }
  }

  /**
   * 🔄 Update stockMetadata for a single product (tổng từ variants active)
   * Call this after variant stock changes OR variant isActive toggle
   *
   * @param productId Product ID
   * @param manager Transaction manager (optional)
   */
  async updateProductStockMetadata(
    productId: string,
    manager: EntityManager,
  ): Promise<void> {
    try {
      await this.productRepository.updateProductStockMetadata(
        productId,
        manager,
      );
    } catch (error: any) {
      logger.error(
        `[StockMetadataHelper] Failed to update stockMetadata for product ${productId}:`,
        error.message,
      );
    }
  }

  /**
   * 🔄 Update stockMetadata for multiple products (batch)
   * More efficient when updating many products
   *
   * @param productIds Array of product IDs
   * @param manager Transaction manager (optional)
   */
  async batchUpdateProductStockMetadata(
    productIds: string[],
    manager: EntityManager,
  ): Promise<void> {
    if (!productIds.length) return;

    try {
      await this.productRepository.batchUpdateProductStockMetadata(
        productIds,
        manager,
      );
    } catch (error: any) {
      logger.error(
        `[StockMetadataHelper] Failed to batch update stockMetadata for ${productIds.length} products: ${error.message || ""}`,
      );
    }
  }

  /**
   * 🔄 Update cascade: Variant → Product
   * Call this after updating variant stockMetadata to update parent product
   *
   * @param variantId Variant ID
   * @param manager Transaction manager
   */
  async updateCascadeToProduct(
    variantId: string,
    manager: EntityManager,
  ): Promise<void> {
    try {
      // Step 1: Update variant stockMetadata
      await this.updateStockMetadata(variantId, manager);

      // Step 2: Get productId from variant
      const variant = await this.productVariantRepository.findOne({
        where: { id: variantId },
        select: ["id", "productId"],
      });

      if (!variant?.productId) {
        logger.warn(
          `[StockMetadataHelper] Variant ${variantId} has no productId, skipping product update`,
        );
        return;
      }

      // Step 3: Update product stockMetadata
      await this.updateProductStockMetadata(variant.productId, manager);
    } catch (error: any) {
      logger.error(
        `[StockMetadataHelper] Failed to cascade update for variant ${variantId}:`,
        error.message,
      );
    }
  }

  /**
   * 🔄 Batch update cascade: Variants → Products
   * More efficient for bulk operations
   *
   * @param variantIds Array of variant IDs
   * @param manager Transaction manager
   */
  async batchUpdateCascadeToProducts(
    variantIds: string[],
    manager: EntityManager,
  ): Promise<void> {
    if (!variantIds.length) return;

    try {
      // Step 1: Update variants stockMetadata
      await this.batchUpdateStockMetadata(variantIds, manager);

      // Step 2: Get productIds from variants
      const variants = await this.productVariantRepository.find({
        where: variantIds.map((id) => ({ id })) as any,
        select: ["id", "productId"],
      });

      const productIds = [
        ...new Set(
          variants.map((v) => v.productId).filter((id): id is string => !!id),
        ),
      ];

      if (!productIds.length) {
        logger.warn(
          `[StockMetadataHelper] No products found for ${variantIds.length} variants`,
        );
        return;
      }

      // Step 3: Update products stockMetadata
      await this.batchUpdateProductStockMetadata(productIds, manager);
    } catch (error: any) {
      logger.error(
        `[StockMetadataHelper] Failed to batch cascade update for ${variantIds.length} variants:`,
        error.message,
      );
    }
  }

  async reSyncAllStockMetadata(
    manager: EntityManager,
    variantId?: string,
  ): Promise<void> {
    try {
      logger.info(
        "[StockMetadataHelper] Starting full re-sync of stockMetadata...",
      );

      let variantIds: string[] = [];

      if (variantId) {
        variantIds = [variantId];
      } else {
        // Get all active variants
        const variants = await this.productVariantRepository.find({
          // where: { isActive: true },
          select: ["id"],
        });
        variantIds = variants.map((v) => v.id);
      }

      // Batch update all variants (will cascade to products)
      await this.batchUpdateCascadeToProducts(variantIds, manager);
      logger.info(
        `[StockMetadataHelper] Completed full re-sync of stockMetadata for ${variantIds.length} variants`,
      );
    } catch (error: any) {
      logger.error(
        `[StockMetadataHelper] Failed to re-sync all stockMetadata:`,
        error.message,
      );
    }
  }
}
