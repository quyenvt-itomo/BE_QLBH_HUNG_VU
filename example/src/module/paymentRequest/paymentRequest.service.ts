import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { PaymentRequestRepository } from "./paymentRequest.repository";
import { PAYMENT_REQUEST_TYPES } from "./paymentRequest.types";
import { PaymentRequest } from "@/database/models/company/PaymentRequest";
import { PaymentRequestLine } from "@/database/models/company/PaymentRequestLine";
import { DeepPartial, EntityManager } from "typeorm";
import { Request } from "express";
import { withTransaction } from "@/shared/base/TransactionManager";
import { BadRequestError, NotFoundError } from "@/shared/types/errors";
import { ApproveStatus } from "@/shared/constants/enum";
import { RejectPaymentRequestDto } from "./paymentRequest.validator";
import { PARTNER_TYPES, PartnerRepository } from "@/module/partner";
import {
  PARTNER_CONTACT_TYPES,
  PartnerContactRepository,
} from "@/module/partnerContact";
import { EMPLOYEE_TYPES, EmployeeRepository } from "@/module/employee";

@injectable()
export class PaymentRequestService extends BaseService<PaymentRequest> {
  protected repository: PaymentRequestRepository;
  protected uniqueFields: (keyof PaymentRequest)[] = ["code"];
  protected uniqueScope?: (keyof PaymentRequest)[] = ["storeId"];
  protected searchableFields = ["code", "note"];
  protected timeField: keyof PaymentRequest = "timeAt";

  constructor(
    @inject(PAYMENT_REQUEST_TYPES.PaymentRequestRepository)
    repository: PaymentRequestRepository,
    @inject(PARTNER_TYPES.PartnerRepository)
    private partnerRepository: PartnerRepository,
    @inject(PARTNER_CONTACT_TYPES.PartnerContactRepository)
    private partnerContactRepository: PartnerContactRepository,
    @inject(EMPLOYEE_TYPES.EmployeeRepository)
    private employeeRepository: EmployeeRepository,
  ) {
    super();
    this.repository = repository;
  }

  async update(
    id: string,
    data: DeepPartial<PaymentRequest>,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<PaymentRequest | null> {
    const { lines, ...safeData } = data;
    const result = await super.update(
      id,
      safeData as DeepPartial<PaymentRequest>,
      manager,
      req,
    );
    if (lines !== undefined && result) {
      const run = async (trxManager: EntityManager) => {
        const lineRepo = trxManager.getRepository(PaymentRequestLine);
        const existing = await lineRepo.find({
          where: { paymentRequestId: id },
        });
        const incomingIds = new Set(
          lines.map((l: any) => l.id).filter(Boolean),
        );
        const removedIds = existing
          .map((l) => l.id)
          .filter((lid) => !incomingIds.has(lid));
        if (removedIds.length > 0) {
          await lineRepo.softDelete(removedIds);
        }
        const toSave = lines.map((l: any, i: number) => ({
          ...l,
          paymentRequestId: id,
          sortOrder: l.sortOrder || 10 * (i + 1),
        }));
        if (toSave.length > 0) {
          await lineRepo.save(toSave);
        }
      };
      if (manager) {
        await run(manager);
      } else {
        await withTransaction(run);
      }
    }
    return result;
  }

  async approve(id: string, req: Request): Promise<PaymentRequest> {
    return withTransaction(async (trxManager) => {
      const pr = await this.repository.findById(id, trxManager);
      if (!pr)
        throw new NotFoundError("KhÃ´ng tÃ¬m tháº¥y Ä‘á» nghá»‹ thanh toÃ¡n");
      if (pr.approveStatus !== ApproveStatus.PENDING) {
        throw new BadRequestError(
          "Chá»‰ cÃ³ thá»ƒ duyá»‡t Ä‘á» nghá»‹ Ä‘ang chá» duyá»‡t",
        );
      }
      return trxManager.getRepository(PaymentRequest).save({
        ...pr,
        approveStatus: ApproveStatus.APPROVED,
        approvedAt: new Date(),
      });
    });
  }

  async reject(
    id: string,
    dto: RejectPaymentRequestDto,
    req: Request,
  ): Promise<PaymentRequest> {
    return withTransaction(async (trxManager) => {
      const pr = await this.repository.findById(id, trxManager);
      if (!pr)
        throw new NotFoundError("KhÃ´ng tÃ¬m tháº¥y Ä‘á» nghá»‹ thanh toÃ¡n");
      if (pr.approveStatus !== ApproveStatus.PENDING) {
        throw new BadRequestError(
          "Chá»‰ cÃ³ thá»ƒ tá»« chá»‘i Ä‘á» nghá»‹ Ä‘ang chá» duyá»‡t",
        );
      }
      return trxManager.getRepository(PaymentRequest).save({
        ...pr,
        approveStatus: ApproveStatus.REJECTED,
        approvedAt: new Date(),
        rejectReason: dto.rejectReason,
      });
    });
  }

  async validateBeforeCreate(
    data: DeepPartial<PaymentRequest>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.partnerId) {
      data.partnerSnapshot = await this.partnerRepository.getSnapshot(
        data.partnerId,
        manager,
      );
    }
    if (data.partnerContactId) {
      data.partnerContactSnapshot =
        await this.partnerContactRepository.getSnapshot(
          data.partnerContactId,
          manager,
        );
    }
    if (data.staffId) {
      data.staffSnapshot = await this.employeeRepository.getSnapshot(
        data.staffId,
        manager,
      );
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<PaymentRequest>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const pr = await this.repository.findById(id, manager);
    if (!pr)
      throw new NotFoundError("KhÃ´ng tÃ¬m tháº¥y Ä‘á» nghá»‹ thanh toÃ¡n");
    if (pr.approveStatus === ApproveStatus.APPROVED) {
      throw new BadRequestError(
        "KhÃ´ng thá»ƒ sá»­a Ä‘á» nghá»‹ Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t",
      );
    }
    if (data.partnerId !== undefined) {
      data.partnerSnapshot = data.partnerId
        ? await this.partnerRepository.getSnapshot(data.partnerId, manager)
        : null;
    }
    if (data.partnerContactId !== undefined) {
      data.partnerContactSnapshot = data.partnerContactId
        ? await this.partnerContactRepository.getSnapshot(
            data.partnerContactId,
            manager,
          )
        : null;
    }
    if (data.staffId !== undefined) {
      data.staffSnapshot = data.staffId
        ? await this.employeeRepository.getSnapshot(data.staffId, manager)
        : null;
    }
  }
}
