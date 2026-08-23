import { injectable, inject } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { Attribute } from "@/database/models/Attribute";
import { AttributeService } from "./attribute.service";
import { ATTRIBUTE_TYPES } from "./attribute.types";

@injectable()
export class AttributeController extends BaseController<Attribute> {
  protected service: AttributeService;
  constructor(
    @inject(ATTRIBUTE_TYPES.AttributeService) service: AttributeService,
  ) {
    super();
    this.service = service;
  }
}
