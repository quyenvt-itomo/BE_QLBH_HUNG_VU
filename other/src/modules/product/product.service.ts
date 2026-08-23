import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { ProductRepository } from "./product.repository";
import { PRODUCT_TYPES } from "./product.types";
import { Product } from "@/database/models/Product";
import { PRODUCT_OPTION_TYPES, ProductOptionRepository } from "./productOption";
import { Request } from "express";
import { DeepPartial, EntityManager, In } from "typeorm";
import { BadRequestError, IError } from "@/shared/types/errors";
import { ProductOption } from "@/database/models/ProductOption";
import { ErrorsMessages } from "@/shared/constants/errors";
import { ProductVariant } from "@/database/models/ProductVariant";
import { ProductQueryDto } from "./product.validator";
import {
  PRODUCT_VARIANT_TYPES,
  ProductVariantRepository,
  ProductVariantSnapshot,
} from "./productVariant";
import { FileHelper } from "@/shared/utils/file.helper";
import { ProductRelations } from "./product.select";

/**
 * Product Service - Tenant Entity
 */
@injectable()
export class ProductService extends BaseService<Product> {
  protected repository: ProductRepository;
  protected uniqueFields: (keyof Product)[] = ["code", "name"];
  protected searchableFields = [
    "name",
    "code",
    "note",
    "unit.name",
    "category.name",
    "variants.barcode",
    "variants.sku",
  ];

  constructor(
    @inject(PRODUCT_TYPES.ProductRepository)
    repository: ProductRepository,
    @inject(PRODUCT_OPTION_TYPES.ProductOptionRepository)
    private productOptionRepository: ProductOptionRepository,
    @inject(PRODUCT_VARIANT_TYPES.ProductVariantRepository)
    private productVariantRepository: ProductVariantRepository,
  ) {
    super();
    this.repository = repository;
  }

  private getStockData(
    entity: Product | ProductVariant,
    storeId?: string,
  ): { stockQty: number; stockValue: number } {
    const stockData = storeId
      ? entity.stockMetadata?.byStore?.[storeId]
      : entity.stockMetadata?.total;
    return {
      stockQty: Number(stockData?.quantity ?? 0),
      stockValue: Number(stockData?.value ?? 0),
    };
  }

  protected async attachMoreDataToEntities(
    entities: Product[],
    options: ProductQueryDto,
  ): Promise<void> {
    await super.attachMoreDataToEntities(entities, options);
    const { storeId } = options;

    for (const entity of entities) {
      const { stockQty, stockValue } = this.getStockData(entity, storeId);
      // (entity as any).totalStockQty = (entity as any).totalstockquantity ?? 0;
      // (entity as any).totalStockValue = (entity as any).totalstockvalue ?? 0;

      (entity as any).totalStockQty = stockQty;
      (entity as any).totalStockValue = stockValue;
      delete (entity as any).totalstockquantity;
      delete (entity as any).totalstockvalue;

      for (const variant of entity.variants || []) {
        // const { stockQty, stockValue } =
        //   await this.repository.calculateVariantStock(variant.id, storeId);

        const { stockQty, stockValue } = this.getStockData(variant, storeId);
        (variant as any).stockQty = stockQty;
        (variant as any).stockValue = stockValue;
        (variant as any).stockQty = stockQty;
        (variant as any).stockValue = stockValue;
      }
    }

    // entities.forEach((entity) => {
    //   (entity as any).totalStockQty = (entity as any).totalstockquantity ?? 0;
    //   (entity as any).totalStockValue = (entity as any).totalstockvalue ?? 0;
    //   delete (entity as any).totalstockquantity;
    //   delete (entity as any).totalstockvalue;

    // });
  }

  protected async attachMoreDataToEntity(
    entity: Product,
    req?: Request,
  ): Promise<void> {
    await super.attachMoreDataToEntity(entity, req);
    (entity as any).totalStockQty = (entity as any).totalstockquantity ?? 0;
    (entity as any).totalStockValue = (entity as any).totalstockvalue ?? 0;
    delete (entity as any).totalstockquantity;
    delete (entity as any).totalstockvalue;
  }

  async validateOptions(
    data: DeepPartial<Product>,
    options: DeepPartial<ProductOption>[],
  ): Promise<IError[]> {
    const errors: IError[] = [];

    errors.push(
      ...this.checkDuplicate(options, ["value", "tempId"], "options", [
        "typeId",
      ]),
    );

    // typeId và typeIndex phải giống nhau giữa các phần tử của options
    const typeIdToTypeIndexMap: Record<string, number> = {};
    options.forEach((option, index) => {
      if (option.typeId !== undefined && option.typeIndex !== undefined) {
        if (typeIdToTypeIndexMap[option.typeId] === undefined) {
          typeIdToTypeIndexMap[option.typeId] = option.typeIndex;
        } else if (typeIdToTypeIndexMap[option.typeId] !== option.typeIndex) {
          errors.push({
            field: `options.${index}.typeIndex`,
            code: ErrorsMessages.incorrect,
          });
        }
      }
    });

    return errors;
  }

  async validateVariants(
    data: DeepPartial<Product>,
    variants: DeepPartial<ProductVariant>[],
    options: DeepPartial<ProductOption>[],
  ): Promise<IError[]> {
    const errors: IError[] = [];

    errors.push(...this.checkDuplicate(variants, ["tempId"], "variants"));

    // * Thống kê số lượng của option chung typeId number[] mảng này có độ dài n => B<i>(0 <= i <= n)
    // * Điều kiện cần: Số lượng variant K = Π|Bi| (không nhân với unit)
    let K = 1;
    if (options.length > 0) {
      const typeIdToValuesMap: Record<string, Set<string>> = {};
      options.forEach((option) => {
        if (option.typeId && option.value) {
          if (!typeIdToValuesMap[option.typeId]) {
            typeIdToValuesMap[option.typeId] = new Set();
          }
          typeIdToValuesMap[option.typeId].add(option.value);
        }
      });

      for (const typeId in typeIdToValuesMap) {
        K *= typeIdToValuesMap[typeId].size;
      }
    }

    // Số lượng option trong mỗi variant phải bằng số lượng typeId của options
    const optionTypeIds = new Set<string>();
    options.forEach((option) => {
      if (option.typeId) {
        optionTypeIds.add(option.typeId);
      }
    });
    const expectedOptionCount = optionTypeIds.size;

    if (data.hasVariant) {
      variants.forEach((variant, index) => {
        if (variant.options?.length !== expectedOptionCount) {
          errors.push({
            field: `variants.${index}.options.length`,
            code: ErrorsMessages.incorrect,
          });
        } else {
          const subCode = `${data.code || ""}${index + 1}`;
          variant.barcode = variant.barcode?.trim() || data.code;
        }
      });
    } else if (variants.length === 1) {
      variants[0].barcode = variants[0].barcode?.trim() || data.code;
    }

    return errors;
  }

  async validateBeforeCreate(
    data: DeepPartial<Product>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<void> {
    const errors: IError[] = [];

    /**
     * VALIDATION RULES:
     * 1. hasVariant = true → phải có options
     * 2. hasVariant = false → xóa options của variants
     * 3. Units phải có variants (length = variants.length)
     * 4. Options không trùng (value + typeId)
     * 5. Variants đúng số lượng (tích các options cùng type)
     */

    if (!data.hasVariant) {
      delete data.options;
      data.variants?.forEach((variant) => {
        delete variant.options;
        variant.isActive = true;
      });
    } else if (!data.options || data.options.length === 0) {
      errors.push({
        field: "options",
        code: ErrorsMessages.required,
      });
    }

    const { options = [], variants = [] } = data;

    if (options.length > 0) {
      errors.push(...(await this.validateOptions(data, options)));
    }

    errors.push(...(await this.validateVariants(data, variants, options)));

    if (errors.length > 0) {
      throw new BadRequestError("Validation Error", errors);
    }
  }

  async actionAfterCreate(
    data: Product,
    manager?: EntityManager,
    req?: Request,
  ): Promise<void> {
    /**
     * FLOW TẠO PRODUCT (sau khi refactor):
     * 1. Product đã được save với cascade options → options tự động tạo
     * 2. Chỉ cần tạo variants + map relationship với options
     */

    const { variants = [] } = data;
    if (variants.length === 0) return;

    // Reload product để lấy options đã được cascade save
    const productRepo = manager?.getRepository(Product) || this.repository;
    const savedProduct = await productRepo.findOne({
      where: { id: data.id },
      relations: ["options"],
    });

    if (!savedProduct) return;

    const savedOptions = savedProduct.options || [];

    // Map options vào variants dựa trên tempId
    const formatVariants: DeepPartial<ProductVariant>[] = variants.map(
      (variant) => ({
        ...variant,
        productId: data.id,
        options: savedOptions.filter((opt: any) =>
          variant.options?.some((o) => o.tempId === opt.tempId),
        ),
      }),
    );

    const newVariants = await this.productVariantRepository.createMany(
      formatVariants,
      manager,
    );
    for (const variant of newVariants) {
      if (variant.tempId) {
        await this.productVariantRepository.handleFiles(
          variant.id,
          variant.tempId,
        );
      }
    }
  }

  async actionAfterUpdate(
    data: Product,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    if (!data.hasVariant) {
      // Xóa tất cả các options của product và gọi tính lại variants
      await this.productOptionRepository.deleteByProductId(data.id, manager);
      await this.productVariantRepository.updateVariantsOnOptionChange({
        productId: data.id,
        manager,
      });
    }
  }

  /**
   * Get product variant unit snapshot
   */
  async getProductVariantSnapshot(
    variantId: string,
    manager?: EntityManager,
  ): Promise<ProductVariantSnapshot | null> {
    return this.repository.getProductVariantSnapshot(variantId);
  }

  async getProductVariantByBarcode(
    barcode: string,
    req?: Request,
  ): Promise<ProductVariant | null> {
    let variant = await this.productVariantRepository.findOne({
      where: { barcode },
      relations: {
        options: {
          type: true,
        },
        product: {
          category: true,
          unit: true,
        },
      },
    });
    if (!variant) {
      const product = await this.repository.findOne({
        where: { code: barcode },
        relations: ProductRelations,
      });

      variant = product?.variants[0] || null;
      if (!variant) return null;
    }

    const storeId = req?.query.storeId as string;

    // Tính tồn kho cho variant
    const { stockQty, stockValue } = this.getStockData(variant, storeId);
    (variant as any).stockQty = stockQty;
    (variant as any).stockValue = stockValue;

    const product = await FileHelper.attachFilesToEntity(variant.product);
    const result: any = await FileHelper.attachFilesToEntity({
      ...variant,
      product,
    });

    return result;
  }

  /**
   * Xóa mềm nhiều product cùng lúc
   * @param ids
   * @param manager
   */
  async deleteMany(ids: string[], manager?: EntityManager): Promise<void> {
    await this.repository.softDeleteMany(
      {
        id: In(ids),
      },
      manager,
    );
  }

  async updateAllProductStockMetadata(): Promise<void> {
    const manager = this.repository.getRepository().manager;
    const allProducts = await this.repository.findAll(manager);
    const productIds = allProducts.map((p) => p.id);

    await this.repository.batchUpdateProductStockMetadata(productIds, manager);
  }
}
