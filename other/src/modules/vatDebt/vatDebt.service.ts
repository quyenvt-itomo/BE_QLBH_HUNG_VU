import { inject, injectable } from "inversify";
import { VatDebtTransaction } from "@/database/models/store/VatDebtTransaction";
import { EntityManager } from "typeorm";
import { VatDebtSnapshot } from "@/database/models/store/VatDebtSnapshot";
import { GetVatDebtReportQueryDto } from "./vatDebt.validator";
import { TransactionService } from "@/shared/base/TransactionService";
import { DebtDirectionEnum } from "@/shared/constants/enum";
import { ApiResponse } from "@/shared/types/interfaces";
import { STORE_TYPES, StoreRepository } from "../store";

/**
 * VatDebt Service
 * Quản lý tồn kho, transaction, snapshot và stock tracking với thuật toán FIFO
 */
@injectable()
export class VatDebtService extends TransactionService {
  constructor(
    @inject(STORE_TYPES.StoreRepository)
    private storeRepository: StoreRepository,
  ) {
    super();
  }

  /**
   * Chi tiết transactions (nhập xuất tồn)
   */
  async getVatDebtReport(
    params: GetVatDebtReportQueryDto,
  ): Promise<ApiResponse> {
    const { startAt, endAt, storeId } = params;
    const manager = await this.getManager();

    // ===== SNAPSHOT trước startAt =====
    const snapshotQb = manager
      .createQueryBuilder(VatDebtSnapshot, "s")
      .where("s.snapshotAt <= :startAt", { startAt });

    if (storeId) {
      snapshotQb.andWhere("s.storeId = :storeId", { storeId });
    }

    snapshotQb.orderBy("s.snapshotAt", "DESC");

    const snapshot = await snapshotQb.getOne();

    let snapshotAmount = snapshot?.amount ?? 0;
    const snapshotAt = snapshot?.snapshotAt ?? new Date(0);

    // ===== TRANSACTIONS =====
    const txQb = manager
      .createQueryBuilder(VatDebtTransaction, "tx")
      .where("tx.occurredAt > :snapshotAt", { snapshotAt })
      .andWhere("tx.occurredAt <= :endAt", { endAt });

    if (storeId) {
      txQb.andWhere("tx.storeId = :storeId", { storeId });
    }

    txQb.orderBy("tx.occurredAt", "ASC");

    const transactions = await txQb.getMany();

    // ===== CALCULATE =====
    let openingAmount = snapshotAmount;
    let totalIncreaseAmount = 0;
    let totalDecreaseAmount = 0;
    // let saleVatAmount = 0;
    // let purchaseVatAmount = 0;
    // let saleReturnVatAmount = 0;

    const dataRes: VatDebtTransaction[] = [];

    for (const tx of transactions) {
      if (tx.occurredAt < startAt) {
        openingAmount +=
          tx.direction === DebtDirectionEnum.INCREASE ? tx.amount : -tx.amount;
      } else {
        const store = storeId
          ? null
          : await this.storeRepository.findById(tx.storeId);
        dataRes.push({
          ...tx,
          store,
        } as any);
        if (tx.direction === DebtDirectionEnum.INCREASE) {
          totalIncreaseAmount += tx.amount;
        } else {
          totalDecreaseAmount += tx.amount;
        }
      }
    }

    return {
      message: "VAT debt report fetched successfully",
      statusCode: 200,
      success: true,
      data: dataRes,
      summary: {
        openingAmount,
        totalIncreaseAmount,
        totalDecreaseAmount,
        closingAmount:
          openingAmount + totalIncreaseAmount - totalDecreaseAmount,
      },
    };
  }

  /**
   * Tính công nợ tại một thời điểm
   */
  async getDebtAtDate(
    atDate: Date,
    storeId?: string,
    manager?: EntityManager,
  ): Promise<number> {
    const mainManager = manager || (await this.getManager());

    // ===== SNAPSHOT =====
    const snapshotQb = mainManager
      .createQueryBuilder(VatDebtSnapshot, "s")
      .where("s.snapshotAt <= :atDate", { atDate });

    if (storeId) {
      snapshotQb.andWhere("s.storeId = :storeId", { storeId });
    }

    snapshotQb.orderBy("s.snapshotAt", "DESC");

    const snapshot = await snapshotQb.getOne();

    let amount = snapshot?.amount ?? 0;
    const snapshotAt = snapshot?.snapshotAt ?? new Date(0);

    // ===== TRANSACTIONS =====
    const txQb = mainManager
      .createQueryBuilder(VatDebtTransaction, "tx")
      .where("tx.occurredAt > :snapshotAt", { snapshotAt })
      .andWhere("tx.occurredAt <= :atDate", { atDate });

    if (storeId) {
      txQb.andWhere("tx.storeId = :storeId", { storeId });
    }

    const txs = await txQb.getMany();

    for (const tx of txs) {
      amount +=
        tx.direction === DebtDirectionEnum.INCREASE ? tx.amount : -tx.amount;
    }

    return amount;
  }
}
