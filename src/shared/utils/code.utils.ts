import { Request, Response } from "express";
import { EntityTarget, ObjectLiteral } from "typeorm";
import { ValidationError } from "../types/errors";
import DatabaseConfig from "@/config/database";
import { ErrorsMessages } from "../constants/errors";
import logger from "./logger";
import { Organization } from "@/database/models/Organization";
import { User } from "@/database/models/User";
import { Attribute } from "@/database/models/Attribute";
import { Partner } from "@/database/models/company/Partner";
import { Product } from "@/database/models/company/Product";
import { BillOfMaterial } from "@/database/models/company/BillOfMaterial";
import { Employee } from "@/database/models/company/Employee";
import { Fund } from "@/database/models/company/Fund";
import { FundAdjustment } from "@/database/models/company/FundAdjustment";
import { FundTransfer } from "@/database/models/company/FundTransfer";
import { IncomeExpense } from "@/database/models/company/IncomeExpense";
import { InventoryAdjustment } from "@/database/models/company/InventoryAdjustment";
import { Order } from "@/database/models/company/Order";
import { PartnerDebtOffset } from "@/database/models/company/PartnerDebtOffset";
import { PartnerDebtAdjustment } from "@/database/models/company/PartnerDebtAdjustment";
import { Production } from "@/database/models/company/Production";
import { Purchase } from "@/database/models/company/Purchase";
import { StockDocument } from "@/database/models/company/StockDocument";
import { Warehouse } from "@/database/models/company/Warehouse";
import { WarehouseTransfer } from "@/database/models/company/WarehouseTransfer";
import { Service } from "@/database/models/company/Service";
import { PaymentTerm } from "@/database/models/company/PaymentTerm";
import { appDayjs } from "./dayjs.util";
import { PurchaseRequisition } from "@/database/models/company/PurchaseRequisition";
import { PurchaseQuotation } from "@/database/models/company/PurchaseQuotation";
import { Quotation } from "@/database/models/company/Quotation";
import { QuotationRequest } from "@/database/models/company/QuotationRequest";
import { ShippingPlan } from "@/database/models/company/ShippingPlan";

type ResetPeriod = "none" | "yearly" | "monthly";

type CodeConfig = {
  entity: EntityTarget<ObjectLiteral>;
  prefix: string;
  length: number;
  resetPeriod: ResetPeriod;
  /** true = mã toàn hệ thống, bỏ qua companyId dù có truyền. Mặc định false. */
  global?: boolean;
};

const codeConfig: Record<string, CodeConfig> = {
  // ──── Toàn hệ thống (global) ────
  user: {
    entity: User,
    prefix: "ND",
    length: 4,
    resetPeriod: "none",
    global: true,
  },
  organization: {
    entity: Organization,
    prefix: "ORG",
    length: 3,
    resetPeriod: "none",
    global: true,
  },
  attribute: {
    entity: Attribute,
    prefix: "TT",
    length: 5,
    resetPeriod: "none",
    global: true,
  },
  role: {
    entity: Attribute,
    prefix: "VT",
    length: 3,
    resetPeriod: "none",
    global: true,
  },

  // ──── Theo công ty ────
  employee: { entity: Employee, prefix: "NV", length: 4, resetPeriod: "none" },
  paymentterm: {
    entity: PaymentTerm,
    prefix: "DKTT",
    length: 3,
    resetPeriod: "none",
  },
  partner: { entity: Partner, prefix: "DT", length: 5, resetPeriod: "none" },
  product: { entity: Product, prefix: "HH", length: 5, resetPeriod: "none" },
  service: { entity: Service, prefix: "DV", length: 4, resetPeriod: "none" },
  bom: {
    entity: BillOfMaterial,
    prefix: "BOM",
    length: 4,
    resetPeriod: "none",
  },
  warehouse: {
    entity: Warehouse,
    prefix: "KHO",
    length: 3,
    resetPeriod: "none",
  },

  // ──── Quỹ ────
  fund: { entity: Fund, prefix: "QTK", length: 2, resetPeriod: "none" },
  fundadjustment: {
    entity: FundAdjustment,
    prefix: "DCQ",
    length: 3,
    resetPeriod: "monthly",
  },
  fundtransfer: {
    entity: FundTransfer,
    prefix: "CQ",
    length: 3,
    resetPeriod: "monthly",
  },

  // ──── Thu / Chi ────
  income: {
    entity: IncomeExpense,
    prefix: "PT",
    length: 3,
    resetPeriod: "monthly",
  },
  expense: {
    entity: IncomeExpense,
    prefix: "PC",
    length: 3,
    resetPeriod: "monthly",
  },

  // ──── Kho ────
  stockdocument: {
    entity: StockDocument,
    prefix: "PXNK",
    length: 3,
    resetPeriod: "monthly",
  },
  purchasereceipt: {
    entity: StockDocument,
    prefix: "PNM",
    length: 3,
    resetPeriod: "monthly",
  },
  materialissue: {
    entity: StockDocument,
    prefix: "PXVT",
    length: 3,
    resetPeriod: "monthly",
  },
  orderissue: {
    entity: StockDocument,
    prefix: "PXB",
    length: 3,
    resetPeriod: "monthly",
  },
  productionreceipt: {
    entity: StockDocument,
    prefix: "PNTP",
    length: 3,
    resetPeriod: "monthly",
  },

  inventoryin: {
    entity: StockDocument,
    prefix: "PNK",
    length: 3,
    resetPeriod: "monthly",
  },
  inventoryout: {
    entity: StockDocument,
    prefix: "PXK",
    length: 3,
    resetPeriod: "monthly",
  },
  inventoryadjustment: {
    entity: InventoryAdjustment,
    prefix: "DKK",
    length: 3,
    resetPeriod: "monthly",
  },
  warehousetransfer: {
    entity: WarehouseTransfer,
    prefix: "PCK",
    length: 3,
    resetPeriod: "monthly",
  },

  // ──── Kinh doanh
  quotationrequest: {
    entity: QuotationRequest,
    prefix: "ĐNBG",
    length: 3,
    resetPeriod: "monthly",
  },
  quotation: {
    entity: Quotation,
    prefix: "BG",
    length: 3,
    resetPeriod: "monthly",
  },
  order: { entity: Order, prefix: "DH", length: 3, resetPeriod: "monthly" },
  purchaserequisition: {
    entity: PurchaseRequisition,
    prefix: "PĐN",
    length: 3,
    resetPeriod: "monthly",
  },
  purchase: {
    entity: Purchase,
    prefix: "MH",
    length: 3,
    resetPeriod: "monthly",
  },
  purchasequotation: {
    entity: PurchaseQuotation,
    prefix: "NCC-BG",
    length: 3,
    resetPeriod: "monthly",
  },
  production: {
    entity: Production,
    prefix: "LSX",
    length: 3,
    resetPeriod: "monthly",
  },
  partnerdebtoffset: {
    entity: PartnerDebtOffset,
    prefix: "DTCN",
    length: 2,
    resetPeriod: "monthly",
  },
  partnerdebtadjustment: {
    entity: PartnerDebtAdjustment,
    prefix: "DCN",
    length: 3,
    resetPeriod: "monthly",
  },
  shippingplan: {
    entity: ShippingPlan,
    prefix: "PA",
    length: 3,
    resetPeriod: "monthly",
  },
};

export const getEntityByType = (
  type: string,
): EntityTarget<ObjectLiteral> | undefined => {
  const normalized = type.toLowerCase();
  return codeConfig[normalized]?.entity;
};

function getPeriodInfo(period: ResetPeriod = "none") {
  const now = appDayjs();

  const yy = now.format("YY");
  const mm = now.format("MM");

  switch (period) {
    case "yearly":
      return { periodKey: yy, codePrefix: yy };
    case "monthly":
      return { periodKey: `${yy}${mm}`, codePrefix: `${yy}${mm}` };
    default:
      return { periodKey: "global", codePrefix: "" };
  }
}

function getConfig(type: string): CodeConfig {
  const normalized = type.toLowerCase();
  const config = codeConfig[normalized];

  if (!config) {
    throw new ValidationError(`Không tìm thấy cấu hình mã cho loại "${type}"`);
  }

  return config;
}

async function getNextSequence(
  key: string,
  periodKey: string,
): Promise<number> {
  const seqName = `code_seq_${key}_${periodKey}`
    .replace(/\./g, "_")
    .replace(/-/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "");

  await DatabaseConfig.query(
    `CREATE SEQUENCE IF NOT EXISTS "${seqName}" START 1;`,
  );

  const result = await DatabaseConfig.query(
    `SELECT nextval('"${seqName}"') as value;`,
  );

  return Number(result[0].value);
}

export const generateCode = async (
  type: string,
  companyId?: string,
): Promise<string> => {
  try {
    const { prefix, length, resetPeriod = "none", global } = getConfig(type);

    const baseKey = type.toLowerCase();
    // global entity: luôn dùng key toàn cục, bỏ qua companyId
    const key = !global && companyId ? `${baseKey}_${companyId}` : baseKey;

    const { periodKey, codePrefix } = getPeriodInfo(resetPeriod);

    const nextNumber = await getNextSequence(key, periodKey);

    const runningCode = String(nextNumber).padStart(length, "0");

    switch (resetPeriod) {
      case "yearly":
      case "monthly":
        return `${prefix}-${codePrefix}-${runningCode}`;
      default:
        return `${prefix}-${runningCode}`;
    }
  } catch (error) {
    logger.error("Code generation error:", error);
    throw error;
  }
};

export async function getCode(req: Request, res: Response) {
  try {
    const type = req.query.type as string;
    const companyId = req.query.companyId as string | undefined;

    if (!type) {
      return res.status(400).json({
        message: "type.required",
        errors: [{ field: "type", code: ErrorsMessages.required }],
      });
    }

    const code = await generateCode(type, companyId);

    return res.json({
      statusCode: 200,
      data: { code },
      success: true,
      message: "code.generated",
    });
  } catch (error) {
    logger.error("Get code error:", error);
    return res.status(500).json({
      message: (error as any).message || "server.error",
      errors: (error as any).errors || [],
    });
  }
}

export function alphaNumericToNumber(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => {
      if (/[A-Z]/.test(c)) return (c.charCodeAt(0) - 64).toString();
      return c;
    })
    .join("");
}
