import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { InventoryConversionLineRepository } from "./inventoryConversionLine.repository";
import { INVENTORY_CONVERSION_LINE_TYPES } from "./inventoryConversionLine.types";
import { InventoryConversionLine } from "@/database/models/company/InventoryConversionLine";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import { withTransaction } from "@/shared/base/TransactionManager";
import { NotFoundError } from "@/shared/types/errors";
import { ApproveStatus } from "@/shared/constants/enum";
import { PRODUCT_TYPES, ProductRepository } from "@/module/product";

@injectable()
export class InventoryConversionLineService extends BaseService<InventoryConversionLine> {
  protected repository: InventoryConversionLineRepository;
  protected searchableFields = [];

  constructor(
    @inject(INVENTORY_CONVERSION_LINE_TYPES.InventoryConversionLineRepository)
    repository: InventoryConversionLineRepository,
    @inject(PRODUCT_TYPES.ProductRepository)
    private productRepository: ProductRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<InventoryConversionLine>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.fromProductId) {
      data.fromProductSnapshot = await this.productRepository.getSnapshot(
        data.fromProductId,
        manager,
      );
    }
    if (data.toProductId) {
      data.toProductSnapshot = await this.productRepository.getSnapshot(
        data.toProductId,
        manager,
      );
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<InventoryConversionLine>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.fromProductId !== undefined) {
      data.fromProductSnapshot = data.fromProductId
        ? await this.productRepository.getSnapshot(data.fromProductId, manager)
        : null;
    }
    if (data.toProductId !== undefined) {
      data.toProductSnapshot = data.toProductId
        ? await this.productRepository.getSnapshot(data.toProductId, manager)
        : null;
    }
  }

  async approve(id: string, req: Request): Promise<InventoryConversionLine> {
    return withTransaction(async (trxManager) => {
      const entity = await this.repository.findById(id, trxManager);
      if (!entity)
        throw new NotFoundError("Inventory conversion line not found");
      return trxManager.getRepository(InventoryConversionLine).save({
        ...entity,
        approveStatus: ApproveStatus.APPROVED,
        approvedAt: new Date(),
        approverId: req.userContext?.userId ?? null,
      });
    });
  }

  async reject(
    id: string,
    rejectReason: string,
    req: Request,
  ): Promise<InventoryConversionLine> {
    return withTransaction(async (trxManager) => {
      const entity = await this.repository.findById(id, trxManager);
      if (!entity)
        throw new NotFoundError("Inventory conversion line not found");
      return trxManager.getRepository(InventoryConversionLine).save({
        ...entity,
        approveStatus: ApproveStatus.REJECTED,
        approvedAt: new Date(),
        rejectReason,
        approverId: req.userContext?.userId ?? null,
      });
    });
  }
}
