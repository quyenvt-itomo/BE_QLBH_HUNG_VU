import { injectable, inject } from "inversify";
import { OrderCommissionService } from "./orderCommission.service";
import { ORDER_COMMISSION_TYPES } from "./orderCommission.types";
import { BaseController } from "@/shared/base/BaseController";
import { OrderCommission } from "@/database/models/store/OrderCommission";

@injectable()
export class OrderCommissionController extends BaseController<OrderCommission> {
  protected service: OrderCommissionService;

  constructor(
    @inject(ORDER_COMMISSION_TYPES.OrderCommissionService)
    service: OrderCommissionService,
  ) {
    super();
    this.service = service;
  }
}
