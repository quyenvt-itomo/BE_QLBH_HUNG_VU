import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { OrderRepository } from "./order.repository";
import { ORDER_TYPES } from "./order.types";
import { Order } from "@/database/models/store/Order";
import { Request } from "express";
import { DeepPartial, EntityManager } from "typeorm";
import { OrderLine } from "@/database/models/store/OrderLine";
import { BadRequestError, IError } from "@/shared/types/errors";
import logger from "@/shared/utils/logger";
import { PRODUCT_TYPES, ProductRepository } from "@/modules/product";
import { ErrorsMessages } from "@/shared/constants/errors";
import { PARTNER_TYPES, PartnerRepository, PartnerSnapshot } from "../partner";
import {
  EMPLOYEE_TYPES,
  EmployeeRepository,
  EmployeeSnapshot,
} from "../employee";
import { config } from "@/config/env";
import {
  DiscountTypeEnum,
  EXPENSE_PURCHASE_CATEGORY_NAME,
  EXPENSE_SALE_CATEGORY_NAME,
  INCOME_PURCHASE_CATEGORY_NAME,
  INCOME_SALE_CATEGORY_NAME,
  IncomeExpenseTypeEnum,
  InventoryRefTypeEnum,
  OrderTypeEnum,
  OrderLineTypeEnum,
  OrderStatusEnum,
} from "@/shared/constants/enum";
import {
  PARTNER_DEBT_TYPES,
  PartnerDebtRecalculateService,
} from "../partnerDebt";
import { VAT_DEBT_TYPES, VatDebtRecalculateService } from "../vatDebt";
import { CreateOrderDto } from "./order.validator";
import {
  INCOME_EXPENSE_TYPES,
  IncomeExpenseRepository,
} from "../incomeExpense";
import {
  FUND_TRANSACTION_TYPES,
  FundTransactionRecalculate,
  FundTransactionService,
} from "../fundTransaction";
import { FUND_TYPES, FundRepository } from "../fund";
import { FundCategory } from "@/database/models/FundCategory";
import { FUND_CATEGORY_TYPES, FundCategoryRepository } from "../fundCategory";
import {
  LOYALTY_POINT_TYPES,
  LoyaltyPointRecalculateService,
} from "../loyaltyPoint";
import { generateCode } from "@/shared/utils/code.utils";
import { IncomeExpense } from "@/database/models/store/IncomeExpense";
import InventoryRecalculateQueue from "@/jobs/inventoryRecalculate.queue";

/**
 * Order Service - Tenant Entity
 *
 * Logic tính toán Order (đơn giản hơn Contract):
 * - Chỉ có 2 cấp: Order và OrderLine
 * - Không có phí phát sinh (extraFees)
 * - Không có phí nội bộ (internalCosts)
 * - Có thể có discount cấp line và cấp order
 * - Có thể có phí vận chuyển (shippingFee)
 */
@injectable()
export class OrderService extends BaseService<Order> {
  protected repository: OrderRepository;
  protected uniqueFields: (keyof Order)[] = ["code"];
  protected uniqueScope: (keyof Order)[] = ["type"];
  protected searchableFields = ["code", "note"];
  protected timeField: keyof Order & string = "orderAt";

  protected summaryFields?: (keyof Order)[] = [
    "grossAmount",
    "netAmount",
    "taxAmount",
    "totalAmount",
    "orderDiscountAmount",
    "lineDiscountAmount",
    "loyaltyPointsUsed",
  ];

  constructor(
    @inject(ORDER_TYPES.OrderRepository)
    repository: OrderRepository,
    @inject(FUND_CATEGORY_TYPES.FundCategoryRepository)
    private fundCategoryRepository: FundCategoryRepository,
    @inject(PARTNER_TYPES.PartnerRepository)
    private partnerRepository: PartnerRepository,
    @inject(EMPLOYEE_TYPES.EmployeeRepository)
    private employeeRepository: EmployeeRepository,
    @inject(PRODUCT_TYPES.ProductRepository)
    private productRepository: ProductRepository,
    @inject(FUND_TYPES.FundRepository)
    private fundRepository: FundRepository,
    @inject(INCOME_EXPENSE_TYPES.IncomeExpenseRepository)
    private incomeExpenseRepository: IncomeExpenseRepository,
    @inject(PARTNER_DEBT_TYPES.PartnerDebtRecalculateService)
    private partnerDebtRecalculateService: PartnerDebtRecalculateService,
    @inject(VAT_DEBT_TYPES.VatDebtRecalculateService)
    private vatDebtRecalculate: VatDebtRecalculateService,
    @inject(FUND_TRANSACTION_TYPES.FundTransactionRecalculate)
    private fundRecalculateService: FundTransactionRecalculate,
    @inject(FUND_TRANSACTION_TYPES.FundTransactionService)
    private fundTransactionService: FundTransactionService,
    @inject(LOYALTY_POINT_TYPES.LoyaltyPointRecalculateService)
    private loyaltyPointRecalculateService: LoyaltyPointRecalculateService,
  ) {
    super();
    this.repository = repository;
  }

  protected async attachMoreDataToEntity(
    entity: Order,
    req?: Request,
  ): Promise<void> {
    const storId = req?.query?.storeId as string;
    for (const line of entity.lines || []) {
      if (line.productVariantId) {
        const { stockQty, stockValue } =
          await this.productRepository.calculateVariantStock(
            line.productVariantId,
            storId,
          );
        (line.productVariant as any).stockQty = stockQty;
        (line.productVariant as any).stockValue = stockValue;
      }
    }
  }

  async validateBeforeCreate(
    data: DeepPartial<Order> & CreateOrderDto,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    const errors: IError[] = [];
    const { type } = data;
    const isReturnOrder =
      type === OrderTypeEnum.PURCHASE_RETURN ||
      type === OrderTypeEnum.SALE_RETURN;
    const isPayment = type === OrderTypeEnum.PURCHASE;

    // TODO: Sau này thay bằng cài đặt
    data.pointRedeemRate = data.pointRedeemRate || 1000;
    data.pointEarnRate = data.pointEarnRate || 100000;

    if (isReturnOrder) {
      const refOrder = await this.repository.findById(
        data.refOrderId!,
        manager,
      );

      data.partnerId = refOrder?.partnerId;
    }

    // Nạp các snapshot cần thiết
    if (data.partnerId) {
      const partnerSnapshot = await this.partnerRepository.getPartnerSnapshot(
        data.partnerId,
      );
      if (partnerSnapshot) {
        data.partnerSnapshot = partnerSnapshot;
      }
    }

    let employeeSnapshot: EmployeeSnapshot | null = null;
    if (data.employeeId) {
      employeeSnapshot = await this.employeeRepository.getEmployeeSnapshot(
        data.employeeId,
      );
      data.employeeSnapshot = employeeSnapshot;
    }

    if (data.shippingProviderId) {
      const shippingProviderSnapshot =
        await this.partnerRepository.getPartnerSnapshot(
          data.shippingProviderId,
        );
      if (shippingProviderSnapshot) {
        data.shippingProviderSnapshot = shippingProviderSnapshot;
      }
    }

    if (data.lines) {
      data.lines = await Promise.all(
        data.lines.map(async (line, idx) => {
          if (line.lineType === OrderLineTypeEnum.RETURN) {
            // 1️⃣ Bắt buộc có refOrderLineId
            if (!line.refOrderLineId) {
              errors.push({
                field: `lines.${idx}.refOrderLineId`,
                code: ErrorsMessages.required,
              });
              return {
                ...line,
                sortOrder: (idx + 1) * config.SORT_ORDER_STEP,
              };
            }

            // 2️⃣ Lấy line gốc
            const refLine = await manager.findOne(OrderLine, {
              where: {
                id: line.refOrderLineId,
                orderId: data.refOrderId!,
              },
            });

            if (!refLine) {
              errors.push({
                field: `lines.${idx}.refOrderLineId`,
                code: ErrorsMessages.not_found,
              });
              return {
                ...line,
                sortOrder: (idx + 1) * config.SORT_ORDER_STEP,
              };
            }

            // 3️⃣ Override dữ liệu KHÔNG cho sửa
            if (refLine.productVariantId)
              line.productVariantId = refLine.productVariantId;
            line.taxRate = refLine.taxRate;

            // 4️⃣ Validate quantity
            if (line.quantity! > refLine.quantity) {
              errors.push({
                field: `lines.${idx}.quantity`,
                code: ErrorsMessages.max,
              });
            }
          }

          const productVariantSnapshot =
            (await this.productRepository.getProductVariantSnapshot(
              line.productVariantId!,
            )) || undefined;

          // if (!productVariantSnapshot?.isActive) {
          //   errors.push({
          //     field: `lines.${idx}.productVariantId`,
          //     code: ErrorsMessages.inactive,
          //   });
          // }

          return {
            ...line,
            sortOrder: (idx + 1) * config.SORT_ORDER_STEP,
            productVariantSnapshot,
          };
        }),
      );
    }

    if (errors.length > 0) {
      throw new BadRequestError("Validation errors", errors);
    }

    const payments = (data as CreateOrderDto).payments;
    delete (data as CreateOrderDto).payments;

    // Tính toán order
    this.calculateOrder(data);

    if (payments && payments.length > 0) {
      let category: FundCategory | null = null;
      if (data.type === OrderTypeEnum.SALE) {
        category = await this.fundCategoryRepository.findOne({
          where: { name: INCOME_SALE_CATEGORY_NAME },
        });
      } else if (data.type === OrderTypeEnum.PURCHASE) {
        category = await this.fundCategoryRepository.findOne({
          where: { name: EXPENSE_PURCHASE_CATEGORY_NAME },
        });
      } else if (data.type === OrderTypeEnum.PURCHASE_RETURN) {
        category = await this.fundCategoryRepository.findOne({
          where: { name: INCOME_PURCHASE_CATEGORY_NAME },
        });
      } else if (data.type === OrderTypeEnum.SALE_RETURN) {
        category = await this.fundCategoryRepository.findOne({
          where: { name: INCOME_SALE_CATEGORY_NAME },
        });
      }

      const occurredAt = new Date(data.orderAt as any);
      occurredAt.setSeconds(occurredAt.getSeconds() + 1);

      // Tạo income expense tương ứng
      const type = isPayment
        ? IncomeExpenseTypeEnum.EXPENSE
        : IncomeExpenseTypeEnum.INCOME;
      // tạo code

      let incomeExpenses: DeepPartial<IncomeExpense>[] = [];

      if (payments.length === 1) {
        const payment = payments[0];
        if (payment?.amount) {
          if (!payment.fundId) {
            errors.push({
              field: "payment.fundId",
              code: ErrorsMessages.required,
            });
          }

          const amount = Math.min(
            (data.totalAmount || 0) - (data.loyaltyPointsDiscountAmount || 0),
            payment.amount,
          );

          const fund = await this.fundRepository.findById(
            payment.fundId!,
            manager,
          );

          if (!fund) {
            errors.push({
              field: "payment.fundId",
              code: ErrorsMessages.not_found,
            });
          } else {
            const offsetAt = new Date(data.orderAt as any);
            const funds =
              await this.fundTransactionService.enrichFundsWithBalance(
                [fund],
                offsetAt,
              );
            const fundBalance = (funds[0] as any)?.currentBalance || 0;
            if (payment.amount > fundBalance && isPayment) {
              errors.push({
                field: "payment.fundId",
                code: ErrorsMessages.insufficient_balance,
              });
            }
          }

          if (errors.length > 0) {
            throw new BadRequestError("Validation errors", errors);
          }
          const code = await generateCode(
            IncomeExpense,
            isPayment ? "expense" : "income",
          );
          incomeExpenses.push({
            code,
            occurredAt,
            fundId: payment.fundId!,
            partnerId: data.partnerId,
            categoryId: category?.id,
            amount,
            type,
            storeId: data.storeId,
            description: `Thanh toán cho đơn hàng ${data.code}`,
            creatorId: data.employeeId,
            creatorSnapshot: employeeSnapshot,
          });
        }
      } else {
        let totalPaymentAmount = payments.reduce(
          (sum, p) => sum + (p.amount || 0),
          0,
        );
        const totalOrderAmount =
          (data.totalAmount || 0) - (data.loyaltyPointsDiscountAmount || 0);

        if (totalPaymentAmount > totalOrderAmount) {
          errors.push({
            field: "paymentAmount",
            code: ErrorsMessages.max,
          });
        }
        for (const payment of payments) {
          if (payment?.amount) {
            if (!payment.fundId) {
              errors.push({
                field: "payment.fundId",
                code: ErrorsMessages.required,
              });

              continue;
            }

            const fund = await this.fundRepository.findById(
              payment.fundId,
              manager,
            );

            if (!fund) {
              errors.push({
                field: "payment.fundId",
                code: ErrorsMessages.not_found,
              });
            } else {
              const offsetAt = new Date(data.orderAt as any);
              const funds =
                await this.fundTransactionService.enrichFundsWithBalance(
                  [fund],
                  offsetAt,
                );
              const fundBalance = (funds[0] as any)?.currentBalance || 0;
              if (payment.amount > fundBalance && isPayment) {
                errors.push({
                  field: "payment.fundId",
                  code: ErrorsMessages.insufficient_balance,
                });
              }
            }

            if (errors.length > 0) {
              throw new BadRequestError("Validation errors", errors);
            }

            const code = await generateCode(
              IncomeExpense,
              isPayment ? "expense" : "income",
            );

            incomeExpenses.push({
              code,
              occurredAt,
              fundId: payment.fundId!,
              partnerId: data.partnerId,
              categoryId: category?.id,
              amount: payment.amount,
              type,
              storeId: data.storeId,
              description: `Thanh toán cho đơn hàng ${data.code}`,
              creatorId: data.employeeId,
              creatorSnapshot: employeeSnapshot,
            });
          }
        }
      }

      if (incomeExpenses.length > 0) {
        data.incomeExpenses = incomeExpenses;
      }
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<Order>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    // Không cho sửa đơn đã hủy hoặc cũ hơn 1 tuần
    const existing = await this.repository.findById(id, manager);
    if (!existing) {
      throw new BadRequestError("Đơn hàng không tồn tại");
    }

    if (existing.status === OrderStatusEnum.CANCELLED) {
      throw new BadRequestError("Không thể sửa đơn hàng đã hủy");
    }

    const errors: IError[] = [];
    // Nạp các snapshot cần thiết
    if (data.partnerId) {
      const partnerSnapshot = await this.partnerRepository.getPartnerSnapshot(
        data.partnerId,
      );
      if (partnerSnapshot) {
        data.partnerSnapshot = partnerSnapshot;
        await this.updatePartnerForReturnOrder(id, partnerSnapshot, manager);
      }
    }

    if (data.employeeId) {
      const employeeSnapshot =
        await this.employeeRepository.getEmployeeSnapshot(data.employeeId);
      data.employeeSnapshot = employeeSnapshot;
    } else if (data.employeeId === null) {
      data.employeeSnapshot = null;
    }

    if (data.shippingProviderId) {
      const shippingProviderSnapshot =
        await this.partnerRepository.getPartnerSnapshot(
          data.shippingProviderId,
        );
      if (shippingProviderSnapshot) {
        data.shippingProviderSnapshot = shippingProviderSnapshot;
      }
    }
    if (errors.length > 0) {
      throw new BadRequestError("Validation errors", errors);
    }
  }

  async updatePartnerForReturnOrder(
    refOrderId: string,
    partnerSnapshot: PartnerSnapshot,
    manager: EntityManager,
  ): Promise<void> {
    const returnOrders = await this.repository.findByOptions(
      { where: { refOrderId } },
      manager,
    );

    for (const returnOrder of returnOrders) {
      await this.repository.update(
        returnOrder.id,
        { partnerId: partnerSnapshot.id, partnerSnapshot },
        manager,
      );
    }
  }

  /**
   * Tính toán Order
   *
   * Thứ tự tính toán:
   * 1. Tính từng line (subTotal, discountAmount, netAmount - chưa tính thuế)
   *    - Return lines có giá trị âm (lineType = RETURN)
   *    - Normal lines có giá trị dương
   * 2. Tính order discount CHỈ từ normal lines
   * 3. Phân bổ order discount CHỈ xuống normal lines
   * 4. Tính thuế cho tất cả lines (return lines đã có dấu âm)
   * 5. Tính tổng order
   * 6. Cộng shipping fee vào totalAmount
   */
  private calculateOrder(data: DeepPartial<Order>): void {
    data.loyaltyPointsDiscountAmount =
      (data.loyaltyPointsUsed || 0) * (data.pointRedeemRate || 0);

    if (!data.lines || data.lines.length === 0) return;

    // Bước 1: Tính từng line (return lines sẽ có dấu âm)
    data.lines.forEach((line) => {
      this.calculateLine(line);
    });

    // Bước 2: Tách normal lines và return lines
    const normalLines = data.lines.filter(
      (line) => !line.lineType || line.lineType === OrderLineTypeEnum.NORMAL,
    );
    const returnLines = data.lines.filter(
      (line) => line.lineType === OrderLineTypeEnum.RETURN,
    );

    // Bước 3: Tính base amount CHỈ từ normal lines (để tính order discount)
    const normalLinesBaseAmount = normalLines.reduce(
      (sum, line) => sum + (line.netAmount || 0),
      0,
    );

    // Bước 4: Tính order discount amount CHỈ dựa trên normal lines
    const orderDiscountAmount = this.calculateAmount(
      normalLinesBaseAmount,
      data.discountType!,
      data.discountValue || 0,
    );

    // Bước 5: Phân bổ order discount CHỈ xuống normal lines
    let orderDiscountAllocated = 0;
    normalLines.forEach((line, index) => {
      let allocatedDiscount = 0;

      if (normalLinesBaseAmount > 0) {
        if (index === normalLines.length - 1) {
          // Line cuối nhận phần còn lại để tránh sai số làm tròn
          allocatedDiscount = orderDiscountAmount - orderDiscountAllocated;
        } else {
          // Phân bổ theo tỷ lệ
          allocatedDiscount =
            ((line.netAmount || 0) / normalLinesBaseAmount) *
            orderDiscountAmount;
          allocatedDiscount = Math.round(allocatedDiscount);
          orderDiscountAllocated += allocatedDiscount;
        }
      }

      line.orderDiscountAmount = allocatedDiscount;
      line.netAmount = line.netAmount! - allocatedDiscount;

      // Tính thuế
      line.taxAmount = line.netAmount * ((line.taxRate || 0) / 100);
      line.totalAmount = line.netAmount + line.taxAmount;
    });

    // Bước 6: Return lines không nhận phân bổ order discount, chỉ tính thuế
    returnLines.forEach((line) => {
      line.orderDiscountAmount = 0;
      // netAmount đã có dấu âm từ calculateLine()
      line.taxAmount = line.netAmount! * ((line.taxRate || 0) / 100);
      line.totalAmount = line.netAmount! + line.taxAmount;
    });

    // Bước 7: Tính tổng order (normal + return)
    data.grossAmount = data.lines.reduce(
      (sum, line) => sum + (line.subTotal || 0),
      0,
    );
    data.lineDiscountAmount = data.lines.reduce(
      (sum, line) => sum + (line.discountAmount || 0),
      0,
    );
    data.orderDiscountAmount = orderDiscountAmount;
    data.netAmount = data.lines.reduce(
      (sum, line) => sum + (line.netAmount || 0),
      0,
    );
    data.taxAmount = data.lines.reduce(
      (sum, line) => sum + (line.taxAmount || 0),
      0,
    );

    // Bước 8: Tính shipping fee
    const shippingFeeAmount = data.isFreeShipping ? 0 : data.shippingFee || 0;

    // Bước 9: Tổng tiền cuối
    data.totalAmount =
      data.lines.reduce((sum, line) => sum + (line.totalAmount || 0), 0) +
      shippingFeeAmount;
  }

  /**
   * Tính toán line
   * - Return lines (lineType = RETURN): có dấu âm
   * - Normal lines: có dấu dương
   * - subTotal = unitPrice * quantity * multiplier
   * - discountAmount = tính từ discountType và discountValue * multiplier
   * - netAmount = subTotal - discountAmount (CHƯA TÍNH THUẾ)
   */
  private calculateLine(line: DeepPartial<OrderLine>): void {
    // Xác định multiplier dựa vào lineType
    const multiplier = line.lineType === OrderLineTypeEnum.RETURN ? -1 : 1;

    // Tính subTotal
    line.subTotal = (line.unitPrice || 0) * (line.quantity || 0) * multiplier;

    // Tính line discount per unit
    const discountPerUnit = this.calculateAmount(
      line.unitPrice || 0,
      line.discountType!,
      line.discountValue || 0,
    );

    // Tính tổng line discount
    line.discountAmount = discountPerUnit * (line.quantity || 0) * multiplier;

    // Tính netAmount (chưa bao gồm order discount và CHƯA TÍNH THUẾ)
    line.netAmount = line.subTotal - line.discountAmount;

    // Khởi tạo các giá trị phân bổ
    line.orderDiscountAmount = 0;
    line.taxAmount = 0;
    line.totalAmount = 0;
  }

  /**
   * Tính amount từ type (AMOUNT | PERCENT) và value
   */
  private calculateAmount(
    baseAmount: number,
    type: DiscountTypeEnum,
    value: number,
  ): number {
    if (type === DiscountTypeEnum.PERCENT) {
      return (baseAmount * value) / 100;
    }
    return value;
  }

  /**
   * Recalculate order khi update từ lines
   */
  async recalculateOrder(
    orderId: string,
    manager: EntityManager,
  ): Promise<void> {
    try {
      // 1. Load full order với tất cả relation cần thiết cho tính toán
      const orderRepo = manager.getRepository(Order);

      const order = await orderRepo.findOne({
        where: { id: orderId },
        relations: {
          lines: true,
        },
      });

      if (!order) {
        throw new BadRequestError("Order not found");
      }

      // 2. Recalculate toàn bộ order
      this.calculateOrder(order);

      // 3. Persist (cascade save)
      await orderRepo.save(order);
    } catch (error) {
      logger.error(
        `Error in recalculateOrder for orderId ${orderId}: `,
        JSON.stringify(error, null, 2),
      );
      return;
    }
  }

  async handleAfterChangedData(
    data: Order,
    manager: EntityManager,
    req?: Request,
    options?: {
      skipInventoryRecalculate?: boolean;
      allowMissingOrder?: boolean;
    },
  ): Promise<void> {
    await this.recalculateOrder(data.id, manager);
    const oldData = await this.findById(data.id, req);
    if (data.status === OrderStatusEnum.CANCELLED) {
      // Xóa hết giao dịch thu chi liên quan
      await this.incomeExpenseRepository.softDeleteMany(
        { orderId: data.id },
        manager,
      );
    }

    const orderAt = this.getEarliestDate(data.orderAt, oldData?.orderAt);
    const recalculateFromDate = new Date(orderAt);
    recalculateFromDate.setMilliseconds(0);

    const storeIds = this.collectUniqueIds([data.storeId, oldData?.storeId]);
    const variantIds = this.collectUniqueIds([
      ...(data.lines?.map((line) => line.productVariantId) || []),
      ...(oldData?.lines?.map((line) => line.productVariantId) || []),
    ]);

    let inventoryRefType: InventoryRefTypeEnum = InventoryRefTypeEnum.SALE;
    if (data.type === OrderTypeEnum.PURCHASE) {
      inventoryRefType = InventoryRefTypeEnum.PURCHASE;
    } else if (data.type === OrderTypeEnum.PURCHASE_RETURN) {
      inventoryRefType = InventoryRefTypeEnum.PURCHASE_RETURN;
    } else if (data.type === OrderTypeEnum.SALE_RETURN) {
      inventoryRefType = InventoryRefTypeEnum.SALE_RETURN;
    }

    if (
      !options?.skipInventoryRecalculate &&
      variantIds.length &&
      storeIds.length
    ) {
      await InventoryRecalculateQueue.enqueueMany(
        variantIds.flatMap((variantId) =>
          storeIds.map((storeId) => ({
            variantId,
            storeId,
            fromDate: recalculateFromDate,
            source: {
              sourceType: inventoryRefType,
              refId: data.id,
            },
          })),
        ),
      );
    }

    const partnerIds = this.collectUniqueIds([
      data.partnerId,
      oldData?.partnerId,
      data.shippingProviderId,
      oldData?.shippingProviderId,
    ]);

    const fundIds = this.collectUniqueIds([
      ...(data.incomeExpenses?.map((ie) => ie.fundId) || []),
      ...(oldData?.incomeExpenses?.map((ie) => ie.fundId) || []),
    ]);

    if (fundIds.length > 0) {
      await this.fundRecalculateService.recalculateFromDate(
        recalculateFromDate,
        manager,
        fundIds,
      );
    }

    if (partnerIds.length > 0) {
      await this.partnerDebtRecalculateService.recalculateFromDate(
        data.storeId,
        recalculateFromDate,
        manager,
        partnerIds,
      );

      if (
        data.type === OrderTypeEnum.SALE ||
        data.type === OrderTypeEnum.SALE_RETURN
      ) {
        await this.loyaltyPointRecalculateService.recalculateFromDate(
          recalculateFromDate,
          manager,
          partnerIds,
        );
      }
    }

    await this.vatDebtRecalculate.recalculateFromDate(
      data.storeId,
      recalculateFromDate,
      manager,
    );
  }

  /**
   * Hook: Sau khi tạo Order
   * - Nếu có orderAt (đã nhập/xuất kho) → Recalculate inventory từ thời điểm đó
   * - Phải dùng recalculate vì Order có thể được tạo với orderAt trong quá khứ
   * - Nếu chỉ ghi thêm transaction thì các transaction sau sẽ có balance SAI
   */
  async actionAfterCreate(
    data: Order,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager, req);
  }

  /**
   * Hook: Sau khi cập nhật Order
   * - Recalculate inventory từ thời điểm orderAt
   */
  async actionAfterUpdate(
    data: Order,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager, req);
  }

  /**
   * Hook: Sau khi xóa Order
   * - Recalculate từ thời điểm của Order bị xóa
   */
  async actionAfterDelete(
    data: Order,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    await this.handleAfterChangedData(data, manager, req, {
      allowMissingOrder: true,
    });
  }
}
