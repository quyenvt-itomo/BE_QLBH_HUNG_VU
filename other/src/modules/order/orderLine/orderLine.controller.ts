import { injectable, inject } from "inversify";
import { OrderLineService } from "./orderLine.service";
import { ORDER_LINE_TYPES } from "./orderLine.types";
import { BaseController } from "@/shared/base/BaseController";
import { OrderLine } from "@/database/models/store/OrderLine";

/**
 * OrderLine Controller - Tenant Entity
 */
@injectable()
export class OrderLineController extends BaseController<OrderLine> {
  protected service: OrderLineService;

  constructor(
    @inject(ORDER_LINE_TYPES.OrderLineService)
    service: OrderLineService,
  ) {
    super();
    this.service = service;
  }
}
