import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { WarehouseTransferLine } from "@/database/models/company/WarehouseTransferLine";
import {
  WarehouseTransferLineSelectFull,
  WarehouseTransferLineRelations,
} from "./warehouseTransferLine.select";
import { injectable } from "inversify";
import { SelectQueryBuilder } from "typeorm";
import { WarehouseTransferLineQueryDto } from "./warehouseTransferLine.validator";

@injectable()
export class WarehouseTransferLineRepository extends BaseRepository<WarehouseTransferLine> {
  protected entityClass = WarehouseTransferLine;
  protected selectedFields = WarehouseTransferLineSelectFull;
  protected relations = WarehouseTransferLineRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<WarehouseTransferLine>,
    options: IFindPaginationOptions<WarehouseTransferLine>,
  ): Promise<void> {
    const alias = qb.alias;
    const { transferId, productId } =
      (options?.moreQuery as WarehouseTransferLineQueryDto) || {};

    if (transferId) {
      qb.andWhere(`${alias}.transferId = :transferId`, { transferId });
    }
    if (productId) {
      qb.andWhere(`${alias}.productId = :productId`, { productId });
    }
  }
}
