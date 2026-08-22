import { Request, Response } from "express";
import { EntityTarget, ObjectLiteral } from "typeorm";
import { ValidationError } from "../types/errors";
import DatabaseConfig from "@/config/database";
import { ErrorsMessages } from "../constants/errors";
import logger from "./logger";
import { Employee } from "@/database/models/store/Employee";
import { Store } from "@/database/models/Store";
import { User } from "@/database/models/User";
import { Product } from "@/database/models/Product";
import { Partner } from "@/database/models/Partner";
import { Order } from "@/database/models/store/Order";
import { PartnerDebtAdjustment } from "@/database/models/store/PartnerDebtAdjustment";
import { VatDebtAdjustment } from "@/database/models/store/VatDebtAdjustment";
import { PartnerDebtOffset } from "@/database/models/store/PartnerDebtOffset";
import { InventoryAdjustment } from "@/database/models/store/InventoryAdjustment";
import { StoreTransfer } from "@/database/models/StoreTransfer";
import { FundAdjustment } from "@/database/models/FundAdjustment";
import { FundTransfer } from "@/database/models/FundTransfer";
import { IncomeExpense } from "@/database/models/store/IncomeExpense";
import { Fund } from "@/database/models/Fund";
import { LoyaltyPointAdjustment } from "@/database/models/LoyaltyPointAdjustment";
import { Shift } from "@/database/models/store/Shift";

export const prefixMap = new Map<
  EntityTarget<ObjectLiteral>,
  { prefix: string; length: number }
>([
  [Store, { prefix: "ST", length: 3 }],
  [User, { prefix: "U", length: 3 }],
  [Product, { prefix: "PR", length: 5 }],
  [Partner, { prefix: "PA", length: 5 }],
  [StoreTransfer, { prefix: "STF", length: 5 }],
  [Fund, { prefix: "FD", length: 2 }],
  [FundAdjustment, { prefix: "FA", length: 5 }],
  [FundTransfer, { prefix: "FT", length: 5 }],
  [LoyaltyPointAdjustment, { prefix: "LPADJ", length: 5 }],

  [Employee, { prefix: "EMP", length: 3 }],
  [Order, { prefix: "O", length: 5 }],

  [InventoryAdjustment, { prefix: "IA", length: 6 }],
  [PartnerDebtAdjustment, { prefix: "PDA", length: 5 }],
  [PartnerDebtOffset, { prefix: "PDO", length: 5 }],
  [VatDebtAdjustment, { prefix: "VDA", length: 5 }],

  [IncomeExpense, { prefix: "IE", length: 5 }],

  [Shift, { prefix: "SH", length: 5 }],
]);

export const exceptionMap = new Map<string, { prefix: string; length: number }>(
  [
    ["partner.customer", { prefix: "C", length: 5 }],
    ["partner.supplier", { prefix: "S", length: 5 }],

    ["order.purchase", { prefix: "PU", length: 6 }],
    ["order.sale", { prefix: "SA", length: 6 }],
    ["order.purchasereturn", { prefix: "PRN", length: 6 }],
    ["order.salereturn", { prefix: "SRN", length: 6 }],

    ["incomeexpense.income", { prefix: "INC", length: 5 }],
    ["incomeexpense.expense", { prefix: "EXP", length: 5 }],
  ],
);

// Map type đặc biệt về entity
const typeToEntityMap = new Map<string, EntityTarget<ObjectLiteral>>([
  ["customer", Partner],
  ["supplier", Partner],

  ["purchase", Order],
  ["sale", Order],
  ["purchasereturn", Order],
  ["salereturn", Order],

  ["income", IncomeExpense],
  ["expense", IncomeExpense],
]);

export const getEntityByType = (
  type: string,
): EntityTarget<ObjectLiteral> | undefined => {
  const normalizedType = type.toLowerCase();

  // Check trong typeToEntityMap trước
  if (typeToEntityMap.has(normalizedType)) {
    return typeToEntityMap.get(normalizedType);
  }

  return [...prefixMap.keys()].find((key) => {
    if (typeof key === "string") {
      return (
        key.toLowerCase() === normalizedType ||
        key.toLowerCase() + "s" === normalizedType
      );
    }

    if (typeof key === "function" && "name" in key) {
      return (
        key.name.toLowerCase() === normalizedType ||
        key.name.toLowerCase() + "s" === normalizedType
      );
    }

    return false;
  });
};

function getConfig(entity: EntityTarget<ObjectLiteral>, type?: string) {
  if (type) {
    const entityName =
      typeof entity === "function" && "name" in entity
        ? entity.name.toLowerCase()
        : String(entity).toLowerCase();

    const exceptionKey = `${entityName}.${type.toLowerCase()}`;
    if (exceptionMap.has(exceptionKey)) {
      return exceptionMap.get(exceptionKey)!;
    }
  }

  const config = prefixMap.get(entity);
  if (!config) {
    throw <ValidationError>{
      message: "type.invalid",
      errors: [
        {
          code: ErrorsMessages.invalid,
          field: "type",
        },
      ],
    };
  }

  return config;
}

async function getNextSequence(key: string): Promise<number> {
  const seqName = `code_seq_${key
    .replace(/\./g, "_")
    .replace(/-/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")}`;

  await DatabaseConfig.query(
    `CREATE SEQUENCE IF NOT EXISTS "${seqName}" START 1;`,
  );

  const result = await DatabaseConfig.query(
    `SELECT nextval('"${seqName}"') as value;`,
  );
  console.log({
    seqName,
  });
  return Number(result[0].value);
}

export const generateCode = async <T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  type?: string,
): Promise<string> => {
  const config = getConfig(entity, type);
  const { prefix, length } = config;

  const entityName =
    typeof entity === "function" && "name" in entity
      ? entity.name.toLowerCase()
      : String(entity).toLowerCase();

  const key = type ? `${entityName}.${type.toLowerCase()}` : `${entityName}`;

  const nextNumber = await getNextSequence(key);

  return `${prefix}${String(nextNumber).padStart(length, "0")}`;
};

export async function getCode(req: Request, res: Response) {
  try {
    const type = req.query.type as string;

    if (!type) {
      return res.status(400).json({
        message: "type.required",
        errors: [
          {
            field: "type",
            code: ErrorsMessages.required,
          },
        ],
      });
    }

    const entity = getEntityByType(type);
    if (!entity) {
      return res.status(400).json({
        message: "type.invalid",
        errors: [
          {
            code: ErrorsMessages.invalid,
            field: "type",
          },
        ],
      });
    }

    const code = await generateCode(entity, type);
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
