import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { ReferralCodeRepository } from "./referralCode.repository";
import { REFERRAL_CODE_TYPES } from "./referralCode.types";
import { ReferralCode } from "@/database/models/company/ReferralCode";
import { PurchaseRequisitionRepository } from "@/module/purchaseRequisition/purchaseRequisition.repository";
import { PURCHASE_REQUISITION_TYPES } from "@/module/purchaseRequisition/purchaseRequisition.types";
import { PurchaseRequisitionService } from "@/module/purchaseRequisition/purchaseRequisition.service";
import { BadRequestError, NotFoundError } from "@/shared/types/errors";
import { ApproveStatus } from "@/shared/constants/enum";
import { DeepPartial, EntityManager } from "typeorm";
import { EMPLOYEE_TYPES } from "../employee/employee.types";
import { EmployeeRepository } from "../employee/employee.repository";
import { PARTNER_TYPES } from "../partner/partner.types";
import { PartnerRepository } from "../partner/partner.repository";

@injectable()
export class ReferralCodeService extends BaseService<ReferralCode> {
  protected repository: ReferralCodeRepository;
  protected searchableFields = ["code"];

  constructor(
    @inject(REFERRAL_CODE_TYPES.ReferralCodeRepository)
    repository: ReferralCodeRepository,
    @inject(PURCHASE_REQUISITION_TYPES.PurchaseRequisitionRepository)
    private purchaseRequisitionRepository: PurchaseRequisitionRepository,
    @inject(EMPLOYEE_TYPES.EmployeeRepository)
    private employeeRepository: EmployeeRepository,
    @inject(PARTNER_TYPES.PartnerRepository)
    private partnerRepository: PartnerRepository,

    @inject(PURCHASE_REQUISITION_TYPES.PurchaseRequisitionService)
    private purchaseRequisitionService: PurchaseRequisitionService,
  ) {
    super();
    this.repository = repository;
  }

  async lockReferralCode(
    referralCodeId: string,
    manager?: EntityManager,
  ): Promise<ReferralCode | null> {
    return await this.repository.update(
      referralCodeId,
      { isLock: true },
      manager,
    );
  }

  /**
   * Ghi đè validateBeforeCreate từ BaseService.
   * Khi FE gọi POST /referral-code với { purchaseRequisitionId },
   * tự động validate PR đã duyệt, sinh code, gán staffId từ requestContext.
   */
  async validateBeforeCreate(
    data: DeepPartial<ReferralCode>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const purchaseRequisitionId = data.purchaseRequisitionId;
    if (!purchaseRequisitionId) {
      throw new BadRequestError(
        "Vui lòng cung cấp thông tin đề nghị mua vật tư",
        "purchaseRequisitionId",
      );
    }

    const canCreate =
      await this.purchaseRequisitionService.canCreateReferralCode(
        purchaseRequisitionId,
        req,
      );
    if (!canCreate.can)
      throw new BadRequestError(canCreate.reason, "purchaseRequisitionId");

    const storeId = req?.storeContext?.storeId;
    // Kiểm tra đề nghị tồn tại và đã duyệt (dùng repository đã inject)
    const pr = await this.purchaseRequisitionRepository.findOne(
      {
        where: { id: purchaseRequisitionId, storeId },
      },
      manager,
    );

    if (!pr) throw new NotFoundError("Không tìm thấy đề nghị mua vật tư");
    if (pr.approveStatus !== ApproveStatus.APPROVED) {
      throw new BadRequestError("Đề nghị mua vật tư chưa được duyệt");
    }

    data.staffId = req?.userContext?.employeeId || undefined;
    data.code = await this.generateCode();

    await this.employeeRepository.attachInfo(data, manager);
    await this.partnerRepository.attachInfo(data, manager);
  }

  /** Bind a referral code to a partner (supplier) and optionally mark used */
  async bindToPartner(
    referralCodeId: string,
    partnerId: string,
    partnerSnapshot: any,
    markUsed: boolean = true,
  ): Promise<ReferralCode | null> {
    const ref = await this.repository.findById(referralCodeId);
    if (!ref) throw new NotFoundError("Referral code not found");

    const update: Partial<ReferralCode> = {
      partnerId,
      partnerSnapshot,
    };
    if (markUsed && !ref.isUsed) {
      update.isUsed = true;
      update.usedAt = new Date();
    }

    await this.repository.update(referralCodeId, update);
    return await this.repository.findById(referralCodeId);
  }

  /**
   * Validate mã giới thiệu (tồn tại, chưa hết hạn, chưa bị khóa)
   * và trả về entity để caller xử lý nghiệp vụ riêng.
   */
  async validateAndResolve(
    id: string,
    storeId: string,
    manager?: EntityManager,
  ): Promise<ReferralCode> {
    const ref = await this.repository.findOne(
      { where: { id, storeId } as any },
      manager,
    );
    if (!ref) throw new BadRequestError("Mã giới thiệu không hợp lệ");
    if (ref.expiresAt && new Date() > ref.expiresAt)
      throw new BadRequestError("Mã giới thiệu đã hết hạn");
    if (ref.isLock)
      throw new BadRequestError(
        "Mã giới thiệu đã bị khóa, vui lòng liên hệ lại với người cung cấp.",
      );
    return ref;
  }

  /**
   * Public: giải mã mã giới thiệu, trả về thông tin đề nghị mua vật tư.
   */
  async decodePublic(code: string): Promise<ReferralCode | null> {
    const ref = await this.repository.findOne({
      where: { code } as any,
      relations: {
        purchaseRequisition: {
          department: true,
          requester: true,
        },
        staff: true,
      },
    });

    if (!ref) return null;

    // Kiểm tra hết hạn
    if (ref.expiresAt && new Date() > ref.expiresAt) {
      return null;
    }

    // NOTE: do not mark as used on public decode; usage should be claimed
    // when a supplier creates a quotation or when an admin approves it.
    return ref;
  }

  /**
   * Sinh mã giới thiệu dạng: xxxx xxxx xxxx xxxx (16 ký tự, mỗi nhóm 4)
   * x là chữ hoa, chữ thường hoặc số, không trùng mã cũ.
   */
  private async generateCode(): Promise<string> {
    const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"; // bỏ O,0,I,1,l để tránh nhầm

    for (let attempt = 0; attempt < 10; attempt++) {
      let raw = "";
      for (let i = 0; i < 16; i++) {
        raw += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
      }
      const code = `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 12)} ${raw.slice(12, 16)}`;

      // Kiểm tra trùng
      const exists = await this.repository.findOne({
        where: { code } as any,
      });
      if (!exists) return code;
    }

    // Fallback cực hiếm: thêm timestamp
    const ts = Date.now().toString(36).slice(-4);
    const code = `${ts}${"x".repeat(12)}`.replace(/x/g, () =>
      CHARS.charAt(Math.floor(Math.random() * CHARS.length)),
    );
    return `${code.slice(0, 4)} ${code.slice(4, 8)} ${code.slice(8, 12)} ${code.slice(12, 16)}`;
  }
}
