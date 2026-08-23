import { injectable, inject } from "inversify";
import { PartnerService } from "./partner.service";
import { PARTNER_TYPES } from "./partner.types";
import { BaseController } from "@/shared/base/BaseController";
import { Partner } from "@/database/models/company/Partner";
import { asyncHandler } from "@/shared/utils/controller.utils";
import { BaseParamsSchema } from "@/shared/base/BaseValidator";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  PartnerContactSchema,
  PartnerPublicParamsDto,
} from "./partner.validator";

/**
 * Partner Controller - Tenant Entity
 */
@injectable()
export class PartnerController extends BaseController<Partner> {
  protected service: PartnerService;

  constructor(@inject(PARTNER_TYPES.PartnerService) service: PartnerService) {
    super();
    this.service = service;
  }

  getPublicByTaxCode = asyncHandler(async (req, res, _next) => {
    const { taxCode } = req.params as unknown as PartnerPublicParamsDto;
    const storeId = req.headers["x-company-id"] as string;
    const data = await this.service.getPublicByTaxCode(taxCode, storeId);
    this.sendResponse({ res, data });
  });

  getContacts = asyncHandler(async (req, res, _next) => {
    const { id } = req.params;
    const data = await this.service.getContacts(id);
    this.sendResponse({ res, data });
  });

  createContact = asyncHandler(async (req, res, _next) => {
    const { id } = req.params;
    const reqContext = this.service.getReqContext(req);
    const data = await this.service.createContact(id, req.body, reqContext);
    this.sendResponse({ res, data, statusCode: 201 });
  });

  updateContact = asyncHandler(async (req, res, _next) => {
    const { id, contactId } = req.params;
    const reqContext = this.service.getReqContext(req);
    const data = await this.service.updateContact(
      id,
      contactId,
      req.body,
      reqContext,
    );
    this.sendResponse({ res, data });
  });

  deleteContact = asyncHandler(async (req, res, _next) => {
    const { id, contactId } = req.params;
    await this.service.deleteContact(id, contactId);
    this.sendResponse({ res, data: null });
  });
}
