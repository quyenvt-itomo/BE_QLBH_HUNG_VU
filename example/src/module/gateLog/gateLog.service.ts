import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { GateLogRepository } from "./gateLog.repository";
import { GATE_LOG_TYPES } from "./gateLog.types";
import { GateLog, GateLogStatusEnum } from "@/database/models/company/GateLog";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import { withTransaction } from "@/shared/base/TransactionManager";
import { BadRequestError, NotFoundError } from "@/shared/types/errors";
import { GateEntryDto, GateExitDto, LinkGateLogDto } from "./gateLog.validator";

@injectable()
export class GateLogService extends BaseService<GateLog> {
  protected repository: GateLogRepository;
  protected uniqueFields: (keyof GateLog)[] = ["code"];
  protected uniqueScope?: (keyof GateLog)[] = ["storeId"];
  protected searchableFields = ["code", "vehiclePlate"];
  protected timeField: keyof GateLog = "timeAt";

  constructor(
    @inject(GATE_LOG_TYPES.GateLogRepository)
    repository: GateLogRepository,
  ) {
    super();
    this.repository = repository;
  }

  async enter(id: string, dto: GateEntryDto, req: Request): Promise<GateLog> {
    return withTransaction(async (trxManager) => {
      const gateLog = await this.repository.findById(id, trxManager);
      if (!gateLog)
        throw new NotFoundError("KhÃ´ng tÃ¬m tháº¥y báº£n ghi cá»•ng");
      if (gateLog.status !== GateLogStatusEnum.PENDING) {
        throw new BadRequestError(
          "Xe chá»‰ cÃ³ thá»ƒ vÃ o cá»•ng tá»« tráº¡ng thÃ¡i chá»",
        );
      }

      return trxManager.getRepository(GateLog).save({
        ...gateLog,
        status: GateLogStatusEnum.ENTERED,
        entryTime: dto.entryTime ?? new Date(),
        entryNote: dto.entryNote ?? null,
      });
    });
  }

  async exit(id: string, dto: GateExitDto, req: Request): Promise<GateLog> {
    return withTransaction(async (trxManager) => {
      const gateLog = await this.repository.findById(id, trxManager);
      if (!gateLog)
        throw new NotFoundError("KhÃ´ng tÃ¬m tháº¥y báº£n ghi cá»•ng");
      if (gateLog.status !== GateLogStatusEnum.ENTERED) {
        throw new BadRequestError(
          "Xe chá»‰ cÃ³ thá»ƒ ra cá»•ng tá»« tráº¡ng thÃ¡i Ä‘Ã£ vÃ o",
        );
      }

      return trxManager.getRepository(GateLog).save({
        ...gateLog,
        status: GateLogStatusEnum.EXITED,
        exitTime: dto.exitTime ?? new Date(),
        exitNote: dto.exitNote ?? null,
      });
    });
  }

  async link(id: string, dto: LinkGateLogDto, req: Request): Promise<GateLog> {
    return withTransaction(async (trxManager) => {
      const gateLog = await this.repository.findById(id, trxManager);
      if (!gateLog)
        throw new NotFoundError("KhÃ´ng tÃ¬m tháº¥y báº£n ghi cá»•ng");

      const linked = await this.repository.findById(
        dto.linkedGateLogId,
        trxManager,
      );
      if (!linked)
        throw new NotFoundError(
          "KhÃ´ng tÃ¬m tháº¥y báº£n ghi cá»•ng Ä‘á»ƒ ná»‘i",
        );

      const repo = trxManager.getRepository(GateLog);
      await repo.save({ ...linked, status: GateLogStatusEnum.LINKED });
      return repo.save({ ...gateLog, status: GateLogStatusEnum.LINKED });
    });
  }

  async validateBeforeCreate(
    data: DeepPartial<GateLog>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {}

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<GateLog>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const gateLog = await this.repository.findById(id, manager);
    if (!gateLog)
      throw new NotFoundError("KhÃ´ng tÃ¬m tháº¥y báº£n ghi cá»•ng");
    if (gateLog.status !== GateLogStatusEnum.PENDING) {
      throw new BadRequestError(
        "Chá»‰ cÃ³ thá»ƒ sá»­a báº£n ghi cá»•ng Ä‘ang á»Ÿ tráº¡ng thÃ¡i chá»",
      );
    }
  }
}
