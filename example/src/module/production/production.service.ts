import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { ProductionRepository } from "./production.repository";
import { PRODUCTION_TYPES } from "./production.types";
import {
  Production,
  ProductionStatusEnum,
} from "@/database/models/company/Production";
import { DeepPartial, EntityManager } from "typeorm";
import { withTransaction } from "@/shared/base/TransactionManager";
import { BadRequestError, NotFoundError } from "@/shared/types/errors";
import {
  ActionMap,
  ActionValue,
  RequestContext,
} from "@/shared/types/interfaces";

@injectable()
export class ProductionService extends BaseService<Production> {
  protected repository: ProductionRepository;
  protected targetEntity = "Production";
  protected uniqueFields: (keyof Production)[] = ["code"];
  protected uniqueScope?: (keyof Production)[] = ["storeId"];
  protected searchableFields = ["code", "name", "note"];
  protected timeField: keyof Production = "timeAt";

  constructor(
    @inject(PRODUCTION_TYPES.ProductionRepository)
    repository: ProductionRepository,
  ) {
    super();
    this.repository = repository;
  }

  // =====================================================
  // ACTIONS â€” Tráº£ vá» cho FE Ä‘á»ƒ render UI, Server cÅ©ng dÃ¹ng Ä‘á»ƒ validate
  // =====================================================

  protected async attachActions(
    entity: Production & { _actions?: ActionMap },
    req?: RequestContext,
  ): Promise<void> {
    entity._actions = await this.getActions(entity, req);
  }

  private async getActions(
    entity: Production | null,
    req?: RequestContext,
  ): Promise<ActionMap> {
    const actions = this.getDefaultAction();
    if (!entity) return actions;
    actions.update = await this.canUpdate(entity, req);
    actions.delete = await this.canDelete(entity, req);
    actions.start = await this.canStart(entity, req);
    actions.complete = await this.canComplete(entity, req);
    actions.cancel = await this.canCancel(entity, req);
    return actions;
  }

  async canUpdate(
    entity: Production,
    req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.status === ProductionStatusEnum.COMPLETED)
      return {
        can: false,
        reason: "Lá»‡nh sáº£n xuáº¥t Ä‘Ã£ hoÃ n thÃ nh, khÃ´ng thá»ƒ sá»­a",
      };
    if (entity.status === ProductionStatusEnum.CANCELLED)
      return {
        can: false,
        reason: "Lá»‡nh sáº£n xuáº¥t Ä‘Ã£ há»§y, khÃ´ng thá»ƒ sá»­a",
      };
    return { can: true };
  }

  async canDelete(
    entity: Production,
    req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.status === ProductionStatusEnum.COMPLETED)
      return {
        can: false,
        reason: "Lá»‡nh sáº£n xuáº¥t Ä‘Ã£ hoÃ n thÃ nh, khÃ´ng thá»ƒ xÃ³a",
      };
    if (entity.status === ProductionStatusEnum.CANCELLED)
      return { can: false, reason: "Lá»‡nh sáº£n xuáº¥t Ä‘Ã£ há»§y" };
    return { can: true };
  }

  async canStart(
    entity: Production,
    req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.status !== ProductionStatusEnum.PLANNING)
      return {
        can: false,
        reason: "Chá»‰ cÃ³ thá»ƒ báº¯t Ä‘áº§u lá»‡nh Ä‘ang lÃªn káº¿ hoáº¡ch",
      };
    return { can: true };
  }

  async canComplete(
    entity: Production,
    req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.status !== ProductionStatusEnum.IN_PROGRESS)
      return {
        can: false,
        reason: "Chá»‰ cÃ³ thá»ƒ hoÃ n thÃ nh lá»‡nh Ä‘ang sáº£n xuáº¥t",
      };
    return { can: true };
  }

  async canCancel(
    entity: Production,
    req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.status === ProductionStatusEnum.COMPLETED)
      return {
        can: false,
        reason: "KhÃ´ng thá»ƒ há»§y lá»‡nh Ä‘Ã£ hoÃ n thÃ nh",
      };
    if (entity.status === ProductionStatusEnum.CANCELLED)
      return {
        can: false,
        reason: "Lá»‡nh sáº£n xuáº¥t Ä‘Ã£ bá»‹ há»§y trÆ°á»›c Ä‘Ã³",
      };
    return { can: true };
  }

  async start(id: string, req?: RequestContext): Promise<Production> {
    return withTransaction(async (trxManager) => {
      const production = await this.repository.findById(id, trxManager);
      if (!production)
        throw new NotFoundError("KhÃ´ng tÃ¬m tháº¥y lá»‡nh sáº£n xuáº¥t");
      if (production.status !== ProductionStatusEnum.PLANNING) {
        throw new BadRequestError(
          "Chá»‰ cÃ³ thá»ƒ báº¯t Ä‘áº§u lá»‡nh Ä‘ang lÃªn káº¿ hoáº¡ch",
        );
      }
      return trxManager.getRepository(Production).save({
        ...production,
        status: ProductionStatusEnum.IN_PROGRESS,
      });
    });
  }

  async complete(id: string, req?: RequestContext): Promise<Production> {
    return withTransaction(async (trxManager) => {
      const production = await this.repository.findById(id, trxManager);
      if (!production)
        throw new NotFoundError("KhÃ´ng tÃ¬m tháº¥y lá»‡nh sáº£n xuáº¥t");
      if (production.status !== ProductionStatusEnum.IN_PROGRESS) {
        throw new BadRequestError(
          "Chá»‰ cÃ³ thá»ƒ hoÃ n thÃ nh lá»‡nh Ä‘ang sáº£n xuáº¥t",
        );
      }
      return trxManager.getRepository(Production).save({
        ...production,
        status: ProductionStatusEnum.COMPLETED,
      });
    });
  }

  async cancel(id: string, req?: RequestContext): Promise<Production> {
    return withTransaction(async (trxManager) => {
      const production = await this.repository.findById(id, trxManager);
      if (!production)
        throw new NotFoundError("KhÃ´ng tÃ¬m tháº¥y lá»‡nh sáº£n xuáº¥t");
      if (production.status === ProductionStatusEnum.COMPLETED) {
        throw new BadRequestError(
          "KhÃ´ng thá»ƒ há»§y lá»‡nh sáº£n xuáº¥t Ä‘Ã£ hoÃ n thÃ nh",
        );
      }
      return trxManager.getRepository(Production).save({
        ...production,
        status: ProductionStatusEnum.CANCELLED,
      });
    });
  }

  async validateBeforeCreate(
    data: DeepPartial<Production>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {}

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<Production>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const production = await this.repository.findById(id, manager);
    if (!production)
      throw new NotFoundError("KhÃ´ng tÃ¬m tháº¥y lá»‡nh sáº£n xuáº¥t");
    if (
      production.status === ProductionStatusEnum.COMPLETED ||
      production.status === ProductionStatusEnum.CANCELLED
    ) {
      throw new BadRequestError(
        "KhÃ´ng thá»ƒ sá»­a lá»‡nh sáº£n xuáº¥t Ä‘Ã£ hoÃ n thÃ nh hoáº·c Ä‘Ã£ há»§y",
      );
    }
  }
}
