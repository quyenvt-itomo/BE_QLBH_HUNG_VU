import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
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

@injectable()
export class WarehouseTransferService extends BaseService<WarehouseTransfer> {
  protected repository: WarehouseTransferRepository;
  protected uniqueFields: (keyof WarehouseTransfer)[] = ["code"];
  protected uniqueScope?: (keyof WarehouseTransfer)[] = ["storeId"];
  protected searchableFields = ["code", "reason"];
  protected timeField: keyof WarehouseTransfer = "timeAt";

  constructor(
    @inject(WAREHOUSE_TRANSFER_TYPES.WarehouseTransferRepository)
    repository: WarehouseTransferRepository,
  ) {
    super();
    this.repository = repository;
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
  ): Promise<void> {}

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<WarehouseTransfer>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const transfer = await this.repository.findById(id, manager);
    if (!transfer)
      throw new NotFoundError("KhÃ´ng tÃ¬m tháº¥y phiáº¿u chuyá»ƒn kho");
    if (transfer.exportedAt) {
      throw new BadRequestError(
        "KhÃ´ng thá»ƒ sá»­a phiáº¿u chuyá»ƒn kho Ä‘Ã£ xuáº¥t",
      );
    }
  }
}
