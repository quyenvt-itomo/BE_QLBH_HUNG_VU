import { inject, injectable } from "inversify";
import { DebtAdjustment } from "@/database/models/DebtAdjustment";
import { BaseController } from "@/shared/base/BaseController";
import { Request, Response } from "express";
import { DebtAdjustmentService } from "./debtAdjustment.service";
import { DEBT_ADJUSTMENT_TYPES } from "./debtAdjustment.types";
import { DebtAdjustmentQuery } from "./debtAdjustment.validator";
@injectable()
export class DebtAdjustmentController extends BaseController<DebtAdjustment> {
  protected service: DebtAdjustmentService;
  constructor(@inject(DEBT_ADJUSTMENT_TYPES.Service) service: DebtAdjustmentService) { super(); this.service = service; }

  getAllWithPagination = async (
    req: Request,
    res: Response,
    next: (err?: any) => void,
  ): Promise<Response<any, Record<string, any>> | undefined> => {
    try {
      const options = req.query as unknown as DebtAdjustmentQuery;
      const reqContext = this.service.getReqContext(req);
      const data = await this.service.findAllWithPagination(options, undefined, reqContext);
      if (data.data?.length) await this.service.hydrateEntities(data.data, reqContext);
      const { totalReceivable, totalPayable, filterItems } =
        await this.service.getFilterItemsAndTotal(options, reqContext);

      return res.status(data.statusCode).json({
        ...data,
        summary: { totalReceivable, totalPayable },
        filterItems,
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  };
}
