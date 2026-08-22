import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { GateLog } from "@/database/models/company/GateLog";
import { GateLogSelectFull, GateLogRelations } from "./gateLog.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { GateLogQueryDto } from "./gateLog.validator";

@injectable()
export class GateLogRepository extends BaseRepository<GateLog> {
  protected entityClass = GateLog;
  protected selectedFields = GateLogSelectFull;
  protected relations = GateLogRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<GateLog>,
    options: IFindPaginationOptions<GateLog>,
  ): Promise<void> {
    const alias = qb.alias;
    const { type, status, stockDocumentId, partnerId, warehouseId } =
      (options?.moreQuery as GateLogQueryDto) || {};

    if (type) {
      qb.andWhere(`${alias}.type = :type`, { type });
    }
    if (status) {
      qb.andWhere(`${alias}.status = :status`, { status });
    }
    if (stockDocumentId) {
      qb.andWhere(`${alias}.stockDocumentId = :stockDocumentId`, {
        stockDocumentId,
      });
    }
    if (partnerId) {
      qb.andWhere(`${alias}.partnerId = :partnerId`, { partnerId });
    }
    if (warehouseId) {
      qb.andWhere(`${alias}.warehouseId = :warehouseId`, { warehouseId });
    }
  }
}
