import { inject, injectable } from "inversify";
import { Request, Response, NextFunction } from "express";
import { BaseController } from "@/shared/base/BaseController";
import { Shift } from "@/database/models/store/Shift";
import { SHIFT_TYPES } from "./shift.types";
import { ShiftService } from "./shift.service";
import { asyncHandler } from "@/shared/utils/controller.utils";
import { CloseShiftDto, OpenShiftDto, ShiftParamsDto } from "./shift.validator";

@injectable()
export class ShiftController extends BaseController<Shift> {
  protected service: ShiftService;

  constructor(
    @inject(SHIFT_TYPES.ShiftService)
    service: ShiftService,
  ) {
    super();
    this.service = service;
  }

  getShiftSummary = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;

        const summary = await this.service.getShiftSummary(id, req);

        this.sendResponse({
          res,
          data: summary,
          message: "Lấy thông tin tổng kết ca làm việc thành công",
        });
      } catch (error) {
        next(error);
      }
    },
  );

  openShift = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const payload = req.body as OpenShiftDto;
        const data = await this.service.openShift(payload, undefined, req);

        this.sendResponse({
          res,
          data,
          message: "Mở ca thành công",
        });
      } catch (error) {
        next(error);
      }
    },
  );

  closeShift = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params as ShiftParamsDto;
        const payload = req.body as CloseShiftDto;

        const data = await this.service.closeShift(id, payload, req);

        this.sendResponse({
          res,
          data,
          message: "Đóng ca thành công",
        });
      } catch (error) {
        next(error);
      }
    },
  );
}
