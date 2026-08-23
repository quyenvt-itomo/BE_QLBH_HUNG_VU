import { Request } from "express";
import { UserSnapshot } from "../base/BaseEntity";

export type OperationAction = "create" | "update" | "delete" | (string & {});
export interface WriteOperationLogParams { req?: Request; action: OperationAction; targetEntity: string; targetId?: string | null; requestBody?: Record<string, unknown> | null; before?: Record<string, unknown> | null; after?: Record<string, unknown> | null; success?: boolean; error?: unknown; metadata?: Record<string, unknown> | null; markRequestLogged?: boolean; }
export interface FinalizeOperationLogParams { logId?: string | null; targetId?: string | null; requestBody?: Record<string, unknown> | null; before?: Record<string, unknown> | null; after?: Record<string, unknown> | null; success: boolean; error?: unknown; metadata?: Record<string, unknown> | null; creatorId?: string | null; creator?: UserSnapshot | null; }

/** OperationLog is intentionally not an entity in the current model. */
export class OperationLogUtils {
  static async createOperationLog(_params: WriteOperationLogParams): Promise<string | null> { return null; }
  static async finalizeOperationLog(_params: FinalizeOperationLogParams): Promise<void> {}
  static async writeOperationLog(params: WriteOperationLogParams): Promise<void> { await this.createOperationLog(params); }
  static toOperationRecord(value: unknown): Record<string, unknown> | null { if (!value || typeof value !== "object") return null; try { return JSON.parse(JSON.stringify(value)); } catch { return null; } }
  static enrichRequestBodyWithRelations(requestBody: Record<string, unknown> | null, _persistedData: Record<string, unknown> | null): Record<string, unknown> | null { return requestBody; }
  static markRequestLogged(_req: Request): void {}
}
