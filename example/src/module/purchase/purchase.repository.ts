import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { Purchase, PurchaseSnapshot } from "@/database/models/company/Purchase";
import {
  PurchaseSelectFull,
  PurchaseSelectList,
  PurchaseRelations,
  PurchaseRelationsList,
  PurchaseRelationSelects,
  PurchaseRelationSelectsForList,
} from "./purchase.select";
import { injectable } from "inversify";
import { DeepPartial, EntityManager, SelectQueryBuilder } from "typeorm";
import { PurchaseQueryDto } from "./purchase.validator";

@injectable()
export class PurchaseRepository extends BaseRepository<Purchase> {
  protected entityClass = Purchase;
  protected selectedFields = PurchaseSelectFull;
  protected selectedFieldsForList = PurchaseSelectList;
  protected relations = PurchaseRelations;
  protected relationsForList = PurchaseRelationsList;
  protected relationSelects = PurchaseRelationSelects;
  protected relationSelectsForList = PurchaseRelationSelectsForList;

  protected multipleFile: boolean = true;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Purchase>,
    options: IFindPaginationOptions<Purchase>,
  ): Promise<void> {
    const alias = qb.alias;
    const { approveStatus, supplierId, supplierIds, staffId, isCompleted } =
      (options?.moreQuery as PurchaseQueryDto) || {};

    if (approveStatus) {
      qb.andWhere(`${alias}.approveStatus = :approveStatus`, { approveStatus });
    }
    if (supplierId) {
      qb.andWhere(`${alias}.supplierId = :supplierId`, { supplierId });
    } else if (this.checkArrayFilter(supplierIds)) {
      qb.andWhere(`${alias}.supplierId IN (:...supplierIds)`, { supplierIds });
    }

    if (staffId) {
      qb.andWhere(`${alias}.staffId = :staffId`, { staffId });
    }

    if (typeof isCompleted === "boolean") {
      qb.andWhere(`${alias}.isCompleted = :isCompleted`, { isCompleted });
    }
  }
  async attachInfo<
    T extends {
      purchaseId?: string | null;
      purchaseSnapshot?: DeepPartial<PurchaseSnapshot> | null;
    },
  >(data: T, manager?: EntityManager): Promise<void> {
    // purchaseId → purchaseSnapshot
    if (
      data.purchaseId &&
      (!data.purchaseSnapshot || data.purchaseSnapshot.id !== data.purchaseId)
    )
      data.purchaseSnapshot = await this.getSnapshot(data.purchaseId, manager);
  }

  async getSnapshot(
    purchaseId: string,
    manager?: EntityManager,
  ): Promise<PurchaseSnapshot | null> {
    const purchase = await this.findById(purchaseId, manager);
    if (!purchase) return null;
    return {
      id: purchase.id,
      code: purchase.code,
      orderedAt: purchase.orderedAt,
      toleranceRate: purchase.toleranceRate,
      sellerId: purchase.sellerId,
      sellerSnapshot: purchase.sellerSnapshot,
      supplierId: purchase.supplierId,
      supplierSnapshot: purchase.supplierSnapshot,
      staffId: purchase.staffId,
      staffSnapshot: purchase.staffSnapshot,
      subTotal: purchase.subTotal,
      taxAmount: purchase.taxAmount,
      totalAmount: purchase.totalAmount,
      totalCommissionAmount: purchase.totalCommissionAmount,
    };
  }
}
