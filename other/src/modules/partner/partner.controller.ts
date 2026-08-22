import { injectable, inject } from "inversify";
import { PartnerService } from "./partner.service";
import { PARTNER_TYPES } from "./partner.types";
import { BaseController } from "@/shared/base/BaseController";
import { Partner } from "@/database/models/Partner";
import { Request, Response } from "express";
import { PartnerQueryByRoleDto } from "./partner.validator";

/**
 * Partner Controller - Tenant Entity
 */
@injectable()
export class PartnerController extends BaseController<Partner> {
  protected service: PartnerService;

  constructor(
    @inject(PARTNER_TYPES.PartnerService) partnerService: PartnerService,
  ) {
    super();
    this.service = partnerService;
  }

  getByRole = async (
    req: Request,
    res: Response,
    next: (err?: any) => void,
  ): Promise<Response<any, Record<string, any>> | undefined> => {
    try {
      const options = req.query as unknown as PartnerQueryByRoleDto;

      const { role } = options;

      const data = await this.service.getByRole(role, options);
      return res.status(data.statusCode).json(data);
    } catch (error) {
      console.error(error);
      next(error);
    }
  };
}
