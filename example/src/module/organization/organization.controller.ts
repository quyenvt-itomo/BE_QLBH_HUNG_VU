import { injectable, inject } from "inversify";
import { OrganizationService } from "./organization.service";
import { BaseController } from "@/shared/base/BaseController";
import { ORGANIZATION_TYPES } from "./organization.types";
import { Organization } from "@/database/models/Organization";
import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "@/shared/utils/controller.utils";
import logger from "@/shared/utils/logger";
import { UpdateSortOrderDto } from "./organization.validator";

@injectable()
export class OrganizationController extends BaseController<Organization> {
  protected service: OrganizationService;

  constructor(
    @inject(ORGANIZATION_TYPES.OrganizationService)
    service: OrganizationService,
  ) {
    super();
    this.service = service;
  }

  updateBulkSortOrder = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { data } = req.body as UpdateSortOrderDto;
        await this.service.updateSortOrder(data);

        this.sendResponse({
          res,
          message: "Cập nhật thứ tự thành công",
        });
      } catch (error) {
        logger.error(
          `Error OrganizationController:[updateSortOrder]: ${JSON.stringify(
            error,
            null,
            2,
          )}`,
        );
        return this.sendError({ res });
      }
    },
  );

  getPublicInfoByCode = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { code } = req.params;
        const organization = await this.service.getPublicInfoByCode(code);

        if (!organization) {
          return res
            .status(404)
            .json({ message: "Không tìm thấy thông tin tổ chức" });
        }

        this.sendResponse({
          res,
          data: organization,
          message: "Lấy thông tin đơn vị thành công",
        });
      } catch (error) {
        logger.error(
          `Error OrganizationController:[getPublicInfoByCode]: ${JSON.stringify(
            error,
            null,
            2,
          )}`,
        );
        this.sendError({ res });
      }
    },
  );
}
