import { injectable, inject } from "inversify";
import { ReferralCodeService } from "./referralCode.service";
import { BaseController } from "@/shared/base/BaseController";
import { REFERRAL_CODE_TYPES } from "./referralCode.types";
import { ReferralCode } from "@/database/models/company/ReferralCode";
import { Request, Response, NextFunction } from "express";

@injectable()
export class ReferralCodeController extends BaseController<ReferralCode> {
  protected service: ReferralCodeService;

  constructor(
    @inject(REFERRAL_CODE_TYPES.ReferralCodeService)
    service: ReferralCodeService,
  ) {
    super();
    this.service = service;
  }

  /** Public: giải mã */
  decodePublic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.params;
      const data = await this.service.decodePublic(code);
      if (!data) {
        return res.status(404).json({
          success: false,
          message: "Mã giới thiệu không tồn tại hoặc đã hết hạn",
        });
      }
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  bindToPartner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { partnerId, markUsed } = req.body as any;
      const reqContext = this.service.getReqContext(req);
      const partnerSnapshot = req.body.partnerSnapshot || null;
      const data = await this.service.bindToPartner(
        id,
        partnerId,
        partnerSnapshot,
        !!markUsed,
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
