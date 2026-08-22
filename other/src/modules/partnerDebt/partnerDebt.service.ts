import { inject, injectable } from "inversify";
import { PartnerDebtTransaction } from "@/database/models/store/PartnerDebtTransaction";

import { EntityManager, In } from "typeorm";
import { Partner } from "@/database/models/Partner";
import { PartnerDebtSnapshot } from "@/database/models/store/PartnerDebtSnapshot";
import {
  GetPartnerDebtReportQueryDto,
  GetTransactionDetailsQueryDto,
} from "./partnerDebt.validator";
import { PARTNER_TYPES } from "../partner/partner.types";
import { PartnerRepository } from "../partner/partner.repository";
import {
  DebtDirectionEnum,
  PartnerDebtSideEnum,
} from "@/shared/constants/enum";
import { TransactionService } from "@/shared/base/TransactionService";
import { FileHelper } from "@/shared/utils/file.helper";
import { ApiResponse } from "@/shared/types/interfaces";

/**
 * PartnerDebt Service
 * Quản lý tồn kho, transaction, snapshot và stock tracking với thuật toán FIFO
 */
@injectable()
export class PartnerDebtService extends TransactionService {
  constructor(
    @inject(PARTNER_TYPES.PartnerRepository)
    private partnerRepo: PartnerRepository,
  ) {
    super();
  }

  /**
   * Báo cáo công nợ theo partner
   */
  async getPartnerDebtReport(
    params: GetPartnerDebtReportQueryDto,
  ): Promise<ApiResponse> {
    const {
      keyword,
      page = 1,
      size = 20,
      partnerIds,
      side,
      startAt,
      endAt,
      storeId,
    } = params;

    // ===== BƯỚC 1: Lấy TẤT CẢ Partners cần truy vấn (không phân trang) =====
    const whereConditions: any = {};
    if (partnerIds && partnerIds.length > 0) {
      whereConditions.id = In(partnerIds);
    }

    // Lấy tất cả partners để tính summary
    const allPartners = await this.partnerRepo.findWithPagination({
      skip: 0,
      take: 999999, // Lấy tất cả
      keyword,
      searchFields: [
        "name",
        "code",
        "email",
        "phone",
        "taxCode",
        "note",
        "group.name",
      ],
      where: whereConditions,
    });

    if (!allPartners.data || allPartners.data.length === 0) {
      return {
        message: "No partners found",
        statusCode: 200,
        success: true,
        data: [],
        pagination: {
          currentPage: page,
          size,
          totalRecords: 0,
          totalPages: 0,
        },
        summary: {
          openingAmount: 0,
          increaseAmount: 0,
          decreaseAmount: 0,
          closingAmount: 0,
        },
      };
    }

    // Thu thập tất cả partnerIds từ partners
    const allPartnerIds = allPartners.data.map((p) => p.id);
    if (allPartnerIds.length === 0) {
      return {
        message: "No partners found",
        statusCode: 200,
        success: true,
        data: [],
        pagination: {
          currentPage: page,
          size,
          totalRecords: allPartners.total,
          totalPages: Math.ceil(allPartners.total / size),
        },
        summary: {
          openingQty: 0,
          openingAmount: 0,
          increaseQty: 0,
          increaseAmount: 0,
          decreaseQty: 0,
          decreaseAmount: 0,
          closingQty: 0,
          closingAmount: 0,
        },
      };
    }

    // ===== BƯỚC 2: Tính công nợ cho TẤT CẢ partners =====
    const partnerDebtMap = await this.calculatePartnerDebt(
      allPartnerIds,
      side,
      startAt,
      endAt,
      storeId,
    );

    // ===== BƯỚC 3: Tính Summary =====
    let summaryOpeningAmount = 0;
    let summaryIncreaseAmount = 0;
    let summaryDecreaseAmount = 0;
    let summaryClosingAmount = 0;

    const enrichedPartners: any = allPartners.data.map((partner) => {
      const { openingAmount, increaseAmount, decreaseAmount, closingAmount } =
        partnerDebtMap.get(partner.id) || {
          openingAmount: 0,
          increaseAmount: 0,
          decreaseAmount: 0,
          closingAmount: 0,
        };

      // Cộng dồn vào summary tổng
      summaryOpeningAmount += openingAmount;
      summaryIncreaseAmount += increaseAmount;
      summaryDecreaseAmount += decreaseAmount;
      summaryClosingAmount += closingAmount;

      // xóa đi những thông tin không cần thiết của partner
      const partialPartner: Partial<Partner> = {
        id: partner.id,
        code: partner.code,
        name: partner.name,
        type: partner.type,
        phone: partner.phone,
        groupId: partner.groupId,
        group: partner.group,
      };

      return {
        ...partialPartner,
        openingAmount,
        increaseAmount,
        decreaseAmount,
        closingAmount,
      };
    });

    const filteredPartners = [...enrichedPartners].filter(
      (partner) =>
        partner.openingAmount !== 0 ||
        partner.increaseAmount !== 0 ||
        partner.decreaseAmount !== 0 ||
        partner.closingAmount !== 0,
    );

    // ===== BƯỚC 4: Áp dụng phân trang =====
    const total = filteredPartners.length;
    const totalPages = Math.ceil(total / size);
    const skip = (page - 1) * size;
    const paginatedData = filteredPartners.slice(skip, skip + size);

    const result = await FileHelper.attachFilesToEntities(paginatedData);

    return {
      message: "Partner debt report fetched successfully",
      statusCode: 200,
      success: true,
      data: result,
      pagination: {
        currentPage: page,
        size,
        totalRecords: total,
        totalPages,
      },
      summary: {
        openingAmount: summaryOpeningAmount,
        increaseAmount: summaryIncreaseAmount,
        decreaseAmount: summaryDecreaseAmount,
        closingAmount: summaryClosingAmount,
      },
    };
  }

  /**
   * Tính công nợ cho danh sách partnerIds
   * Trả về Map<partnerId, debtData>
   */
  private async calculatePartnerDebt(
    partnerIds: string[],
    side: PartnerDebtSideEnum,
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<
    Map<
      string,
      {
        openingAmount: number;
        increaseAmount: number;
        decreaseAmount: number;
        closingAmount: number;
      }
    >
  > {
    const resultMap = new Map<
      string,
      {
        openingAmount: number;
        increaseAmount: number;
        decreaseAmount: number;
        closingAmount: number;
      }
    >();

    const manager = await this.getManager();

    /**
     * ===== 1. Lấy snapshot gần nhất trước startAt
     * (mỗi partner + mỗi store 1 snapshot)
     */
    const snapshotQb = manager
      .createQueryBuilder(PartnerDebtSnapshot, "s")
      .where("s.partnerId IN (:...partnerIds)", { partnerIds })
      .andWhere("s.side = :side", { side })
      .andWhere("s.snapshotAt <= :startAt", { startAt });

    if (storeId) {
      snapshotQb.andWhere("s.storeId = :storeId", { storeId });
    }

    const snapshots = await snapshotQb.getMany();

    /**
     * Map: partnerId_storeId -> snapshot
     */
    const snapshotMap = new Map<string, { snapshotAt: Date; amount: number }>();

    for (const snap of snapshots) {
      const key = `${snap.partnerId}_${snap.storeId}`;
      const exist = snapshotMap.get(key);

      if (!exist || snap.snapshotAt > exist.snapshotAt) {
        snapshotMap.set(key, {
          snapshotAt: snap.snapshotAt,
          amount: snap.amount,
        });
      }
    }

    /**
     * ===== 2. Lấy transaction từ snapshot sớm nhất → endAt
     * Nếu không có snapshot, load từ đầu
     */
    let earliestSnapshotAt = startAt;

    if (snapshotMap.size === 0) {
      // Không có snapshot nào, cần load tất cả tx từ đầu
      earliestSnapshotAt = new Date(0);
    } else {
      // Có snapshot, tìm snapshot sớm nhất
      snapshotMap.forEach((s) => {
        if (s.snapshotAt < earliestSnapshotAt) {
          earliestSnapshotAt = s.snapshotAt;
        }
      });
    }

    const txQb = manager
      .createQueryBuilder(PartnerDebtTransaction, "tx")
      .where("tx.partnerId IN (:...partnerIds)", { partnerIds })
      .andWhere("tx.side = :side", { side })
      .andWhere("tx.occurredAt >= :earliestSnapshotAt", {
        earliestSnapshotAt,
      })
      .andWhere("tx.occurredAt <= :endAt", { endAt });

    if (storeId) {
      txQb.andWhere("tx.storeId = :storeId", { storeId });
    }

    const transactions = await txQb.getMany();

    /**
     * ===== 3. Tính cho từng partner
     */
    for (const partnerId of partnerIds) {
      let openingAmount = 0;
      let increaseAmount = 0;
      let decreaseAmount = 0;

      /**
       * 3.1 Tồn đầu kỳ = tổng snapshot của mọi store
       */
      const partnerSnapshots = [...snapshotMap.entries()].filter(([key]) =>
        key.startsWith(`${partnerId}_`),
      );

      partnerSnapshots.forEach(([, snap]) => {
        openingAmount += snap.amount;
      });

      /**
       * 3.2 Transaction trước startAt (để hiệu chỉnh tồn đầu kỳ)
       */
      const txBeforeStart = transactions.filter(
        (tx) =>
          tx.partnerId === partnerId &&
          tx.occurredAt >=
            (snapshotMap.get(`${tx.partnerId}_${tx.storeId}`)?.snapshotAt ??
              earliestSnapshotAt) &&
          tx.occurredAt < startAt,
      );

      txBeforeStart.forEach((tx) => {
        if (tx.direction === DebtDirectionEnum.INCREASE) {
          openingAmount += tx.amount;
        } else {
          openingAmount -= tx.amount;
        }
      });

      /**
       * 3.3 Transaction trong kỳ
       */
      const txInPeriod = transactions.filter(
        (tx) =>
          tx.partnerId === partnerId &&
          tx.occurredAt >= startAt &&
          tx.occurredAt <= endAt,
      );

      txInPeriod.forEach((tx) => {
        if (tx.direction === DebtDirectionEnum.INCREASE) {
          increaseAmount += tx.amount;
        } else {
          decreaseAmount += tx.amount;
        }
      });

      const closingAmount = openingAmount + increaseAmount - decreaseAmount;

      resultMap.set(partnerId, {
        openingAmount,
        increaseAmount,
        decreaseAmount,
        closingAmount,
      });
    }

    return resultMap;
  }

  /**
   * Chi tiết transactions (nhập xuất tồn)
   */
  async getTransactionDetails(
    params: GetTransactionDetailsQueryDto,
  ): Promise<ApiResponse> {
    const { partnerId, side, startAt, endAt, storeId } = params;

    const manager = await this.getManager();

    /**
     * ===== 1. Lấy snapshot gần nhất trước startAt
     * (mỗi store 1 snapshot)
     */
    const snapshotQb = manager
      .createQueryBuilder(PartnerDebtSnapshot, "s")
      .where("s.partnerId = :partnerId", { partnerId })
      .andWhere("s.side = :side", { side })
      .andWhere("s.snapshotAt <= :startAt", { startAt });

    if (storeId) {
      snapshotQb.andWhere("s.storeId = :storeId", { storeId });
    }

    const snapshots = await snapshotQb.getMany();

    /**
     * Map: storeId -> snapshot
     */
    const snapshotMap = new Map<string, { snapshotAt: Date; amount: number }>();

    snapshots.forEach((snap) => {
      const exist = snapshotMap.get(snap.storeId);
      if (!exist || snap.snapshotAt > exist.snapshotAt) {
        snapshotMap.set(snap.storeId, {
          snapshotAt: snap.snapshotAt,
          amount: snap.amount,
        });
      }
    });

    /**
     * ===== 2. Tồn đầu kỳ = tổng snapshot của các store
     */
    let openingAmount = 0;
    snapshotMap.forEach((s) => {
      openingAmount += s.amount;
    });

    /**
     * ===== 3. Xác định mốc snapshot sớm nhất để query transaction
     * Nếu không có snapshot, load từ đầu
     */
    let earliestSnapshotAt = startAt;

    if (snapshotMap.size === 0) {
      // Không có snapshot, load tất cả tx từ đầu
      earliestSnapshotAt = new Date(0);
    } else {
      // Có snapshot, tìm snapshot sớm nhất
      snapshotMap.forEach((s) => {
        if (s.snapshotAt < earliestSnapshotAt) {
          earliestSnapshotAt = s.snapshotAt;
        }
      });
    }

    /**
     * ===== 4. Lấy transaction
     */
    const txQb = manager
      .createQueryBuilder(PartnerDebtTransaction, "tx")
      .where("tx.partnerId = :partnerId", { partnerId })
      .andWhere("tx.side = :side", { side })
      .andWhere("tx.occurredAt >= :earliestSnapshotAt", {
        earliestSnapshotAt,
      })
      .andWhere("tx.occurredAt <= :endAt", { endAt })
      .orderBy("tx.occurredAt", "ASC");

    if (storeId) {
      txQb.andWhere("tx.storeId = :storeId", { storeId });
    }

    const transactions = await txQb.getMany();

    /**
     * ===== 5. Tính opening + phân loại transaction
     */
    let totalIncreaseAmount = 0;
    let totalDecreaseAmount = 0;
    const dataRes: PartnerDebtTransaction[] = [];

    transactions.forEach((tx) => {
      const snapshotAt =
        snapshotMap.get(tx.storeId)?.snapshotAt ?? earliestSnapshotAt;

      if (tx.occurredAt >= snapshotAt && tx.occurredAt < startAt) {
        // Hiệu chỉnh tồn đầu kỳ
        if (tx.direction === DebtDirectionEnum.INCREASE) {
          openingAmount += tx.amount;
        } else {
          openingAmount -= tx.amount;
        }
      } else if (tx.occurredAt >= startAt && tx.occurredAt <= endAt) {
        dataRes.push(tx);
        if (tx.direction === DebtDirectionEnum.INCREASE) {
          totalIncreaseAmount += tx.amount;
        } else {
          totalDecreaseAmount += tx.amount;
        }
      }
    });

    /**
     * ===== 6. Tồn cuối kỳ
     */
    const closingAmount =
      openingAmount + totalIncreaseAmount - totalDecreaseAmount;

    return {
      message: "Transaction details fetched successfully",
      statusCode: 200,
      success: true,
      data: dataRes,
      summary: {
        openingAmount,
        totalIncreaseAmount,
        totalDecreaseAmount,
        closingAmount,
      },
    };
  }

  async getTopDebtCustomers(
    offsetAt: Date,
    top: number = 10,
    storeId?: string,
  ): Promise<any[]> {
    const manager = await this.getManager();

    // ===== BƯỚC 1: Lấy tất cả customers =====
    const customersQb = manager
      .createQueryBuilder(Partner, "p")
      .where("p.type = :type", { type: "customer" })
      .andWhere("p.deletedAt IS NULL");

    const customers = await customersQb.getMany();

    if (customers.length === 0) {
      return [];
    }

    // ===== BƯỚC 2: Tính công nợ phải thu cho từng customer =====
    const customerDebtData: any[] = [];

    for (const customer of customers) {
      const debtInfo = await this.getDebtAtDate(
        customer.id,
        offsetAt,
        storeId,
        manager,
      );

      // Chỉ lấy những customer có công nợ phải thu > 0
      if (debtInfo.receivableDebtAmount > 0) {
        customerDebtData.push({
          id: customer.id,
          name: customer.name,
          code: customer.code,
          amount: debtInfo.receivableDebtAmount,
        });
      }
    }

    // ===== BƯỚC 3: Sort theo amount giảm dần và lấy top N =====
    customerDebtData.sort((a, b) => b.amount - a.amount);
    const topCustomers = customerDebtData.slice(0, top);

    // ===== BƯỚC 4: Attach files =====
    const customersWithFiles = (await FileHelper.attachFilesToEntities(
      topCustomers,
    )) as any[];

    return customersWithFiles;
  }

  /**
   * Tính công nợ của partner tại một thời điểm
   */
  async getDebtAtDate(
    partnerId: string,
    atDate: Date,
    storeId?: string,
    manager?: EntityManager,
  ): Promise<{
    payableDebtAmount: number;
    receivableDebtAmount: number;
  }> {
    const mainManager = manager || (await this.getManager());

    const sides = [PartnerDebtSideEnum.PAYABLE, PartnerDebtSideEnum.RECEIVABLE];

    const resultMap = new Map<PartnerDebtSideEnum, number>();

    for (const side of sides) {
      /**
       * ===== 1. Lấy snapshot trước atDate (mỗi store 1 snapshot)
       */
      const snapshotQb = mainManager
        .createQueryBuilder(PartnerDebtSnapshot, "s")
        .where("s.partnerId = :partnerId", { partnerId })
        .andWhere("s.side = :side", { side })
        .andWhere("s.snapshotAt <= :atDate", { atDate });

      if (storeId) {
        snapshotQb.andWhere("s.storeId = :storeId", { storeId });
      }

      const snapshots = await snapshotQb.getMany();

      /**
       * Map snapshot theo store
       */
      const snapshotMap = new Map<
        string,
        { snapshotAt: Date; amount: number }
      >();

      snapshots.forEach((snap) => {
        const exist = snapshotMap.get(snap.storeId);
        if (!exist || snap.snapshotAt > exist.snapshotAt) {
          snapshotMap.set(snap.storeId, {
            snapshotAt: snap.snapshotAt,
            amount: snap.amount,
          });
        }
      });

      /**
       * ===== 2. Tổng snapshot = tồn tại snapshot
       */
      let totalAmount = 0;
      snapshotMap.forEach((s) => {
        totalAmount += s.amount;
      });

      /**
       * ===== 3. Mốc snapshot sớm nhất để query transaction
       * Nếu không có snapshot nào, query từ đầu
       */
      let earliestSnapshotAt = new Date(0); // Mặc định từ đầu
      if (snapshotMap.size > 0) {
        // Có snapshot, tìm snapshot sớm nhất
        earliestSnapshotAt = atDate; // Reset về atDate trước
        snapshotMap.forEach((s) => {
          if (s.snapshotAt < earliestSnapshotAt) {
            earliestSnapshotAt = s.snapshotAt;
          }
        });
      }
      /**
       * ===== 4. Lấy transaction từ snapshot → atDate
       */
      const txQb = mainManager
        .createQueryBuilder(PartnerDebtTransaction, "tx")
        .where("tx.partnerId = :partnerId", { partnerId })
        .andWhere("tx.side = :side", { side })
        .andWhere("tx.occurredAt >= :earliestSnapshotAt", {
          earliestSnapshotAt,
        })
        .andWhere("tx.occurredAt <= :atDate", { atDate });

      if (storeId) {
        txQb.andWhere("tx.storeId = :storeId", { storeId });
      }

      const transactions = await txQb.getMany();
      /**
       * ===== 5. Cộng transaction theo từng store
       * Mỗi store có mốc snapshot riêng, nếu không có thì tính từ new Date(0)
       */
      transactions.forEach((tx) => {
        const snapshotForStore = snapshotMap.get(tx.storeId);
        const snapshotAt = snapshotForStore
          ? snapshotForStore.snapshotAt
          : new Date(0); // Không có snapshot cho store này, tính từ đầu

        if (tx.occurredAt >= snapshotAt) {
          if (tx.direction === DebtDirectionEnum.INCREASE) {
            totalAmount += tx.amount;
          } else {
            totalAmount -= tx.amount;
          }
        }
      });

      resultMap.set(side, totalAmount);
    }

    return {
      payableDebtAmount: resultMap.get(PartnerDebtSideEnum.PAYABLE) || 0,
      receivableDebtAmount: resultMap.get(PartnerDebtSideEnum.RECEIVABLE) || 0,
    };
  }
}
