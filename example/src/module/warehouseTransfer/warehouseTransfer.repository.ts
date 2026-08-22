import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { WarehouseTransfer } from "@/database/models/company/WarehouseTransfer";
import {
  WarehouseTransferSelectFull,
  WarehouseTransferRelations,
} from "./warehouseTransfer.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { WarehouseTransferQueryDto } from "./warehouseTransfer.validator";

@injectable()
export class WarehouseTransferRepository extends BaseRepository<WarehouseTransfer> {
  protected entityClass = WarehouseTransfer;
  protected selectedFields = WarehouseTransferSelectFull;
  protected relations = WarehouseTransferRelations;

  protected multipleFile: boolean = true;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<WarehouseTransfer>,
    options: IFindPaginationOptions<WarehouseTransfer>,
  ): Promise<void> {
    const alias = qb.alias;
    const { fromWarehouseId, toWarehouseId } =
      (options?.moreQuery as WarehouseTransferQueryDto) || {};

    if (fromWarehouseId) {
      qb.andWhere(`${alias}.fromWarehouseId = :fromWarehouseId`, {
        fromWarehouseId,
      });
    }
    if (toWarehouseId) {
      qb.andWhere(`${alias}.toWarehouseId = :toWarehouseId`, { toWarehouseId });
    }
  }
}
