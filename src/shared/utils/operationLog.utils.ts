import { Request } from "express";
import DatabaseConfig from "@/config/database";
import {
  OperationLog,
  OperationChangeItem,
  OperationErrorItem,
} from "@/database/models/OperationLog";
import logger from "./logger";
import { UserSnapshot } from "../base/BaseEntity";

export type OperationAction = "create" | "update" | "delete" | (string & {});

export interface WriteOperationLogParams {
  req?: Request;
  action: OperationAction;
  targetEntity: string;
  targetId?: string | null;
  requestBody?: Record<string, unknown> | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  success?: boolean;
  error?: unknown;
  metadata?: Record<string, unknown> | null;
  markRequestLogged?: boolean;
}

export interface FinalizeOperationLogParams {
  logId?: string | null;
  targetId?: string | null;
  requestBody?: Record<string, unknown> | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  success: boolean;
  error?: unknown;
  metadata?: Record<string, unknown> | null;
  creatorId?: string | null;
  creator?: UserSnapshot | null;
}

export class OperationLogUtils {
  static async createOperationLog(
    params: WriteOperationLogParams,
  ): Promise<string | null> {
    try {
      if (!DatabaseConfig.isInitialized) return null;

      const repo = DatabaseConfig.getRepository(OperationLog);

      const userContext = params.req?.userContext || null;
      const creator = userContext?.userSnapshot || null;

      const before = this.toOperationRecord(params.before);
      const after = this.toOperationRecord(params.after);

      const changes = this.computeChanges(before, after);
      const endpoint = this.resolveEndpoint(params.req);

      const payload = {
        action: params.action,
        targetEntity: params.targetEntity,
        targetId: params.targetId || null,
        requestBody: this.toOperationRecord(params.requestBody),
        targetSnapshot: after || before || null,
        changes,
        companyId: params.req?.companyContext?.companyId || null,
        creatorId: userContext?.userId || null,
        creatorSnapshot: creator,
        requestId: (params.req?.headers["x-request-id"] as string) || null,
        method: params.req?.method || null,
        endpoint,
        ipAddress: params.req?.ip || null,
        userAgent: params.req?.headers["user-agent"] || null,
        success: params.success ?? false,
        error: this.serializeOperationError(params.error),
        metadata: this.toOperationRecord(params.metadata),
      };

      const saved = await repo.save(repo.create(payload));

      if (params.req && params.markRequestLogged) {
        OperationLogUtils.markRequestLogged(params.req);
      }

      return saved.id;
    } catch (error) {
      logger.error("[OperationLog] Failed to create operation log", error);
      return null;
    }
  }

  static async finalizeOperationLog(
    params: FinalizeOperationLogParams,
  ): Promise<void> {
    try {
      if (!DatabaseConfig.isInitialized || !params.logId) return;

      const repo = DatabaseConfig.getRepository(OperationLog);
      const log = await repo.findOne({ where: { id: params.logId } });
      if (!log) return;

      log.success = params.success;

      if (params.targetId !== undefined) {
        log.targetId = params.targetId || null;
      }

      if (params.requestBody !== undefined) {
        log.requestBody = this.toOperationRecord(params.requestBody);
      }

      if (params.before !== undefined || params.after !== undefined) {
        const before = this.toOperationRecord(params.before);
        const after = this.toOperationRecord(params.after);

        log.targetSnapshot = after || before || null;
        log.changes = this.computeChanges(before, after);
      }

      if (params.metadata !== undefined) {
        log.metadata = this.toOperationRecord(params.metadata);
      }

      log.error = this.serializeOperationError(params.error);
      log.creatorId = params.creatorId || log.creatorId;
      log.creatorSnapshot = params.creator || log.creatorSnapshot;

      await repo.save(log);
    } catch (error) {
      logger.error("[OperationLog] Failed to finalize operation log", error);
    }
  }

  static async writeOperationLog(
    params: WriteOperationLogParams,
  ): Promise<void> {
    await this.createOperationLog({
      ...params,
      success: params.success ?? true,
    });
  }

  static toOperationRecord(value: unknown): Record<string, unknown> | null {
    if (!this.isObjectLike(value)) return null;

    try {
      return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  static enrichRequestBodyWithRelations(
    requestBody: Record<string, unknown> | null,
    persistedData: Record<string, unknown> | null,
  ): Record<string, unknown> | null {
    if (!requestBody) return null;
    if (!persistedData) return requestBody;

    const output = this.toOperationRecord(requestBody);
    if (!output) return requestBody;

    this.mergeRelationObjects(output, persistedData);
    return output;
  }

  static mergeRelationObjects(
    requestNode: unknown,
    persistedNode: unknown,
  ): void {
    if (Array.isArray(requestNode) && Array.isArray(persistedNode)) {
      requestNode.forEach((item, index) => {
        this.mergeRelationObjects(item, persistedNode[index]);
      });
      return;
    }

    if (!this.isObjectLike(requestNode) || !this.isObjectLike(persistedNode))
      return;

    const requestObj = requestNode as Record<string, unknown>;
    const persistedObj = persistedNode as Record<string, unknown>;

    for (const key of Object.keys(requestObj)) {
      if (key.endsWith("Id") && key.length > 2) {
        const relationKey = key.slice(0, -2);
        const relationValue = persistedObj[relationKey];

        if (
          requestObj[relationKey] === undefined &&
          this.isObjectLike(relationValue)
        ) {
          requestObj[relationKey] = this.toOperationRecord(relationValue);
        }
      }

      this.mergeRelationObjects(requestObj[key], persistedObj[key]);
    }
  }

  static resolveEndpoint(req?: Request): string | null {
    if (!req) return null;
    return `${req.baseUrl || ""}${req.route?.path || req.path || ""}` || null;
  }

  static serializeOperationError(error: unknown): OperationErrorItem | null {
    if (!error) return null;

    if (error instanceof Error) {
      const errWithMeta = error as Error & {
        statusCode?: number;
        code?: string | number;
        errors?: unknown;
      };

      return {
        name: error.name,
        message: error.message,
        statusCode: errWithMeta.statusCode,
        code: errWithMeta.code,
        errors: errWithMeta.errors,
        stack: error.stack,
      };
    }

    if (typeof error === "string") {
      return { message: error };
    }

    if (this.isObjectLike(error)) {
      const payload = error as Record<string, unknown>;
      return {
        name: typeof payload.name === "string" ? payload.name : undefined,
        message:
          typeof payload.message === "string"
            ? payload.message
            : "Unknown error",
        statusCode:
          typeof payload.statusCode === "number"
            ? payload.statusCode
            : undefined,
        code:
          typeof payload.code === "string" || typeof payload.code === "number"
            ? (payload.code as string | number)
            : undefined,
        errors: payload.errors,
      };
    }

    return { message: "Unknown error" };
  }

  static computeChanges(
    before: Record<string, unknown> | null,
    after: Record<string, unknown> | null,
  ): OperationChangeItem[] | null {
    if (!before && !after) return null;

    const result: OperationChangeItem[] = [];
    const walk = (prev: unknown, next: unknown, path: string): void => {
      if (this.isPrimitive(prev) || this.isPrimitive(next)) {
        if (!this.isEqual(prev, next)) {
          result.push({ path, before: prev, after: next });
        }
        return;
      }

      if (Array.isArray(prev) || Array.isArray(next)) {
        if (!this.isEqual(prev, next)) {
          result.push({ path, before: prev, after: next });
        }
        return;
      }

      const prevObj = (prev as Record<string, unknown>) || {};
      const nextObj = (next as Record<string, unknown>) || {};
      const keys = new Set([...Object.keys(prevObj), ...Object.keys(nextObj)]);

      for (const key of keys) {
        const childPath = path ? `${path}.${key}` : key;
        walk(prevObj[key], nextObj[key], childPath);
      }
    };

    walk(before, after, "");

    return result.length > 0 ? result : null;
  }

  static isPrimitive(value: unknown): boolean {
    return (
      value === null ||
      value === undefined ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    );
  }

  static isObjectLike(value: unknown): boolean {
    return value !== null && value !== undefined && typeof value === "object";
  }

  static isEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  private static markRequestLogged(req: Request): void {
    (
      req as Request & { __operationLogHandled?: boolean }
    ).__operationLogHandled = true;
  }
}
