import Bull, { Job } from "bull";
import { Response } from "express";
import { config } from "@/config/env";
import logger from "@/shared/utils/logger";
import { container } from "@/config/container";
import {
  INVENTORY_TYPES,
  InventoryRecalculateService,
} from "@/modules/inventory";
import { InventoryRefTypeEnum } from "@/shared/constants/enum";

export interface InventoryRecalculateSource {
  sourceType?: InventoryRefTypeEnum | string;
  refId?: string;
}

export interface InventoryRecalculateTaskPayload {
  variantId: string;
  storeId: string;
  fromDate: Date | string;
  source?: InventoryRecalculateSource;
}

interface InventoryRecalculateQueueJobData {
  key: string;
  variantId: string;
  storeId: string;
  fromDate: string; // ISO string — bắt buộc để cross-process worker có đủ data
}

interface PendingTask {
  key: string;
  variantId: string;
  storeId: string;
  fromDate: Date;
  sources: Map<string, InventoryRecalculateSource>;
}

interface QueueStatsSummary {
  totalVariants: number;
  pendingVariants: number;
  processingVariants: number;
  byDocumentType: {
    saleOrders: number;
    purchaseOrders: number;
    purchaseReturns: number;
    saleReturns: number;
    transferVouchers: number;
    adjustmentVouchers: number;
    unknown: number;
  };
}

class InventoryRecalculateQueue {
  private queue: Bull.Queue<InventoryRecalculateQueueJobData> | null = null;
  private initialized = false;

  private pendingTasks = new Map<string, PendingTask>();
  private activeTasks = new Map<string, PendingTask>();
  private sseClients = new Set<Response>();

  private readonly SSE_HEARTBEAT_MS = 15000;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  private readonly LOG_INTERVAL_MS = 15000;
  private logTimer: NodeJS.Timeout | null = null;

  private getService(): InventoryRecalculateService {
    return container.get<InventoryRecalculateService>(
      INVENTORY_TYPES.InventoryRecalculateService,
    );
  }

  private buildKey(variantId: string, storeId: string): string {
    return `${variantId}:${storeId}`;
  }

  private normalizeDate(value: Date | string): Date {
    const normalized = new Date(value);
    normalized.setMilliseconds(0);
    return normalized;
  }

  private normalizeSourceType(sourceType?: string): string {
    if (!sourceType) return "unknown";
    return sourceType.toLowerCase();
  }

  private toPriority(fromDate: Date): number {
    // Ưu tiên mốc gần hiện tại trước để phản hồi nhanh trên màn hình báo cáo.
    const now = Date.now();
    const ageInMinutes = Math.max(
      0,
      Math.floor((now - fromDate.getTime()) / (60 * 1000)),
    );
    return Math.min(2_000_000, ageInMinutes + 1);
  }

  private mergeTask(
    prev: PendingTask | undefined,
    payload: InventoryRecalculateTaskPayload,
  ): PendingTask {
    const normalizedFromDate = this.normalizeDate(payload.fromDate);

    const merged: PendingTask = prev
      ? {
          ...prev,
          fromDate:
            normalizedFromDate < prev.fromDate
              ? normalizedFromDate
              : prev.fromDate,
          sources: new Map(prev.sources),
        }
      : {
          key: this.buildKey(payload.variantId, payload.storeId),
          variantId: payload.variantId,
          storeId: payload.storeId,
          fromDate: normalizedFromDate,
          sources: new Map<string, InventoryRecalculateSource>(),
        };

    const normalizedSourceType = this.normalizeSourceType(
      payload.source?.sourceType,
    );
    const sourceId = payload.source?.refId || merged.key;
    const sourceKey = `${normalizedSourceType}:${sourceId}`;
    merged.sources.set(sourceKey, {
      sourceType: normalizedSourceType,
      refId: payload.source?.refId,
    });

    return merged;
  }

  private async upsertQueueJob(task: PendingTask): Promise<void> {
    if (!this.queue) {
      throw new Error("InventoryRecalculateQueue is not started");
    }

    const existing = await this.queue.getJob(task.key);
    if (existing) {
      const state = await existing.getState();
      if (state !== "active") {
        try {
          await existing.remove();
        } catch (error) {
          logger.warn(
            `[InventoryRecalculateQueue] Cannot remove existing waiting job key=${task.key}: ${
              (error as Error)?.message || error
            }`,
          );
        }
      } else {
        return;
      }
    }

    await this.queue.add(
      {
        key: task.key,
        variantId: task.variantId,
        storeId: task.storeId,
        fromDate: task.fromDate.toISOString(),
      },
      {
        jobId: task.key,
        delay: 1200,
        priority: this.toPriority(task.fromDate),
      },
    );
  }

  private getStats(): QueueStatsSummary {
    const allTasks = [
      ...this.pendingTasks.values(),
      ...this.activeTasks.values(),
    ];

    const saleOrders = new Set<string>();
    const purchaseOrders = new Set<string>();
    const purchaseReturns = new Set<string>();
    const saleReturns = new Set<string>();
    const transferVouchers = new Set<string>();
    const adjustmentVouchers = new Set<string>();
    const unknown = new Set<string>();

    for (const task of allTasks) {
      for (const [sourceKey, source] of task.sources.entries()) {
        const type = this.normalizeSourceType(source.sourceType);

        if (type === InventoryRefTypeEnum.SALE) {
          saleOrders.add(sourceKey);
          continue;
        }

        if (type === InventoryRefTypeEnum.PURCHASE) {
          purchaseOrders.add(sourceKey);
          continue;
        }

        if (type === InventoryRefTypeEnum.PURCHASE_RETURN) {
          purchaseReturns.add(sourceKey);
          continue;
        }

        if (type === InventoryRefTypeEnum.SALE_RETURN) {
          saleReturns.add(sourceKey);
          continue;
        }

        if (type === InventoryRefTypeEnum.TRANSFER) {
          transferVouchers.add(sourceKey);
          continue;
        }

        if (type === InventoryRefTypeEnum.ADJUST) {
          adjustmentVouchers.add(sourceKey);
          continue;
        }

        unknown.add(sourceKey);
      }
    }

    return {
      totalVariants: allTasks.length,
      pendingVariants: this.pendingTasks.size,
      processingVariants: this.activeTasks.size,
      byDocumentType: {
        saleOrders: saleOrders.size,
        purchaseOrders: purchaseOrders.size,
        purchaseReturns: purchaseReturns.size,
        saleReturns: saleReturns.size,
        transferVouchers: transferVouchers.size,
        adjustmentVouchers: adjustmentVouchers.size,
        unknown: unknown.size,
      },
    };
  }

  private pushSse(): void {
    if (!this.sseClients.size) return;

    const payload = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...this.getStats(),
    });

    for (const res of this.sseClients) {
      if (res.writableEnded) {
        this.sseClients.delete(res);
        continue;
      }

      try {
        res.write(`data: ${payload}\n\n`);
        if (typeof (res as any).flush === "function") {
          (res as any).flush();
        }
      } catch (error) {
        this.sseClients.delete(res);
        logger.warn(
          `[InventoryRecalculateQueue] SSE client write error: ${
            (error as Error)?.message || error
          }`,
        );
      }
    }
  }

  private ensureHeartbeat(): void {
    if (this.heartbeatTimer) return;

    this.heartbeatTimer = setInterval(() => {
      for (const res of this.sseClients) {
        if (res.writableEnded) {
          this.sseClients.delete(res);
          continue;
        }
        res.write(`event: ping\ndata: ${Date.now()}\n\n`);
      }
    }, this.SSE_HEARTBEAT_MS);
  }

  private ensureLogTimer(): void {
    if (this.logTimer) return;

    this.logTimer = setInterval(async () => {
      const stats = this.getStats();

      if (stats.totalVariants > 0) {
        const parts: string[] = [];
        const d = stats.byDocumentType;
        if (d.saleOrders) parts.push(`sale=${d.saleOrders}`);
        if (d.purchaseOrders) parts.push(`purchase=${d.purchaseOrders}`);
        if (d.purchaseReturns)
          parts.push(`purchaseReturn=${d.purchaseReturns}`);
        if (d.saleReturns) parts.push(`saleReturn=${d.saleReturns}`);
        if (d.transferVouchers) parts.push(`transfer=${d.transferVouchers}`);
        if (d.adjustmentVouchers)
          parts.push(`adjustment=${d.adjustmentVouchers}`);
        if (d.unknown) parts.push(`unknown=${d.unknown}`);

        logger.info(
          `[InventoryRecalculateQueue] pending=${stats.pendingVariants} processing=${stats.processingVariants} total=${stats.totalVariants}` +
            (parts.length ? ` | ${parts.join(" ")}` : ""),
        );
      }

      // Self-heal: nếu pendingTasks có item nhưng không có Bull job tương ứng
      // (xảy ra khi upsertQueueJob lỗi hoặc job bị lost sau restart)
      if (this.pendingTasks.size > 0 && this.queue) {
        for (const [key, task] of this.pendingTasks.entries()) {
          if (this.activeTasks.has(key)) continue;
          try {
            const existing = await this.queue.getJob(key);
            if (!existing) {
              logger.warn(
                `[InventoryRecalculateQueue] Self-heal: re-enqueue orphan key=${key.substring(0, 16)}...`,
              );
              await this.upsertQueueJob(task);
            }
          } catch {
            // bỏ qua lỗi Redis tạm thời, sẽ retry lần sau
          }
        }
      }
    }, this.LOG_INTERVAL_MS);
  }

  async start(): Promise<void> {
    if (this.initialized) return;

    this.queue = new Bull<InventoryRecalculateQueueJobData>(
      "inventory-recalculate",
      {
        prefix: config.BULL_PREFIX,
        redis: {
          host: config.REDIS_HOST,
          port: config.REDIS_PORT,
          password: config.REDIS_PASSWORD || undefined,
          db: config.REDIS_DB,
        },
        defaultJobOptions: {
          removeOnComplete: true,
          attempts: 1,
        },
      },
    );

    this.queue.process(
      1,
      async (job: Job<InventoryRecalculateQueueJobData>) => {
        const key = job.data.key;

        // Ưu tiên dùng task từ pendingTasks (cùng process, có thể đã merge fromDate sớm hơn).
        // Nếu job do process khác enqueue (cross-process), fallback về job.data.
        const localTask = this.pendingTasks.get(key);
        const task: PendingTask = localTask ?? {
          key,
          variantId: job.data.variantId,
          storeId: job.data.storeId,
          fromDate: new Date(job.data.fromDate),
          sources: new Map(),
        };

        this.pendingTasks.delete(key);
        this.activeTasks.set(key, task);
        this.pushSse();

        const startMs = Date.now();
        const shortKey = `variant=${task.variantId.substring(0, 8)} store=${task.storeId.substring(0, 8)}`;
        logger.info(
          `[InventoryRecalculateQueue] ▶ START ${shortKey} fromDate=${task.fromDate.toISOString()} | pending=${this.pendingTasks.size}`,
        );

        try {
          await this.getService().recalculateVariantStoreFromDate(
            task.variantId,
            task.storeId,
            task.fromDate,
          );

          const elapsedMs = Date.now() - startMs;
          logger.info(
            `[InventoryRecalculateQueue] ✅ DONE ${shortKey} | ${elapsedMs}ms | pending=${this.pendingTasks.size}`,
          );
        } catch (error) {
          const elapsedMs = Date.now() - startMs;
          const existingPending = this.pendingTasks.get(key);
          this.pendingTasks.set(
            key,
            this.mergeTask(existingPending, {
              variantId: task.variantId,
              storeId: task.storeId,
              fromDate: task.fromDate,
              source: { sourceType: "retry", refId: key },
            }),
          );

          logger.error(
            `[InventoryRecalculateQueue] ❌ FAIL ${shortKey} | ${elapsedMs}ms | ${(error as Error)?.message || error}`,
            error,
          );
        } finally {
          this.activeTasks.delete(key);
        }

        const nextTask = this.pendingTasks.get(key);
        if (nextTask) {
          await this.upsertQueueJob(nextTask);
        }

        this.pushSse();
      },
    );

    this.queue.on("failed", (job, err) => {
      logger.error(
        `[InventoryRecalculateQueue] Worker failed key=${job?.data?.key || "unknown"}: ${err?.message || err}`,
      );
    });

    this.queue.on("error", (err) => {
      logger.error(
        `[InventoryRecalculateQueue] Queue error: ${err?.message || err}`,
      );
    });

    this.initialized = true;
    this.ensureHeartbeat();
    this.ensureLogTimer();
    logger.info(
      `[InventoryRecalculateQueue] Worker started | redis=${config.REDIS_HOST}:${config.REDIS_PORT} db=${config.REDIS_DB} prefix=${config.BULL_PREFIX}`,
    );
  }

  async enqueue(payload: InventoryRecalculateTaskPayload): Promise<void> {
    if (!this.queue || !this.initialized) {
      throw new Error("InventoryRecalculateQueue is not started");
    }

    if (!payload.variantId || !payload.storeId || !payload.fromDate) {
      return;
    }

    const key = this.buildKey(payload.variantId, payload.storeId);
    const mergedTask = this.mergeTask(this.pendingTasks.get(key), payload);

    this.pendingTasks.set(key, mergedTask);

    if (!this.activeTasks.has(key)) {
      await this.upsertQueueJob(mergedTask);
    }

    this.pushSse();
  }

  async enqueueMany(
    payloads: InventoryRecalculateTaskPayload[],
  ): Promise<void> {
    for (const payload of payloads) {
      await this.enqueue(payload);
    }
  }

  getLiveStats(): QueueStatsSummary {
    return this.getStats();
  }

  registerSSEClient(res: Response): void {
    this.sseClients.add(res);
    this.pushSse();
  }

  unregisterSSEClient(res: Response): void {
    this.sseClients.delete(res);
  }

  async stop(): Promise<void> {
    logger.info("[InventoryRecalculateQueue] Shutting down...");

    // Clear timers
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.logTimer) {
      clearInterval(this.logTimer);
      this.logTimer = null;
    }

    // Close all SSE connections
    for (const res of this.sseClients) {
      if (!res.writableEnded) {
        res.end();
      }
    }
    this.sseClients.clear();

    // Pause the queue (stop processing new jobs) and wait for active job to finish
    if (this.queue) {
      try {
        await this.queue.pause(true); // true = wait for active job to finish
        await this.queue.close();
      } catch (error) {
        logger.warn(
          `[InventoryRecalculateQueue] Error during queue close: ${
            (error as Error)?.message || error
          }`,
        );
      }
      this.queue = null;
    }

    this.pendingTasks.clear();
    this.activeTasks.clear();
    this.initialized = false;
    logger.info("[InventoryRecalculateQueue] Shutdown complete");
  }
}

export default new InventoryRecalculateQueue();
