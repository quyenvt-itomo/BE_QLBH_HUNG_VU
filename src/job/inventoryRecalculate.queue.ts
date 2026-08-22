import Bull, { Job } from "bull";
import { config } from "@/config/env";
import logger from "@/shared/utils/logger";
import { container } from "@/config/container";
import { INVENTORY_TYPES } from "@/module/inventory/inventory.types";
import type { InventoryRecalculateService } from "@/module/inventory/inventoryRecalculate.service";

/**
 * Nguồn gốc gây ra việc cần recalculate (dùng để gỡ lỗi / thống kê)
 */
export interface InventoryRecalculateSource {
  sourceType?: string;
  refId?: string;
}

export interface InventoryRecalculateTaskPayload {
  productId: string;
  warehouseId: string;
  fromDate: Date | string;
  source?: InventoryRecalculateSource;
}

interface InventoryRecalculateQueueJobData {
  key: string;
  productId: string;
  warehouseId: string;
}

interface PendingTask {
  key: string;
  productId: string;
  warehouseId: string;
  fromDate: Date;
  sources: Map<string, InventoryRecalculateSource>;
}

/**
 * Queue tính lại tồn kho dựa trên Bull.
 *
 * Ưu điểm so với gọi đồng bộ trong transaction:
 * - Không chặn response HTTP trong thời gian dài.
 * - Dedup/merge nhiều yêu cầu cho cùng 1 (product, warehouse) → chỉ tính 1 lần.
 * - Giữ mốc fromDate sớm nhất để rebuild chính xác từ thời điểm thay đổi.
 */
class InventoryRecalculateQueue {
  private queue: Bull.Queue<InventoryRecalculateQueueJobData> | null = null;
  private initialized = false;

  private pendingTasks = new Map<string, PendingTask>();
  private activeTasks = new Map<string, PendingTask>();

  private getService(): InventoryRecalculateService {
    return container.get<InventoryRecalculateService>(
      INVENTORY_TYPES.InventoryRecalculateService,
    );
  }

  private buildKey(productId: string, warehouseId: string): string {
    return `${productId}:${warehouseId}`;
  }

  private normalizeDate(value: Date | string): Date {
    const normalized = new Date(value);
    if (Number.isNaN(normalized.getTime())) {
      return new Date();
    }
    normalized.setMilliseconds(0);
    return normalized;
  }

  private toPriority(fromDate: Date): number {
    // Ưu tiên mốc gần hiện tại trước để phản hồi nhanh cho báo cáo.
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
          key: this.buildKey(payload.productId, payload.warehouseId),
          productId: payload.productId,
          warehouseId: payload.warehouseId,
          fromDate: normalizedFromDate,
          sources: new Map<string, InventoryRecalculateSource>(),
        };

    if (payload.source) {
      const sourceKey = `${payload.source.sourceType || "unknown"}:${
        payload.source.refId || merged.key
      }`;
      merged.sources.set(sourceKey, {
        sourceType: payload.source.sourceType,
        refId: payload.source.refId,
      });
    }

    return merged;
  }

  private async upsertQueueJob(task: PendingTask): Promise<void> {
    if (!this.queue) {
      throw new Error("InventoryRecalculateQueue is not started");
    }

    const existing = await this.queue.getJob(task.key);
    if (existing) {
      const state = await existing.getState();
      if (state === "active") {
        return;
      }
      try {
        await existing.remove();
      } catch (error) {
        logger.warn(
          `[InventoryRecalculateQueue] Không thể xóa job đang chờ key=${task.key}: ${
            (error as Error)?.message || error
          }`,
        );
      }
    }

    await this.queue.add(
      {
        key: task.key,
        productId: task.productId,
        warehouseId: task.warehouseId,
      },
      {
        jobId: task.key,
        // Chờ 1 chút để transaction nguồn commit xong trước khi worker đọc dữ liệu.
        delay: 1200,
        priority: this.toPriority(task.fromDate),
      },
    );
  }

  async start(): Promise<void> {
    if (this.initialized) {
      return;
    }

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
          removeOnFail: false,
          attempts: 1,
        },
      },
    );

    this.queue.process(
      1,
      async (job: Job<InventoryRecalculateQueueJobData>) => {
        const key = job.data.key;
        const task = this.pendingTasks.get(key);

        if (!task) {
          logger.info(
            `[InventoryRecalculateQueue] Bỏ qua job hết hạn key=${key} (không có payload)`,
          );
          return;
        }

        this.pendingTasks.delete(key);
        this.activeTasks.set(key, task);

        try {
          await this.getService().recalculateProductWarehouseFromDateWithRetry(
            task.productId,
            task.warehouseId,
            task.fromDate,
          );

          logger.info(
            `[InventoryRecalculateQueue] Đã recalc product=${task.productId} warehouse=${task.warehouseId} fromDate=${task.fromDate.toISOString()}`,
          );
        } catch (error) {
          logger.error(
            `[InventoryRecalculateQueue] Thất bại key=${key}: ${
              (error as Error)?.message || error
            }`,
            error,
          );
        } finally {
          this.activeTasks.delete(key);
        }

        const nextTask = this.pendingTasks.get(key);
        if (nextTask) {
          await this.upsertQueueJob(nextTask);
        }
      },
    );

    this.queue.on("failed", (job, err) => {
      logger.error(
        `[InventoryRecalculateQueue] Worker failed key=${
          job?.data?.key || "unknown"
        }: ${err?.message || err}`,
      );
    });

    this.queue.on("error", (err) => {
      logger.error(
        `[InventoryRecalculateQueue] Queue error: ${err?.message || err}`,
      );
    });

    this.initialized = true;
    logger.info("[InventoryRecalculateQueue] Worker đã khởi động");
  }

  async enqueue(payload: InventoryRecalculateTaskPayload): Promise<void> {
    if (!this.queue || !this.initialized) {
      throw new Error("InventoryRecalculateQueue chưa được start");
    }

    if (!payload.productId || !payload.warehouseId || !payload.fromDate) {
      return;
    }

    const key = this.buildKey(payload.productId, payload.warehouseId);
    const mergedTask = this.mergeTask(this.pendingTasks.get(key), payload);

    this.pendingTasks.set(key, mergedTask);

    if (!this.activeTasks.has(key)) {
      await this.upsertQueueJob(mergedTask);
    }
  }

  async enqueueMany(
    payloads: InventoryRecalculateTaskPayload[],
  ): Promise<void> {
    for (const payload of payloads) {
      await this.enqueue(payload);
    }
  }
}

export default new InventoryRecalculateQueue();
