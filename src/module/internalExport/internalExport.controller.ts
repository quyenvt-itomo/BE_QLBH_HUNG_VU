import { inject, injectable } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { InternalExport } from "@/database/models/store/InternalExport";
import { InternalExportService } from "./internalExport.service";
import { INTERNAL_EXPORT_TYPES } from "./internalExport.types";

@injectable()
export class InternalExportController extends BaseController<InternalExport> {
  protected service: InternalExportService;
  constructor(@inject(INTERNAL_EXPORT_TYPES.Service) service: InternalExportService) {
    super();
    this.service = service;
  }
}
