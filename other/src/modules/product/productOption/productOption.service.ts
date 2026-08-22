import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { ProductOptionRepository } from "./productOption.repository";
import { PRODUCT_OPTION_TYPES } from "./productOption.types";
import { ProductOption } from "@/database/models/ProductOption";
import {
  CreateManyProductOptionDto,
  ProductOptionParamsDto,
} from "./productOption.validator";
import { Request } from "express";
import { DeepPartial, EntityManager, In } from "typeorm";
import { PRODUCT_VARIANT_TYPES } from "../productVariant/productVariant.types";
import { ProductVariantRepository } from "../productVariant/productVariant.repository";
import { withTransaction } from "@/shared/base/TransactionManager";
import { BadRequestError } from "@/shared/types/errors";

/**
 * ProductOption Service - Tenant Entity
 */
@injectable()
export class ProductOptionService extends BaseService<ProductOption> {
  protected repository: ProductOptionRepository;
  protected uniqueFields: (keyof ProductOption)[] = ["value"];
  protected uniqueScope?: (keyof ProductOption)[] = ["productId", "typeId"];
  protected searchableFields = ["value", "note"];

  constructor(
    @inject(PRODUCT_OPTION_TYPES.ProductOptionRepository)
    repository: ProductOptionRepository,
    @inject(PRODUCT_VARIANT_TYPES.ProductVariantRepository)
    private productVariantRepository: ProductVariantRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: Partial<ProductOption>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<void> {
    const { productId } = req?.params as ProductOptionParamsDto;
    data.productId = productId;

    // thay thế typeIndex bằng giá trị với typeId tương ứng
    const sameTypeOptions = await this.repository.findOne({
      where: { productId: data.productId, typeId: data.typeId },
    });

    if (sameTypeOptions) {
      data.typeIndex = sameTypeOptions.typeIndex;
    } else {
      const maxTypeIndexOption = await this.repository.findOne({
        where: { productId: data.productId },
        order: { typeIndex: "DESC" },
      });
      data.typeIndex = maxTypeIndexOption
        ? maxTypeIndexOption.typeIndex + 1
        : 0;
    }
  }

  async actionAfterCreate(
    data: ProductOption,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.productVariantRepository.updateVariantsOnOptionChange({
      productId: data.productId,
      newOption: data,
      manager,
    });
  }

  async validateBeforeDelete(
    data: Partial<ProductOption>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    // Xóa relationship với product variants trước khi xóa option
    await this.repository.deleteRelationshipWithVariants([data.id!], manager);
  }

  async actionAfterDelete(
    data: ProductOption,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.productVariantRepository.updateVariantsOnOptionChange({
      productId: data.productId,
      manager,
    });
  }

  async createMany(
    productId: string,
    data: CreateManyProductOptionDto,
    req?: Request,
  ): Promise<void> {
    const maxTypeIndexOption = await this.repository.findOne({
      where: { productId },
      order: { typeIndex: "DESC" },
    });

    const formatOptions: DeepPartial<ProductOption>[] = data.values.map(
      (value) => ({
        productId,
        typeId: data.typeId,
        value,
        typeIndex: maxTypeIndexOption ? maxTypeIndexOption.typeIndex + 1 : 0,
      }),
    );

    const errors = await this.checkExistInDb(
      formatOptions,
      this.uniqueFields,
      this.uniqueScope || [],
    );
    if (errors.length > 0) {
      throw new BadRequestError("Validation Error", errors);
    }

    await withTransaction(async (trxManager) => {
      await this.repository.createMany(formatOptions, trxManager);
      await this.productVariantRepository.updateVariantsOnOptionChange({
        productId,
        manager: trxManager,
      });
    });
  }

  async deleteByTypeId(productId: string, typeId: string): Promise<void> {
    await withTransaction(async (trxManager) => {
      const options = await this.repository.findByOptions({
        where: { productId, typeId },
      });

      const optionIds = options.map((option) => option.id);

      await this.repository.deleteRelationshipWithVariants(
        optionIds,
        trxManager,
      );

      await this.repository.deleteByTypeId(productId, typeId, trxManager);
      await this.productVariantRepository.updateVariantsOnOptionChange({
        productId,
        manager: trxManager,
      });
    });
  }
}
