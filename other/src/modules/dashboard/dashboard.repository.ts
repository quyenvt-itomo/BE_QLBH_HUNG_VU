import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import DatabaseConfig from "@/config/database";
import { Order } from "@/database/models/store/Order";
import { OrderLine } from "@/database/models/store/OrderLine";
import { Partner } from "@/database/models/Partner";
import {
  OrderTypeEnum,
  OrderStatusEnum,
  PartnerTypeEnum,
  InventoryTransactionType,
  InventoryRefTypeEnum,
  FundTypeEnum,
  FundTransactionType,
  IncomeExpenseTypeEnum,
  DebtDirectionEnum,
  PartnerDebtSideEnum,
  DebtRefTypeEnum,
  AttributeTypeEnum,
} from "@/shared/constants/enum";
import {
  SalesMetrics,
  PurchaseMetrics,
  PartnerMetrics,
  RevenueByDate,
  IncomeExpenseByDate,
  CategoryRevenue,
  TopSellingProduct,
  TopCustomer,
  TopSupplier,
  FundMetrics,
  IncomeExpenseMetrics,
  InventoryMetrics,
  DebtMetrics,
  StoreMetrics,
  StoreRevenue,
  ExpenseBreakdown,
  LowStockProduct,
  TopDebtCustomer,
  RevenueByEmployee,
  RevenueByStore,
  RevenueByCategory,
  TopProduct,
  ProductMetrics,
  DeadStockProduct,
  ProductDetailMetrics,
} from "./dashboard.interface";
import { FileHelper } from "@/shared/utils/file.helper";
import { InventoryTransaction } from "@/database/models/store/InventoryTransaction";
import { Fund } from "@/database/models/Fund";
import {
  FUND_TRANSACTION_TYPES,
  FundTransactionRecalculate,
  FundTransactionService,
} from "../fundTransaction";
import { IncomeExpense } from "@/database/models/store/IncomeExpense";
import {
  INVENTORY_TYPES,
  InventoryRecalculateService,
  InventoryService,
} from "../inventory";
import { Product } from "@/database/models/Product";
import { ProductVariant } from "@/database/models/ProductVariant";
import {
  PARTNER_DEBT_TYPES,
  PartnerDebtRecalculateService,
  PartnerDebtService,
} from "../partnerDebt";
import {
  VAT_DEBT_TYPES,
  VatDebtRecalculateService,
  VatDebtService,
} from "../vatDebt";
import dayjs from "dayjs";
import { PartnerDebtTransaction } from "@/database/models/store/PartnerDebtTransaction";
import { VatDebtTransaction } from "@/database/models/store/VatDebtTransaction";
import { Store } from "@/database/models/Store";
import { StoreTransfer } from "@/database/models/StoreTransfer";
import { OrderSnapshot } from "../order";
import { Attribute } from "@/database/models/Attribute";
import { ATTRIBUTE_TYPES, AttributeRepository } from "../attribute";
import { Employee } from "@/database/models/store/Employee";
import { FundAdjustment } from "@/database/models/FundAdjustment";
import { PartnerDebtAdjustment } from "@/database/models/store/PartnerDebtAdjustment";
import { InventoryAdjustment } from "@/database/models/store/InventoryAdjustment";
import { config } from "@/config/env";

@injectable()
export class DashboardRepository {
  private get dataSource(): DataSource {
    return DatabaseConfig;
  }

  private async getInventoryClosingSummary(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<{ closingQty: number; closingAmount: number }> {
    let excludedTransferIds: string[] = [];

    if (storeId) {
      const transfers = await this.dataSource
        .createQueryBuilder(StoreTransfer, "t")
        .select("t.id", "id")
        .where('t."occurredAt" BETWEEN :startAt AND :endAt', {
          startAt,
          endAt,
        })
        .andWhere('t."fromStoreId" = :storeId', { storeId })
        .andWhere('t."toStoreId" = :storeId', { storeId })
        .getRawMany<{ id: string }>();

      excludedTransferIds = transfers.map((t) => t.id);
    }

    let snapshotSubquery = `
      SELECT DISTINCT ON (sn."productVariantId")
        sn."productVariantId" as "productVariantId",
        sn.quantity as "snapshotQuantity",
        sn.amount as "snapshotAmount",
        sn."snapshotAt" as "snapshotAt"
      FROM inventory_snapshots sn
      WHERE sn."snapshotAt" <= :snapStartAt
    `;

    if (storeId) {
      snapshotSubquery += ` AND sn."storeId" = :snapStoreId`;
    }

    snapshotSubquery += `
      ORDER BY sn."productVariantId", sn."snapshotAt" DESC
    `;

    const mainQb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "t")
      .innerJoin(
        ProductVariant,
        "pv",
        'pv.id = t."productVariantId" AND pv."deletedAt" IS NULL',
      )
      .innerJoin(
        Product,
        "p",
        'p.id = pv."productId" AND p."deletedAt" IS NULL',
      )
      .leftJoin(
        "(" + snapshotSubquery + ")",
        "s",
        's."productVariantId" = t."productVariantId"',
      )
      .select('t."productVariantId"', "productVariantId")
      .addSelect(
        `
        COALESCE(MAX(s."snapshotQuantity"), 0)
        +
        COALESCE(SUM(
          CASE
            WHEN t."occurredAt" <= :endAt
            AND (
              s."snapshotAt" IS NULL
              OR t."occurredAt" >= s."snapshotAt"
            )
            THEN
              CASE
                WHEN t.type = :typeIn THEN t.quantity
                ELSE -t.quantity
              END
          END
        ), 0)::float
      `,
        "closingQty",
      )
      .addSelect(
        `
        COALESCE(MAX(s."snapshotAmount"), 0)
        +
        COALESCE(SUM(
          CASE
            WHEN t."occurredAt" <= :endAt
            AND (
              s."snapshotAt" IS NULL
              OR t."occurredAt" >= s."snapshotAt"
            )
            THEN
              CASE
                WHEN t.type = :typeIn THEN t.amount
                ELSE -t.amount
              END
          END
        ), 0)::float
      `,
        "closingAmount",
      )
      .groupBy('t."productVariantId"')
      .setParameters({
        endAt,
        typeIn: InventoryTransactionType.IN,
        snapStartAt: startAt,
      });

    if (storeId) {
      mainQb
        .andWhere('t."storeId" = :storeId', { storeId })
        .setParameter("snapStoreId", storeId);
    }

    if (excludedTransferIds.length > 0) {
      mainQb.andWhere(
        'NOT (t."refType" = :refTypeTransfer AND t."refId" IN (:...excludedTransferIds))',
        {
          refTypeTransfer: InventoryRefTypeEnum.TRANSFER,
          excludedTransferIds,
        },
      );
    }

    const summary = await this.dataSource
      .createQueryBuilder()
      .select('COALESCE(SUM("closingQty"), 0)::float', "closingQty")
      .addSelect('COALESCE(SUM("closingAmount"), 0)::float', "closingAmount")
      .from("(" + mainQb.getQuery() + ")", "stock")
      .setParameters(mainQb.getParameters())
      .getRawOne<{ closingQty: string; closingAmount: string }>();

    return {
      closingQty: Number(summary?.closingQty || 0),
      closingAmount: Number(summary?.closingAmount || 0),
    };
  }

  constructor(
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    private attributeRepository: AttributeRepository,
    @inject(FUND_TRANSACTION_TYPES.FundTransactionRecalculate)
    private fundTransactionRecalculate: FundTransactionRecalculate,
    @inject(FUND_TRANSACTION_TYPES.FundTransactionService)
    private fundTransactionService: FundTransactionService,
    @inject(INVENTORY_TYPES.InventoryRecalculateService)
    private inventoryRecalculateService: InventoryRecalculateService,
    @inject(INVENTORY_TYPES.InventoryService)
    private inventoryService: InventoryService,
    @inject(PARTNER_DEBT_TYPES.PartnerDebtRecalculateService)
    private partnerDebtRecalculateService: PartnerDebtRecalculateService,
    @inject(PARTNER_DEBT_TYPES.PartnerDebtService)
    private partnerDebtService: PartnerDebtService,
    @inject(VAT_DEBT_TYPES.VatDebtRecalculateService)
    private vatDebtRecalculateService: VatDebtRecalculateService,
    @inject(VAT_DEBT_TYPES.VatDebtService)
    private vatDebtService: VatDebtService,
  ) {}

  async getPurchaseMetrics(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<PurchaseMetrics> {
    let qb = this.dataSource
      .createQueryBuilder(Order, "o")
      .where("o.type = :type", { type: OrderTypeEnum.PURCHASE })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt });

    if (storeId) {
      qb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const orders = await qb
      .select([
        'SUM(o."totalAmount") as "totalPurchaseAmount"',
        'SUM(o."taxAmount") as "totalPurchaseTax"',
        'COUNT(o.id) as "totalPurchaseOrders"',
      ])
      .getRawOne();

    // Query for purchase return orders
    let returnQb = this.dataSource
      .createQueryBuilder(Order, "o")
      .where("o.type = :type", { type: OrderTypeEnum.PURCHASE_RETURN })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt });

    if (storeId) {
      returnQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const returnOrders = await returnQb
      .select([
        'SUM(o."totalAmount") as "totalReturnAmount"',
        'SUM(o."taxAmount") as "totalReturnTax"',
        'COUNT(o.id) as "totalReturnOrders"',
      ])
      .getRawOne();

    const totalPurchaseAmount = Number(orders?.totalPurchaseAmount || 0);
    const totalReturnAmount = Number(returnOrders?.totalReturnAmount || 0);
    const totalPurchaseTax = Number(orders?.totalPurchaseTax || 0);
    const totalReturnTax = Number(returnOrders?.totalReturnTax || 0);
    const totalPurchaseOrders = Number(orders?.totalPurchaseOrders || 0);
    const totalReturnOrders = Number(returnOrders?.totalReturnOrders || 0);

    // Net values (after returns)
    const netPurchaseAmount = totalPurchaseAmount - totalReturnAmount;
    const netPurchaseTax = totalPurchaseTax - totalReturnTax;
    const netPurchaseOrders = totalPurchaseOrders + totalReturnOrders;

    const avgPurchaseOrderValue =
      netPurchaseOrders > 0 ? netPurchaseAmount / netPurchaseOrders : 0;

    return {
      totalPurchaseAmount: netPurchaseAmount,
      purchaseGrowth: 0,
      totalPurchaseTax: netPurchaseTax,
      purchaseTaxGrowth: 0,
      totalPurchaseOrders: netPurchaseOrders,
      purchaseOrderGrowth: 0,
      avgPurchaseOrderValue,
      avgPurchaseOrderValueGrowth: 0,
    };
  }

  // * DONE
  // ============= Partner Stats =============
  async getPartnerStats(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<PartnerMetrics> {
    const countPartnerByType = async (type: PartnerTypeEnum) => {
      const result = await this.dataSource
        .getRepository(Partner)
        .createQueryBuilder("p")
        .select("COUNT(DISTINCT p.id)", "total")
        .where("p.type = :type", { type })
        .orWhere(
          `
          EXISTS (
            SELECT 1
            FROM partner_sub_types pst
            WHERE pst."partnerId" = p.id
              AND pst.type::text = :type::text
          )
        `,
        )
        .getRawOne<{ total: string }>();

      return Number(result?.total || 0);
    };
    const countActivePartners = async (orderType: OrderTypeEnum) => {
      const qb = this.dataSource
        .getRepository(Order)
        .createQueryBuilder("o")
        .select("COUNT(DISTINCT o.partnerId)", "total")
        .where("o.type = :orderType", { orderType })
        .andWhere('o."status" = :postedStatus', {
          postedStatus: OrderStatusEnum.POSTED,
        })
        .andWhere("o.createdAt BETWEEN :startAt AND :endAt", {
          startAt,
          endAt,
        });
      if (storeId) {
        qb.andWhere('o."storeId" = :storeId', { storeId });
      }
      const result = await qb.getRawOne<{ total: string }>();

      return Number(result?.total || 0);
    };
    const countNewPartners = async (type: PartnerTypeEnum) => {
      const qb = this.dataSource
        .getRepository(Partner)
        .createQueryBuilder("p")
        .select("COUNT(DISTINCT p.id)", "total")
        .where("p.type = :type", { type })
        .andWhere("p.createdAt BETWEEN :startAt AND :endAt", {
          startAt,
          endAt,
        });
      const result = await qb.getRawOne<{ total: string }>();

      return Number(result?.total || 0);
    };
    const countReturningCustomers = async () => {
      const result = await this.dataSource
        .getRepository(Order)
        .createQueryBuilder("o")
        .select("COUNT(*)", "total")
        .from((qb) => {
          const cloneQb = qb
            .select("o.partnerId", "partnerId")
            .from(Order, "o")
            .where("o.type = :type", { type: OrderTypeEnum.SALE })
            .andWhere('o."status" = :postedStatus', {
              postedStatus: OrderStatusEnum.POSTED,
            });
          if (storeId) {
            cloneQb.andWhere('o."storeId" = :storeId', { storeId });
          }
          return cloneQb.groupBy("o.partnerId").having("COUNT(o.id) > 1");
        }, "t")
        .getRawOne<{ total: string }>();

      return Number(result?.total || 0);
    };
    const getOrderStats = async (type: OrderTypeEnum) => {
      const qb = this.dataSource
        .getRepository(Order)
        .createQueryBuilder("o")
        .select("COUNT(o.id)", "totalOrders")
        .addSelect("COALESCE(SUM(o.totalAmount), 0)", "totalRevenue")
        .where("o.type = :type", { type })
        .andWhere('o."status" = :postedStatus', {
          postedStatus: OrderStatusEnum.POSTED,
        });
      if (storeId) {
        qb.andWhere('o."storeId" = :storeId', { storeId });
      }
      const result = await qb.getRawOne<{
        totalOrders: string;
        totalRevenue: string;
      }>();

      return {
        totalOrders: Number(result?.totalOrders || 0),
        totalRevenue: Number(result?.totalRevenue || 0),
      };
    };

    const [
      totalCustomers,
      totalSuppliers,
      totalShippers,

      activeCustomers,
      activeSuppliers,

      newCustomers,
      newSuppliers,

      returningCustomers,

      saleStats,
      purchaseStats,
    ] = await Promise.all([
      countPartnerByType(PartnerTypeEnum.CUSTOMER),
      countPartnerByType(PartnerTypeEnum.SUPPLIER),
      countPartnerByType(PartnerTypeEnum.SHIPPER),

      countActivePartners(OrderTypeEnum.SALE),
      countActivePartners(OrderTypeEnum.PURCHASE),

      countNewPartners(PartnerTypeEnum.CUSTOMER),
      countNewPartners(PartnerTypeEnum.SUPPLIER),

      countReturningCustomers(),

      getOrderStats(OrderTypeEnum.SALE),
      getOrderStats(OrderTypeEnum.PURCHASE),
    ]);

    const customerRetentionRate =
      totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    const customerChurnRate =
      totalCustomers > 0
        ? ((totalCustomers - returningCustomers) / totalCustomers) * 100
        : 0;

    const avgCustomerLifetimeValue =
      totalCustomers > 0 ? saleStats.totalRevenue / totalCustomers : 0;

    const avgOrdersPerCustomer =
      activeCustomers > 0 ? saleStats.totalOrders / activeCustomers : 0;

    const avgOrdersPerSupplier =
      activeSuppliers > 0 ? purchaseStats.totalOrders / activeSuppliers : 0;

    return {
      // === CUSTOMER ===
      totalCustomers,
      activeCustomers,
      newCustomers,
      returningCustomers,
      customerRetentionRate,
      customerChurnRate,
      avgCustomerLifetimeValue,
      avgOrdersPerCustomer,

      // === SUPPLIER ===
      totalSuppliers,
      activeSuppliers,
      newSuppliers,
      avgOrdersPerSupplier,

      // === SHIPPER ===
      totalShippers,
      activeShippers: 0, // TODO: nếu có order.shipperId

      // === GROWTH ===
      customerGrowth: 0, // cần dữ liệu kỳ trước
      supplierGrowth: 0,
    };
  }

  // ============= Revenue By Date =============
  async getRevenueByDate(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<RevenueByDate[]> {
    // Query for SALE orders
    let qb = this.dataSource
      .createQueryBuilder(Order, "o")
      .select([
        'DATE(o."orderAt") as date',
        'SUM(o."netAmount") as revenue',
        "COUNT(o.id) as orders",
      ])
      .where("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .groupBy('DATE(o."orderAt")')
      .orderBy('DATE(o."orderAt")', "ASC");

    if (storeId) {
      qb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const saleResults = await qb.getRawMany();

    // Query for SALE_RETURN orders
    let returnQb = this.dataSource
      .createQueryBuilder(Order, "o")
      .select([
        'DATE(o."orderAt") as date',
        'SUM(o."netAmount") as returnRevenue',
        "COUNT(o.id) as returnOrders",
      ])
      .where("o.type = :type", { type: OrderTypeEnum.SALE_RETURN })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .groupBy('DATE(o."orderAt")')
      .orderBy('DATE(o."orderAt")', "ASC");

    if (storeId) {
      returnQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const returnResults = await returnQb.getRawMany();

    // Query inventory transactions for cost (SALE)
    let costQb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .select(['DATE(it."occurredAt") as date', 'SUM(it."amount") as cost'])
      .where('it."occurredAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere("it.type = :type", { type: InventoryTransactionType.OUT })
      .andWhere("it.refType = :refType", {
        refType: InventoryRefTypeEnum.SALE,
      })
      .groupBy('DATE(it."occurredAt")')
      .orderBy('DATE(it."occurredAt")', "ASC");

    if (storeId) {
      costQb.andWhere('it."storeId" = :storeId', { storeId });
    }

    const costResults = await costQb.getRawMany();

    // Query inventory transactions for return cost (SALE_RETURN)
    let returnCostQb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .select([
        'DATE(it."occurredAt") as date',
        'SUM(it."amount") as returnCost',
      ])
      .where('it."occurredAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere("it.type = :type", { type: InventoryTransactionType.IN })
      .andWhere("it.refType = :refType", {
        refType: InventoryRefTypeEnum.SALE_RETURN,
      })
      .groupBy('DATE(it."occurredAt")')
      .orderBy('DATE(it."occurredAt")', "ASC");

    if (storeId) {
      returnCostQb.andWhere('it."storeId" = :storeId', { storeId });
    }

    const returnCostResults = await returnCostQb.getRawMany();

    // Query product sold quantity by date (SALE only)
    let soldQtyQb = this.dataSource
      .createQueryBuilder(OrderLine, "ol")
      .leftJoin("ol.order", "o")
      .select([
        'DATE(o."orderAt") as date',
        'COALESCE(SUM(ol.quantity), 0) as "productsSold"',
      ])
      .where("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .groupBy('DATE(o."orderAt")')
      .orderBy('DATE(o."orderAt")', "ASC");

    if (storeId) {
      soldQtyQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const soldQtyResults = await soldQtyQb.getRawMany();

    // Merge all results by date
    const dateMap = new Map<
      string,
      {
        revenue: number;
        returnRevenue: number;
        cost: number;
        returnCost: number;
        orders: number;
        returnOrders: number;
        productsSold: number;
      }
    >();

    // Initialize with sale results
    saleResults.forEach((r) => {
      dateMap.set(r.date, {
        revenue: Number(r.revenue || 0),
        returnRevenue: 0,
        cost: 0,
        returnCost: 0,
        orders: Number(r.orders || 0),
        returnOrders: 0,
        productsSold: 0,
      });
    });

    // Add return results
    returnResults.forEach((r) => {
      const existing = dateMap.get(r.date) || {
        revenue: 0,
        returnRevenue: 0,
        cost: 0,
        returnCost: 0,
        orders: 0,
        returnOrders: 0,
        productsSold: 0,
      };
      existing.returnRevenue = Number(r.returnRevenue || 0);
      existing.returnOrders = Number(r.returnOrders || 0);
      dateMap.set(r.date, existing);
    });

    // Add cost results
    costResults.forEach((r) => {
      const existing = dateMap.get(r.date);
      if (existing) {
        existing.cost = Number(r.cost || 0);
      }
    });

    // Add return cost results
    returnCostResults.forEach((r) => {
      const existing = dateMap.get(r.date);
      if (existing) {
        existing.returnCost = Number(r.returnCost || 0);
      }
    });

    // Add sold quantity results
    soldQtyResults.forEach((r) => {
      const existing = dateMap.get(r.date) || {
        revenue: 0,
        returnRevenue: 0,
        cost: 0,
        returnCost: 0,
        orders: 0,
        returnOrders: 0,
        productsSold: 0,
      };
      existing.productsSold = Number(r.productsSold || 0);
      dateMap.set(r.date, existing);
    });

    // Convert to array and calculate net values
    const results: RevenueByDate[] = [];
    dateMap.forEach((value, date) => {
      const netRevenue = value.revenue - value.returnRevenue;
      const netCost = value.cost - value.returnCost;
      const netOrders = value.orders + value.returnOrders;
      const profit = netRevenue - netCost;
      const avgOrderValue = netOrders > 0 ? netRevenue / netOrders : 0;

      results.push({
        date,
        revenue: netRevenue,
        cost: netCost,
        profit,
        orders: netOrders,
        avgOrderValue,
        productsSold: value.productsSold,
      });
    });

    // Sort by date
    results.sort((a, b) => a.date.localeCompare(b.date));

    return results;
  }

  // * DONE
  // ============ Fund Metrics =============
  async getFundMetrics(startAt: Date, endAt: Date): Promise<FundMetrics> {
    let cashBalance: number = 0;
    let bankBalance: number = 0;
    let cashInflow: number = 0;
    let cashOutflow: number = 0;

    const cashFunds = await this.dataSource
      .createQueryBuilder(Fund, "f")
      .where("f.type = :type", { type: FundTypeEnum.CASH })
      .getRawMany();
    const bankFunds = await this.dataSource
      .createQueryBuilder(Fund, "f")
      .where("f.type = :type", { type: FundTypeEnum.BANK })
      .getRawMany();

    for (const fund of cashFunds) {
      const balance = await this.fundTransactionRecalculate.getBalanceAtDate(
        fund.id,
        endAt,
        this.dataSource.manager,
      );
      cashBalance += balance;
    }
    for (const fund of bankFunds) {
      const balance = await this.fundTransactionRecalculate.getBalanceAtDate(
        fund.id,
        endAt,
        this.dataSource.manager,
      );
      bankBalance += balance;
    }

    const flowData = await this.fundTransactionService.calculateFundBalance(
      [...cashFunds, ...bankFunds].map((f) => f.id),
      startAt,
      endAt,
    );

    flowData.forEach(({ increaseAmount, decreaseAmount }) => {
      cashInflow += increaseAmount;
      cashOutflow += decreaseAmount;
    });

    const totalFundBalance = cashBalance + bankBalance;
    const netCashFlow = cashInflow - cashOutflow;

    return {
      totalFundBalance,
      fundBalanceGrowth: 0,
      cashBalance,
      cashBalanceGrowth: 0,
      bankBalance,
      bankBalanceGrowth: 0,
      cashInflow,
      cashInflowGrowth: 0,
      cashOutflow,
      cashOutflowGrowth: 0,
      netCashFlow,
      netCashFlowGrowth: 0,
    };
  }

  // * DONE
  // ============= Income Expense Metrics =============
  async getIncomeExpenseMetrics(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<IncomeExpenseMetrics> {
    const qb = this.dataSource
      .createQueryBuilder(IncomeExpense, "ie")
      .where('ie."occurredAt" BETWEEN :startAt AND :endAt', { startAt, endAt });
    if (storeId) {
      qb.andWhere('ie."storeId" = :storeId', { storeId });
    }
    // tính
    // tổng chi, tổng thu, tổng chi khác (không theo partner), tổng thu khác (không theo partner)
    // phân biệt theo type IncomeExpenseTypeEnum
    const result = await qb
      .select([
        'SUM(CASE WHEN ie.type = :income THEN ie.amount ELSE 0 END) as "totalIncome"',
        'SUM(CASE WHEN ie.type = :expense THEN ie.amount ELSE 0 END) as "totalExpense"',
        'SUM(CASE WHEN ie.type = :income AND ie."partnerId" IS NULL THEN ie.amount ELSE 0 END) as "totalGeneralExpense"',
        'SUM(CASE WHEN ie.type = :expense AND ie."partnerId" IS NULL THEN ie.amount ELSE 0 END) as "totalGeneralIncome"',
      ])
      .setParameters({
        income: IncomeExpenseTypeEnum.INCOME,
        expense: IncomeExpenseTypeEnum.EXPENSE,
      })
      .getRawOne();

    const totalIncome = Number(result?.totalIncome || 0);
    const totalExpense = Number(result?.totalExpense || 0);
    const netIncomeExpense = totalIncome - totalExpense;
    const totalGeneralIncome = Number(result?.totalGeneralIncome || 0);
    const totalGeneralExpense = Number(result?.totalGeneralExpense || 0);

    return {
      totalIncome,
      incomeGrowth: 0,
      totalExpense,
      expenseGrowth: 0,
      netIncomeExpense,
      netIncomeExpenseGrowth: 0,
      totalGeneralIncome,
      generalIncomeGrowth: 0,
      totalGeneralExpense,
      generalExpenseGrowth: 0,
    };
  }

  // ============= Income Expense By Date =============
  async getIncomeExpenseByDate(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<IncomeExpenseByDate[]> {
    // TODO: Query from IncomeExpense and FundTransaction tables
    return [];
  }

  // * DONE
  // ============= Category Revenue =============
  async getCategoryRevenue(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<CategoryRevenue[]> {
    let qb = this.dataSource
      .createQueryBuilder(OrderLine, "ol")
      .leftJoin("ol.order", "o")
      .select([
        "ol.\"productVariantSnapshot\" -> 'product' -> 'category' ->> 'id' as \"categoryId\"",
        "ol.\"productVariantSnapshot\" -> 'product' -> 'category' ->> 'name' as \"categoryName\"",
        'SUM(ol."totalAmount") as revenue',
        'SUM(ol."netAmount") as cost',
        'SUM(ol.quantity) as "soldQuantity"',
      ])
      .where("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .groupBy(
        "ol.\"productVariantSnapshot\" -> 'product' -> 'category' ->> 'id', ol.\"productVariantSnapshot\" -> 'product' -> 'category' ->> 'name'",
      )
      .orderBy("revenue", "DESC");

    if (storeId) {
      qb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const results = await qb.getRawMany();

    // Calculate total for percentage
    const totalRevenue = results.reduce(
      (sum, r) => sum + Number(r.revenue || 0),
      0,
    );

    return results.map((r) => {
      const revenue = Number(r.revenue || 0);
      const cost = Number(r.cost || 0);
      const profit = revenue - cost;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
      const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

      return {
        id: r.categoryId || "unknown",
        name: r.categoryName || "Unknown",
        revenue,
        cost,
        profit,
        profitMargin,
        percentage,
        soldQuantity: Number(r.soldQuantity || 0),
      };
    });
  }

  // * DONE
  // ============= Top Selling Products =============
  async getTopSellingProducts(
    startAt: Date,
    endAt: Date,
    storeId: string | undefined,
    limit: number,
  ): Promise<TopSellingProduct[]> {
    let qb = this.dataSource
      .createQueryBuilder(OrderLine, "ol")
      .leftJoin("ol.order", "o")
      .select([
        "ol.\"productVariantSnapshot\" -> 'product' ->> 'id' as \"productId\"",
        "ol.\"productVariantSnapshot\" -> 'product' ->> 'name' as \"productName\"",
        "ol.\"productVariantSnapshot\" -> 'product' ->> 'code' as \"productCode\"",
        "ol.\"productVariantSnapshot\" -> 'product' -> 'category' ->> 'name' as \"categoryName\"",
        'SUM(ol.quantity) as "soldQuantity"',
        'SUM(ol."totalAmount") as revenue',
        'SUM(ol."netAmount") as cost',
      ])
      .where("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .groupBy(
        "ol.\"productVariantSnapshot\" -> 'product' ->> 'id', ol.\"productVariantSnapshot\" -> 'product' ->> 'name', ol.\"productVariantSnapshot\" -> 'product' ->> 'code', ol.\"productVariantSnapshot\" -> 'product' -> 'category' ->> 'name'",
      )
      .orderBy('"soldQuantity"', "DESC")
      .limit(limit);

    if (storeId) {
      qb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const results = await qb.getRawMany();

    return await FileHelper.attachFilesToEntities(
      results.map((r) => {
        const revenue = Number(r.revenue || 0);
        const cost = Number(r.cost || 0);
        const profit = revenue - cost;
        const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return {
          id: r.productId || "unknown",
          name: r.productName || "Unknown",
          code: r.productCode || "",
          categoryName: r.categoryName || "Unknown",
          soldQuantity: Number(r.soldQuantity || 0),
          revenue,
          profit,
          profitMargin,
          stockQty: 0, // TODO: Get from inventory
        };
      }),
    );
  }

  // * DONE
  // ============= Top Customers =============
  async getTopCustomers(
    startAt: Date,
    endAt: Date,
    storeId: string | undefined,
    limit: number,
  ): Promise<TopCustomer[]> {
    let qb = this.dataSource
      .createQueryBuilder(Order, "o")
      .leftJoin("o.partner", "p")
      .select([
        'o."partnerId" as "partnerId"',
        'p.name as "partnerName"',
        'p.code as "partnerCode"',
        'COUNT(o.id) as "orderCount"',
        'SUM(o."totalAmount") as "totalRevenue"',
        'MAX(o."orderAt") as "lastOrderDate"',
      ])
      .where("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."partnerId" IS NOT NULL')
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .groupBy('o."partnerId", p.name, p.code')
      .orderBy('"totalRevenue"', "DESC")
      .limit(limit);

    if (storeId) {
      qb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const results = await qb.getRawMany();

    const finalResult: TopCustomer[] = [];

    for (const r of results) {
      const orderCount = Number(r.orderCount || 0);
      const totalRevenue = Number(r.totalRevenue || 0);

      finalResult.push({
        id: r.partnerId || "",
        name: r.partnerName || "Unknown",
        code: r.partnerCode || "",
        orders: orderCount,
        revenue: totalRevenue,
      });
    }

    return await FileHelper.attachFilesToEntities(finalResult);
  }

  // * DONE
  // ============= Top Suppliers =============
  async getTopSuppliers(
    startAt: Date,
    endAt: Date,
    storeId: string | undefined,
    limit: number,
  ): Promise<TopSupplier[]> {
    let qb = this.dataSource
      .createQueryBuilder(Order, "o")
      .leftJoin("o.partner", "p")
      .select([
        'o."partnerId" as "partnerId"',
        'p.name as "partnerName"',
        'p.code as "partnerCode"',
        'COUNT(o.id) as "orderCount"',
        'SUM(o."totalAmount") as "totalPurchase"',
        'MAX(o."orderAt") as "lastOrderDate"',
      ])
      .where("o.type = :type", { type: OrderTypeEnum.PURCHASE })
      .andWhere('o."partnerId" IS NOT NULL')
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .groupBy('o."partnerId", p.name, p.code')
      .orderBy('"totalPurchase"', "DESC")
      .limit(limit);

    if (storeId) {
      qb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const results = await qb.getRawMany();

    const finalResult: TopSupplier[] = [];

    for (const r of results) {
      const orderCount = Number(r.orderCount || 0);
      const totalPurchase = Number(r.totalPurchase || 0);
      const avgOrderValue = orderCount > 0 ? totalPurchase / orderCount : 0;

      const debtAmount =
        await this.partnerDebtRecalculateService.getDebtAtDateBySide(
          PartnerDebtSideEnum.PAYABLE,
          r.partnerId,
          endAt,
          this.dataSource.manager,
          storeId,
        );

      finalResult.push({
        id: r.partnerId || "",
        name: r.partnerName || "Unknown",
        code: r.partnerCode || "",
        orderCount: orderCount,
        totalPurchase,
        avgOrderValue,
        lastOrderDate: r.lastOrderDate || "",
        debtAmount,
      });
    }

    return await FileHelper.attachFilesToEntities(finalResult);
  }

  // * DONE
  // ============= Inventory Metrics =============
  async getInventoryMetrics(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<InventoryMetrics> {
    const {
      closingQty = 0,
      closingAmount = 0,
      outOfStockItems = 0,
      lowStockItems = 0,
      overstockItems = 0,
    } = (
      await this.inventoryService.getStockReport({
        startAt,
        endAt,
        storeId,
      } as any)
    ).summary || {};

    // tính tổng sản phẩm, tổng biến thể có createAt <= endAt
    const totalProducts = await this.dataSource
      .createQueryBuilder()
      .from(Product, "p")
      .where('p."createdAt" <= :endAt', { endAt })
      .getCount();
    const totalVariants = await this.dataSource
      .createQueryBuilder()
      .from(ProductVariant, "pv")
      .where('pv."createdAt" <= :endAt', { endAt })
      .getCount();

    const adjustmentQb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .where('it."occurredAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere("it.refType = :refType", {
        refType: InventoryRefTypeEnum.ADJUST,
      });
    if (storeId) {
      adjustmentQb.andWhere('it."storeId" = :storeId', { storeId });
    }

    const adjustmentResult = await adjustmentQb
      .select([
        'SUM(CASE WHEN it.type = :in THEN it.quantity WHEN it.type = :out THEN -it.quantity ELSE 0 END) as "totalAdjustmentQty"',
        'SUM(CASE WHEN it.type = :in THEN it.amount WHEN it.type = :out THEN -it.amount ELSE 0 END) as "totalAdjustmentValue"',
        'COUNT(CASE WHEN it.type = :in THEN 1 END) as "positiveAdjustments"',
        'COUNT(CASE WHEN it.type = :out THEN 1 END) as "negativeAdjustments"',
      ])
      .setParameters({
        in: InventoryTransactionType.IN,
        out: InventoryTransactionType.OUT,
      })
      .getRawOne();
    const totalAdjustmentValue = Number(
      adjustmentResult?.totalAdjustmentValue || 0,
    );
    const totalAdjustmentQty = Number(
      adjustmentResult?.totalAdjustmentQty || 0,
    );
    const positiveAdjustments = Number(
      adjustmentResult?.positiveAdjustments || 0,
    );
    const negativeAdjustments = Number(
      adjustmentResult?.negativeAdjustments || 0,
    );

    return {
      totalInventoryValue: closingAmount,
      inventoryValueGrowth: 0,
      totalStockQty: closingQty,
      stockQtyGrowth: 0,
      totalProducts,
      productsGrowth: 0,
      totalVariants,
      variantsGrowth: 0,
      outOfStockItems,
      outOfStockItemsGrowth: 0,
      lowStockItems,
      lowStockItemsGrowth: 0,
      overstockItems,
      overstockItemsGrowth: 0,
      totalAdjustmentValue,
      adjustmentValueGrowth: 0,
      totalAdjustmentQty,
      adjustmentQtyGrowth: 0,
      positiveAdjustments,
      negativeAdjustments,
    };
  }

  // * DONE
  // ============= Debt Metrics =============
  async getDebtMetrics(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<DebtMetrics> {
    const { closingAmount: totalReceivable = 0 } =
      (
        await this.partnerDebtService.getPartnerDebtReport({
          side: PartnerDebtSideEnum.RECEIVABLE,
          storeId,
          endAt,
          startAt: dayjs(endAt).subtract(1, "minute").toDate(),
        } as any)
      ).summary || {};
    const { closingAmount: totalPayable = 0 } =
      (
        await this.partnerDebtService.getPartnerDebtReport({
          side: PartnerDebtSideEnum.PAYABLE,
          storeId,
          endAt,
          startAt: dayjs(endAt).subtract(1, "minute").toDate(),
        } as any)
      ).summary || {};
    const netDebt = totalReceivable - totalPayable;

    const partnerDebtAdjustmentQb = this.dataSource
      .createQueryBuilder(PartnerDebtTransaction, "pdt")
      .where('pdt."occurredAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere("pdt.refType = :refType", {
        refType: DebtRefTypeEnum.ADJUSTMENT,
      });
    if (storeId) {
      partnerDebtAdjustmentQb.andWhere('pdt."storeId" = :storeId', { storeId });
    }

    const partnerDebtAdjustmentResult = await partnerDebtAdjustmentQb
      .select([
        `
          SUM(
            CASE
              WHEN pdt.side = :receivableSide AND pdt.direction = :increase THEN pdt.amount
              WHEN pdt.side = :receivableSide AND pdt.direction = :decrease THEN -pdt.amount
              ELSE 0
            END
          ) as "receiableDebtAdjustmentValue"
          `,
        `
          SUM(
            CASE
              WHEN pdt.side = :payableSide AND pdt.direction = :decrease THEN pdt.amount
              WHEN pdt.side = :payableSide AND pdt.direction = :increase THEN -pdt.amount
              ELSE 0
            END
          ) as "payableDebtAdjustmentValue"
          `,
        `
        COUNT(*) AS "debtAdjustmentCount"
        `,
      ])
      .setParameters({
        increase: DebtDirectionEnum.INCREASE,
        decrease: DebtDirectionEnum.DECREASE,
        receivableSide: PartnerDebtSideEnum.RECEIVABLE,
        payableSide: PartnerDebtSideEnum.PAYABLE,
      })
      .getRawOne();

    const receiableDebtAdjustmentValue = Number(
      partnerDebtAdjustmentResult?.receiableDebtAdjustmentValue || 0,
    );
    const payableDebtAdjustmentValue = Number(
      partnerDebtAdjustmentResult?.payableDebtAdjustmentValue || 0,
    );
    const debtAdjustmentCount = Number(
      partnerDebtAdjustmentResult?.debtAdjustmentCount || 0,
    );

    const { closingAmount: vatPayable = 0 } =
      (
        await this.vatDebtService.getVatDebtReport({
          storeId,
          endAt,
          startAt: dayjs(endAt).subtract(1, "minute").toDate(),
        } as any)
      ).summary || {};

    const vatDebtAdjustmentQb = this.dataSource
      .createQueryBuilder(VatDebtTransaction, "vdt")
      .where('vdt."occurredAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere("vdt.refType = :refType", {
        refType: DebtRefTypeEnum.ADJUSTMENT,
      });
    if (storeId) {
      vatDebtAdjustmentQb.andWhere('vdt."storeId" = :storeId', { storeId });
    }

    const vatDebtAdjustmentResult = await vatDebtAdjustmentQb
      .select([
        `
          SUM(
            CASE
              WHEN vdt.direction = :increase THEN vdt.amount
              WHEN vdt.direction = :decrease THEN -vdt.amount
              ELSE 0
            END
          ) as "vatDebtAdjustmentValue"
          `,
        'COUNT(*) AS "vatDebtAdjustmentCount"',
      ])
      .setParameters({
        increase: DebtDirectionEnum.INCREASE,
        decrease: DebtDirectionEnum.DECREASE,
      })
      .getRawOne();

    const vatDebtAdjustmentValue = Number(
      vatDebtAdjustmentResult?.vatDebtAdjustmentValue || 0,
    );
    const vatDebtAdjustmentCount = Number(
      vatDebtAdjustmentResult?.vatDebtAdjustmentCount || 0,
    );

    return {
      totalReceivable,
      receivableGrowth: 0,
      totalPayable,
      payableGrowth: 0,
      vatPayable,
      vatPayableGrowth: 0,
      netDebt,
      netDebtGrowth: 0,
      debtRatio: 0,
      receiableDebtAdjustmentValue,
      receiableDebtAdjustmentValueGrowth: 0,
      payableDebtAdjustmentValue,
      payableDebtAdjustmentValueGrowth: 0,
      debtAdjustmentCount,
      debtAdjustmentCountGrowth: 0,
      vatDebtAdjustmentValue,
      vatDebtAdjustmentValueGrowth: 0,
      vatDebtAdjustmentCount,
      vatDebtAdjustmentCountGrowth: 0,
    };
  }

  // * DONE
  // ============= Store Metrics =============
  async getStoreMetrics(startAt: Date, endAt: Date): Promise<StoreMetrics> {
    const storeRepo = this.dataSource.getRepository(Store);
    const orderRepo = this.dataSource.getRepository(Order);
    const transferRepo = this.dataSource.getRepository(StoreTransfer);

    const totalStoresPromise = storeRepo.count();
    const activeStoresPromise = storeRepo.count({ where: { isActive: true } });
    const totalRevenuePromise = orderRepo
      .createQueryBuilder("o")
      .select("COALESCE(SUM(o.totalAmount), 0)", "total")
      .where("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere("o.createdAt BETWEEN :startAt AND :endAt", {
        startAt,
        endAt,
      })
      .getRawOne<{ total: string }>();

    const topStoreRevenuePromise = orderRepo
      .createQueryBuilder("o")
      .select("o.storeId", "storeId")
      .addSelect("SUM(o.totalAmount)", "total")
      .where("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere("o.createdAt BETWEEN :startAt AND :endAt", {
        startAt,
        endAt,
      })
      .groupBy("o.storeId")
      .orderBy("total", "DESC")
      .limit(1)
      .getRawOne<{ total: string }>();

    const storeTransferCountPromise = transferRepo
      .createQueryBuilder("st")
      .where("st.createdAt BETWEEN :startAt AND :endAt", { startAt, endAt })
      .getCount();

    const storeTransferValuePromise = await this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .where('it."occurredAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere("it.refType = :refType", {
        refType: InventoryRefTypeEnum.TRANSFER,
      })
      .select('SUM(it."amount") as total')
      .getRawOne<{ total: string }>();

    /**
     * 7. Resolve song song
     */
    const [
      totalStores,
      activeStores,
      totalRevenueRaw,
      topStoreRevenueRaw,
      storeTransferCount,
      storeTransferValueRaw,
    ] = await Promise.all([
      totalStoresPromise,
      activeStoresPromise,
      totalRevenuePromise,
      topStoreRevenuePromise,
      storeTransferCountPromise,
      storeTransferValuePromise,
    ]);

    const totalRevenue = Number(totalRevenueRaw?.total || 0);
    const topStoreRevenue = Number(topStoreRevenueRaw?.total || 0);
    const storeTransferValue = Number(storeTransferValueRaw?.total || 0);

    return {
      totalStores,
      activeStores,

      avgRevenuePerStore: activeStores > 0 ? totalRevenue / activeStores : 0,

      topStoreRevenue,

      storeTransferCount,
      storeTransferValue,
    };
  }

  // * DONE
  // ============= Store Revenue =============
  async getStoreRevenueByDate(
    startAt: Date,
    endAt: Date,
  ): Promise<StoreRevenue[]> {
    const results = await this.dataSource
      .createQueryBuilder(Order, "o")
      .leftJoin(Store, "s", 'o."storeId" = s.id')
      .select([
        'o."storeId" as "storeId"',
        's.name as "storeName"',
        'COUNT(o.id) as "orders"',
        'SUM(o."totalAmount") as "revenue"',
      ])
      .where("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .groupBy('o."storeId"')
      .addGroupBy("s.name")
      .orderBy("revenue", "DESC")
      .getRawMany<{
        storeId: string;
        storeName: string;
        orders: string;
        revenue: string;
      }>();

    const totalRevenue = results.reduce(
      (sum, r) => sum + Number(r.revenue || 0),
      0,
    );

    return results.map((r) => ({
      id: r.storeId,
      name: r.storeName,
      orders: Number(r.orders || 0),
      revenue: Number(r.revenue || 0),
      percentage:
        totalRevenue > 0 ? (Number(r.revenue || 0) / totalRevenue) * 100 : 0,
    }));
  }

  async getExpenseBreakdown(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<ExpenseBreakdown[]> {
    let qb = this.dataSource
      .createQueryBuilder(IncomeExpense, "ie")
      .innerJoin("ie.category", "c")
      .select([
        'c.id as "categoryId"',
        'c.name as "categoryName"',
        'SUM(ie.amount) as "totalAmount"',
      ])
      .where("ie.type = :type", { type: IncomeExpenseTypeEnum.EXPENSE })
      .andWhere('ie."occurredAt" BETWEEN :startAt AND :endAt', {
        startAt,
        endAt,
      })
      .andWhere('ie."partnerId" IS NULL');

    if (storeId) {
      qb.andWhere('ie."storeId" = :storeId', { storeId });
    }

    const results = await qb
      .groupBy("c.id")
      .addGroupBy("c.name")
      .orderBy('"totalAmount"', "DESC")
      .getRawMany<{
        categoryId: string;
        categoryName: string;
        totalAmount: string;
      }>();

    const totalExpense = results.reduce(
      (sum, r) => sum + Number(r.totalAmount || 0),
      0,
    );

    return results.map((r) => ({
      id: r.categoryId,
      name: r.categoryName,
      amount: Number(r.totalAmount || 0),
      percentage:
        totalExpense > 0
          ? (Number(r.totalAmount || 0) / totalExpense) * 100
          : 0,
    }));
  }

  // * DONE
  // ============= Low Stock Products =============
  async getLowStockProducts(
    offsetAt: Date,
    limit: number = 10,
    storeId?: string,
  ): Promise<LowStockProduct[]> {
    const thirtyDaysAgo = dayjs(offsetAt).subtract(30, "day").toDate();

    const rows = await this.dataSource.query(
      `
      WITH sales_30d AS (
        SELECT
          pv."productId" as "productId",
          COALESCE(SUM(ol.quantity), 0) as "totalSold"
        FROM order_lines ol
        INNER JOIN orders o ON o.id = ol."orderId"
        INNER JOIN product_variants pv ON pv.id = ol."productVariantId"
        WHERE o.type = 'sale'
          AND o.status = 'posted'
          AND o."orderAt" BETWEEN $1 AND $2
          ${storeId ? 'AND o."storeId" = $3' : ""}
          AND o."deletedAt" IS NULL
          AND ol."deletedAt" IS NULL
        GROUP BY pv."productId"
      )
      SELECT
        p.id,
        p.name,
        p.code,
        c.name as "categoryName",
        COALESCE(${storeId ? "(COALESCE(p.\"stockMetadata\", '{}'::jsonb)->'byStore'-> ($3::text) ->> 'qty')::numeric" : "(COALESCE(p.\"stockMetadata\", '{}'::jsonb)->'total'->> 'qty')::numeric"}, 0) as "currentStock",
        COALESCE(s."totalSold", 0) as "totalSold"
      FROM products p
      LEFT JOIN attributes c ON c.id = p."categoryId"
      LEFT JOIN sales_30d s ON s."productId" = p.id
      WHERE p."deletedAt" IS NULL
        AND COALESCE(${storeId ? "(COALESCE(p.\"stockMetadata\", '{}'::jsonb)->'byStore'-> ($3::text) ->> 'qty')::numeric" : "(COALESCE(p.\"stockMetadata\", '{}'::jsonb)->'total'->> 'qty')::numeric"}, 0) > 0
        AND COALESCE(${storeId ? "(COALESCE(p.\"stockMetadata\", '{}'::jsonb)->'byStore'-> ($3::text) ->> 'qty')::numeric" : "(COALESCE(p.\"stockMetadata\", '{}'::jsonb)->'total'->> 'qty')::numeric"}, 0) < $${storeId ? "4" : "3"}
      ORDER BY "currentStock" ASC
      LIMIT $${storeId ? "5" : "4"}
      `,
      storeId
        ? [thirtyDaysAgo, offsetAt, storeId, config.MINIMUM_STOCK_LEVEL, limit]
        : [thirtyDaysAgo, offsetAt, config.MINIMUM_STOCK_LEVEL, limit],
    );

    const lowStockProducts = rows.map((row: any) => {
      const currentStock = Number(row.currentStock || 0);
      const totalSold = Number(row.totalSold || 0);
      const avgDailySales = totalSold / 30;
      const daysUntilStockout =
        avgDailySales > 0 ? Math.floor(currentStock / avgDailySales) : 999;
      const reorderRecommendation = Math.max(
        0,
        Math.ceil(avgDailySales * 30 - currentStock),
      );

      return {
        id: row.id,
        name: row.name || "",
        code: row.code || "",
        categoryName: row.categoryName || "",
        currentStock,
        minimumStock: config.MINIMUM_STOCK_LEVEL,
        avgDailySales: Number(avgDailySales.toFixed(2)),
        daysUntilStockout,
        reorderRecommendation,
      };
    });

    return FileHelper.attachFilesToEntities(lowStockProducts);
  }

  async getTopDebtCustomers(
    endAt: Date,
    limit: number,
    storeId?: string,
  ): Promise<TopDebtCustomer[]> {
    return this.partnerDebtService.getTopDebtCustomers(endAt, limit, storeId);
  }

  // ============= Top Profitable Products =============
  async getTopProfitableProducts(
    startAt: Date,
    endAt: Date,
    limit: number = 10,
    storeId?: string,
  ): Promise<any[]> {
    const manager = this.dataSource.manager;

    // ===== Query để tính revenue và cost cho từng product variant =====
    const query = `
      WITH sale_data AS (
        -- Tính revenue từ OrderLine
        SELECT 
          ol."productVariantId",
          SUM(ol."netAmount") as revenue
        FROM order_lines ol
        INNER JOIN orders o ON o.id = ol."orderId"
        WHERE o.type = 'sale'
          AND o.status = 'posted'
          AND o."orderAt" BETWEEN $1 AND $2
          AND o."deletedAt" IS NULL
          AND ol."deletedAt" IS NULL
          ${storeId ? 'AND o."storeId" = $3' : ""}
          AND ol."productVariantId" IS NOT NULL
        GROUP BY ol."productVariantId"
      ),
      cost_data AS (
        -- Tính cost từ InventoryTransaction
        SELECT 
          it."productVariantId",
          SUM(it.amount) as cost
        FROM inventory_transactions it
        INNER JOIN orders o ON o.id = it."refId"
        WHERE it.type = '${InventoryTransactionType.OUT}'
          AND it."refType" = '${InventoryRefTypeEnum.SALE}'
          AND it."occurredAt" BETWEEN $1 AND $2
          AND o.status = 'posted'
          ${storeId ? 'AND it."storeId" = $3' : ""}
          AND it."deletedAt" IS NULL
        GROUP BY it."productVariantId"
      )
      SELECT 
        pv."productId",
        p.name,
        p.code,
        COALESCE(sd.revenue, 0) as revenue,
        COALESCE(cd.cost, 0) as cost,
        COALESCE(sd.revenue, 0) - COALESCE(cd.cost, 0) as profit,
        CASE 
          WHEN COALESCE(sd.revenue, 0) > 0 
          THEN ((COALESCE(sd.revenue, 0) - COALESCE(cd.cost, 0)) / sd.revenue * 100)
          ELSE 0
        END as "profitMargin"
      FROM product_variants pv
      INNER JOIN products p ON p.id = pv."productId"
      LEFT JOIN sale_data sd ON sd."productVariantId" = pv.id
      LEFT JOIN cost_data cd ON cd."productVariantId" = pv.id
      WHERE p."deletedAt" IS NULL
        AND (sd.revenue IS NOT NULL OR cd.cost IS NOT NULL)
      ORDER BY profit DESC
      LIMIT $${storeId ? "4" : "3"}
    `;

    const params = storeId
      ? [startAt, endAt, storeId, limit]
      : [startAt, endAt, limit];
    const rawResults = await manager.query(query, params);

    // ===== Group by productId (vì có thể có nhiều variants) =====
    const productMap = new Map<string, any>();

    rawResults.forEach((row: any) => {
      const existing = productMap.get(row.productId);
      if (!existing) {
        productMap.set(row.productId, {
          id: row.productId,
          name: row.name,
          code: row.code,
          revenue: parseFloat(row.revenue) || 0,
          cost: parseFloat(row.cost) || 0,
          profit: parseFloat(row.profit) || 0,
          profitMargin: parseFloat(row.profitMargin) || 0,
        });
      } else {
        // Cộng dồn nếu cùng product
        existing.revenue += parseFloat(row.revenue) || 0;
        existing.cost += parseFloat(row.cost) || 0;
        existing.profit += parseFloat(row.profit) || 0;
        // Tính lại profitMargin
        existing.profitMargin =
          existing.revenue > 0 ? (existing.profit / existing.revenue) * 100 : 0;
      }
    });

    // ===== Convert map to array và sort lại =====
    const products = Array.from(productMap.values())
      .sort((a, b) => b.profit - a.profit)
      .slice(0, limit);

    // ===== Attach files =====
    const productsWithFiles = await FileHelper.attachFilesToEntities(products);

    return productsWithFiles;
  }

  // ============= Overview Dashboard Methods =============

  /**
   * Get overview metrics for dashboard
   */
  async getOverviewMetrics(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalProductsSold: number;
    totalReturnOrders: number;
    totalReturnValue: number;
    totalProductsReturned: number;
  }> {
    // Query for sale orders - revenue and count (without join to avoid duplicates)
    let saleRevenueQb = this.dataSource
      .createQueryBuilder(Order, "o")
      .where("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('o."deletedAt" IS NULL');

    if (storeId) {
      saleRevenueQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const saleRevenueResult = await saleRevenueQb
      .select([
        'COALESCE(SUM(o."netAmount"), 0) as "totalSalesRevenue"',
        'COUNT(o.id) as "totalOrders"',
      ])
      .getRawOne();

    // Query for products sold (separate query to avoid duplicate aggregation)
    let saleProductsQb = this.dataSource
      .createQueryBuilder(OrderLine, "ol")
      .leftJoin("ol.order", "o")
      .where("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('o."deletedAt" IS NULL');
    if (storeId) {
      saleProductsQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const saleProductsResult = await saleProductsQb
      .select(['COALESCE(SUM(ol.quantity), 0) as "totalProductsSold"'])
      .getRawOne();

    // Query for return orders - revenue and count
    let returnRevenueQb = this.dataSource
      .createQueryBuilder(Order, "o")
      .where("o.type = :type", { type: OrderTypeEnum.SALE_RETURN })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('o."deletedAt" IS NULL');

    if (storeId) {
      returnRevenueQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const returnRevenueResult = await returnRevenueQb
      .select([
        'COUNT(o.id) as "totalReturnOrders"',
        'COALESCE(SUM(o."netAmount"), 0) as "totalReturnRevenue"',
      ])
      .getRawOne();

    // Query for products returned (separate query)
    let returnProductsQb = this.dataSource
      .createQueryBuilder(OrderLine, "ol")
      .leftJoin("ol.order", "o")
      .where("o.type = :type", { type: OrderTypeEnum.SALE_RETURN })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('o."deletedAt" IS NULL');

    if (storeId) {
      returnProductsQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const returnProductsResult = await returnProductsQb
      .select(['COALESCE(SUM(ol.quantity), 0) as "totalProductsReturned"'])
      .getRawOne();

    // Query for other income (excluding order-related income)
    let incomeQb = this.dataSource
      .createQueryBuilder(IncomeExpense, "ie")
      .where("ie.type = :type", { type: IncomeExpenseTypeEnum.INCOME })
      .andWhere('ie."occurredAt" BETWEEN :startAt AND :endAt', {
        startAt,
        endAt,
      })
      .andWhere('ie."partnerId" IS NULL')
      .andWhere('ie."orderId" IS NULL')
      .andWhere('ie."deletedAt" IS NULL');

    if (storeId) {
      incomeQb.andWhere('ie."storeId" = :storeId', { storeId });
    }

    const incomeResult = await incomeQb
      .select(['COALESCE(SUM(ie.amount), 0) as "totalOtherIncome"'])
      .getRawOne();

    // Calculate total revenue (Trang overview: Doanh thu = Bán hàng (đã gộp hoàn) + Thu khác)
    const totalSalesRevenue = Number(saleRevenueResult?.totalSalesRevenue || 0);
    const totalReturnRevenue = Number(
      returnRevenueResult?.totalReturnRevenue || 0,
    );
    const totalOtherIncome = Number(incomeResult?.totalOtherIncome || 0);
    const totalRevenue = totalSalesRevenue + totalOtherIncome;

    return {
      totalRevenue,
      totalOrders: Number(saleRevenueResult?.totalOrders || 0),
      totalProductsSold: Number(saleProductsResult?.totalProductsSold || 0),
      totalReturnOrders: Number(returnRevenueResult?.totalReturnOrders || 0),
      totalReturnValue: totalReturnRevenue,
      totalProductsReturned: Number(
        returnProductsResult?.totalProductsReturned || 0,
      ),
    };
  }

  /**
   * Get revenue by date for overview
   */
  async getOverviewRevenueByDate(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<Array<{ date: string; revenue: number; orders: number }>> {
    let qb = this.dataSource
      .createQueryBuilder(Order, "o")
      .where("o.type IN (:...types)", {
        types: [OrderTypeEnum.SALE, OrderTypeEnum.SALE_RETURN],
      })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('o."deletedAt" IS NULL');

    if (storeId) {
      qb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const result = await qb
      .select([
        'DATE(o."orderAt") as date',
        'COALESCE(SUM(o."netAmount"), 0) as revenue',
        "COUNT(o.id) as orders",
      ])
      .groupBy('DATE(o."orderAt")')
      .orderBy("date", "ASC")
      .getRawMany();

    // Create a map of existing data
    const dataMap = new Map<string, { revenue: number; orders: number }>();
    result.forEach((row) => {
      // row.date is YYYY-MM-DD from PostgreSQL DATE()
      const dateStr = dayjs(row.date).format("DD/MM/YYYY");
      dataMap.set(dateStr, {
        revenue: Number(row.revenue || 0),
        orders: Number(row.orders || 0),
      });
    });

    // Generate all dates in range
    const start = dayjs(startAt).startOf("day");
    const end = dayjs(endAt).startOf("day");
    const allDates: Array<{ date: string; revenue: number; orders: number }> =
      [];

    let current = start;
    while (current.isBefore(end) || current.isSame(end, "day")) {
      const dateStr = current.format("DD/MM/YYYY");
      const data = dataMap.get(dateStr) || { revenue: 0, orders: 0 };
      allDates.push({
        date: dateStr,
        revenue: data.revenue,
        orders: data.orders,
      });
      current = current.add(1, "day");
    }

    return allDates;
  }

  /**
   * Get income/expense by attribute for overview
   */
  async getOverviewIncomeExpenseByAttribute(
    startAt: Date,
    endAt: Date,
    type: "income" | "expense",
    storeId?: string,
    isOtherIncomeExpense: boolean = false,
  ): Promise<
    Array<{ id: string; name: string; amount: number; type: AttributeTypeEnum }>
  > {
    const attributeType =
      type === "income"
        ? AttributeTypeEnum.INCOME_CATEGORY
        : AttributeTypeEnum.EXPENSE_CATEGORY;

    let qb = this.dataSource
      .createQueryBuilder(IncomeExpense, "ie")
      .leftJoin("ie.category", "cat")
      .leftJoin("cat.fundCategoryGroup", "attr")
      .where('ie."occurredAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere("ie.type = :type", {
        type:
          type === "income"
            ? IncomeExpenseTypeEnum.INCOME
            : IncomeExpenseTypeEnum.EXPENSE,
      })
      .andWhere("attr.type = :attributeType", { attributeType })
      .andWhere('ie."deletedAt" IS NULL');

    if (isOtherIncomeExpense) {
      qb.andWhere('ie."partnerId" IS NULL').andWhere('ie."orderId" IS NULL');
    }

    if (storeId) {
      qb.andWhere('ie."storeId" = :storeId', { storeId });
    }

    const result = await qb
      .select([
        "attr.id as id",
        "attr.name as name",
        "attr.type as type",
        "COALESCE(SUM(ie.amount), 0) as amount",
      ])
      .groupBy("attr.id, attr.name, attr.type")
      .orderBy("amount", "DESC")
      .getRawMany();

    return result.map((row) => ({
      id: row.id || "uncategorized",
      name: row.name || "Chưa phân loại",
      amount: Number(row.amount || 0),
      type: (row.type || attributeType) as AttributeTypeEnum,
    }));
  }

  /**
   * Get recent sale orders for overview
   */
  async getOverviewRecentOrders(
    startAt: Date,
    endAt: Date,
    storeId?: string,
    limit: number = 10,
  ): Promise<OrderSnapshot[]> {
    let qb = this.dataSource
      .createQueryBuilder(Order, "o")
      .where("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('o."deletedAt" IS NULL');

    if (storeId) {
      qb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const orders = await qb
      .select([
        'o."id"',
        'o."code"',
        'o."type"',
        'o."orderAt"',
        'o."partnerSnapshot"',
        'o."employeeSnapshot"',
        'o."netAmount"',
        'o."totalAmount"',
        'o."status"',
      ])
      .orderBy('o."orderAt"', "DESC")
      .limit(limit)
      .getRawMany();
    return orders.map((order) => ({
      id: order.id,
      code: order.code,
      type: order.type,
      orderAt: order.orderAt,
      partnerSnapshot: order.partnerSnapshot,
      employeeSnapshot: order.employeeSnapshot,
      netAmount: Number(order.netAmount || 0),
      totalAmount: Number(order.totalAmount || 0),
      status: order.status,
    }));
  }

  /**
   * Get top products by revenue for overview
   */
  async getOverviewTopProducts(
    startAt: Date,
    endAt: Date,
    storeId?: string,
    limit: number = 5,
  ): Promise<TopProduct[]> {
    let qb = this.dataSource
      .createQueryBuilder(OrderLine, "ol")
      .leftJoin("ol.order", "o")
      .leftJoin(ProductVariant, "pv", 'pv.id = ol."productVariantId"')
      .leftJoin(Product, "p", 'p.id = pv."productId"')
      .where("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('o."deletedAt" IS NULL');

    if (storeId) {
      qb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const result = await qb
      .select([
        'p."id"',
        'p."name"',
        'p."code"',
        'COALESCE(SUM(ol."netAmount"), 0) as revenue',
        "COALESCE(SUM(ol.quantity), 0) as quantity",
      ])
      .groupBy("p.id, p.name, p.code")
      .orderBy("revenue", "DESC")
      .limit(limit)
      .getRawMany();

    const products = result.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code || "",
      revenue: Number(row.revenue || 0),
      quantity: Number(row.quantity || 0),
    }));

    // Attach files
    const productsWithFiles = await FileHelper.attachFilesToEntities(products);

    return productsWithFiles;
  }

  /**
   * Get top products by revenue for profit report (SALE + SALE_RETURN)
   */
  async getTopProductsForProfit(
    startAt: Date,
    endAt: Date,
    storeId?: string,
    limit: number = 10,
  ): Promise<TopProduct[]> {
    let qb = this.dataSource
      .createQueryBuilder(OrderLine, "ol")
      .leftJoin("ol.order", "o")
      .leftJoin(ProductVariant, "pv", 'pv.id = ol."productVariantId"')
      .leftJoin(Product, "p", 'p.id = pv."productId"')
      .where("o.type IN (:...types)", {
        types: [OrderTypeEnum.SALE, OrderTypeEnum.SALE_RETURN],
      })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('o."deletedAt" IS NULL');

    if (storeId) {
      qb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const result = await qb
      .select([
        'p."id"',
        'p."name"',
        'p."code"',
        'COALESCE(SUM(ol."netAmount"), 0) as revenue',
        "COALESCE(SUM(ol.quantity), 0) as quantity",
      ])
      .groupBy("p.id, p.name, p.code")
      .orderBy("revenue", "DESC")
      .limit(limit)
      .getRawMany();

    const products = result.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code || "",
      revenue: Number(row.revenue || 0),
      quantity: Number(row.quantity || 0),
    }));

    // Attach files
    const productsWithFiles = await FileHelper.attachFilesToEntities(products);

    return productsWithFiles;
  }

  /**
   * Get top customers for profit report (SALE + SALE_RETURN)
   */
  async getTopCustomersForProfit(
    startAt: Date,
    endAt: Date,
    storeId?: string,
    limit: number = 5,
  ): Promise<TopCustomer[]> {
    let qb = this.dataSource
      .createQueryBuilder(Order, "o")
      .leftJoin("o.partner", "p")
      .select([
        'o."partnerId" as "partnerId"',
        'p.name as "partnerName"',
        'p.code as "partnerCode"',
        'COUNT(o.id) as "orderCount"',
        'SUM(o."netAmount") as "totalRevenue"',
      ])
      .where("o.type IN (:...types)", {
        types: [OrderTypeEnum.SALE, OrderTypeEnum.SALE_RETURN],
      })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."partnerId" IS NOT NULL')
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('o."deletedAt" IS NULL')
      .groupBy('o."partnerId", p.name, p.code')
      .orderBy('"totalRevenue"', "DESC")
      .limit(limit);

    if (storeId) {
      qb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const results = await qb.getRawMany();

    const finalResult: TopCustomer[] = results.map((r) => ({
      id: r.partnerId || "",
      name: r.partnerName || "Unknown",
      code: r.partnerCode || "",
      orders: Number(r.orderCount || 0),
      revenue: Number(r.totalRevenue || 0),
    }));

    return await FileHelper.attachFilesToEntities(finalResult);
  }

  // ============= PROFIT REPORT =============

  /**
   * Get profit metrics
   */
  async getProfitMetrics(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<{
    totalSalesRevenue: number;
    totalOtherIncome: number;
    totalRevenue: number;
    totalCost: number;
    totalShippingExpense: number;
    totalOtherExpense: number;
    totalExpense: number;
    grossProfit: number;
    grossProfitMargin: number;
    inventoryAdjustment: number;
    fundAdjustment: number;
    partnerDebtAdjustment: number;
    netProfit: number;
    netProfitMargin: number;
  }> {
    // 1. Doanh thu từ bán hàng (SALE + SALE_RETURN orders)
    let saleQb = this.dataSource
      .createQueryBuilder(Order, "o")
      .where("o.type IN (:...types)", {
        types: [OrderTypeEnum.SALE, OrderTypeEnum.SALE_RETURN],
      })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt });

    if (storeId) {
      saleQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const saleResult = await saleQb
      .select([
        'COALESCE(SUM(o."netAmount"), 0) as "totalSalesRevenue"',
        `
          COALESCE(SUM(
            CASE
              WHEN o."isFreeShipping" = true
              THEN COALESCE(o."shippingFee", 0)
              ELSE 0
            END
          ), 0) as "totalSaleShipping"
        `,
      ])
      .getRawOne();

    // 2. Thu khác (không phải từ bán hàng)
    let incomeQb = this.dataSource
      .createQueryBuilder(IncomeExpense, "ie")
      .where("ie.type = :type", { type: IncomeExpenseTypeEnum.INCOME })
      .andWhere('ie."occurredAt" BETWEEN :startAt AND :endAt', {
        startAt,
        endAt,
      })
      .andWhere('ie."partnerId" IS NULL')
      .andWhere('ie."orderId" IS NULL')
      .andWhere('ie."deletedAt" IS NULL');

    if (storeId) {
      incomeQb.andWhere('ie."storeId" = :storeId', { storeId });
    }

    const incomeResult = await incomeQb
      .select(['COALESCE(SUM(ie.amount), 0) as "totalOtherIncome"'])
      .getRawOne();

    // 4. Chi phí khác (không phải giá vốn và phí vận chuyển)
    let expenseQb = this.dataSource
      .createQueryBuilder(IncomeExpense, "ie")
      .where("ie.type = :type", { type: IncomeExpenseTypeEnum.EXPENSE })
      .andWhere('ie."occurredAt" BETWEEN :startAt AND :endAt', {
        startAt,
        endAt,
      })
      .andWhere('ie."partnerId" IS NULL')
      .andWhere('ie."orderId" IS NULL')
      .andWhere('ie."deletedAt" IS NULL');

    if (storeId) {
      expenseQb.andWhere('ie."storeId" = :storeId', { storeId });
    }

    const expenseResult = await expenseQb
      .select(['COALESCE(SUM(ie.amount), 0) as "totalOtherExpense"'])
      .getRawOne();

    // 5. Giá vốn hàng bán (COGS) từ inventory transactions
    let costQb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .where('it."refType" IN (:...refTypes)', {
        refTypes: [InventoryRefTypeEnum.SALE, InventoryRefTypeEnum.SALE_RETURN],
      })
      .andWhere('it."occurredAt" BETWEEN :startAt AND :endAt', {
        startAt,
        endAt,
      });

    if (storeId) {
      costQb.andWhere('it."storeId" = :storeId', { storeId });
    }

    const costResult = await costQb
      .select([
        `
        COALESCE(SUM(
          CASE 
            WHEN it.type = :inType THEN -it.amount
            WHEN it.type = :outType THEN it.amount
          END
        ), 0) as "totalCost"
        `,
      ])
      .setParameters({
        inType: InventoryTransactionType.IN,
        outType: InventoryTransactionType.OUT,
      })
      .getRawOne();

    // 6. Điều chỉnh tồn kho (Inventory Adjustment)
    let adjustmentQb = this.dataSource
      .createQueryBuilder(InventoryAdjustment, "ia")
      .where('ia."occurredAt" BETWEEN :startAt AND :endAt', {
        startAt,
        endAt,
      })
      .andWhere('ia."isInitial" = :isInitial', { isInitial: false });
    if (storeId) {
      adjustmentQb.andWhere('ia."storeId" = :storeId', { storeId });
    }
    const adjustmentResult = await adjustmentQb
      .select([
        'COALESCE(SUM(ia."totalAdjustmentValue"), 0) as "inventoryAdjustment"',
      ])
      .getRawOne();

    const inventoryAdjustment = Number(
      adjustmentResult?.inventoryAdjustment || 0,
    );

    // 7. Điều chỉnh quỹ (Fund Adjustment) - chỉ tính khi không có storeId
    let fundAdjustment = 0;
    if (!storeId) {
      const fundAdjustmentResult = await this.dataSource
        .createQueryBuilder(FundAdjustment, "fa")
        .where('fa."occurredAt" BETWEEN :startAt AND :endAt', {
          startAt,
          endAt,
        })
        .andWhere('fa."isInitial" = :isInitial', { isInitial: false })
        .select([
          `
          COALESCE(SUM(
            CASE 
              WHEN fa.direction = :increase THEN fa."deltaAmount"
              WHEN fa.direction = :decrease THEN -fa."deltaAmount"
            END
          ), 0) as "fundAdjustment"
          `,
        ])
        .setParameters({
          increase: FundTransactionType.INCREASE,
          decrease: FundTransactionType.DECREASE,
        })
        .getRawOne();

      fundAdjustment = Number(fundAdjustmentResult?.fundAdjustment || 0);
    }

    // 8. Điều chỉnh công nợ (Partner Debt Adjustment)
    let debtAdjustmentQb = this.dataSource
      .createQueryBuilder(PartnerDebtAdjustment, "pda")
      .where('pda."occurredAt" BETWEEN :startAt AND :endAt', {
        startAt,
        endAt,
      })
      .andWhere('pda."isInitial" = :isInitial', { isInitial: false });

    if (storeId) {
      debtAdjustmentQb.andWhere('pda."storeId" = :storeId', { storeId });
    }

    const debtAdjustmentResult = await debtAdjustmentQb
      .select([
        `
        COALESCE(SUM(
          CASE 
            WHEN pda.direction = :increase THEN pda."deltaAmount"
            WHEN pda.direction = :decrease THEN -pda."deltaAmount"
          END
        ), 0) as "partnerDebtAdjustment"
        `,
      ])
      .setParameters({
        increase: DebtDirectionEnum.INCREASE,
        decrease: DebtDirectionEnum.DECREASE,
      })
      .getRawOne();

    const partnerDebtAdjustment = Number(
      debtAdjustmentResult?.partnerDebtAdjustment || 0,
    );

    // Parse values
    const totalSalesRevenue = Number(saleResult?.totalSalesRevenue || 0);
    const totalOtherIncome = Number(incomeResult?.totalOtherIncome || 0);
    const totalCost = Number(costResult?.totalCost || 0); // Đã xử lý IN/OUT ở trên
    const totalSaleShipping = Number(saleResult?.totalSaleShipping || 0);
    const totalOtherExpense = Number(expenseResult?.totalOtherExpense || 0);

    // Tính toán
    const totalRevenue = totalSalesRevenue + totalOtherIncome;
    const totalShippingExpense = totalSaleShipping;
    // shippingFee đã nằm trong netAmount của đơn, không cộng lại vào expense để tránh trừ 2 lần
    const totalExpense = totalCost + totalOtherExpense;
    const grossProfit = totalSalesRevenue - totalCost;
    const netProfit = totalRevenue - totalExpense;
    // +
    // inventoryAdjustment +
    // fundAdjustment +
    // partnerDebtAdjustment;
    const grossProfitMargin =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netProfitMargin =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalSalesRevenue,
      totalOtherIncome,
      totalRevenue,
      totalCost,
      totalShippingExpense,
      totalOtherExpense,
      totalExpense,
      grossProfit,
      grossProfitMargin,
      inventoryAdjustment,
      fundAdjustment,
      partnerDebtAdjustment,
      netProfit,
      netProfitMargin,
    };
  }

  /**
   * Get sale revenue by date (only from sale orders, not including other income)
   * Tổng netAmount của đơn bán + đơn hoàn trong ngày
   */
  async getSaleRevenueByDate(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<Array<{ date: string; revenue: number; orders: number }>> {
    // Sale + Sale Return revenue (chỉ từ đơn hàng, không có thu khác)
    let qb = this.dataSource
      .createQueryBuilder(Order, "o")
      .where("o.type IN (:...types)", {
        types: [OrderTypeEnum.SALE, OrderTypeEnum.SALE_RETURN],
      })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt });

    if (storeId) {
      qb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const orderRevenue = await qb
      .select([
        'DATE(o."orderAt") as date',
        'COALESCE(SUM(o."netAmount"), 0) as revenue',
        "COUNT(o.id) as orders",
      ])
      .groupBy('DATE(o."orderAt")')
      .orderBy("date", "ASC")
      .getRawMany();

    // Create data map
    const dataMap = new Map<string, { revenue: number; orders: number }>();

    orderRevenue.forEach((row) => {
      const dateStr = dayjs(row.date).format("DD/MM/YYYY");
      dataMap.set(dateStr, {
        revenue: Number(row.revenue || 0),
        orders: Number(row.orders || 0),
      });
    });

    // Generate all dates in range
    const start = dayjs(startAt).startOf("day");
    const end = dayjs(endAt).startOf("day");
    const allDates: Array<{ date: string; revenue: number; orders: number }> =
      [];

    let current = start;
    while (current.isBefore(end) || current.isSame(end, "day")) {
      const dateStr = current.format("DD/MM/YYYY");
      const data = dataMap.get(dateStr) || { revenue: 0, orders: 0 };
      allDates.push({
        date: dateStr,
        revenue: data.revenue,
        orders: data.orders,
      });
      current = current.add(1, "day");
    }

    return allDates;
  }

  /**
   * Get sale cost by date (COGS from inventory transactions)
   * Tổng giá vốn xuất bán + giá vốn hoàn trong ngày
   */
  async getSaleCostByDate(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<Array<{ date: string; revenue: number; orders: number }>> {
    // Lấy giá vốn từ inventory transactions (sale + sale_return)
    let costQb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .where('it."refType" IN (:...refTypes)', {
        refTypes: [InventoryRefTypeEnum.SALE, InventoryRefTypeEnum.SALE_RETURN],
      })
      .andWhere('it."occurredAt" BETWEEN :startAt AND :endAt', {
        startAt,
        endAt,
      });

    if (storeId) {
      costQb.andWhere('it."storeId" = :storeId', { storeId });
    }

    const costData = await costQb
      .select([
        'DATE(it."occurredAt") as date',
        `
        COALESCE(SUM(
          CASE 
            WHEN it.type = :inType THEN -it.amount
            WHEN it.type = :outType THEN it.amount
          END
        ), 0) as cost
        `,
      ])
      .setParameters({
        inType: InventoryTransactionType.IN,
        outType: InventoryTransactionType.OUT,
      })
      .groupBy('DATE(it."occurredAt")')
      .getRawMany();

    // Create data map from cost data
    const dataMap = new Map<string, number>();

    costData.forEach((row) => {
      const dateStr = dayjs(row.date).format("DD/MM/YYYY");
      dataMap.set(dateStr, Number(row.cost || 0));
    });

    // Generate all dates in range
    const start = dayjs(startAt).startOf("day");
    const end = dayjs(endAt).startOf("day");
    const allDates: Array<{ date: string; revenue: number; orders: number }> =
      [];

    let current = start;
    while (current.isBefore(end) || current.isSame(end, "day")) {
      const dateStr = current.format("DD/MM/YYYY");
      const expense = dataMap.get(dateStr) || 0;
      allDates.push({
        date: dateStr,
        revenue: expense,
        orders: 0,
      });
      current = current.add(1, "day");
    }

    return allDates;
  }

  /**
   * Get gross profit by date (revenue - cost)
   * Lợi nhuận gộp trong ngày = doanh thu - giá vốn
   */
  async getGrossProfitByDate(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<Array<{ date: string; revenue: number; orders: number }>> {
    const [saleRevenueByDate, saleCostByDate] = await Promise.all([
      this.getSaleRevenueByDate(startAt, endAt, storeId),
      this.getSaleCostByDate(startAt, endAt, storeId),
    ]);

    const costMap = new Map(saleCostByDate.map((e) => [e.date, e.revenue]));

    return saleRevenueByDate.map((r) => ({
      date: r.date,
      revenue: r.revenue - (costMap.get(r.date) || 0),
      orders: r.orders,
    }));
  }

  /**
   * Get revenue by order (top orders)
   */
  async getRevenueByOrder(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<
    Array<{
      id: string;
      code: string;
      orderAt: string;
      type: OrderTypeEnum;
      netAmount: number;
      cost: number;
      grossProfit: number;
    }>
  > {
    let qb = this.dataSource
      .createQueryBuilder(Order, "o")
      .where("o.type IN (:...types)", {
        types: [OrderTypeEnum.SALE, OrderTypeEnum.SALE_RETURN],
      })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt });

    if (storeId) {
      qb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const orders = await qb
      .select([
        'o."id"',
        'o."code"',
        'o."orderAt"',
        'o."type"',
        'o."netAmount"',
      ])
      .orderBy('o."netAmount"', "DESC")
      .getRawMany();

    // Get cost from inventory transactions
    const orderIds = orders.map((o) => o.id);

    if (orderIds.length === 0) {
      return [];
    }

    const costData = await this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .where('it."refId" IN (:...orderIds)', { orderIds })
      .andWhere('it."refType" IN (:...refTypes)', {
        refTypes: [InventoryRefTypeEnum.SALE, InventoryRefTypeEnum.SALE_RETURN],
      })
      .select([
        'it."refId" as "orderId"',
        "COALESCE(ABS(SUM(it.amount)), 0) as cost",
      ])
      .groupBy('it."refId"')
      .getRawMany();

    const costMap = new Map<string, number>();
    costData.forEach((row) => {
      costMap.set(row.orderId, Number(row.cost || 0));
    });

    return orders.map((row) => {
      const netAmount = Number(row.netAmount || 0);
      const cost = costMap.get(row.id) || 0;
      return {
        id: row.id,
        code: row.code,
        orderAt: row.orderAt,
        type: row.type,
        netAmount,
        cost,
        grossProfit: netAmount - cost,
      };
    });
  }

  /**
   * Get revenue by category (product category level 1)
   */
  async getRevenueByCategory(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<
    Array<{
      id: string;
      name: string;
      revenue: number;
      cost: number;
      grossProfit: number;
      orders: number;
    }>
  > {
    const params: any[] = [startAt, endAt];

    const allCategories =
      await this.attributeRepository.aggregateAttributesByAncestors();

    let storeCondition = "";

    if (storeId) {
      storeCondition = `AND o."storeId" = $3`;
      params.push(storeId);
    }

    // 1️⃣ Lấy doanh thu group theo categoryId
    const revenueRows = await this.dataSource.query(
      `
    SELECT 
      p."categoryId" as "categoryId",
      COALESCE(SUM(ol."netAmount"), 0) as revenue
    FROM "order_lines" ol
    INNER JOIN "orders" o ON o.id = ol."orderId"
      AND o."orderAt" BETWEEN $1 AND $2
      AND o.type IN ('sale', 'sale_return')
      AND o.status = 'posted'
      ${storeCondition}
    INNER JOIN "product_variants" pv ON pv.id = ol."productVariantId"
    INNER JOIN "products" p ON p.id = pv."productId"
    WHERE p."categoryId" IS NOT NULL
    GROUP BY p."categoryId"
  `,
      params,
    );

    // 2️⃣ Lấy giá vốn group theo categoryId (tính riêng để tránh duplicate)
    const costRows = await this.dataSource.query(
      `
    SELECT 
      p."categoryId" as "categoryId",
      COALESCE(ABS(SUM(it.amount)), 0) as cost
    FROM "inventory_transactions" it
    INNER JOIN "orders" o ON o.id = it."refId"
      AND o."orderAt" BETWEEN $1 AND $2
      AND o.type IN ('sale', 'sale_return')
      AND o.status = 'posted'
      AND it."refType" IN ('sale', 'sale_return')
      ${storeCondition}
    INNER JOIN "product_variants" pv ON pv.id = it."productVariantId"
    INNER JOIN "products" p ON p.id = pv."productId"
    WHERE p."categoryId" IS NOT NULL
    GROUP BY p."categoryId"
  `,
      params,
    );

    // 3️⃣ Lấy số đơn hàng theo categoryId
    const ordersRows = await this.dataSource.query(
      `
    SELECT 
      p."categoryId" as "categoryId",
      COUNT(DISTINCT o.id) as orders
    FROM "order_lines" ol
    INNER JOIN "orders" o ON o.id = ol."orderId"
      AND o."orderAt" BETWEEN $1 AND $2
      AND o.type IN ('sale', 'sale_return')
      AND o.status = 'posted'
      ${storeCondition}
    INNER JOIN "product_variants" pv ON pv.id = ol."productVariantId"
    INNER JOIN "products" p ON p.id = pv."productId"
    WHERE p."categoryId" IS NOT NULL
    GROUP BY p."categoryId"
  `,
      params,
    );

    const revenueMap = new Map<
      string,
      { revenue: number; cost: number; orders: number }
    >();

    for (const row of revenueRows) {
      revenueMap.set(row.categoryId, {
        revenue: Number(row.revenue || 0),
        cost: 0,
        orders: 0,
      });
    }

    for (const row of costRows) {
      const existing = revenueMap.get(row.categoryId) || {
        revenue: 0,
        cost: 0,
        orders: 0,
      };
      existing.cost = Number(row.cost || 0);
      revenueMap.set(row.categoryId, existing);
    }

    for (const row of ordersRows) {
      const existing = revenueMap.get(row.categoryId) || {
        revenue: 0,
        cost: 0,
        orders: 0,
      };
      existing.orders = Number(row.orders || 0);
      revenueMap.set(row.categoryId, existing);
    }

    // 4️⃣ Gom theo familyIds (ancestor aggregation)
    const result = allCategories
      .filter((cat) => !cat.parentId) // chỉ lấy cấp 1
      .map((cat) => {
        let totalRevenue = 0;
        let totalCost = 0;
        let totalOrders = 0;

        for (const familyId of cat.familyIds) {
          const data = revenueMap.get(familyId) || {
            revenue: 0,
            cost: 0,
            orders: 0,
          };
          totalRevenue += data.revenue;
          totalCost += data.cost;
          totalOrders += data.orders;
        }

        return {
          id: cat.id,
          name: cat.name,
          revenue: totalRevenue,
          cost: totalCost,
          grossProfit: totalRevenue - totalCost,
          orders: totalOrders,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .filter((cat) => cat.revenue > 0); // Chỉ lấy category có doanh thu

    return result;
  }

  /**
   * Get revenue by product
   * @deprecated No longer used in current dashboard design
   */
  async getRevenueByProduct(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<
    Array<{
      id: string;
      name: string;
      code: string;
      album?: any[];
      revenue: number;
      quantity: number;
      cost: number;
      grossProfit: number;
    }>
  > {
    // 1. Lấy revenue và quantity từ order_lines
    let revenueQb = this.dataSource
      .createQueryBuilder(OrderLine, "ol")
      .leftJoin("ol.order", "o")
      .leftJoin(ProductVariant, "pv", 'pv.id = ol."productVariantId"')
      .leftJoin(Product, "p", 'p.id = pv."productId"')
      .where("o.type IN (:...types)", {
        types: [OrderTypeEnum.SALE, OrderTypeEnum.SALE_RETURN],
      })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt });

    if (storeId) {
      revenueQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const revenueResult = await revenueQb
      .select([
        'p."id"',
        'p."name"',
        'p."code"',
        'COALESCE(SUM(ol.quantity), 0) as "quantitySold"',
        'COALESCE(SUM(ol."netAmount"), 0) as revenue',
      ])
      .groupBy("p.id, p.name, p.code")
      .orderBy("revenue", "DESC")
      .getRawMany();

    const productIds = revenueResult.map((r) => r.id);

    if (productIds.length === 0) {
      return [];
    }

    // 2. Lấy cost từ inventory_transactions (tính riêng để tránh duplicate)
    let costQb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .leftJoin(Order, "o", 'o.id = it."refId"')
      .leftJoin(ProductVariant, "pv", 'pv.id = it."productVariantId"')
      .leftJoin(Product, "p", 'p.id = pv."productId"')
      .where('it."refType" IN (:...refTypes)', {
        refTypes: [InventoryRefTypeEnum.SALE, InventoryRefTypeEnum.SALE_RETURN],
      })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('p."id" IN (:...productIds)', { productIds });

    if (storeId) {
      costQb.andWhere('it."storeId" = :storeId', { storeId });
    }

    const costResult = await costQb
      .select(['p."id"', "COALESCE(ABS(SUM(it.amount)), 0) as cost"])
      .groupBy('p."id"')
      .getRawMany();

    const costMap = new Map<string, number>();
    costResult.forEach((row) => {
      costMap.set(row.id, Number(row.cost || 0));
    });

    const products = revenueResult.map((row) => {
      const revenue = Number(row.revenue || 0);
      const cost = costMap.get(row.id) || 0;
      return {
        id: row.id,
        name: row.name,
        code: row.code || "",
        quantity: Number(row.quantitySold || 0),
        revenue,
        cost,
        grossProfit: revenue - cost,
      };
    });

    // Attach files
    const productsWithFiles = await FileHelper.attachFilesToEntities(products);

    return productsWithFiles;
  }

  /**
   * Get revenue by partner
   * @deprecated No longer used in current dashboard design
   */
  async getRevenueByPartner(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<
    Array<{
      id: string;
      name: string;
      code: string;
      avatar?: any[];
      revenue: number;
      cost: number;
      grossProfit: number;
      orders: number;
    }>
  > {
    // 1. Lấy revenue từ orders
    let revenueQb = this.dataSource
      .createQueryBuilder(Order, "o")
      .leftJoin(Partner, "p", 'p.id = o."partnerId"')
      .where("o.type IN (:...types)", {
        types: [OrderTypeEnum.SALE, OrderTypeEnum.SALE_RETURN],
      })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('o."partnerId" IS NOT NULL');

    if (storeId) {
      revenueQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const revenueResult = await revenueQb
      .select([
        'p."id"',
        'p."name"',
        'p."code"',
        'COALESCE(SUM(o."netAmount"), 0) as revenue',
        "COUNT(o.id) as orders",
      ])
      .groupBy("p.id, p.name, p.code")
      .orderBy("revenue", "DESC")
      .getRawMany();

    const partnerIds = revenueResult.map((r) => r.id);

    if (partnerIds.length === 0) {
      return [];
    }

    // 2. Lấy cost từ inventory_transactions (tính riêng để tránh duplicate)
    let costQb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .leftJoin(Order, "o", 'o.id = it."refId"')
      .leftJoin(Partner, "p", 'p.id = o."partnerId"')
      .where('it."refType" IN (:...refTypes)', {
        refTypes: [InventoryRefTypeEnum.SALE, InventoryRefTypeEnum.SALE_RETURN],
      })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('o."partnerId" IN (:...partnerIds)', { partnerIds });

    if (storeId) {
      costQb.andWhere('it."storeId" = :storeId', { storeId });
    }

    const costResult = await costQb
      .select(['p."id"', "COALESCE(ABS(SUM(it.amount)), 0) as cost"])
      .groupBy('p."id"')
      .getRawMany();

    const costMap = new Map<string, number>();
    costResult.forEach((row) => {
      costMap.set(row.id, Number(row.cost || 0));
    });

    const partners = revenueResult.map((row) => {
      const revenue = Number(row.revenue || 0);
      const cost = costMap.get(row.id) || 0;
      return {
        id: row.id,
        name: row.name,
        code: row.code || "",
        revenue,
        cost,
        grossProfit: revenue - cost,
        orders: Number(row.orders || 0),
      };
    });

    // Attach avatar files
    const partnersWithFiles = await FileHelper.attachFilesToEntities(partners);

    return partnersWithFiles;
  }

  /**
   * Get revenue by employee (profit dashboard - includes SALE + SALE_RETURN)
   */
  async getRevenueByEmployee(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<RevenueByEmployee[]> {
    // 1. Lấy revenue từ orders (SALE + SALE_RETURN)
    let revenueQb = this.dataSource
      .createQueryBuilder(Order, "o")
      .leftJoin(Employee, "e", 'e.id = o."employeeId"')
      .where("o.type IN (:...types)", {
        types: [OrderTypeEnum.SALE, OrderTypeEnum.SALE_RETURN],
      })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('o."employeeId" IS NOT NULL');

    if (storeId) {
      revenueQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const revenueResult = await revenueQb
      .select([
        'e."id"',
        'e."name"',
        'e."code"',
        'COALESCE(SUM(o."netAmount"), 0) as revenue',
        "COUNT(o.id) as orders",
      ])
      .groupBy("e.id, e.name, e.code")
      .orderBy("revenue", "DESC")
      .getRawMany();

    const employeeIds = revenueResult.map((r) => r.id);

    if (employeeIds.length === 0) {
      return [];
    }

    // 2. Lấy cost từ inventory_transactions (SALE + SALE_RETURN)
    let costQb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .leftJoin(Order, "o", 'o.id = it."refId"')
      .leftJoin(Employee, "e", 'e.id = o."employeeId"')
      .where('it."refType" IN (:...refTypes)', {
        refTypes: [InventoryRefTypeEnum.SALE, InventoryRefTypeEnum.SALE_RETURN],
      })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('o."employeeId" IN (:...employeeIds)', { employeeIds });

    if (storeId) {
      costQb.andWhere('it."storeId" = :storeId', { storeId });
    }

    const costResult = await costQb
      .select(['e."id"', "COALESCE(ABS(SUM(it.amount)), 0) as cost"])
      .groupBy('e."id"')
      .getRawMany();

    const costMap = new Map<string, number>();
    costResult.forEach((row) => {
      costMap.set(row.id, Number(row.cost || 0));
    });

    const employees = revenueResult.map((row) => {
      const revenue = Number(row.revenue || 0);
      const cost = costMap.get(row.id) || 0;
      return {
        id: row.id,
        name: row.name,
        code: row.code || "",
        revenue,
        cost,
        grossProfit: revenue - cost,
        orders: Number(row.orders || 0),
      };
    });

    // Attach avatar files
    const employeesWithFiles =
      await FileHelper.attachFilesToEntities(employees);

    return employeesWithFiles;
  }

  /**
   * Get revenue by store (profit dashboard - includes SALE + SALE_RETURN)
   * Only meaningful for global view (when storeId is not provided)
   */
  async getRevenueByStore(
    startAt: Date,
    endAt: Date,
  ): Promise<RevenueByStore[]> {
    // 1. Lấy revenue từ orders (SALE + SALE_RETURN)
    const revenueQb = this.dataSource
      .createQueryBuilder(Order, "o")
      .leftJoin(Store, "s", 's.id = o."storeId"')
      .where("o.type IN (:...types)", {
        types: [OrderTypeEnum.SALE, OrderTypeEnum.SALE_RETURN],
      })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('o."storeId" IS NOT NULL');

    const revenueResult = await revenueQb
      .select([
        's."id"',
        's."name"',
        's."code"',
        'COALESCE(SUM(o."netAmount"), 0) as revenue',
        "COUNT(o.id) as orders",
      ])
      .groupBy("s.id, s.name, s.code")
      .orderBy("revenue", "DESC")
      .getRawMany();

    const storeIds = revenueResult.map((r) => r.id);

    if (storeIds.length === 0) {
      return [];
    }

    // 2. Lấy cost từ inventory_transactions (SALE + SALE_RETURN)
    const costQb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .leftJoin(Order, "o", 'o.id = it."refId"')
      .leftJoin(Store, "s", 's.id = it."storeId"')
      .where('it."refType" IN (:...refTypes)', {
        refTypes: [InventoryRefTypeEnum.SALE, InventoryRefTypeEnum.SALE_RETURN],
      })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('it."storeId" IN (:...storeIds)', { storeIds });

    const costResult = await costQb
      .select(['s."id"', "COALESCE(ABS(SUM(it.amount)), 0) as cost"])
      .groupBy('s."id"')
      .getRawMany();

    const costMap = new Map<string, number>();
    costResult.forEach((row) => {
      costMap.set(row.id, Number(row.cost || 0));
    });

    const stores = revenueResult.map((row) => {
      const revenue = Number(row.revenue || 0);
      const cost = costMap.get(row.id) || 0;
      return {
        id: row.id,
        name: row.name,
        code: row.code || "",
        revenue,
        cost,
        grossProfit: revenue - cost,
        orders: Number(row.orders || 0),
      };
    });

    // Attach image files
    const storesWithFiles = await FileHelper.attachFilesToEntities(stores);

    return storesWithFiles;
  }

  // ============= SALES DASHBOARD =============
  /**
   * Get sales metrics (chỉ tính đơn bán, không có đơn hoàn)
   */
  async getSalesMetrics(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<{
    totalRevenue: number;
    totalRevenueWithTax: number;
    totalSalesTax: number;
    totalCost: number;
    grossProfit: number;
    grossProfitMargin: number;
    totalOrders: number;
    avgOrderValue: number;
    totalDiscount: number;
    discountRate: number;
  }> {
    // 1. Lấy metrics từ order_lines (bao gồm cả sale và sale_return để tính doanh thu thuần)
    let metricsQb = this.dataSource
      .createQueryBuilder(OrderLine, "ol")
      .leftJoin("ol.order", "o")
      .where("o.type IN (:...types)", {
        types: [OrderTypeEnum.SALE, OrderTypeEnum.SALE_RETURN],
      })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt });

    if (storeId) {
      metricsQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const lineMetrics = await metricsQb
      .select([
        'COALESCE(SUM(ol."netAmount"), 0) as "totalRevenue"',
        'COALESCE(SUM(ol."taxAmount"), 0) as "totalSalesTax"',
        'COALESCE(SUM(ol."discountAmount" + ol."orderDiscountAmount"), 0) as "totalDiscount"',
        'COALESCE(COUNT(DISTINCT o.id), 0) as "totalOrders"',
      ])
      .getRawOne();

    // 2. Lấy giá vốn từ inventory_transactions (bao gồm cả sale và sale_return để tính COGS chuẩn)
    let costQb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .leftJoin(Order, "o", 'o.id = it."refId"')
      .where('it."refType" IN (:...refTypes)', {
        refTypes: [InventoryRefTypeEnum.SALE, InventoryRefTypeEnum.SALE_RETURN],
      })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt });

    if (storeId) {
      costQb.andWhere('it."storeId" = :storeId', { storeId });
    }

    const costResult = await costQb
      .select([
        `
        COALESCE(SUM(
          CASE 
            WHEN it.type = :inType THEN -it.amount
            WHEN it.type = :outType THEN it.amount
          END
        ), 0) as cost
        `,
      ])
      .setParameters({
        inType: InventoryTransactionType.IN,
        outType: InventoryTransactionType.OUT,
      })
      .getRawOne();

    // Parse values
    const totalRevenue = Number(lineMetrics?.totalRevenue || 0);
    const totalSalesTax = Number(lineMetrics?.totalSalesTax || 0);
    const totalDiscount = Number(lineMetrics?.totalDiscount || 0);
    const totalOrders = Number(lineMetrics?.totalOrders || 0);
    const totalCost = Number(costResult?.cost || 0);

    // Calculate metrics
    const totalRevenueWithTax = totalRevenue + totalSalesTax;
    const grossProfit = totalRevenue - totalCost;
    const grossProfitMargin =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const discountRate =
      totalRevenue + totalDiscount > 0
        ? (totalDiscount / (totalRevenue + totalDiscount)) * 100
        : 0;

    return {
      totalRevenue,
      totalRevenueWithTax,
      totalSalesTax,
      totalCost,
      grossProfit,
      grossProfitMargin,
      totalOrders,
      avgOrderValue,
      totalDiscount,
      discountRate,
    };
  }

  /**
   * Get revenue by date for sales only (không có return)
   */
  async getSalesRevenueByDate(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<
    Array<{
      date: string;
      revenue: number;
      cost: number;
      profit: number;
      orders: number;
      avgOrderValue: number;
      productsSold: number;
    }>
  > {
    // 1. Lấy revenue từ orders (chỉ type = SALE)
    let revenueQb = this.dataSource
      .createQueryBuilder(Order, "o")
      .where("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt });

    if (storeId) {
      revenueQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const revenueData = await revenueQb
      .select([
        'DATE(o."orderAt") as date',
        'COALESCE(SUM(o."netAmount"), 0) as revenue',
        "COUNT(o.id) as orders",
      ])
      .groupBy('DATE(o."orderAt")')
      .getRawMany();

    // 2. Lấy cost từ inventory_transactions (chỉ refType = SALE)
    let costQb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .leftJoin(Order, "o", 'o.id = it."refId"')
      .where('it."refType" IN (:...refTypes)', {
        refTypes: [InventoryRefTypeEnum.SALE, InventoryRefTypeEnum.SALE_RETURN],
      })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt });

    if (storeId) {
      costQb.andWhere('it."storeId" = :storeId', { storeId });
    }

    const costData = await costQb
      .select([
        'DATE(o."orderAt") as date',
        `
        COALESCE(SUM(
          CASE 
            WHEN it.type = :inType THEN -it.amount
            WHEN it.type = :outType THEN it.amount
          END
        ), 0) as cost
        `,
      ])
      .setParameters({
        inType: InventoryTransactionType.IN,
        outType: InventoryTransactionType.OUT,
      })
      .groupBy('DATE(o."orderAt")')
      .getRawMany();

    // 3. Lấy số lượng sản phẩm bán ra theo ngày
    let soldQb = this.dataSource
      .createQueryBuilder(OrderLine, "ol")
      .leftJoin("ol.order", "o")
      .where("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt });

    if (storeId) {
      soldQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const soldData = await soldQb
      .select([
        'DATE(o."orderAt") as date',
        'COALESCE(SUM(ol.quantity), 0) as "productsSold"',
      ])
      .groupBy('DATE(o."orderAt")')
      .getRawMany();

    // 3. Merge revenue and cost data
    const dataMap = new Map<
      string,
      { revenue: number; cost: number; orders: number }
    >();

    revenueData.forEach((row) => {
      const dateStr = dayjs(row.date).format("DD/MM/YYYY");
      dataMap.set(dateStr, {
        revenue: Number(row.revenue || 0),
        cost: 0,
        orders: Number(row.orders || 0),
      });
    });

    costData.forEach((row) => {
      const dateStr = dayjs(row.date).format("DD/MM/YYYY");
      const existing = dataMap.get(dateStr) || {
        revenue: 0,
        cost: 0,
        orders: 0,
      };
      existing.cost = Number(row.cost || 0);
      dataMap.set(dateStr, existing);
    });

    const soldMap = new Map<string, number>();
    soldData.forEach((row) => {
      const dateStr = dayjs(row.date).format("DD/MM/YYYY");
      soldMap.set(dateStr, Number(row.productsSold || 0));
    });

    // 4. Generate all dates in range
    const start = dayjs(startAt).startOf("day");
    const end = dayjs(endAt).startOf("day");
    const allDates: Array<{
      date: string;
      revenue: number;
      cost: number;
      profit: number;
      orders: number;
      avgOrderValue: number;
      productsSold: number;
    }> = [];

    let current = start;
    while (current.isBefore(end) || current.isSame(end, "day")) {
      const dateStr = current.format("DD/MM/YYYY");
      const data = dataMap.get(dateStr) || { revenue: 0, cost: 0, orders: 0 };
      const profit = data.revenue - data.cost;
      const avgOrderValue = data.orders > 0 ? data.revenue / data.orders : 0;

      allDates.push({
        date: dateStr,
        revenue: data.revenue,
        cost: data.cost,
        profit,
        orders: data.orders,
        avgOrderValue,
        productsSold: soldMap.get(dateStr) || 0,
      });
      current = current.add(1, "day");
    }

    return allDates;
  }

  async getProductMetrics(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<ProductMetrics> {
    const totalProducts = await this.dataSource
      .createQueryBuilder(Product, "p")
      .where('p."createdAt" <= :endAt', { endAt })
      .andWhere('p."deletedAt" IS NULL')
      .getCount();

    const newProducts = await this.dataSource
      .createQueryBuilder(Product, "p")
      .where('p."createdAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('p."deletedAt" IS NULL')
      .getCount();

    let soldProductsQb = this.dataSource
      .createQueryBuilder(OrderLine, "ol")
      .leftJoin("ol.order", "o")
      .leftJoin(ProductVariant, "pv", 'pv.id = ol."productVariantId"')
      .where("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt });

    if (storeId) {
      soldProductsQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const soldProductsResult = await soldProductsQb
      .select('COUNT(DISTINCT pv."productId")', "totalSellingProducts")
      .getRawOne();

    let purchasedProductsQb = this.dataSource
      .createQueryBuilder(OrderLine, "ol")
      .leftJoin("ol.order", "o")
      .leftJoin(ProductVariant, "pv", 'pv.id = ol."productVariantId"')
      .where("o.type = :type", { type: OrderTypeEnum.PURCHASE })
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt });

    if (storeId) {
      purchasedProductsQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const purchasedProductsResult = await purchasedProductsQb
      .select('COUNT(DISTINCT pv."productId")', "totalPurchasedProducts")
      .getRawOne();

    const inventorySummary = await this.getInventoryClosingSummary(
      startAt,
      endAt,
      storeId,
    );

    let adjustmentQb = this.dataSource
      .createQueryBuilder(InventoryAdjustment, "ia")
      .where('ia."occurredAt" BETWEEN :startAt AND :endAt', { startAt, endAt });

    if (storeId) {
      adjustmentQb.andWhere('ia."storeId" = :storeId', { storeId });
    }

    const adjustmentResult = await adjustmentQb
      .select([
        'COALESCE(SUM(ia."totalAdjustmentQty"), 0) as "totalInventoryAdjustment"',
        'COALESCE(SUM(ia."totalAdjustmentValue"), 0) as "totalInventoryAdjustmentValue"',
      ])
      .getRawOne();

    return {
      totalProducts,
      productGrowth: 0,
      newProducts,
      newProductGrowth: 0,
      totalSellingProducts: Number(
        soldProductsResult?.totalSellingProducts || 0,
      ),
      sellingProductGrowth: 0,
      totalPurchasedProducts: Number(
        purchasedProductsResult?.totalPurchasedProducts || 0,
      ),
      purchasedProductGrowth: 0,
      totalEndingInventory: Number(inventorySummary.closingQty || 0),
      endingInventoryGrowth: 0,
      totalEndingInventoryValue: Number(inventorySummary.closingAmount || 0),
      endingInventoryValueGrowth: 0,
      totalInventoryAdjustment: Number(
        adjustmentResult?.totalInventoryAdjustment || 0,
      ),
      inventoryAdjustmentGrowth: 0,
      totalInventoryAdjustmentValue: Number(
        adjustmentResult?.totalInventoryAdjustmentValue || 0,
      ),
      inventoryAdjustmentValueGrowth: 0,
    };
  }

  async getProductById(productId: string): Promise<Product | null> {
    const product = await this.dataSource.getRepository(Product).findOne({
      where: { id: productId } as any,
      relations: {
        category: true,
        unit: true,
        variants: true,
      } as any,
    });

    if (!product) return null;
    return (await FileHelper.attachFilesToEntity(product)) as Product;
  }

  private async getProductInventoryAtDate(
    productId: string,
    date: Date,
    storeId?: string,
  ): Promise<{ qty: number; value: number }> {
    const qb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .innerJoin(ProductVariant, "pv", 'pv.id = it."productVariantId"')
      .where('pv."productId" = :productId', { productId })
      .andWhere('it."occurredAt" <= :date', { date });

    if (storeId) {
      qb.andWhere('it."storeId" = :storeId', { storeId });
    }

    const row = await qb
      .select([
        `
          COALESCE(SUM(
            CASE
              WHEN it.type = :inType THEN it.quantity
              WHEN it.type = :outType THEN -it.quantity
              ELSE 0
            END
          ), 0) as qty
        `,
        `
          COALESCE(SUM(
            CASE
              WHEN it.type = :inType THEN it.amount
              WHEN it.type = :outType THEN -it.amount
              ELSE 0
            END
          ), 0) as value
        `,
      ])
      .setParameters({
        inType: InventoryTransactionType.IN,
        outType: InventoryTransactionType.OUT,
      })
      .getRawOne();

    return {
      qty: Number(row?.qty || 0),
      value: Number(row?.value || 0),
    };
  }

  async getProductDetailMetrics(
    productId: string,
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<ProductDetailMetrics> {
    let revenueQb = this.dataSource
      .createQueryBuilder(OrderLine, "ol")
      .innerJoin("ol.order", "o")
      .innerJoin(ProductVariant, "pv", 'pv.id = ol."productVariantId"')
      .where('pv."productId" = :productId', { productId })
      .andWhere("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt });

    if (storeId) {
      revenueQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const revenueResult = await revenueQb
      .select([
        'COALESCE(SUM(ol."netAmount"), 0) as "totalRevenue"',
        'COALESCE(SUM(ol.quantity), 0) as "totalQuantitySold"',
        'COUNT(DISTINCT o.id) as "totalSoldOrders"',
      ])
      .getRawOne();

    let returnQb = this.dataSource
      .createQueryBuilder(OrderLine, "ol")
      .innerJoin("ol.order", "o")
      .innerJoin(ProductVariant, "pv", 'pv.id = ol."productVariantId"')
      .where('pv."productId" = :productId', { productId })
      .andWhere("o.type = :type", { type: OrderTypeEnum.SALE_RETURN })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt });

    if (storeId) {
      returnQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const returnResult = await returnQb
      .select(['COALESCE(SUM(ol.quantity), 0) as "returnedQuantity"'])
      .getRawOne();

    let costQb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .innerJoin(ProductVariant, "pv", 'pv.id = it."productVariantId"')
      .where('pv."productId" = :productId', { productId })
      .andWhere('it."refType" IN (:...refTypes)', {
        refTypes: [InventoryRefTypeEnum.SALE, InventoryRefTypeEnum.SALE_RETURN],
      })
      .andWhere('it."occurredAt" BETWEEN :startAt AND :endAt', {
        startAt,
        endAt,
      });

    if (storeId) {
      costQb.andWhere('it."storeId" = :storeId', { storeId });
    }

    const costResult = await costQb
      .select([
        `
        COALESCE(SUM(
          CASE
            WHEN it.type = :inType THEN -it.amount
            WHEN it.type = :outType THEN it.amount
            ELSE 0
          END
        ), 0) as "totalCost"
      `,
      ])
      .setParameters({
        inType: InventoryTransactionType.IN,
        outType: InventoryTransactionType.OUT,
      })
      .getRawOne();

    const inventory = await this.getProductInventoryAtDate(
      productId,
      endAt,
      storeId,
    );

    const totalRevenue = Number(revenueResult?.totalRevenue || 0);
    const totalQuantitySold = Number(revenueResult?.totalQuantitySold || 0);
    const totalSoldOrders = Number(revenueResult?.totalSoldOrders || 0);
    const returnedQuantity = Number(returnResult?.returnedQuantity || 0);
    const totalCost = Number(costResult?.totalCost || 0);
    const grossProfit = totalRevenue - totalCost;

    return {
      totalRevenue,
      revenueGrowth: 0,
      totalQuantitySold,
      quantitySoldGrowth: 0,
      totalCost,
      costGrowth: 0,
      grossProfit,
      grossProfitGrowth: 0,
      grossProfitMargin:
        totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
      totalSoldOrders,
      soldOrderGrowth: 0,
      returnedQuantity,
      returnedQuantityGrowth: 0,
      returnRate:
        totalQuantitySold > 0
          ? (returnedQuantity / totalQuantitySold) * 100
          : 0,
      averageSellingPrice:
        totalQuantitySold > 0 ? totalRevenue / totalQuantitySold : 0,
      averageCostPrice:
        totalQuantitySold > 0 ? totalCost / totalQuantitySold : 0,
      endingInventory: inventory.qty,
      endingInventoryGrowth: 0,
      endingInventoryValue: inventory.value,
      endingInventoryValueGrowth: 0,
    };
  }

  async getProductRevenueByDate(
    productId: string,
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<RevenueByDate[]> {
    let revenueQb = this.dataSource
      .createQueryBuilder(OrderLine, "ol")
      .innerJoin("ol.order", "o")
      .innerJoin(ProductVariant, "pv", 'pv.id = ol."productVariantId"')
      .where('pv."productId" = :productId', { productId })
      .andWhere("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', {
        startAt,
        endAt,
      });

    if (storeId) {
      revenueQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const revenueRows = await revenueQb
      .select([
        'DATE(o."orderAt") as date',
        'COALESCE(SUM(ol."netAmount"), 0) as revenue',
        'COALESCE(SUM(ol.quantity), 0) as "productsSold"',
        "COUNT(DISTINCT o.id) as orders",
      ])
      .groupBy('DATE(o."orderAt")')
      .orderBy("date", "ASC")
      .getRawMany();

    let costQb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .innerJoin(ProductVariant, "pv", 'pv.id = it."productVariantId"')
      .where('pv."productId" = :productId', { productId })
      .andWhere('it."refType" = :refType', {
        refType: InventoryRefTypeEnum.SALE,
      })
      .andWhere('it."occurredAt" BETWEEN :startAt AND :endAt', {
        startAt,
        endAt,
      });

    if (storeId) {
      costQb.andWhere('it."storeId" = :storeId', { storeId });
    }

    const costRows = await costQb
      .select([
        'DATE(it."occurredAt") as date',
        `COALESCE(SUM(
          CASE
            WHEN it.type = :inType THEN -it.amount
            WHEN it.type = :outType THEN it.amount
            ELSE 0
          END
        ), 0) as cost`,
      ])
      .setParameters({
        inType: InventoryTransactionType.IN,
        outType: InventoryTransactionType.OUT,
      })
      .groupBy('DATE(it."occurredAt")')
      .getRawMany();

    const dataMap = new Map<
      string,
      { revenue: number; cost: number; orders: number; productsSold: number }
    >();

    revenueRows.forEach((row) => {
      const dateStr = dayjs(row.date).format("DD/MM/YYYY");
      dataMap.set(dateStr, {
        revenue: Number(row.revenue || 0),
        cost: 0,
        orders: Number(row.orders || 0),
        productsSold: Number(row.productsSold || 0),
      });
    });

    costRows.forEach((row) => {
      const dateStr = dayjs(row.date).format("DD/MM/YYYY");
      const existing = dataMap.get(dateStr) || {
        revenue: 0,
        cost: 0,
        orders: 0,
        productsSold: 0,
      };
      existing.cost = Number(row.cost || 0);
      dataMap.set(dateStr, existing);
    });

    const start = dayjs(startAt).startOf("day");
    const end = dayjs(endAt).startOf("day");
    const results: RevenueByDate[] = [];

    let current = start;
    while (current.isBefore(end) || current.isSame(end, "day")) {
      const dateStr = current.format("DD/MM/YYYY");
      const row = dataMap.get(dateStr) || {
        revenue: 0,
        cost: 0,
        orders: 0,
        productsSold: 0,
      };
      const profit = row.revenue - row.cost;
      results.push({
        date: dateStr,
        revenue: row.revenue,
        cost: row.cost,
        profit,
        orders: row.orders,
        avgOrderValue: row.orders > 0 ? row.revenue / row.orders : 0,
        productsSold: row.productsSold,
      });
      current = current.add(1, "day");
    }

    return results;
  }

  async getProductSoldOrders(
    productId: string,
    startAt: Date,
    endAt: Date,
    storeId?: string,
    limit: number = 10,
  ): Promise<OrderSnapshot[]> {
    let qb = this.dataSource
      .createQueryBuilder(Order, "o")
      .innerJoin(OrderLine, "ol", 'ol."orderId" = o.id')
      .innerJoin(ProductVariant, "pv", 'pv.id = ol."productVariantId"')
      .where('pv."productId" = :productId', { productId })
      .andWhere("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt });

    if (storeId) {
      qb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const rows = await qb
      .select([
        'o."id" as id',
        'o."code" as code',
        'o."type" as type',
        'o."orderAt" as "orderAt"',
        'o."partnerSnapshot" as "partnerSnapshot"',
        'o."employeeSnapshot" as "employeeSnapshot"',
        'o."netAmount" as "netAmount"',
        'o."totalAmount" as "totalAmount"',
        'o."status" as status',
      ])
      .distinct(true)
      .orderBy('o."orderAt"', "DESC")
      .limit(limit)
      .getRawMany();

    return rows.map((order) => ({
      id: order.id,
      code: order.code,
      type: order.type,
      orderAt: order.orderAt,
      partnerSnapshot: order.partnerSnapshot,
      employeeSnapshot: order.employeeSnapshot,
      netAmount: Number(order.netAmount || 0),
      totalAmount: Number(order.totalAmount || 0),
      status: order.status,
    }));
  }

  async getDeadStockProducts(
    startAt: Date,
    endAt: Date,
    limit: number = 10,
    storeId?: string,
  ): Promise<DeadStockProduct[]> {
    const rows = await this.dataSource.query(
      `
      WITH sold_in_period AS (
        SELECT
          pv."productId" as "productId",
          COALESCE(SUM(ol.quantity), 0) as "soldQty"
        FROM order_lines ol
        INNER JOIN orders o ON o.id = ol."orderId"
        INNER JOIN product_variants pv ON pv.id = ol."productVariantId"
        WHERE o.type = 'sale'
          AND o.status = 'posted'
          AND o."orderAt" BETWEEN $1 AND $2
          ${storeId ? 'AND o."storeId" = $3' : ""}
          AND o."deletedAt" IS NULL
          AND ol."deletedAt" IS NULL
        GROUP BY pv."productId"
      ),
      last_sale AS (
        SELECT
          pv."productId" as "productId",
          MAX(o."orderAt") as "lastSoldDate"
        FROM order_lines ol
        INNER JOIN orders o ON o.id = ol."orderId"
        INNER JOIN product_variants pv ON pv.id = ol."productVariantId"
        WHERE o.type = 'sale'
          AND o.status = 'posted'
          AND o."orderAt" <= $2
          ${storeId ? 'AND o."storeId" = $3' : ""}
          AND o."deletedAt" IS NULL
          AND ol."deletedAt" IS NULL
        GROUP BY pv."productId"
      )
      SELECT
        p.id,
        p.name,
        COALESCE(${storeId ? "(COALESCE(p.\"stockMetadata\",'{}'::jsonb)->'byStore'-> ($3::text) ->> 'qty')::numeric" : "(COALESCE(p.\"stockMetadata\",'{}'::jsonb)->'total'->> 'qty')::numeric"}, 0) as "currentStock",
        COALESCE(${storeId ? "(COALESCE(p.\"stockMetadata\",'{}'::jsonb)->'byStore'-> ($3::text) ->> 'value')::numeric" : "(COALESCE(p.\"stockMetadata\",'{}'::jsonb)->'total'->> 'value')::numeric"}, 0) as "stockValue",
        ls."lastSoldDate",
        COALESCE(sp."soldQty", 0) as "soldQty"
      FROM products p
      LEFT JOIN sold_in_period sp ON sp."productId" = p.id
      LEFT JOIN last_sale ls ON ls."productId" = p.id
      WHERE p."deletedAt" IS NULL
        AND COALESCE(${storeId ? "(COALESCE(p.\"stockMetadata\",'{}'::jsonb)->'byStore'-> ($3::text) ->> 'qty')::numeric" : "(COALESCE(p.\"stockMetadata\",'{}'::jsonb)->'total'->> 'qty')::numeric"}, 0) > 0
        AND COALESCE(sp."soldQty", 0) = 0
      ORDER BY "stockValue" DESC
      LIMIT $${storeId ? "4" : "3"}
    `,
      storeId ? [startAt, endAt, storeId, limit] : [startAt, endAt, limit],
    );

    const products = rows.map((row: any) => {
      const lastSoldDate = row.lastSoldDate
        ? dayjs(row.lastSoldDate).format("DD/MM/YYYY")
        : "";
      const daysWithoutSale = row.lastSoldDate
        ? dayjs(endAt).diff(dayjs(row.lastSoldDate), "day")
        : dayjs(endAt).diff(dayjs(startAt), "day") + 1;

      let recommendation = "Discount";
      if (daysWithoutSale > 120) {
        recommendation = "Clearance";
      } else if (daysWithoutSale > 60) {
        recommendation = "Return to Supplier";
      }

      return {
        id: row.id,
        name: row.name,
        currentStock: Number(row.currentStock || 0),
        stockValue: Number(row.stockValue || 0),
        lastSoldDate,
        daysWithoutSale,
        recommendation,
      };
    });

    return FileHelper.attachFilesToEntities(products);
  }

  /**
   * Get revenue by product for sales only (không có return)
   * @deprecated No longer used in current dashboard design
   */
  async getSalesRevenueByProduct(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<
    Array<{
      id: string;
      name: string;
      code: string;
      album?: any[];
      revenue: number;
      quantity: number;
      cost: number;
      grossProfit: number;
    }>
  > {
    // 1. Lấy revenue và quantity từ order_lines (chỉ type = SALE)
    let revenueQb = this.dataSource
      .createQueryBuilder(OrderLine, "ol")
      .leftJoin("ol.order", "o")
      .leftJoin(ProductVariant, "pv", 'pv.id = ol."productVariantId"')
      .leftJoin(Product, "p", 'p.id = pv."productId"')
      .where("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt });

    if (storeId) {
      revenueQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const revenueResult = await revenueQb
      .select([
        'p."id"',
        'p."name"',
        'p."code"',
        'COALESCE(SUM(ol.quantity), 0) as "quantitySold"',
        'COALESCE(SUM(ol."netAmount"), 0) as revenue',
      ])
      .groupBy("p.id, p.name, p.code")
      .orderBy("revenue", "DESC")
      .getRawMany();

    const productIds = revenueResult.map((r) => r.id);

    if (productIds.length === 0) {
      return [];
    }

    // 2. Lấy cost từ inventory_transactions (chỉ refType = SALE)
    let costQb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .leftJoin(Order, "o", 'o.id = it."refId"')
      .leftJoin(ProductVariant, "pv", 'pv.id = it."productVariantId"')
      .leftJoin(Product, "p", 'p.id = pv."productId"')
      .where('it."refType" = :refType', { refType: InventoryRefTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('p."id" IN (:...productIds)', { productIds });

    if (storeId) {
      costQb.andWhere('it."storeId" = :storeId', { storeId });
    }

    const costResult = await costQb
      .select(['p."id"', "COALESCE(ABS(SUM(it.amount)), 0) as cost"])
      .groupBy('p."id"')
      .getRawMany();

    const costMap = new Map<string, number>();
    costResult.forEach((row) => {
      costMap.set(row.id, Number(row.cost || 0));
    });

    const products = revenueResult.map((row) => {
      const revenue = Number(row.revenue || 0);
      const cost = costMap.get(row.id) || 0;
      return {
        id: row.id,
        name: row.name,
        code: row.code || "",
        quantity: Number(row.quantitySold || 0),
        revenue,
        cost,
        grossProfit: revenue - cost,
      };
    });

    // Attach files
    const productsWithFiles = await FileHelper.attachFilesToEntities(products);

    return productsWithFiles;
  }

  /**
   * Get revenue by category for sales only (không có return)
   */
  async getSalesRevenueByCategory(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<
    Array<{
      id: string;
      name: string;
      revenue: number;
      cost: number;
      grossProfit: number;
      orders: number;
    }>
  > {
    const params: any[] = [startAt, endAt];

    const allCategories =
      await this.attributeRepository.aggregateAttributesByAncestors();

    let storeCondition = "";

    if (storeId) {
      storeCondition = `AND o."storeId" = $3`;
      params.push(storeId);
    }

    // 1️⃣ Lấy doanh thu group theo categoryId (chỉ type = SALE)
    const revenueRows = await this.dataSource.query(
      `
    SELECT 
      p."categoryId" as "categoryId",
      COALESCE(SUM(ol."netAmount"), 0) as revenue
    FROM "order_lines" ol
    INNER JOIN "orders" o ON o.id = ol."orderId"
      AND o."orderAt" BETWEEN $1 AND $2
      AND o.type = 'sale'
      AND o.status = 'posted'
      ${storeCondition}
    INNER JOIN "product_variants" pv ON pv.id = ol."productVariantId"
    INNER JOIN "products" p ON p.id = pv."productId"
    WHERE p."categoryId" IS NOT NULL
    GROUP BY p."categoryId"
  `,
      params,
    );

    // 2️⃣ Lấy giá vốn group theo categoryId (chỉ refType = SALE)
    const costRows = await this.dataSource.query(
      `
    SELECT 
      p."categoryId" as "categoryId",
      COALESCE(ABS(SUM(it.amount)), 0) as cost
    FROM "inventory_transactions" it
    INNER JOIN "orders" o ON o.id = it."refId"
      AND o."orderAt" BETWEEN $1 AND $2
      AND o.type = 'sale'
      AND o.status = 'posted'
      AND it."refType" = 'sale'
      ${storeCondition}
    INNER JOIN "product_variants" pv ON pv.id = it."productVariantId"
    INNER JOIN "products" p ON p.id = pv."productId"
    WHERE p."categoryId" IS NOT NULL
    GROUP BY p."categoryId"
  `,
      params,
    );

    // 3️⃣ Lấy số đơn hàng group theo categoryId (chỉ type = SALE)
    const orderRows = await this.dataSource.query(
      `
    SELECT 
      p."categoryId" as "categoryId",
      COUNT(DISTINCT o.id) as orders
    FROM "order_lines" ol
    INNER JOIN "orders" o ON o.id = ol."orderId"
      AND o."orderAt" BETWEEN $1 AND $2
      AND o.type = 'sale'
      AND o.status = 'posted'
      ${storeCondition}
    INNER JOIN "product_variants" pv ON pv.id = ol."productVariantId"
    INNER JOIN "products" p ON p.id = pv."productId"
    WHERE p."categoryId" IS NOT NULL
    GROUP BY p."categoryId"
  `,
      params,
    );

    const revenueMap = new Map<
      string,
      { revenue: number; cost: number; orders: number }
    >();

    for (const row of revenueRows) {
      revenueMap.set(row.categoryId, {
        revenue: Number(row.revenue || 0),
        cost: 0,
        orders: 0,
      });
    }

    for (const row of costRows) {
      const existing = revenueMap.get(row.categoryId) || {
        revenue: 0,
        cost: 0,
        orders: 0,
      };
      existing.cost = Number(row.cost || 0);
      revenueMap.set(row.categoryId, existing);
    }

    for (const row of orderRows) {
      const existing = revenueMap.get(row.categoryId) || {
        revenue: 0,
        cost: 0,
        orders: 0,
      };
      existing.orders = Number(row.orders || 0);
      revenueMap.set(row.categoryId, existing);
    }

    // 4️⃣ Gom theo familyIds (ancestor aggregation)
    const result = allCategories
      .filter((cat) => !cat.parentId) // chỉ lấy cấp 1
      .map((cat) => {
        let totalRevenue = 0;
        let totalCost = 0;
        let totalOrders = 0;

        for (const familyId of cat.familyIds) {
          const data = revenueMap.get(familyId) || {
            revenue: 0,
            cost: 0,
            orders: 0,
          };
          totalRevenue += data.revenue;
          totalCost += data.cost;
          totalOrders += data.orders;
        }

        return {
          id: cat.id,
          name: cat.name,
          revenue: totalRevenue,
          cost: totalCost,
          grossProfit: totalRevenue - totalCost,
          orders: totalOrders,
        };
      })
      .filter((item) => item.revenue > 0 || item.cost > 0);

    return result;
  }

  /**
   * Get revenue by partner for sales only (không có return)
   * @deprecated No longer used in current dashboard design
   */
  async getSalesRevenueByPartner(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<
    Array<{
      id: string;
      name: string;
      code: string;
      avatar?: any[];
      revenue: number;
      cost: number;
      grossProfit: number;
      orders: number;
    }>
  > {
    // 1. Lấy revenue từ orders (chỉ type = SALE)
    let revenueQb = this.dataSource
      .createQueryBuilder(Order, "o")
      .leftJoin(Partner, "p", 'p.id = o."partnerId"')
      .where("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('o."partnerId" IS NOT NULL');

    if (storeId) {
      revenueQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const revenueResult = await revenueQb
      .select([
        'p."id"',
        'p."name"',
        'p."code"',
        'COALESCE(SUM(o."netAmount"), 0) as revenue',
        "COUNT(o.id) as orders",
      ])
      .groupBy("p.id, p.name, p.code")
      .orderBy("revenue", "DESC")
      .getRawMany();

    const partnerIds = revenueResult.map((r) => r.id);

    if (partnerIds.length === 0) {
      return [];
    }

    // 2. Lấy cost từ inventory_transactions (chỉ refType = SALE)
    let costQb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .leftJoin(Order, "o", 'o.id = it."refId"')
      .leftJoin(Partner, "p", 'p.id = o."partnerId"')
      .where('it."refType" = :refType', { refType: InventoryRefTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('o."partnerId" IN (:...partnerIds)', { partnerIds });

    if (storeId) {
      costQb.andWhere('it."storeId" = :storeId', { storeId });
    }

    const costResult = await costQb
      .select(['p."id"', "COALESCE(ABS(SUM(it.amount)), 0) as cost"])
      .groupBy('p."id"')
      .getRawMany();

    const costMap = new Map<string, number>();
    costResult.forEach((row) => {
      costMap.set(row.id, Number(row.cost || 0));
    });

    const partners = revenueResult.map((row) => {
      const revenue = Number(row.revenue || 0);
      const cost = costMap.get(row.id) || 0;
      return {
        id: row.id,
        name: row.name,
        code: row.code || "",
        revenue,
        cost,
        grossProfit: revenue - cost,
        orders: Number(row.orders || 0),
      };
    });

    // Attach avatar files
    const partnersWithFiles = await FileHelper.attachFilesToEntities(partners);

    return partnersWithFiles;
  }

  /**
   * Get revenue by employee for sales only (không có return)
   */
  async getSalesRevenueByEmployee(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<RevenueByEmployee[]> {
    // 1. Lấy revenue từ orders (chỉ type = SALE)
    let revenueQb = this.dataSource
      .createQueryBuilder(Order, "o")
      .leftJoin(Employee, "e", 'e.id = o."employeeId"')
      .where("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('o."employeeId" IS NOT NULL');

    if (storeId) {
      revenueQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const revenueResult = await revenueQb
      .select([
        'e."id"',
        'e."name"',
        'e."code"',
        'COALESCE(SUM(o."netAmount"), 0) as revenue',
        "COUNT(o.id) as orders",
      ])
      .groupBy("e.id, e.name, e.code")
      .orderBy("revenue", "DESC")
      .getRawMany();

    const employeeIds = revenueResult.map((r) => r.id);

    if (employeeIds.length === 0) {
      return [];
    }

    // 2. Lấy cost từ inventory_transactions (chỉ refType = SALE)
    let costQb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .leftJoin(Order, "o", 'o.id = it."refId"')
      .leftJoin(Employee, "e", 'e.id = o."employeeId"')
      .where('it."refType" = :refType', { refType: InventoryRefTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('o."employeeId" IN (:...employeeIds)', { employeeIds });

    if (storeId) {
      costQb.andWhere('it."storeId" = :storeId', { storeId });
    }

    const costResult = await costQb
      .select(['e."id"', "COALESCE(ABS(SUM(it.amount)), 0) as cost"])
      .groupBy('e."id"')
      .getRawMany();

    const costMap = new Map<string, number>();
    costResult.forEach((row) => {
      costMap.set(row.id, Number(row.cost || 0));
    });

    const employees = revenueResult.map((row) => {
      const revenue = Number(row.revenue || 0);
      const cost = costMap.get(row.id) || 0;
      return {
        id: row.id,
        name: row.name,
        code: row.code || "",
        revenue,
        cost,
        grossProfit: revenue - cost,
        orders: Number(row.orders || 0),
      };
    });

    // Attach avatar files
    const employeesWithFiles =
      await FileHelper.attachFilesToEntities(employees);

    return employeesWithFiles;
  }

  /**
   * Get revenue by store for sales only (không có return)
   * Only meaningful for global view (when storeId is not provided)
   */
  async getSalesRevenueByStore(
    startAt: Date,
    endAt: Date,
  ): Promise<RevenueByStore[]> {
    // 1. Lấy revenue từ orders (chỉ type = SALE)
    const revenueQb = this.dataSource
      .createQueryBuilder(Order, "o")
      .leftJoin(Store, "s", 's.id = o."storeId"')
      .where("o.type = :type", { type: OrderTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('o."storeId" IS NOT NULL');

    const revenueResult = await revenueQb
      .select([
        's."id"',
        's."name"',
        's."code"',
        'COALESCE(SUM(o."netAmount"), 0) as revenue',
        "COUNT(o.id) as orders",
      ])
      .groupBy("s.id, s.name, s.code")
      .orderBy("revenue", "DESC")
      .getRawMany();

    const storeIds = revenueResult.map((r) => r.id);

    if (storeIds.length === 0) {
      return [];
    }

    // 2. Lấy cost từ inventory_transactions (chỉ refType = SALE)
    const costQb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .leftJoin(Order, "o", 'o.id = it."refId"')
      .leftJoin(Store, "s", 's.id = it."storeId"')
      .where('it."refType" = :refType', { refType: InventoryRefTypeEnum.SALE })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt })
      .andWhere('it."storeId" IN (:...storeIds)', { storeIds });

    const costResult = await costQb
      .select(['s."id"', "COALESCE(ABS(SUM(it.amount)), 0) as cost"])
      .groupBy('s."id"')
      .getRawMany();

    const costMap = new Map<string, number>();
    costResult.forEach((row) => {
      costMap.set(row.id, Number(row.cost || 0));
    });

    const stores = revenueResult.map((row) => {
      const revenue = Number(row.revenue || 0);
      const cost = costMap.get(row.id) || 0;
      return {
        id: row.id,
        name: row.name,
        code: row.code || "",
        revenue,
        cost,
        grossProfit: revenue - cost,
        orders: Number(row.orders || 0),
      };
    });

    // Attach image files
    const storesWithFiles = await FileHelper.attachFilesToEntities(stores);

    return storesWithFiles;
  }

  /**
   * Lấy dữ liệu bán hàng chi tiết theo ngày cho Excel export
   * Bao gồm: số đơn, tiền hàng, giảm giá hàng, giảm giá đơn, doanh thu thuần,
   * phí giao hàng, tiền thuế, tổng doanh thu, giá vốn
   */
  async getDailySalesDetail(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<
    Array<{
      date: string;
      orderCount: number;
      grossAmount: number;
      lineDiscount: number;
      orderDiscount: number;
      netAmount: number;
      shippingFee: number;
      taxAmount: number;
      totalAmount: number;
      cost: number;
    }>
  > {
    // 1. Dữ liệu đơn hàng theo ngày (SALE + SALE_RETURN, POSTED)
    let orderQb = this.dataSource
      .createQueryBuilder(Order, "o")
      .where("o.type IN (:...types)", {
        types: [OrderTypeEnum.SALE, OrderTypeEnum.SALE_RETURN],
      })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt });

    if (storeId) {
      orderQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const orderData = await orderQb
      .select([
        'DATE(o."orderAt") as date',
        "COUNT(o.id) as orderCount",
        'COALESCE(SUM(o."grossAmount"), 0) as "grossAmount"',
        'COALESCE(SUM(o."lineDiscountAmount"), 0) as "lineDiscount"',
        'COALESCE(SUM(o."orderDiscountAmount"), 0) as "orderDiscount"',
        'COALESCE(SUM(o."netAmount"), 0) as "netAmount"',
        'COALESCE(SUM(o."shippingFee"), 0) as "shippingFee"',
        'COALESCE(SUM(o."taxAmount"), 0) as "taxAmount"',
        'COALESCE(SUM(o."totalAmount"), 0) as "totalAmount"',
      ])
      .groupBy('DATE(o."orderAt")')
      .orderBy("date", "ASC")
      .getRawMany();

    // 2. Giá vốn theo ngày từ inventory transactions
    let costQb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .where('it."refType" IN (:...refTypes)', {
        refTypes: [InventoryRefTypeEnum.SALE, InventoryRefTypeEnum.SALE_RETURN],
      })
      .andWhere('it."occurredAt" BETWEEN :startAt AND :endAt', {
        startAt,
        endAt,
      });

    if (storeId) {
      costQb.andWhere('it."storeId" = :storeId', { storeId });
    }

    const costData = await costQb
      .select([
        'DATE(it."occurredAt") as date',
        `
        COALESCE(SUM(
          CASE 
            WHEN it.type = :inType THEN -it.amount
            WHEN it.type = :outType THEN it.amount
          END
        ), 0) as cost
        `,
      ])
      .setParameters({
        inType: InventoryTransactionType.IN,
        outType: InventoryTransactionType.OUT,
      })
      .groupBy('DATE(it."occurredAt")')
      .getRawMany();

    // Map cost by date
    const costMap = new Map<string, number>();
    costData.forEach((row) => {
      const dateStr = dayjs(row.date).format("DD/MM/YYYY");
      costMap.set(dateStr, Number(row.cost || 0));
    });

    // Map order data by date
    const dataMap = new Map<
      string,
      {
        orderCount: number;
        grossAmount: number;
        lineDiscount: number;
        orderDiscount: number;
        netAmount: number;
        shippingFee: number;
        taxAmount: number;
        totalAmount: number;
      }
    >();
    orderData.forEach((row) => {
      const dateStr = dayjs(row.date).format("DD/MM/YYYY");
      dataMap.set(dateStr, {
        orderCount: Number(row.orderCount || 0),
        grossAmount: Number(row.grossAmount || 0),
        lineDiscount: Number(row.lineDiscount || 0),
        orderDiscount: Number(row.orderDiscount || 0),
        netAmount: Number(row.netAmount || 0),
        shippingFee: Number(row.shippingFee || 0),
        taxAmount: Number(row.taxAmount || 0),
        totalAmount: Number(row.totalAmount || 0),
      });
    });

    // Generate all dates in range
    const start = dayjs(startAt).startOf("day");
    const end = dayjs(endAt).startOf("day");
    const result: Array<{
      date: string;
      orderCount: number;
      grossAmount: number;
      lineDiscount: number;
      orderDiscount: number;
      netAmount: number;
      shippingFee: number;
      taxAmount: number;
      totalAmount: number;
      cost: number;
    }> = [];

    let current = start;
    while (current.isBefore(end) || current.isSame(end, "day")) {
      const dateStr = current.format("DD/MM/YYYY");
      const data = dataMap.get(dateStr) || {
        orderCount: 0,
        grossAmount: 0,
        lineDiscount: 0,
        orderDiscount: 0,
        netAmount: 0,
        shippingFee: 0,
        taxAmount: 0,
        totalAmount: 0,
      };
      result.push({
        date: dateStr,
        ...data,
        cost: costMap.get(dateStr) || 0,
      });
      current = current.add(1, "day");
    }

    return result;
  }

  /**
   * Lấy dữ liệu lợi nhuận chi tiết theo ngày cho Excel export
   * Bao gồm đầy đủ các thành phần: doanh thu, giá vốn, chi phí, điều chỉnh
   */
  async getDailyProfitDetail(
    startAt: Date,
    endAt: Date,
    storeId?: string,
  ): Promise<
    Array<{
      date: string;
      salesRevenue: number;
      cogs: number;
      shippingExpense: number;
      otherIncome: number;
      otherExpense: number;
      inventoryAdjustment: number;
      partnerDebtAdjustment: number;
      fundAdjustment: number;
    }>
  > {
    // 1. Doanh thu bán hàng + phí vận chuyển theo ngày
    let saleQb = this.dataSource
      .createQueryBuilder(Order, "o")
      .where("o.type IN (:...types)", {
        types: [OrderTypeEnum.SALE, OrderTypeEnum.SALE_RETURN],
      })
      .andWhere('o."status" = :postedStatus', {
        postedStatus: OrderStatusEnum.POSTED,
      })
      .andWhere('o."orderAt" IS NOT NULL')
      .andWhere('o."orderAt" BETWEEN :startAt AND :endAt', { startAt, endAt });

    if (storeId) {
      saleQb.andWhere('o."storeId" = :storeId', { storeId });
    }

    const saleData = await saleQb
      .select([
        'DATE(o."orderAt") as date',
        'COALESCE(SUM(o."netAmount"), 0) as "salesRevenue"',
        'COALESCE(SUM(o."shippingFee"), 0) as "shippingExpense"',
      ])
      .groupBy('DATE(o."orderAt")')
      .orderBy("date", "ASC")
      .getRawMany();

    // 2. Giá vốn theo ngày
    let costQb = this.dataSource
      .createQueryBuilder(InventoryTransaction, "it")
      .where('it."refType" IN (:...refTypes)', {
        refTypes: [InventoryRefTypeEnum.SALE, InventoryRefTypeEnum.SALE_RETURN],
      })
      .andWhere('it."occurredAt" BETWEEN :startAt AND :endAt', {
        startAt,
        endAt,
      });

    if (storeId) {
      costQb.andWhere('it."storeId" = :storeId', { storeId });
    }

    const costData = await costQb
      .select([
        'DATE(it."occurredAt") as date',
        `
        COALESCE(SUM(
          CASE 
            WHEN it.type = :inType THEN -it.amount
            WHEN it.type = :outType THEN it.amount
          END
        ), 0) as cogs
        `,
      ])
      .setParameters({
        inType: InventoryTransactionType.IN,
        outType: InventoryTransactionType.OUT,
      })
      .groupBy('DATE(it."occurredAt")')
      .getRawMany();

    // 3. Thu khác theo ngày
    let incomeQb = this.dataSource
      .createQueryBuilder(IncomeExpense, "ie")
      .where("ie.type = :type", { type: IncomeExpenseTypeEnum.INCOME })
      .andWhere('ie."occurredAt" BETWEEN :startAt AND :endAt', {
        startAt,
        endAt,
      })
      .andWhere('ie."partnerId" IS NULL')
      .andWhere('ie."orderId" IS NULL')
      .andWhere('ie."deletedAt" IS NULL');

    if (storeId) {
      incomeQb.andWhere('ie."storeId" = :storeId', { storeId });
    }

    const incomeData = await incomeQb
      .select([
        'DATE(ie."occurredAt") as date',
        'COALESCE(SUM(ie.amount), 0) as "otherIncome"',
      ])
      .groupBy('DATE(ie."occurredAt")')
      .getRawMany();

    // 4. Chi phí khác theo ngày
    let expenseQb = this.dataSource
      .createQueryBuilder(IncomeExpense, "ie")
      .where("ie.type = :type", { type: IncomeExpenseTypeEnum.EXPENSE })
      .andWhere('ie."occurredAt" BETWEEN :startAt AND :endAt', {
        startAt,
        endAt,
      })
      .andWhere('ie."partnerId" IS NULL')
      .andWhere('ie."orderId" IS NULL')
      .andWhere('ie."deletedAt" IS NULL');

    if (storeId) {
      expenseQb.andWhere('ie."storeId" = :storeId', { storeId });
    }

    const expenseData = await expenseQb
      .select([
        'DATE(ie."occurredAt") as date',
        'COALESCE(SUM(ie.amount), 0) as "otherExpense"',
      ])
      .groupBy('DATE(ie."occurredAt")')
      .getRawMany();

    // 5. Điều chỉnh tồn kho theo ngày
    let inventoryAdjQb = this.dataSource
      .createQueryBuilder(InventoryAdjustment, "ia")
      .where('ia."occurredAt" BETWEEN :startAt AND :endAt', {
        startAt,
        endAt,
      })
      .andWhere('ia."isInitial" = :isInitial', { isInitial: false });

    if (storeId) {
      inventoryAdjQb.andWhere('ia."storeId" = :storeId', { storeId });
    }

    const inventoryAdjData = await inventoryAdjQb
      .select([
        'DATE(ia."occurredAt") as date',
        'COALESCE(SUM(ia."totalAdjustmentValue"), 0) as "inventoryAdjustment"',
      ])
      .groupBy('DATE(ia."occurredAt")')
      .getRawMany();

    // 6. Điều chỉnh công nợ theo ngày (có xét side)
    let debtAdjQb = this.dataSource
      .createQueryBuilder(PartnerDebtAdjustment, "pda")
      .where('pda."occurredAt" BETWEEN :startAt AND :endAt', {
        startAt,
        endAt,
      })
      .andWhere('pda."isInitial" = :isInitial', { isInitial: false });

    if (storeId) {
      debtAdjQb.andWhere('pda."storeId" = :storeId', { storeId });
    }

    const debtAdjData = await debtAdjQb
      .select([
        'DATE(pda."occurredAt") as date',
        `
        COALESCE(SUM(
          CASE 
            WHEN pda.side = :receivableSide AND pda.direction = :increase THEN pda."deltaAmount"
            WHEN pda.side = :receivableSide AND pda.direction = :decrease THEN -pda."deltaAmount"
            WHEN pda.side = :payableSide AND pda.direction = :decrease THEN pda."deltaAmount"
            WHEN pda.side = :payableSide AND pda.direction = :increase THEN -pda."deltaAmount"
          END
        ), 0) as "partnerDebtAdjustment"
        `,
      ])
      .setParameters({
        increase: DebtDirectionEnum.INCREASE,
        decrease: DebtDirectionEnum.DECREASE,
        receivableSide: PartnerDebtSideEnum.RECEIVABLE,
        payableSide: PartnerDebtSideEnum.PAYABLE,
      })
      .groupBy('DATE(pda."occurredAt")')
      .getRawMany();

    // 7. Điều chỉnh quỹ theo ngày
    let fundAdjQb = this.dataSource
      .createQueryBuilder(FundAdjustment, "fa")
      .innerJoin(Fund, "f", 'f.id = fa."fundId"')
      .where('fa."occurredAt" BETWEEN :startAt AND :endAt', {
        startAt,
        endAt,
      })
      .andWhere('fa."isInitial" = :isInitial', { isInitial: false });

    if (storeId) {
      fundAdjQb.andWhere('f."storeId" = :storeId', { storeId });
    }

    const fundAdjData = await fundAdjQb
      .select([
        'DATE(fa."occurredAt") as date',
        `
        COALESCE(SUM(
          CASE 
            WHEN fa.direction = :increase THEN fa."deltaAmount"
            WHEN fa.direction = :decrease THEN -fa."deltaAmount"
          END
        ), 0) as "fundAdjustment"
        `,
      ])
      .setParameters({
        increase: FundTransactionType.INCREASE,
        decrease: FundTransactionType.DECREASE,
      })
      .groupBy('DATE(fa."occurredAt")')
      .getRawMany();

    // Build maps for each dataset
    const saleMap = new Map<
      string,
      { salesRevenue: number; shippingExpense: number }
    >();
    saleData.forEach((row) => {
      const dateStr = dayjs(row.date).format("DD/MM/YYYY");
      saleMap.set(dateStr, {
        salesRevenue: Number(row.salesRevenue || 0),
        shippingExpense: Number(row.shippingExpense || 0),
      });
    });

    const costMap = new Map<string, number>();
    costData.forEach((row) => {
      const dateStr = dayjs(row.date).format("DD/MM/YYYY");
      costMap.set(dateStr, Number(row.cogs || 0));
    });

    const incomeMap = new Map<string, number>();
    incomeData.forEach((row) => {
      const dateStr = dayjs(row.date).format("DD/MM/YYYY");
      incomeMap.set(dateStr, Number(row.otherIncome || 0));
    });

    const expenseMap = new Map<string, number>();
    expenseData.forEach((row) => {
      const dateStr = dayjs(row.date).format("DD/MM/YYYY");
      expenseMap.set(dateStr, Number(row.otherExpense || 0));
    });

    const inventoryAdjMap = new Map<string, number>();
    inventoryAdjData.forEach((row) => {
      const dateStr = dayjs(row.date).format("DD/MM/YYYY");
      inventoryAdjMap.set(dateStr, Number(row.inventoryAdjustment || 0));
    });

    const debtAdjMap = new Map<string, number>();
    debtAdjData.forEach((row) => {
      const dateStr = dayjs(row.date).format("DD/MM/YYYY");
      debtAdjMap.set(dateStr, Number(row.partnerDebtAdjustment || 0));
    });

    const fundAdjMap = new Map<string, number>();
    fundAdjData.forEach((row) => {
      const dateStr = dayjs(row.date).format("DD/MM/YYYY");
      fundAdjMap.set(dateStr, Number(row.fundAdjustment || 0));
    });

    // Generate all dates in range
    const start = dayjs(startAt).startOf("day");
    const end = dayjs(endAt).startOf("day");
    const result: Array<{
      date: string;
      salesRevenue: number;
      cogs: number;
      shippingExpense: number;
      otherIncome: number;
      otherExpense: number;
      inventoryAdjustment: number;
      partnerDebtAdjustment: number;
      fundAdjustment: number;
    }> = [];

    let current = start;
    while (current.isBefore(end) || current.isSame(end, "day")) {
      const dateStr = current.format("DD/MM/YYYY");
      const sale = saleMap.get(dateStr) || {
        salesRevenue: 0,
        shippingExpense: 0,
      };
      result.push({
        date: dateStr,
        salesRevenue: sale.salesRevenue,
        cogs: costMap.get(dateStr) || 0,
        shippingExpense: sale.shippingExpense,
        otherIncome: incomeMap.get(dateStr) || 0,
        otherExpense: expenseMap.get(dateStr) || 0,
        inventoryAdjustment: inventoryAdjMap.get(dateStr) || 0,
        partnerDebtAdjustment: debtAdjMap.get(dateStr) || 0,
        fundAdjustment: fundAdjMap.get(dateStr) || 0,
      });
      current = current.add(1, "day");
    }

    return result;
  }
}
