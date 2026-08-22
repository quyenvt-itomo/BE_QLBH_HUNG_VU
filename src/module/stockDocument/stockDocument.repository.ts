import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import {
  StockDocument,
  StockDocumentSnapshot,
} from "@/database/models/company/StockDocument";
import {
  StockDocumentSelectFull,
  StockDocumentSelectList,
  StockDocumentRelations,
  StockDocumentRelationsList,
  StockDocumentRelationSelects,
  StockDocumentRelationSelectsForList,
} from "./stockDocument.select";
import { injectable } from "inversify";
import { DeepPartial, EntityManager, SelectQueryBuilder } from "typeorm";
import { StockDocumentQueryDto } from "./stockDocument.validator";
import { GateLog } from "@/database/models/company/GateLog";

@injectable()
export class StockDocumentRepository extends BaseRepository<StockDocument> {
  protected entityClass = StockDocument;
  protected selectedFields = StockDocumentSelectFull;
  protected selectedFieldsForList = StockDocumentSelectList;
  protected relations = StockDocumentRelations;
  protected relationsForList = StockDocumentRelationsList;
  protected relationSelects = StockDocumentRelationSelects;
  protected relationSelectsForList = StockDocumentRelationSelectsForList;

  protected multipleFile: boolean = true;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<StockDocument>,
    options: IFindPaginationOptions<StockDocument>,
  ): Promise<void> {
    const alias = qb.alias;
    const {
      type,
      status,
      warehouseId,
      partnerId,
      purchaseId,
      orderId,
      productionId,
    } = (options?.moreQuery as StockDocumentQueryDto) || {};

    if (type) {
      qb.andWhere(`${alias}.type = :type`, { type });
    }
    if (status) {
      qb.andWhere(`${alias}.status = :status`, { status });
    }
    if (warehouseId) {
      qb.andWhere(`${alias}.warehouseId = :warehouseId`, { warehouseId });
    }
    if (partnerId) {
      qb.andWhere(`${alias}.partnerId = :partnerId`, { partnerId });
    }
    if (purchaseId) {
      qb.andWhere(`${alias}.purchaseId = :purchaseId`, { purchaseId });
    }
    if (orderId) {
      qb.andWhere(`${alias}.orderId = :orderId`, { orderId });
    }
    if (productionId) {
      qb.andWhere(`${alias}.productionId = :productionId`, { productionId });
    }
  }

  getGateLogRepository(manager: EntityManager) {
    return manager.getRepository(GateLog);
  }
  async attachInfo<
    T extends {
      stockDocumentId?: string | null;
      stockDocumentSnapshot?: DeepPartial<StockDocumentSnapshot> | null;
    },
  >(data: T, manager?: EntityManager): Promise<void> {
    // stockDocumentId → stockDocumentSnapshot
    if (
      data.stockDocumentId &&
      (!data.stockDocumentSnapshot ||
        data.stockDocumentSnapshot.id !== data.stockDocumentId)
    )
      data.stockDocumentSnapshot = await this.getSnapshot(
        data.stockDocumentId,
        manager,
      );
  }

  async getSnapshot(
    stockDocumentId: string,
    manager?: EntityManager,
  ): Promise<StockDocumentSnapshot | null> {
    const stockDocument = await this.findById(stockDocumentId, manager);
    if (!stockDocument) return null;
    return {
      id: stockDocument.id,
      code: stockDocument.code,
      actualExportDate: stockDocument.actualExportDate,
      actualImportDate: stockDocument.actualImportDate,
      effectiveDate: stockDocument.effectiveDate,
      type: stockDocument.type,

      orderId: stockDocument.orderId,
      orderSnapshot: stockDocument.orderSnapshot,

      purchaseId: stockDocument.purchaseId,
      purchaseSnapshot: stockDocument.purchaseSnapshot,

      productionId: stockDocument.productionId,
      productionSnapshot: stockDocument.productionSnapshot,

      partnerId: stockDocument.partnerId,
      partnerSnapshot: stockDocument.partnerSnapshot,

      shippingProviderId: stockDocument.shippingProviderId,
      shippingProviderSnapshot: stockDocument.shippingProviderSnapshot,

      shippingPlanId: stockDocument.shippingPlanId,
      shippingPlanSnapshot: stockDocument.shippingPlanSnapshot,

      warehouseId: stockDocument.warehouseId,
      warehouseSnapshot: stockDocument.warehouseSnapshot,

      totalVarianceAmount: stockDocument.totalVarianceAmount,
      representative: stockDocument.representative,
      vehicleType: stockDocument.vehicleType,
      vehiclePlate: stockDocument.vehiclePlate,
    };
  }
}
