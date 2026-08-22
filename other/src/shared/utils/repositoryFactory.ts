import { container } from "@/config/container";
import { ATTRIBUTE_TYPES } from "@/modules/attribute/attribute.types";
import { EMPLOYEE_TYPES } from "@/modules/employee/employee.types";
import { FILE_TYPES } from "@/modules/file/file.types";
import { NOTIFICATION_TYPES } from "@/modules/notification/notification.types";
import { PRODUCT_OPTION_TYPES } from "@/modules/product/productOption/productOption.types";
import { PRODUCT_VARIANT_TYPES } from "@/modules/product/productVariant/productVariant.types";
import { PRODUCT_TYPES } from "@/modules/product/product.types";
import { PARTNER_TYPES } from "@/modules/partner/partner.types";
import { PARTNER_CONTACT_TYPES } from "@/modules/partner/partnerContact/partnerContact.types";
import { PARTNER_SUB_TYPE_TYPES } from "@/modules/partner/partnerSubType/partnerSubType.types";
import { ROLE_TYPES } from "@/modules/role/role.types";
import { STORE_TYPES } from "@/modules/store/store.types";
import { SYSTEM_ROLE_TYPES } from "@/modules/systemRole/systemRole.types";
import { USER_TYPES } from "@/modules/user/user.types";
import { ORDER_TYPES } from "@/modules/order/order.types";
import { ORDER_LINE_TYPES } from "@/modules/order/orderLine/orderLine.types";
import { INVENTORY_ADJUSTMENT_TYPES } from "@/modules/inventoryAdjustment/inventoryAdjustment.types";
import { INVENTORY_ADJUSTMENT_LINE_TYPES } from "@/modules/inventoryAdjustment/inventoryAdjustmentLine/inventoryAdjustmentLine.types";
import { STORE_TRANSFER_TYPES } from "@/modules/storeTransfer/storeTransfer.types";
import { STORE_TRANSFER_LINE_TYPES } from "@/modules/storeTransfer/storeTransferLine/storeTransferLine.types";
import { FUND_TYPES } from "@/modules/fund/fund.types";
import { FUND_CATEGORY_TYPES } from "@/modules/fundCategory/fundCategory.types";
import { FUND_ADJUSTMENT_TYPES } from "@/modules/fundAdjustment/fundAdjustment.types";
import { FUND_TRANSFER_TYPES } from "@/modules/fundTransfer/fundTransfer.types";
import { INCOME_EXPENSE_TYPES } from "@/modules/incomeExpense/incomeExpense.types";
import { PARTNER_DEBT_ADJUSTMENT_TYPES } from "@/modules/partnerDebtAdjustment/partnerDebtAdjustment.types";
import { PARTNER_DEBT_OFFSET_TYPES } from "@/modules/partnerDebtOffset/partnerDebtOffset.types";
import { VAT_DEBT_ADJUSTMENT_TYPES } from "@/modules/vatDebtAdjustment/vatDebtAdjustment.types";
import { LOYALTY_POINT_TYPES } from "@/modules/loyaltyPoint/loyaltyPoint.types";

/**
 * Factory để tạo repository map cho tenant entities
 * Tự động lấy tất cả repositories từ inversify container
 */
export class RepositoryFactory {
  private static repoMap: Record<string, any> | null = null;

  /**
   * Lấy tất cả tenant repositories
   * Map entity name -> repository instance
   */
  static getRepositories(): Record<string, any> {
    // Cache lại để không phải get nhiều lần
    if (this.repoMap) {
      return this.repoMap;
    }

    this.repoMap = {
      // Tenant entities
      Attribute: container.get(ATTRIBUTE_TYPES.AttributeRepository),
      Notification: container.get(NOTIFICATION_TYPES.NotificationRepository),
      File: container.get(FILE_TYPES.FileRepository),
      User: container.get(USER_TYPES.UserRepository),
      Store: container.get(STORE_TYPES.StoreRepository),
      SystemRole: container.get(SYSTEM_ROLE_TYPES.SystemRoleRepository),
      Product: container.get(PRODUCT_TYPES.ProductRepository),
      ProductOption: container.get(
        PRODUCT_OPTION_TYPES.ProductOptionRepository,
      ),
      ProductVariant: container.get(
        PRODUCT_VARIANT_TYPES.ProductVariantRepository,
      ),
      Partner: container.get(PARTNER_TYPES.PartnerRepository),
      PartnerContact: container.get(
        PARTNER_CONTACT_TYPES.PartnerContactRepository,
      ),
      PartnerSubType: container.get(
        PARTNER_SUB_TYPE_TYPES.PartnerSubTypeRepository,
      ),

      // Store scope entities
      Employee: container.get(EMPLOYEE_TYPES.EmployeeRepository),
      Role: container.get(ROLE_TYPES.RoleRepository),
      Order: container.get(ORDER_TYPES.OrderRepository),
      OrderLine: container.get(ORDER_LINE_TYPES.OrderLineRepository),
      InventoryAdjustment: container.get(
        INVENTORY_ADJUSTMENT_TYPES.InventoryAdjustmentRepository,
      ),
      InventoryAdjustmentLine: container.get(
        INVENTORY_ADJUSTMENT_LINE_TYPES.InventoryAdjustmentLineRepository,
      ),
      StoreTransfer: container.get(
        STORE_TRANSFER_TYPES.StoreTransferRepository,
      ),
      StoreTransferLine: container.get(
        STORE_TRANSFER_LINE_TYPES.StoreTransferLineRepository,
      ),

      Fund: container.get(FUND_TYPES.FundRepository),
      FundCategory: container.get(FUND_CATEGORY_TYPES.FundCategoryRepository),
      FundAdjustment: container.get(
        FUND_ADJUSTMENT_TYPES.FundAdjustmentRepository,
      ),
      FundTransfer: container.get(FUND_TRANSFER_TYPES.FundTransferRepository),
      IncomeExpense: container.get(
        INCOME_EXPENSE_TYPES.IncomeExpenseRepository,
      ),

      PartnerDebtAdjustment: container.get(
        PARTNER_DEBT_ADJUSTMENT_TYPES.PartnerDebtAdjustmentRepository,
      ),
      PartnerDebtOffset: container.get(
        PARTNER_DEBT_OFFSET_TYPES.PartnerDebtOffsetRepository,
      ),
      VatDebtAdjustment: container.get(
        VAT_DEBT_ADJUSTMENT_TYPES.VatDebtAdjustmentRepository,
      ),

      LoyaltyPoint: container.get(LOYALTY_POINT_TYPES.LoyaltyPointRepository),
    };

    return this.repoMap;
  }

  /**
   * Reset cache (dùng khi cần refresh repositories)
   */
  static reset(): void {
    this.repoMap = null;
  }
}
