import { ContainerModule } from "inversify";
import { SHIPPING_PLAN_TYPES } from "./shippingPlan.types";
import { ShippingPlanController } from "./shippingPlan.controller";
import { ShippingPlanService } from "./shippingPlan.service";
import { ShippingPlanRepository } from "./shippingPlan.repository";
import { ShippingPlanRouter } from "./shippingPlan.route";

export const shippingPlanModule = new ContainerModule((bind) => {
  bind<ShippingPlanController>(SHIPPING_PLAN_TYPES.ShippingPlanController).to(
    ShippingPlanController,
  );
  bind<ShippingPlanService>(SHIPPING_PLAN_TYPES.ShippingPlanService).to(
    ShippingPlanService,
  );
  bind<ShippingPlanRepository>(SHIPPING_PLAN_TYPES.ShippingPlanRepository).to(
    ShippingPlanRepository,
  );
  bind<ShippingPlanRouter>(SHIPPING_PLAN_TYPES.ShippingPlanRouter).to(
    ShippingPlanRouter,
  );
});
