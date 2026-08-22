import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { LoginApproval } from "@/database/models/LoginApproval";
import { injectable } from "inversify";
import {
  SelectQueryBuilder,
  FindOptionsSelect,
  FindOptionsRelations,
} from "typeorm";
import { LoginApprovalQueryDto } from "./loginApproval.validator";

export const LoginApprovalSelect: FindOptionsSelect<LoginApproval> = {
  id: true,
  userId: true,
  companyId: true,
  deviceId: true,
  deviceInfo: true,
  status: true,
  expiresAt: true,
  approvedAt: true,
  approvedById: true,
  approverSnapshot: true,
  createdAt: true,
  updatedAt: true,
};

export const LoginApprovalRelations: FindOptionsRelations<LoginApproval> = {};

@injectable()
export class LoginApprovalRepository extends BaseRepository<LoginApproval> {
  protected entityClass = LoginApproval;
  protected selectedFields = LoginApprovalSelect;
  protected relations = LoginApprovalRelations;
  protected enableFileAttachment = false;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<LoginApproval>,
    options: IFindPaginationOptions<LoginApproval>,
  ): Promise<void> {
    const alias = qb.alias;
    const { companyId, userId, status } =
      (options?.moreQuery as LoginApprovalQueryDto) || {};

    if (companyId) {
      qb.andWhere(`${alias}.companyId = :companyId`, { companyId });
    }
    if (userId) {
      qb.andWhere(`${alias}.userId = :userId`, { userId });
    }
    if (status) {
      qb.andWhere(`${alias}.status = :status`, { status });
    }
  }
}
