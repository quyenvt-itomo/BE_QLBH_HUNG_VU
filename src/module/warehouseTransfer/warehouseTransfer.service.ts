import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import type { ActionMap, ActionValue } from "@/shared/types/interfaces";
import { BaseService } from "@/shared/base/BaseService";
import { WarehouseTransferRepository } from "./warehouseTransfer.repository";
import { WAREHOUSE_TRANSFER_TYPES } from "./warehouseTransfer.types";
import { WarehouseTransfer } from "@/database/models/company/WarehouseTransfer";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import { withTransaction } from "@/shared/base/TransactionManager";
import { BadRequestError, NotFoundError } from "@/shared/types/errors";
import { WarehouseTransferLine } from "@/database/models/company/WarehouseTransferLine";
import { ConfirmTransferDto } from "./warehouseTransfer.validator";
import { PRODUCT_TYPES } from "@/module/product/product.types";
import { ProductRepository } from "@/module/product/product.repository";
import { ATTRIBUTE_TYPES } from "@/module/attribute/attribute.types";
import { AttributeRepository } from "@/module/attribute/attribute.repository";

@injectable()
export class WarehouseTransferService extends BaseService<WarehouseTransfer> {
  protected repository: WarehouseTransferRepository;
  protected uniqueFields: (keyof WarehouseTransfer)[] = ["code"];
  protected uniqueScope?: (keyof WarehouseTransfer)[] = ["companyId"];
  protected searchableFields = ["code", "reason"];
  protected timeField: keyof WarehouseTransfer = "timeAt";

  constructor(
    @inject(WAREHOUSE_TRANSFER_TYPES.WarehouseTransferRepository)
    repository: WarehouseTransferRepository,
    @inject(PRODUCT_TYPES.ProductRepository)
    private productRepository: ProductRepository,
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    private attributeRepository: AttributeRepository,
  ) {
    super();
    this.repository = repository;
  }

  protected async attachActions(
    entity: WarehouseTransfer & { _actions?: ActionMap },
    req?: RequestContext,
  ): Promise<void> {
    entity._actions = {
      ...this.getDefaultAction(),
      update: await this.canUpdate(entity),
      delete: await this.canDelete(entity),
      confirmExport: await this.canConfirmExport(entity, req),
      confirmImport: await this.canConfirmImport(entity, req),
    };
  }

  async update(
    id: string,
    data: DeepPartial<WarehouseTransfer>,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<WarehouseTransfer | null> {
    const { lines, ...safeData } = data;
    const result = await super.update(
      id,
      safeData as DeepPartial<WarehouseTransfer>,
      manager,
      req,
    );
    if (lines !== undefined && result) {
      const run = async (trxManager: EntityManager) => {
        const lineRepo = trxManager.getRepository(WarehouseTransferLine);
        for (const line of lines) {
          await this.productRepository.attachInfo(line, trxManager);
          await this.attributeRepository.attachUnitInfo(line, trxManager);
          await this.productRepository.attachUnitConversion(line, trxManager);
        }
        const existing = await lineRepo.find({
          where: { transferId: id },
        });
        const incomingIds = new Set(
          lines.map((l: any) => l.id).filter(Boolean),
        );
        const removedIds = existing
          .map((l) => l.id)
          .filter((lid) => !incomingIds.has(lid));
        if (removedIds.length > 0) {
          await lineRepo.softDelete(removedIds);
        }
        const toSave = lines.map((l: any, i: number) => ({
          ...l,
          transferId: id,
          sortOrder: l.sortOrder || 10 * (i + 1),
        }));
        if (toSave.length > 0) {
          await lineRepo.save(toSave);
        }
      };
      if (manager) {
        await run(manager);
      } else {
        await withTransaction(run);
      }
    }
    return result;
  }

  async confirmExport(
    id: string,
    dto: ConfirmTransferDto,
    req: Request,
  ): Promise<WarehouseTransfer> {
    return withTransaction(async (trxManager) => {
      const transfer = await this.repository.findById(id, trxManager);
      if (!transfer)
        throw new NotFoundError("KhÃ´ng tÃ¬m tháº¥y phiáº¿u chuyá»ƒn kho");
      const canConfirm = await this.canConfirmExport(transfer);
      if (!canConfirm.can) throw new BadRequestError(canConfirm.reason);
      if (transfer.exportedAt) {
        throw new BadRequestError(
          "Phiáº¿u chuyá»ƒn kho Ä‘Ã£ Ä‘Æ°á»£c xuáº¥t kho",
        );
      }

      const lineRepo = trxManager.getRepository(WarehouseTransferLine);
      for (const lineDto of dto.lines) {
        await lineRepo.update(lineDto.id, { actualQuantity: lineDto.quantity });
      }

      return trxManager.getRepository(WarehouseTransfer).save({
        ...transfer,
        exportedAt: dto.confirmedAt ?? new Date(),
      });
    });
  }

  async confirmImport(
    id: string,
    dto: ConfirmTransferDto,
    req: Request,
  ): Promise<WarehouseTransfer> {
    return withTransaction(async (trxManager) => {
      const transfer = await this.repository.findById(id, trxManager);
      if (!transfer)
        throw new NotFoundError("KhÃ´ng tÃ¬m tháº¥y phiáº¿u chuyá»ƒn kho");
      const canConfirm = await this.canConfirmImport(transfer);
      if (!canConfirm.can) throw new BadRequestError(canConfirm.reason);
      if (!transfer.exportedAt) {
        throw new BadRequestError(
          "Phiáº¿u chuyá»ƒn kho chÆ°a Ä‘Æ°á»£c xuáº¥t kho",
        );
      }
      if (transfer.importedAt) {
        throw new BadRequestError(
          "Phiáº¿u chuyá»ƒn kho Ä‘Ã£ Ä‘Æ°á»£c nháº­p kho",
        );
      }

      const lineRepo = trxManager.getRepository(WarehouseTransferLine);
      for (const lineDto of dto.lines) {
        await lineRepo.update(lineDto.id, {
          receivedQuantity: lineDto.quantity,
        });
      }

      return trxManager.getRepository(WarehouseTransfer).save({
        ...transfer,
        importedAt: dto.confirmedAt ?? new Date(),
      });
    });
  }

  async validateBeforeCreate(
    data: DeepPartial<WarehouseTransfer>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (!data.lines) return;
    for (const line of data.lines) {
      await this.productRepository.attachInfo(line, manager);
      await this.attributeRepository.attachUnitInfo(line, manager);
      await this.productRepository.attachUnitConversion(line, manager);
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<WarehouseTransfer>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const transfer = await this.repository.findById(id, manager);
    if (!transfer)
      throw new NotFoundError("KhÃ´ng tÃ¬m tháº¥y phiáº¿u chuyá»ƒn kho");
    const canUpdate = await this.canUpdate(transfer);
    if (!canUpdate.can) throw new BadRequestError(canUpdate.reason);
    if (transfer.exportedAt) {
      throw new BadRequestError(
        "KhÃ´ng thá»ƒ sá»­a phiáº¿u chuyá»ƒn kho Ä‘Ã£ xuáº¥t",
      );
    }
  }

  async validateBeforeDelete(
    data: WarehouseTransfer,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const canDelete = await this.canDelete(data);
    if (!canDelete.can) throw new BadRequestError(canDelete.reason);
  }

  async canUpdate(entity: WarehouseTransfer): Promise<ActionValue> {
    if (entity.exportedAt) {
      return { can: false, reason: "Không thể sửa phiếu chuyển kho đã xuất" };
    }
    return { can: true };
  }

  async canDelete(entity: WarehouseTransfer): Promise<ActionValue> {
    if (entity.exportedAt || entity.importedAt) {
      return { can: false, reason: "Không thể xóa phiếu chuyển kho đã thực hiện" };
    }
    return { can: true };
  }

  async canConfirmExport(
    entity: WarehouseTransfer | string,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    const transfer =
      typeof entity === "string" ? await this.repository.findById(entity) : entity;
    if (!transfer) return { can: false, reason: "Không tìm thấy phiếu chuyển kho" };
    if (transfer.exportedAt) return { can: false, reason: "Phiếu chuyển kho đã xuất kho" };
    return { can: true };
  }

  async canConfirmImport(
    entity: WarehouseTransfer | string,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    const transfer =
      typeof entity === "string" ? await this.repository.findById(entity) : entity;
    if (!transfer) return { can: false, reason: "Không tìm thấy phiếu chuyển kho" };
    if (!transfer.exportedAt) return { can: false, reason: "Phiếu chuyển kho chưa xuất kho" };
    if (transfer.importedAt) return { can: false, reason: "Phiếu chuyển kho đã nhập kho" };
    return { can: true };
  }
}
