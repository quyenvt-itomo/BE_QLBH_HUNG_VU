import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { StockDocumentRepository } from "./stockDocument.repository";
import { STOCK_DOCUMENT_TYPES } from "./stockDocument.types";
import {
  StockDocument,
  StockDocumentStatus,
  StockDocumentType,
} from "@/database/models/company/StockDocument";
import { StockDocumentLine } from "@/database/models/company/StockDocumentLine";
import { PurchaseLine } from "@/database/models/company/PurchaseLine";
import { OrderLine } from "@/database/models/store/OrderLine";
import { DeepPartial, EntityManager, In } from "typeorm";
import { withTransaction } from "@/shared/base/TransactionManager";
import {
  BadRequestError,
  NotFoundError,
  ValidationError,
} from "@/shared/types/errors";
import {
  ActionMap,
  ActionValue,
  RequestContext,
} from "@/shared/types/interfaces";
import {
  GateLogStatusEnum,
  GateLogTypeEnum,
} from "@/database/models/company/GateLog";
import {
  ConfirmImportDto,
  ConfirmExportDto,
  ConfirmBillingDto,
} from "./stockDocument.validator";
import {
  InventoryRecalculateService,
  InventoryRecalculateNode,
} from "@/module/inventory/inventoryRecalculate.service";
import { INVENTORY_TYPES } from "@/module/inventory/inventory.types";
import inventoryRecalculateQueue from "@/job/inventoryRecalculate.queue";
import { NotificationService } from "@/module/notification/notification.service";
import { NOTIFICATION_TYPES } from "@/module/notification/notification.types";
import { ActionType, NotificationType } from "@/database/models/Notification";
import { appDayjs } from "@/shared/utils/dayjs.util";
import logger from "@/shared/utils/logger";
import { generateCode } from "@/shared/utils/code.utils";
import { PURCHASE_TYPES } from "../purchase/purchase.types";
import { PurchaseService } from "../purchase/purchase.service";
import { PurchaseRepository } from "../purchase/purchase.repository";
import { SHIPPING_PLAN_TYPES } from "../shippingPlan/shippingPlan.types";
import { ShippingPlanService } from "../shippingPlan/shippingPlan.service";
import { ShippingPlanRepository } from "../shippingPlan/shippingPlan.repository";
import { PARTNER_TYPES } from "../partner/partner.types";
import { PartnerRepository } from "../partner/partner.repository";
import { WAREHOUSE_TYPES } from "../warehouse/warehouse.types";
import { WarehouseRepository } from "../warehouse/warehouse.repository";
import { PRODUCT_TYPES } from "../product/product.types";
import { ProductRepository } from "../product/product.repository";
import { ATTRIBUTE_TYPES } from "../attribute/attribute.types";
import { AttributeRepository } from "../attribute/attribute.repository";
import { ORDER_TYPES } from "../order/order.types";
import { OrderService } from "../order/order.service";
import { OrderRepository } from "../order/order.repository";
import { PRODUCTION_TYPES } from "../production/production.types";
import { ProductionRepository } from "../production/production.repository";
import { STOCK_DOCUMENT_LINE_TYPES } from "../stockDocumentLine/stockDocumentLine.types";
import { StockDocumentLineRepository } from "../stockDocumentLine/stockDocumentLine.repository";
import { PURCHASE_LINE_TYPES } from "../purchaseLine/purchaseLine.types";
import { PurchaseLineRepository } from "../purchaseLine/purchaseLine.repository";
import { EMPLOYEE_TYPES } from "../employee/employee.types";
import { EmployeeRepository } from "../employee/employee.repository";
import { InvoiceStatus } from "@/database/models/company/Invoice";

@injectable()
export class StockDocumentService extends BaseService<StockDocument> {
  protected repository: StockDocumentRepository;
  protected targetEntity = "StockDocument";
  protected uniqueFields: (keyof StockDocument)[] = ["code"];
  protected uniqueScope?: (keyof StockDocument)[] = ["companyId"];
  protected searchableFields = ["code", "vehiclePlate", "note"];
  protected timeField: keyof StockDocument = "effectiveDate";

  constructor(
    @inject(STOCK_DOCUMENT_TYPES.StockDocumentRepository)
    repository: StockDocumentRepository,

    @inject(PURCHASE_TYPES.PurchaseRepository)
    private purchaseRepository: PurchaseRepository,
    @inject(SHIPPING_PLAN_TYPES.ShippingPlanRepository)
    private shippingPlanRepository: ShippingPlanRepository,

    @inject(PURCHASE_TYPES.PurchaseService)
    private purchaseService: PurchaseService,
    @inject(SHIPPING_PLAN_TYPES.ShippingPlanService)
    private shippingPlanService: ShippingPlanService,
    @inject(INVENTORY_TYPES.InventoryRecalculateService)
    private inventoryRecalculateService: InventoryRecalculateService,
    @inject(PARTNER_TYPES.PartnerRepository)
    private partnerRepository: PartnerRepository,
    @inject(WAREHOUSE_TYPES.WarehouseRepository)
    private warehouseRepository: WarehouseRepository,
    @inject(EMPLOYEE_TYPES.EmployeeRepository)
    private employeeRepository: EmployeeRepository,
    @inject(PRODUCT_TYPES.ProductRepository)
    private productRepository: ProductRepository,
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    private attributeRepository: AttributeRepository,
    @inject(ORDER_TYPES.OrderRepository)
    private orderRepository: OrderRepository,
    @inject(ORDER_TYPES.OrderService)
    private orderService: OrderService,
    @inject(PRODUCTION_TYPES.ProductionRepository)
    private productionRepository: ProductionRepository,
    @inject(STOCK_DOCUMENT_LINE_TYPES.StockDocumentLineRepository)
    private stockDocumentLineRepository: StockDocumentLineRepository,
    @inject(PURCHASE_LINE_TYPES.PurchaseLineRepository)
    private purchaseLineRepository: PurchaseLineRepository,
    @inject(NOTIFICATION_TYPES.NotificationService)
    private notificationService: NotificationService,
  ) {
    super();
    this.repository = repository;
  }

  // Snapshot phiếu trước khi update để diff stockQuantity & tính lại tồn kho
  private _oldStockDocumentData?: StockDocument;

  async validateBeforeCreate(
    data: DeepPartial<StockDocument>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    switch (data.type) {
      case StockDocumentType.PURCHASE_RECEIPT:
        await this.validateForPurchaseReceipt(data, manager, req);
        break;
      case StockDocumentType.ORDER_ISSUE:
        await this.validateForOrderIssue(data, manager, req);
        break;
      default:
        break;
    }

    // Nạp snapshot cho entity cha
    await this.purchaseRepository.attachInfo(data, manager);
    await this.orderRepository.attachInfo(data, manager);
    await this.productionRepository.attachInfo(data, manager);

    // Ghi đè partner từ purchase hoặc hoặc order
    data.partnerId =
      data.purchaseSnapshot?.supplierId ||
      data.orderSnapshot?.customerId ||
      data.partnerId ||
      null;
    await this.warehouseRepository.attachInfo(data, manager);

    await this.shippingPlanRepository.attachInfo(data, manager);
    // Ghi đè shipper từ shippingPlan
    data.shipperId =
      data.shippingPlanSnapshot?.partnerId || data.shipperId || null;

    await this.partnerRepository.attachInfo(data, manager);

    // Nạp snapshot cho từng line
    if (data.lines) {
      for (const line of data.lines) {
        await this.productRepository.attachInfo(line, manager);
        await this.productRepository.attachUnitConversion(line, manager);
        await this.attributeRepository.attachUnitInfo(line, manager);
        await this.attachLineCostSnapshot(line, manager);
      }
    }

    data.code = await generateCode(
      (data.type || StockDocumentType.PURCHASE_RECEIPT)
        .replace(/_/g, "")
        .toLocaleLowerCase(),
    );
  }

  async validateForPurchaseReceipt(
    data: DeepPartial<StockDocument>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (!data.purchaseId)
      throw new BadRequestError("Vui lòng chọn đơn mua hàng", "purchaseId");

    const canUsePurchase = await this.purchaseService.canCreateStockDocument(
      data.purchaseId,
      req,
    );
    if (!canUsePurchase.can)
      throw new BadRequestError(canUsePurchase.reason, "purchaseId");

    if (!data.shippingPlanId)
      throw new BadRequestError(
        "Vui lòng chọn phương án vận chuyển",
        "shippingPlanId",
      );

    const canUsePlan = await this.shippingPlanService.canCreateStockDocument(
      data.shippingPlanId,
      req,
    );

    if (!canUsePlan.can)
      throw new BadRequestError(canUsePlan.reason, "shippingPlanId");

    // Kiểm tra dung sai nhập kho theo toleranceRate của đơn mua
    // (đã cộng cả những phiếu chưa xác nhận nhập kho)
    await this.validatePurchaseDeliveryTolerance(data, manager);
  }

  /**
   * Kiểm tra dung sai nhập kho: `committedQuantity / quantity` phải nằm trong
   * khoảng 100 ± toleranceRate của đơn mua.
   * `committedQuantity` = delivered (phiếu đã COMPLETED) + pending (phiếu chưa
   * xác nhận nhập kho, chưa xóa — vì chúng vẫn có thể được thực hiện nhập kho)
   * + lượng của phiếu đang tạo.
   */
  private async validatePurchaseDeliveryTolerance(
    data: DeepPartial<StockDocument>,
    manager: EntityManager,
  ): Promise<void> {
    if (!data.purchaseId) return;

    const purchase = await this.purchaseRepository.getById(
      data.purchaseId,
      manager,
    );
    if (!purchase) return;

    const toleranceRate = Number(purchase.toleranceRate) || 0;

    // Lượng của phiếu đang tạo theo từng purchaseLineId
    const incomingByLine = new Map<string, number>();
    for (let i = 0; i < (data.lines?.length || 0); i++) {
      const line = (data.lines || [])[i];
      if (!line.purchaseLineId) continue;
      // Nếu line không có billingQuantity => báo lỗi
      if (
        line.billingQuantity === undefined ||
        line.billingQuantity === null ||
        line.billingQuantity <= 0
      ) {
        throw new BadRequestError(
          "Số lượng chứng từ không hợp lệ",
          `lines.${i}.billingQuantity`,
        );
      }

      incomingByLine.set(
        line.purchaseLineId,
        Number(line.billingQuantity ?? line.stockQuantity ?? 0) || 0,
      );
    }

    const rows = await manager
      .getRepository(PurchaseLine)
      .createQueryBuilder("pl")
      .select("pl.id", "id")
      .addSelect("pl.quantity", "quantity")
      .addSelect(
        `COALESCE((SELECT SUM(sdl."billingQuantity")
           FROM stock_document_lines sdl
           INNER JOIN stock_documents sd ON sd.id = sdl."stockDocumentId"
           WHERE sdl."purchaseLineId" = pl.id
             AND sdl."deletedAt" IS NULL
             AND sd."deletedAt" IS NULL
             AND sd.status = :completed), 0)`,
        "delivered",
      )
      .addSelect(
        `COALESCE((SELECT SUM(sdl."billingQuantity")
           FROM stock_document_lines sdl
           INNER JOIN stock_documents sd ON sd.id = sdl."stockDocumentId"
           WHERE sdl."purchaseLineId" = pl.id
             AND sdl."deletedAt" IS NULL
             AND sd."deletedAt" IS NULL
             AND sd.status != :completed), 0)`,
        "pending",
      )
      .where("pl.purchaseId = :purchaseId")
      .setParameters({
        purchaseId: data.purchaseId,
        completed: StockDocumentStatus.COMPLETED,
      })
      .getRawMany<{
        id: string;
        quantity: string;
        delivered: string;
        pending: string;
      }>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const quantity = Number(row.quantity) || 0;
      if (!quantity) continue;

      const delivered = Number(row.delivered) || 0;
      const pending = Number(row.pending) || 0;
      const incoming = incomingByLine.get(row.id) ?? 0;

      const committed = delivered + pending + incoming;

      // Chỉ chặn khi NHẬN NHIỀU hơn dung sai cho phép (quá 100 + toleranceRate).
      // Nhận ít hơn thì vẫn được vì còn có thể giao bổ sung vào đợt sau.
      const maxAllowed = quantity * (1 + toleranceRate / 100);

      if (committed > maxAllowed) {
        throw new BadRequestError(
          `Số lượng nhập kho vượt quá dung sai cho phép ${toleranceRate}% (nhận ${committed}/${quantity})`,
          `lines.${i}.billingQuantity`,
        );
      }
    }
  }

  async validateForOrderIssue(
    data: DeepPartial<StockDocument>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (!data.orderId)
      throw new BadRequestError("Vui lòng chọn đơn hàng", "orderId");

    const canUseOrder = await this.orderService.canCreateStockDocument(
      data.orderId,
      req,
    );
    if (!canUseOrder.can)
      throw new BadRequestError(canUseOrder.reason, "orderId");

    if (data.shippingPlanId) {
      const canUsePlan = await this.shippingPlanService.canCreateStockDocument(
        data.shippingPlanId,
        req,
        { orderId: data.orderId },
      );

      if (!canUsePlan.can)
        throw new BadRequestError(canUsePlan.reason, "shippingPlanId");
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<StockDocument>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const existed = await this.repository.getById(id, manager);
    const canUpdate = await this.canUpdate(existed, req);
    // Lưu snapshot cũ (header + lines) để diff stockQuantity trong actionAfterUpdate
    const oldLines = await this.stockDocumentLineRepository.find(
      { where: { stockDocumentId: id } },
      manager,
    );
    existed.lines = oldLines;
    this._oldStockDocumentData = existed;
    if (!canUpdate.can) throw new BadRequestError(canUpdate.reason);

    if (
      existed.type === StockDocumentType.PURCHASE_RECEIPT &&
      existed.status !== StockDocumentStatus.COMPLETED
    ) {
      delete data.actualImportDate;
    }
    if (
      existed.type === StockDocumentType.ORDER_ISSUE &&
      existed.status === StockDocumentStatus.PENDING
    )
      delete data.actualExportDate;
  }

  async actionAfterCreate(
    data: StockDocument,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.createAutoGateLog(data, data.code, manager);
    // Nếu phiếu được tạo đã ảnh hưởng tồn kho (status + ngày có sẵn) → tính lại
    await this.enqueueRecalculateForChange(data, undefined, manager);

    // Thông báo cho thủ kho nếu tài khoản tạo không phải thủ kho
    await this.notifyWarehouseKeeperForNewDocument(data, manager);
  }

  private async notifyWarehouseKeeperForNewDocument(
    data: StockDocument,
    manager: EntityManager,
  ): Promise<void> {
    try {
      const companyId = data.companyId;
      if (!companyId || !data.id) return;

      const warehouse = data.warehouseId
        ? await this.warehouseRepository.getById(data.warehouseId, manager)
        : null;

      // Thủ kho = người phụ trách kho (warehouse.managerId)
      const keeperEmployeeId = warehouse?.managerId ?? null;
      if (!keeperEmployeeId) return;

      const isExport = this.isExportDocument(data.type);
      const warehouseName =
        data.warehouseSnapshot?.name || warehouse?.name || "kho";
      const effectiveDate = data.effectiveDate
        ? appDayjs(data.effectiveDate).format("DD/MM/YYYY")
        : "chưa xác định";

      await this.notificationService.notifyUsersWithReadPermission(
        {
          id: data.id,
          code: data.code,
          companyId,
          staffId: keeperEmployeeId,
          kind: this.describeDocumentKind(data.type),
          toFrom: isExport ? "từ" : "tới",
          importExport: isExport ? "xuất" : "nhập",
          warehouseName,
          effectiveDate,
        } as any,
        "stockDocument",
        NotificationType.STOCK_DOCUMENT,
        ActionType.CREATE,
        data.creatorId ?? null,
      );
    } catch (error) {
      logger.error(
        `[StockDocument] Thông báo cho thủ kho thất bại: ${
          (error as Error)?.message || error
        }`,
      );
    }
  }

  private describeDocumentKind(type: StockDocumentType): string {
    switch (type) {
      case StockDocumentType.PURCHASE_RECEIPT:
        return "nhập kho hàng mua";
      case StockDocumentType.PRODUCTION_RECEIPT:
        return "nhập kho sản xuất";
      case StockDocumentType.ORDER_ISSUE:
        return "xuất kho hàng bán";
      case StockDocumentType.MATERIAL_ISSUE:
        return "xuất kho nguyên vật liệu";
      default:
        return "kho";
    }
  }

  async actionAfterUpdate(
    data: StockDocument,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    // Tính lại tồn kho qua queue (dùng chung cho import lẫn export).
    // enqueueRecalculateForChange tự quyết định tính toàn bộ hay chỉ dòng đổi.
    const oldData = this._oldStockDocumentData;
    this._oldStockDocumentData = undefined;
    await this.enqueueRecalculateForChange(data, oldData, manager);

    // Tính lại số lượng giao
    if (data.type === StockDocumentType.PURCHASE_RECEIPT && data.purchaseId) {
      await this.purchaseService.recalculateLineDeliveryQuantities(
        data.purchaseId,
        manager,
      );
    }

    if (data.type === StockDocumentType.ORDER_ISSUE && data.orderId) {
      await this.orderService.recalculateLineDeliveryQuantities(
        data.orderId,
        manager,
      );
    }
  }

  // Xóa phiếu đã ảnh hưởng tồn kho → tính lại toàn bộ product trong phiếu
  async actionAfterDelete(
    data: StockDocument,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    await this.enqueueRecalculateForChange(data, data, manager, {
      deleted: true,
    });
  }

  async update(
    id: string,
    data: DeepPartial<StockDocument>,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<StockDocument | null> {
    const companyId = req?.companyContext?.companyId;
    const trashFileIds = this.collectTrashFileIds(data as any);

    const run = async (trxManager: EntityManager) => {
      await this.validateBeforeUpdate(id, data, trxManager, req);
      // Tách lines riêng, loại bỏ type & status (cố định, không cho sửa qua update)
      const { lines = [], type, status, ...safeData } = data;

      // Lấy document hiện tại để biết type & status thực tế
      const existingDoc = await this.repository.getById(id, trxManager);
      if (
        companyId &&
        existingDoc.companyId &&
        existingDoc.companyId !== companyId
      ) {
        throw new BadRequestError(
          "Dữ liệu không thuộc công ty của bạn, không thể cập nhật",
        );
      }

      // perform unique check if configured (exclude self by providing id)
      if (this.uniqueFields && this.uniqueFields.length > 0) {
        const dataWithScope: any = { ...data, id };
        if (this.uniqueScope && this.uniqueScope.length > 0) {
          for (const scopeField of this.uniqueScope) {
            if (dataWithScope[scopeField] === undefined) {
              dataWithScope[scopeField] = existingDoc[scopeField];
            }
          }
        }

        const errs = await this.checkExistInDb(
          dataWithScope,
          this.uniqueFields,
          this.uniqueScope || [],
        );
        if (errs.length > 0) throw new ValidationError("input.invalid", errs);
      }
      // perform reference existence check for update
      const refErrs = await this.checkReferencesInDb({ ...data, id }, manager);
      if (refErrs && refErrs.length > 0)
        throw new ValidationError("input.invalid", refErrs);

      // 1. Cập nhật lines trước (nếu có)
      const existingLineRows = await this.stockDocumentLineRepository.find(
        { where: { stockDocumentId: id } },
        trxManager,
      );
      if (lines !== undefined) {
        for (const line of lines) {
          await this.productRepository.attachInfo(line, trxManager);
          await this.attributeRepository.attachUnitInfo(line, trxManager);
          const oldLine = line.id
            ? existingLineRows.find((item) => item.id === line.id)
            : undefined;
          if (oldLine) {
            if (
              (line.productId && line.productId !== oldLine.productId) ||
              (line.unitId && line.unitId !== oldLine.unitId)
            ) {
              throw new BadRequestError(
                "Không thể đổi hàng hóa hoặc đơn vị tính của dòng chứng từ; hãy hủy phiếu để tạo lại",
              );
            }
            line.conversionRateAtTime = oldLine.conversionRateAtTime;
            line.costPriceAtTime = oldLine.costPriceAtTime;
            line.costAmount = oldLine.costAmount;
          } else {
            await this.productRepository.attachUnitConversion(line, trxManager);
            await this.attachLineCostSnapshot(line, trxManager);
          }
        }

        const existing = existingLineRows;
        const incomingIds = new Set(lines.map((l) => l.id).filter(Boolean));
        const removedIds = existing
          .map((l) => l.id)
          .filter((lid) => !incomingIds.has(lid));
        if (removedIds.length > 0) {
          await this.stockDocumentLineRepository.softDeleteMany(
            { id: In(removedIds) },
            trxManager,
          );
        }
        const toSave = lines.map((l, i) => ({
          ...l,
          stockDocumentId: id,
          sortOrder: l.sortOrder || 10 * (i + 1),
        }));
        if (toSave.length > 0) {
          await this.stockDocumentLineRepository
            .getRepository(trxManager)
            .save(toSave);
        }
      }

      // 1b. Tính/Clear variance cho các line — CHỈ khi phiếu đã COMPLETED.
      // Nếu chưa hoàn thành: xóa hết giá trị chênh lệch ở line (và phiếu cha ở bước 2).
      const isVarianceRelevant =
        existingDoc.type === StockDocumentType.PURCHASE_RECEIPT ||
        existingDoc.type === StockDocumentType.ORDER_ISSUE;
      const shouldComputeVariance =
        existingDoc.status === StockDocumentStatus.COMPLETED &&
        isVarianceRelevant;

      const allLines = await this.stockDocumentLineRepository.find(
        {
          where: { stockDocumentId: id },
          relations: { purchaseLine: true, orderLine: true },
        },
        trxManager,
      );

      for (const lineDto of allLines) {
        if (shouldComputeVariance) {
          const stockQty = lineDto.stockQuantity ?? 0;
          const billingQty = lineDto.billingQuantity ?? 0;

          const varianceQty = this.resolveImportVarianceQuantity(
            existingDoc.type,
            stockQty,
            billingQty,
          );

          let varianceAmount = 0;
          if (existingDoc.type === StockDocumentType.PURCHASE_RECEIPT) {
            varianceAmount =
              varianceQty * (lineDto.purchaseLine?.unitPrice ?? 0);
          } else if (existingDoc.type === StockDocumentType.ORDER_ISSUE) {
            varianceAmount = varianceQty * (lineDto.orderLine?.unitPrice ?? 0);
          }

          await this.stockDocumentLineRepository.update(
            lineDto.id,
            { varianceQuantity: varianceQty, varianceAmount },
            trxManager,
          );
        } else {
          await this.stockDocumentLineRepository.update(
            lineDto.id,
            { varianceQuantity: 0, varianceAmount: 0 },
            trxManager,
          );
        }
      }

      // 2. Tính lại totalVarianceAmount cho phiếu cha (chỉ khi COMPLETED)
      const totalVarianceAmount = shouldComputeVariance
        ? await this.calculateTotalVarianceAmount(
            id,
            existingDoc.type,
            trxManager,
          )
        : 0;

      // 3. Cập nhật phiếu cha (type & status giữ nguyên từ existingDoc)
      const updateData = { ...safeData, totalVarianceAmount };
      const updatedEntity = await this.repository.update(
        id,
        updateData,
        trxManager,
      );

      // 4. Gọi hàm hậu kỳ: tính lại tồn kho, số lượng giao, v.v... tùy theo type & status
      if (updatedEntity) {
        await this.actionAfterUpdate(updatedEntity, trxManager, req);
      }

      const fullData = await this.repository.findById(
        updatedEntity?.id || id,
        trxManager,
      );

      await this.deleteTrashFiles(trashFileIds);

      return fullData;
    };

    return manager ? run(manager) : withTransaction(run);
  }

  /**
   * Tính lại totalVarianceAmount từ các line hiện tại của phiếu.
   */
  private async calculateTotalVarianceAmount(
    stockDocumentId: string,
    docType: StockDocumentType,
    manager: EntityManager,
  ): Promise<number> {
    const lines = await this.stockDocumentLineRepository.find(
      {
        where: { stockDocumentId },
        relations: { purchaseLine: true, orderLine: true },
      },
      manager,
    );

    let totalVarianceAmount = 0;
    for (const line of lines) {
      const stockQty = line.stockQuantity ?? 0;
      const billingQty = line.billingQuantity ?? 0;
      const varianceQty = this.resolveImportVarianceQuantity(
        docType,
        stockQty,
        billingQty,
      );

      let varianceAmount = 0;
      if (docType === StockDocumentType.PURCHASE_RECEIPT) {
        varianceAmount = varianceQty * (line.purchaseLine?.unitPrice ?? 0);
      } else if (docType === StockDocumentType.ORDER_ISSUE) {
        varianceAmount = varianceQty * (line.orderLine?.unitPrice ?? 0);
      }
      totalVarianceAmount += varianceAmount;
    }

    return totalVarianceAmount;
  }

  private buildGateLogType(type: StockDocumentType): GateLogTypeEnum | null {
    if (type === StockDocumentType.PURCHASE_RECEIPT) {
      return GateLogTypeEnum.PURCHASE_RECEIPT;
    }
    if (type === StockDocumentType.ORDER_ISSUE) {
      return GateLogTypeEnum.ORDER_ISSUE;
    }
    return null;
  }

  private async createAutoGateLog(
    doc: StockDocument,
    code: string,
    manager: EntityManager,
  ): Promise<void> {
    const gateLogType = this.buildGateLogType(doc.type);
    if (!gateLogType) return;

    const gateLogRepo = this.repository.getGateLogRepository(manager);
    await gateLogRepo.save({
      companyId: doc.companyId,
      code,
      timeAt: doc.effectiveDate ?? new Date(),
      type: gateLogType,
      status: GateLogStatusEnum.PENDING,
      stockDocumentId: doc.id,
      stockDocumentSnapshot: null,
      partnerId: doc.partnerId,
      partnerSnapshot: doc.partnerSnapshot,
      vehicleType: doc.vehicleType,
      vehiclePlate: doc.vehiclePlate,
    });
  }

  private isPartnerDocument(type: StockDocumentType): boolean {
    return (
      type === StockDocumentType.PURCHASE_RECEIPT ||
      type === StockDocumentType.ORDER_ISSUE
    );
  }

  private async attachLineCostSnapshot(
    line: DeepPartial<StockDocumentLine>,
    manager: EntityManager,
  ): Promise<void> {
    if (!line.orderLineId) return;
    const orderLine = await manager.getRepository(OrderLine).findOne({
      where: { id: line.orderLineId },
      select: ["id", "costPriceAtTime"],
    });
    if (!orderLine) return;
    const quantity =
      Number(
        line.stockQuantity ?? line.requestQuantity ?? line.billingQuantity,
      ) || 0;
    line.costPriceAtTime = Number(orderLine.costPriceAtTime) || 0;
    line.costAmount = quantity * line.costPriceAtTime;
  }

  private isExportDocument(type: StockDocumentType): boolean {
    return (
      type === StockDocumentType.MATERIAL_ISSUE ||
      type === StockDocumentType.ORDER_ISSUE
    );
  }

  private resolveImportBillingQuantity(
    docType: StockDocumentType,
    stockQuantity: number,
    billingQuantity?: number | null,
  ): number {
    if (!this.isPartnerDocument(docType)) {
      return stockQuantity;
    }
    return billingQuantity ?? stockQuantity;
  }

  private resolveImportVarianceQuantity(
    docType: StockDocumentType,
    stockQuantity: number,
    billingQuantity: number,
  ): number {
    if (docType === StockDocumentType.PURCHASE_RECEIPT) {
      return stockQuantity - billingQuantity;
    }
    if (docType === StockDocumentType.ORDER_ISSUE) {
      return billingQuantity - stockQuantity;
    }
    return 0;
  }

  // Dành cho phiếu xuất bán
  async confirmExport(
    id: string,
    dto: ConfirmExportDto,
    req?: RequestContext,
  ): Promise<StockDocument> {
    const employeeId = req?.userContext?.employeeId;
    return withTransaction(async (trxManager) => {
      const doc = await this.repository.getById(id, trxManager);

      const canExport = await this.canConfirmExport(doc, req);
      if (!canExport.can) throw new BadRequestError(canExport.reason);

      // Update lines
      for (const lineDto of dto.lines) {
        await this.stockDocumentLineRepository.update(
          lineDto.id,
          {
            stockQuantity: lineDto.stockQuantity,
            additionalQuantity: lineDto.additionalQuantity ?? null,
          },
          trxManager,
        );
      }

      const exportDate = dto.actualExportDate ?? new Date();

      const updateData: DeepPartial<StockDocument> = {
        status: StockDocumentStatus.EXPORTED,
        actualExportDate: exportDate,
        staffId: employeeId ?? null,
      };

      await this.employeeRepository.attachInfo(updateData, trxManager);

      const saved = await this.repository.update(id, updateData, trxManager);
      if (!saved)
        throw new NotFoundError("Cập nhật phiếu thất bại, vui lòng thử lại");

      // Tính lại tồn kho (phát sinh qua queue, bao gồm các line xuất kho)
      await this.enqueueRecalculateForChange(saved, doc, trxManager);

      return saved;
    });
  }

  // Dành cho phiếu nhập mua
  async confirmImport(
    id: string,
    dto: ConfirmImportDto,
    req?: RequestContext,
  ): Promise<StockDocument> {
    const employeeId = req?.userContext?.employeeId;
    return withTransaction(async (trxManager) => {
      const doc = await this.repository.getById(id, trxManager);

      const canImport = await this.canConfirmImport(doc, req);
      if (!canImport.can) throw new BadRequestError(canImport.reason);

      // Update lines with billing and variance
      const lines = await this.stockDocumentLineRepository.find(
        {
          where: { stockDocumentId: id },
          relations: {
            purchaseLine: true,
            orderLine: true,
          },
        },
        trxManager,
      );
      const lineById = new Map(lines.map((line) => [line.id, line]));
      let totalVarianceAmount = 0;

      for (const lineDto of dto.lines) {
        const line = lineById.get(lineDto.id);
        if (!line) {
          throw new NotFoundError(
            "Không tìm thấy thông tin hàng hóa trong phiếu",
            "lines",
          );
        }

        const stockQty = lineDto.stockQuantity;

        const varianceQty = this.resolveImportVarianceQuantity(
          doc.type,
          stockQty,
          line.billingQuantity ?? 0,
        );

        let varianceAmount = 0;
        if (doc.type === StockDocumentType.PURCHASE_RECEIPT) {
          varianceAmount = varianceQty * (line.purchaseLine?.unitPrice ?? 0);
        } else if (doc.type === StockDocumentType.ORDER_ISSUE) {
          varianceAmount = varianceQty * (line.orderLine?.unitPrice ?? 0);
        }
        totalVarianceAmount += varianceAmount;

        await this.stockDocumentLineRepository.update(
          lineDto.id,
          {
            stockQuantity: stockQty,
            varianceQuantity: varianceQty,
            varianceAmount,
          },
          trxManager,
        );
      }

      const actualDate = dto.actualImportDate ?? new Date();
      const update: DeepPartial<StockDocument> = {
        status: StockDocumentStatus.COMPLETED,
        totalVarianceAmount,
        staffId: employeeId ?? null,
        actualImportDate: actualDate,
      };
      await this.employeeRepository.attachInfo(update, trxManager);

      const saved = await this.repository.update(id, update, trxManager);
      if (!saved)
        throw new NotFoundError("Cập nhật phiếu thất bại, vui lòng thử lại");

      await this.actionAfterUpdate(saved, trxManager, req);

      return saved;
    });
  }

  // Dành cho phiếu xuất bán, khi đã xuất kho xong thì có thể hoàn thành phiếu
  async confirmComplete(
    id: string,
    dto: ConfirmBillingDto,
    req?: RequestContext,
  ): Promise<StockDocument> {
    const employeeId = req?.userContext?.employeeId;
    return withTransaction(async (trxManager) => {
      const doc = await this.repository.getById(id, trxManager);

      const canComplete = await this.canConfirmComplete(doc, req);
      if (!canComplete.can) throw new BadRequestError(canComplete.reason);

      const lines = await this.stockDocumentLineRepository.find(
        {
          where: { stockDocumentId: id },
          relations: {
            purchaseLine: true,
            orderLine: true,
          },
        },
        trxManager,
      );
      const lineById = new Map(lines.map((line) => [line.id, line]));

      let totalVarianceAmount = 0;
      for (const lineDto of dto.lines) {
        const line = lineById.get(lineDto.id);
        if (!line) {
          throw new NotFoundError(
            "Không tìm thấy thông tin hàng hóa trong phiếu",
            "lines",
          );
        }

        const billingQty = lineDto.billingQuantity;

        const varianceQty = this.resolveImportVarianceQuantity(
          doc.type,
          line.stockQuantity ?? 0,
          billingQty,
        );

        let varianceAmount = 0;
        if (doc.type === StockDocumentType.PURCHASE_RECEIPT) {
          varianceAmount = varianceQty * (line.purchaseLine?.unitPrice ?? 0);
        } else if (doc.type === StockDocumentType.ORDER_ISSUE) {
          varianceAmount = varianceQty * (line.orderLine?.unitPrice ?? 0);
        }
        totalVarianceAmount += varianceAmount;

        await this.stockDocumentLineRepository.update(
          lineDto.id,
          {
            billingQuantity: billingQty,
            varianceQuantity: varianceQty,
            varianceAmount,
          },
          trxManager,
        );
      }

      const updateData: DeepPartial<StockDocument> = {
        status: StockDocumentStatus.COMPLETED,
        totalVarianceAmount,
        confirmerId: employeeId ?? null,
      };
      await this.employeeRepository.attachInfo(updateData, trxManager);

      const saved = await this.repository.update(id, updateData, trxManager);
      if (!saved)
        throw new NotFoundError("Cập nhật phiếu thất bại, vui lòng thử lại");

      await this.actionAfterUpdate(saved, trxManager, req);

      return saved;
    });
  }

  /**
   * Enqueue lại tồn kho khi phiếu thay đổi (import lẫn export đều dùng chung).
   *
   * Quy tắc:
   * - Xóa phiếu đã ảnh hưởng tồn kho HOẶC ngày tính tồn kho thay đổi
   *   (hoặc trạng thái chuyển vào/ra khỏi "đã ảnh hưởng tồn kho")
   *   → tính lại TOÀN BỘ product trong phiếu (union lines cũ + mới).
   * - Ngược lại chỉ tính những product có dòng thay đổi stockQuantity.
   *
   * Sau đó tìm affectedNodes (mở rộng qua chuyển kho) rồi đưa vào queue.
   */
  private async enqueueRecalculateForChange(
    data: StockDocument,
    oldData: StockDocument | undefined,
    manager: EntityManager,
    options?: { deleted?: boolean },
  ): Promise<void> {
    const deleted = options?.deleted ?? false;
    const warehouseId = data.warehouseId ?? oldData?.warehouseId;
    if (!warehouseId) return;

    const isImport =
      data.type === StockDocumentType.PURCHASE_RECEIPT ||
      data.type === StockDocumentType.PRODUCTION_RECEIPT;

    const newDate = isImport ? data.actualImportDate : data.actualExportDate;
    const oldDate = isImport
      ? oldData?.actualImportDate
      : oldData?.actualExportDate;

    const fromDate = this.getEarliestDate(newDate, oldDate);
    if (!fromDate) return;

    // Trạng thái "đã ảnh hưởng tồn kho"
    const isAffectedStatus = (doc: StockDocument): boolean =>
      isImport
        ? doc.status === StockDocumentStatus.COMPLETED
        : doc.status === StockDocumentStatus.EXPORTED ||
          doc.status === StockDocumentStatus.COMPLETED;

    const wasAffected = oldData ? isAffectedStatus(oldData) : false;
    const nowAffected = isAffectedStatus(data);

    // Phiếu chưa từng ảnh hưởng tồn kho (vd: vừa tạo còn PENDING) → không cần tính
    if (!wasAffected && !nowAffected) return;

    const dateChanged =
      (newDate != null &&
        oldDate != null &&
        newDate.getTime() !== oldDate.getTime()) ||
      (newDate != null && oldDate == null) ||
      (newDate == null && oldDate != null);

    // Quyết định tính lại toàn bộ hay chỉ các dòng thay đổi
    const recalcAll =
      (deleted && wasAffected) || wasAffected !== nowAffected || dateChanged;

    // Nạp lines nếu chưa có trên entity
    const loadLines = async (
      doc: StockDocument | undefined,
    ): Promise<StockDocumentLine[]> => {
      if (!doc) return [];
      if (doc.lines && doc.lines.length > 0) return doc.lines;
      return this.stockDocumentLineRepository.find(
        { where: { stockDocumentId: doc.id } },
        manager,
      );
    };

    const newLines = await loadLines(data);
    const oldLines = await loadLines(oldData);

    let productIds: string[];

    if (recalcAll) {
      productIds = this.collectUniqueIds([
        ...newLines.map((l) => l.productId),
        ...oldLines.map((l) => l.productId),
      ]);
    } else {
      // Chỉ những dòng thay đổi stockQuantity hoặc bị xóa khỏi phiếu
      const changedProductIds = new Set<string>();
      const oldById = new Map(oldLines.map((l) => [l.id, l]));

      for (const line of newLines) {
        const old = oldById.get(line.id);
        if (!old || (old.stockQuantity ?? 0) !== (line.stockQuantity ?? 0)) {
          if (line.productId) changedProductIds.add(line.productId);
        }
      }

      // Dòng bị xóa khỏi phiếu (có stockQuantity ở bản cũ) cũng cần tính lại
      const newIds = new Set(newLines.map((l) => l.id));
      for (const line of oldLines) {
        if (
          !newIds.has(line.id) &&
          (line.stockQuantity ?? 0) !== 0 &&
          line.productId
        ) {
          changedProductIds.add(line.productId);
        }
      }

      productIds = Array.from(changedProductIds);
    }

    if (!productIds.length) return;

    const baseNodes: InventoryRecalculateNode[] = productIds.map(
      (productId) => ({ productId, warehouseId, fromDate }),
    );

    const affectedNodes =
      await this.inventoryRecalculateService.collectAffectedInventoryNodes(
        baseNodes,
        manager,
      );

    await inventoryRecalculateQueue.enqueueMany(
      affectedNodes.map((node) => ({
        productId: node.productId,
        warehouseId: node.warehouseId,
        fromDate: node.fromDate,
        source: { sourceType: data.type, refId: data.id },
      })),
    );
  }

  // =====================================================
  // ACTIONS
  // =====================================================

  protected async attachActions(
    entity: StockDocument & { _actions?: ActionMap },
    req?: RequestContext,
  ): Promise<void> {
    entity._actions = await this.getActions(entity, req);
  }

  private async getActions(
    entity: StockDocument | null,
    req?: RequestContext,
  ): Promise<ActionMap> {
    const actions = this.getDefaultAction();
    if (!entity) return actions;
    actions.update = await this.canUpdate(entity, req);
    actions.delete = await this.canDelete(entity, req);
    actions.export = await this.canConfirmExport(entity, req);
    actions.import = await this.canConfirmImport(entity, req);
    actions.complete = await this.canComplete(entity, req);
    return actions;
  }

  async canUpdate(
    entity: StockDocument,
    req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.order?.isCompleted) {
      return {
        can: false,
        reason: "Đơn hàng đã hoàn thành, không thể cập nhật phiếu xuất bán",
      };
    }

    if (entity.purchase?.isCompleted) {
      return {
        can: false,
        reason: "Đơn mua hàng đã hoàn thành, không thể cập nhật phiếu nhập kho",
      };
    }

    return { can: true };
  }

  async canDelete(
    entity: StockDocument,
    req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.status !== StockDocumentStatus.PENDING)
      return {
        can: false,
        reason: "Chỉ có thể xóa phiếu đang ở trạng thái chờ",
      };

    return { can: true };
  }

  async canComplete(
    entity: StockDocument,
    req?: RequestContext,
  ): Promise<ActionValue> {
    if (
      entity.type !== StockDocumentType.ORDER_ISSUE ||
      entity.status !== StockDocumentStatus.EXPORTED
    ) {
      return {
        can: false,
        reason: "Chỉ phiếu xuất bán đã xuất kho mới có thể hoàn thành",
      };
    }
    return { can: true };
  }

  async canConfirmExport(
    entity: StockDocument,
    req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.type !== StockDocumentType.ORDER_ISSUE)
      return {
        can: false,
        reason: "Chỉ phiếu xuất kho hàng bán mới có thể xác nhận xuất",
      };

    if (entity.status !== StockDocumentStatus.PENDING)
      return {
        can: false,
        reason: "Phiếu phải ở trạng thái chờ xử lý",
      };

    return { can: true };
  }

  async canConfirmImport(
    entity: StockDocument,
    req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.type !== StockDocumentType.PURCHASE_RECEIPT) {
      return {
        can: false,
        reason: "Chỉ phiếu nhập mua mới có thể xác nhận nhập",
      };
    }

    if (entity.status === StockDocumentStatus.COMPLETED)
      return { can: false, reason: "Phiếu đã hoàn thành" };

    return { can: true };
  }

  async canConfirmComplete(
    entity: StockDocument,
    req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.type !== StockDocumentType.ORDER_ISSUE) {
      return {
        can: false,
        reason: "Chỉ phiếu xuất bán mới có thể xác nhận hoàn thành",
      };
    }

    if (entity.status !== StockDocumentStatus.EXPORTED)
      return {
        can: false,
        reason: "Phiếu phải ở trạng thái đã xuất kho",
      };
    return { can: true };
  }

  async canCreateInvoice(
    entity: StockDocument,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.status !== StockDocumentStatus.COMPLETED) {
      return {
        can: false,
        reason: "Phiếu chưa hoàn thành, không thể nhập hóa đơn",
      };
    }

    // Nếu có một hóa đơn chưa bị hủy thì không thể nhập thêm hóa đơn
    const invoinces = entity.invoices || [];
    const hasActiveInvoice = invoinces.some(
      (inv) => inv.status !== InvoiceStatus.CANCELED,
    );
    if (hasActiveInvoice) {
      return {
        can: false,
        reason:
          "Phiếu này đã có hóa đơn có hiệu lực, không thể nhập thêm hóa đơn",
      };
    }

    return { can: true };
  }
}
