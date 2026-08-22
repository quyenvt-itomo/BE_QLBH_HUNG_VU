import { injectable, inject } from "inversify";
import { GateLogService } from "./gateLog.service";
import { GATE_LOG_TYPES } from "./gateLog.types";
import { BaseController } from "@/shared/base/BaseController";
import { GateLog } from "@/database/models/company/GateLog";
import { asyncHandler } from "@/shared/utils/controller.utils";
import {
  GateEntrySchema,
  GateExitSchema,
  LinkGateLogSchema,
} from "./gateLog.validator";

@injectable()
export class GateLogController extends BaseController<GateLog> {
  protected service: GateLogService;

  constructor(@inject(GATE_LOG_TYPES.GateLogService) service: GateLogService) {
    super();
    this.service = service;
  }

  enter = asyncHandler(async (req, res, _next) => {
    const { id } = req.params;
    const dto = GateEntrySchema.parse(req.body);
    const data = await this.service.enter(id, dto, req);
    this.sendResponse({ res, data });
  });

  exit = asyncHandler(async (req, res, _next) => {
    const { id } = req.params;
    const dto = GateExitSchema.parse(req.body);
    const data = await this.service.exit(id, dto, req);
    this.sendResponse({ res, data });
  });

  link = asyncHandler(async (req, res, _next) => {
    const { id } = req.params;
    const dto = LinkGateLogSchema.parse(req.body);
    const data = await this.service.link(id, dto, req);
    this.sendResponse({ res, data });
  });
}
