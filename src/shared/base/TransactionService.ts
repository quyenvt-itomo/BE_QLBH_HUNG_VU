import DatabaseConfig from "@/config/database";
import { injectable } from "inversify";
import {
  Brackets,
  EntityManager,
  ObjectLiteral,
  SelectQueryBuilder,
} from "typeorm";
import { OPERATOR_MAP, rangeSuffixes } from "../types/interfaces";

@injectable()
export class TransactionService {
  async getManager(): Promise<EntityManager> {
    return DatabaseConfig.manager;
  }

  checkArrayFilter(value?: any): boolean {
    return value && Array.isArray(value) && value.length > 0;
  }

  getSnapshotDates(fromDate: Date, toDate?: Date): Date[] {
    const snapshotDates: Date[] = [];
    const now = new Date();
    const startDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    const endDate = toDate
      ? new Date(toDate.getFullYear(), toDate.getMonth(), 1)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    for (
      let dt = startDate;
      dt <= endDate;
      dt = new Date(dt.getFullYear(), dt.getMonth() + 1, 1)
    ) {
      snapshotDates.push(new Date(dt));
    }
    return snapshotDates;
  }

  public checkCondition(condition: any) {
    return condition !== undefined && typeof condition === "number";
  }

  protected applyRangeFilter<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    params: Record<string, any>,
    fields: string[],
    alias: string,
  ) {
    Object.entries(params).forEach(([key, value]) => {
      if (value == null || value === "") return;

      const suffix = rangeSuffixes.find((s) => key.endsWith(s));
      if (!suffix) return;

      const field = key.slice(0, -suffix.length);
      if (!fields.includes(field)) return;

      const column = qb.expressionMap.mainAlias?.metadata.findColumnWithPropertyName(field);
      const columnType =
        typeof column?.type === "string" ? column.type.toLowerCase() : "";
      const isDateColumn =
        column?.type === Date ||
        columnType === "date" ||
        columnType.includes("timestamp");

      // Date ranges chỉ có ý nghĩa với Gte/Lte.
      if (isDateColumn && !["Gte", "Lte"].includes(suffix)) return;

      let normalizedValue = value;
      if (isDateColumn && !(value instanceof Date)) {
        const parsedDate = new Date(value);
        if (Number.isNaN(parsedDate.getTime())) return;
        normalizedValue = parsedDate;
      }

      const operator = OPERATOR_MAP[suffix];
      const paramName = `${field}_${suffix}`;

      qb.andWhere(`${alias}."${field}" ${operator} :${paramName}`, {
        [paramName]: normalizedValue,
      });
    });
  }

  protected applyKeywordSearch(
    qb: SelectQueryBuilder<any>,
    keyword: string | undefined,
    fields: string[],
    alias: string,
    options?: {
      similarityThreshold?: number;
    },
  ) {
    if (!keyword) return;

    const threshold = options?.similarityThreshold ?? 0.7;

    qb.andWhere(
      new Brackets((subQb) => {
        fields.forEach((field, index) => {
          const fullField = `${alias}.${field}`;

          const simCond = `similarity(unaccent(CAST(${fullField} AS text)), unaccent(:kw)) > :threshold`;
          const likeCond = `unaccent(CAST(${fullField} AS text)) ILIKE unaccent(:likeKw)`;

          const condition = `(${simCond} OR ${likeCond})`;

          if (index === 0) {
            subQb.where(condition);
          } else {
            subQb.orWhere(condition);
          }
        });
      }),
    );

    qb.setParameters({
      kw: keyword,
      likeKw: `%${keyword}%`,
      threshold,
    });
  }
}
