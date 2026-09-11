import { inject, injectable } from "inversify";
import { Router } from "express";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { AnalysisController } from "./analysis.controller";
import { ANALYSIS_TYPES } from "./analysis.types";
import { AnalysisQuerySchema } from "./analysis.validator";

@injectable()
export class AnalysisRouter {
  private router = Router();
  constructor(@inject(ANALYSIS_TYPES.Controller) controller: AnalysisController) {
    this.router.use(permissionMiddleware("analysis", "read"));
    const add = (path: string, handler: any) => this.router.get(path, zodValidate(AnalysisQuerySchema, "query"), handler);
    add("/sale/overview/metrics", controller.getSaleOverviewMetrics);
    add("/sale/overview/business-indicator", controller.getSaleBusinessIndicator);
    add("/sale/overview/top-product-groups", controller.getSaleTopProductGroups);
    add("/sale/overview/top-products", controller.getSaleTopProducts);
    add("/sale/overview/top-customer-groups", controller.getSaleTopCustomerGroups);
    add("/sale/profit/metrics", controller.getSaleProfitMetrics);
    add("/sale/profit/cost-structure", controller.getSaleProfitCostStructure);
    add("/sale/profit/effectiveness", controller.getSaleProfitEffectiveness);
    add("/product/overview", controller.getProductOverview);
    add("/product/inventory", controller.getProductInventory);
    add("/product/classification", controller.getProductClassification);
    add("/customer/overview", controller.getCustomerOverview);
    add("/customer/classification", controller.getCustomerClassification);
    add("/effectiveness/receivable", controller.getReceivable);
  }
  getRouter(): Router { return this.router; }
}
