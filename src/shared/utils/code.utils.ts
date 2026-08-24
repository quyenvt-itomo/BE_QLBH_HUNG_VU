import { Request, Response } from "express";
import { EntityTarget, ObjectLiteral } from "typeorm";
import DatabaseConfig from "@/config/database";
import { ValidationError } from "../types/errors";
import { ErrorsMessages } from "../constants/errors";
import logger from "./logger";
import { appDayjs } from "./dayjs.util";
import { Attribute } from "@/database/models/Attribute";
import { DebtAdjustment } from "@/database/models/DebtAdjustment";
import { File } from "@/database/models/File";
import { Fund } from "@/database/models/Fund";
import { FundAdjustment } from "@/database/models/FundAdjustment";
import { FundTransfer } from "@/database/models/FundTransfer";
import { Partner } from "@/database/models/Partner";
import { Product } from "@/database/models/Product";
import { Role } from "@/database/models/Role";
import { Store } from "@/database/models/Store";
import { StoreTransfer } from "@/database/models/StoreTransfer";
import { User } from "@/database/models/User";
import { VatAdjustment } from "@/database/models/VatDebtAdjustment";
import { IncomeExpense } from "@/database/models/store/IncomeExpense";
import { InventoryAdjustment } from "@/database/models/store/InventoryAdjustment";
import { Order, OrderType } from "@/database/models/store/Order";
import { ProductPriceHistory } from "@/database/models/store/ProductPriceHistory";

type ResetPeriod = "none" | "yearly" | "monthly";
type CodeConfig = {
  entity: EntityTarget<ObjectLiteral>;
  prefix: string;
  length: number;
  resetPeriod: ResetPeriod;
  global?: boolean;
};

/**
 * Code definitions for the current model only.
 * Multiple business types may intentionally share one entity (for example
 * income/expense and the four order types), but each type has its own prefix.
 */
export const codeConfig: Record<string, CodeConfig> = {
  user: {
    entity: User,
    prefix: "ND",
    length: 4,
    resetPeriod: "none",
    global: true,
  },

  store: {
    entity: Store,
    prefix: "CH",
    length: 3,
    resetPeriod: "none",
    global: true,
  },

  partner: {
    entity: Partner,
    prefix: "DT",
    length: 5,
    resetPeriod: "none",
    global: true,
  },
  customer: {
    entity: Partner,
    prefix: "KH",
    length: 6,
    resetPeriod: "none",
    global: true,
  },
  supplier: {
    entity: Partner,
    prefix: "NCC",
    length: 3,
    resetPeriod: "none",
    global: true,
  },
  shipper: {
    entity: Partner,
    prefix: "ĐVVC",
    length: 3,
    resetPeriod: "none",
    global: true,
  },

  product: {
    entity: Product,
    prefix: "SP",
    length: 5,
    resetPeriod: "none",
    global: true,
  },
  pricehistory: {
    entity: ProductPriceHistory,
    prefix: "GVC",
    length: 4,
    resetPeriod: "monthly",
  },
  fund: {
    entity: Fund,
    prefix: "QTK",
    length: 2,
    resetPeriod: "none",
    global: true,
  },
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

  incomeexpense: {
    entity: IncomeExpense,
    prefix: "PTC",
    length: 3,
    resetPeriod: "monthly",
  },
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
  inventoryadjustment: {
    entity: InventoryAdjustment,
    prefix: "DKK",
    length: 3,
    resetPeriod: "monthly",
  },
  storetransfer: {
    entity: StoreTransfer,
    prefix: "PCK",
    length: 3,
    resetPeriod: "monthly",
    global: true,
  },
  order: { entity: Order, prefix: "DH", length: 4, resetPeriod: "monthly" },
  sale: { entity: Order, prefix: "HĐ", length: 4, resetPeriod: "monthly" },
  salereturn: {
    entity: Order,
    prefix: "HĐT",
    length: 4,
    resetPeriod: "monthly",
  },
  purchase: { entity: Order, prefix: "MH", length: 4, resetPeriod: "monthly" },
  purchasereturn: {
    entity: Order,
    prefix: "THN",
    length: 4,
    resetPeriod: "monthly",
  },
  debtadjustment: {
    entity: DebtAdjustment,
    prefix: "DCN",
    length: 3,
    resetPeriod: "monthly",
  },
  vatadjustment: {
    entity: VatAdjustment,
    prefix: "DCVAT",
    length: 3,
    resetPeriod: "monthly",
  },
};

export function getEntityByType(
  type: string,
): EntityTarget<ObjectLiteral> | undefined {
  return codeConfig[type.trim().toLowerCase()]?.entity;
}

function getConfig(type: string): CodeConfig {
  const config = codeConfig[type.trim().toLowerCase()];
  if (!config)
    throw new ValidationError(`Không tìm thấy cấu hình mã cho loại "${type}"`);
  return config;
}

function getPeriodInfo(period: ResetPeriod) {
  const now = appDayjs();
  const yy = now.format("YY");
  const mm = now.format("MM");
  if (period === "yearly") return { periodKey: yy, codePrefix: yy };
  if (period === "monthly")
    return { periodKey: `${yy}${mm}`, codePrefix: `${yy}${mm}` };
  return { periodKey: "global", codePrefix: "" };
}

async function getNextSequence(
  key: string,
  periodKey: string,
): Promise<number> {
  const seqName = `code_seq_${key}_${periodKey}`.replace(/[^a-zA-Z0-9_]/g, "_");
  await DatabaseConfig.query(
    `CREATE SEQUENCE IF NOT EXISTS "${seqName}" START 1;`,
  );
  const result = await DatabaseConfig.query(
    `SELECT nextval('"${seqName}"') as value;`,
  );
  return Number(result[0].value);
}

export async function generateCode(
  type: string,
  storeId?: string,
): Promise<string> {
  try {
    const config = getConfig(type);
    const { periodKey, codePrefix } = getPeriodInfo(config.resetPeriod);
    const normalized = type.trim().toLowerCase();
    const key =
      !config.global && storeId ? `${normalized}_${storeId}` : normalized;
    const sequence = await getNextSequence(key, periodKey);
    const running = String(sequence).padStart(config.length, "0");
    return config.resetPeriod === "none"
      ? `${config.prefix}-${running}`
      : `${config.prefix}-${codePrefix}-${running}`;
  } catch (error) {
    logger.error("Code generation error:", error);
    throw error;
  }
}

export async function getCode(req: Request, res: Response) {
  try {
    const type = req.query.type as string;
    const storeId = req.query.storeId as string | undefined;
    if (!type) {
      return res.status(400).json({
        message: "type.required",
        errors: [{ field: "type", code: ErrorsMessages.required }],
      });
    }
    const code = await generateCode(type, storeId);
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
    .map((c) => (/[A-Z]/.test(c) ? (c.charCodeAt(0) - 64).toString() : c))
    .join("");
}

export { OrderType };
