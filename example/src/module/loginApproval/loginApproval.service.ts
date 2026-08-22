import type {
  ActionMap,
  ActionValue,
  RequestContext,
} from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import {
  LoginApproval,
  LoginApprovalStatusEnum,
} from "@/database/models/LoginApproval";
import { LOGIN_APPROVAL_TYPES } from "./loginApproval.types";
import { LoginApprovalRepository } from "./loginApproval.repository";
import { Request } from "express";
import { withTransaction } from "@/shared/base/TransactionManager";
import { BadRequestError, NotFoundError } from "@/shared/types/errors";
import socketService from "@/config/socket";
import { DeepPartial } from "typeorm";
import { EMPLOYEE_TYPES } from "../employee/employee.types";
import { EmployeeRepository } from "../employee/employee.repository";

@injectable()
export class LoginApprovalService extends BaseService<LoginApproval> {
  protected repository: LoginApprovalRepository;

  constructor(
    @inject(LOGIN_APPROVAL_TYPES.LoginApprovalRepository)
    repository: LoginApprovalRepository,

    @inject(EMPLOYEE_TYPES.EmployeeRepository)
    private employeeRepository: EmployeeRepository,
  ) {
    super();
    this.repository = repository;
  }

  /**
   * Approve a login approval record and notify the device via socket
   */
  async approve(id: string, req?: RequestContext): Promise<LoginApproval> {
    const employeeId = req?.userContext?.employeeId ?? null;
    return withTransaction(async (trxManager) => {
      const approval = await this.repository.getById(id, trxManager);

      const canApprove = await this.canApprove(approval, req);
      if (!canApprove.can) throw new BadRequestError(canApprove.reason);

      const updatedData: DeepPartial<LoginApproval> = {
        status: LoginApprovalStatusEnum.APPROVED,
        approvedAt: new Date(),
        approvedById: employeeId,
      };

      await this.employeeRepository.attachInfo(updatedData, trxManager);

      const updated = await this.repository.update(
        approval.id,
        updatedData,
        trxManager,
      );

      if (!updated)
        throw new NotFoundError("Phê duyệt yêu cầu xác thực không thành công");

      return updated;
    });
  }

  /**
   * Reject a login approval record
   */
  async reject(id: string, req?: RequestContext): Promise<LoginApproval> {
    const employeeId = req?.userContext?.employeeId ?? null;
    return withTransaction(async (trxManager) => {
      const approval = await this.repository.getById(id, trxManager);

      const canReject = await this.canReject(approval, req);
      if (!canReject.can) throw new BadRequestError(canReject.reason);

      const updatedData: DeepPartial<LoginApproval> = {
        status: LoginApprovalStatusEnum.REJECTED,
        approvedAt: new Date(),
        approvedById: employeeId,
      };

      await this.employeeRepository.attachInfo(updatedData, trxManager);

      const updated = await this.repository.update(
        approval.id,
        updatedData,
        trxManager,
      );

      if (!updated)
        throw new NotFoundError("Từ chối yêu cầu xác thực không thành công");

      return updated;
    });
  }

  /**
   * Expire all overdue PENDING approvals (called by cron or on demand)
   */
  async expireStale(): Promise<void> {
    await this.repository
      .getRepository()
      .createQueryBuilder()
      .update(LoginApproval)
      .set({ status: LoginApprovalStatusEnum.EXPIRED })
      .where("status = :status", { status: LoginApprovalStatusEnum.PENDING })
      .andWhere("expiresAt < :now", { now: new Date() })
      .execute();
  }

  protected async attachActions(
    entity: LoginApproval & { _actions?: ActionMap },
    req?: RequestContext,
  ): Promise<void> {
    entity._actions = await this.getActions(entity, req);
  }

  private async getActions(
    entity: LoginApproval | null,
    req?: RequestContext,
  ): Promise<ActionMap> {
    const actions = this.getDefaultAction();
    if (!entity) return actions;
    actions.update = await this.canUpdate(entity, req);
    actions.delete = await this.canDelete(entity, req);
    actions.approve = await this.canApprove(entity, req);
    actions.reject = await this.canReject(entity, req);
    return actions;
  }

  async canUpdate(
    entity: LoginApproval,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    return { can: false, reason: "Không thể cập nhật yêu cầu xác thực" };
  }

  async canDelete(
    entity: LoginApproval,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    return { can: false, reason: "Không thể xóa yêu cầu xác thực" };
  }

  async canApprove(
    entity: LoginApproval,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (new Date() > entity.expiresAt) {
      if (entity.status !== LoginApprovalStatusEnum.EXPIRED) {
        await this.repository.update(entity.id, {
          status: LoginApprovalStatusEnum.EXPIRED,
        });
      }
      throw new BadRequestError("Yêu cầu đã quá hạn và không thể duyệt");
    }

    if (entity.status !== LoginApprovalStatusEnum.PENDING) {
      return { can: false, reason: "Yêu cầu không ở trạng thái chờ duyệt" };
    }

    return { can: true };
  }

  async canReject(
    entity: LoginApproval,
    _req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.status !== LoginApprovalStatusEnum.PENDING) {
      return { can: false, reason: "Yêu cầu không ở trạng thái chờ duyệt" };
    }
    return { can: true };
  }
}
