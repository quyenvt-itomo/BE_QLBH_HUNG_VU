import type { RequestContext } from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { OrganizationRepository } from "./organization.repository";
import { ORGANIZATION_TYPES } from "./organization.types";
import {
  CompanyType,
  Organization,
  OrganizationTypeEnum,
} from "@/database/models/Organization";
import {
  OrganizationRelations,
  OrganizationSelectFull,
} from "./organization.select";
import { DeepPartial, EntityManager } from "typeorm";
import { roleSeeder } from "@/database/seeders/role";
import { TeamOperation } from "@/database/models/TeamOperation";
import { BadRequestError, ValidationError } from "@/shared/types/errors";
import { withTransaction } from "@/shared/base/TransactionManager";
import logger from "@/shared/utils/logger";

/**
 * Organization Service
 */
@injectable()
export class OrganizationService extends BaseService<Organization> {
  protected repository: OrganizationRepository;
  protected uniqueFields: (keyof Organization)[] = ["code"];
  protected searchableFields = [
    "code",
    "name",
    "email",
    "phone",
    "taxCode",
    "industry",
    "responsibility",
    "establishment",
    "note",
  ];

  constructor(
    @inject(ORGANIZATION_TYPES.OrganizationRepository)
    repository: OrganizationRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(
    data: DeepPartial<Organization>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.type && CompanyType.includes(data.type)) {
      data.roles = roleSeeder;
    }

    const operations = (data as any).operations as
      | DeepPartial<TeamOperation>[]
      | undefined;

    if (operations) {
      this.assertOperationPayload(
        data.type as OrganizationTypeEnum,
        operations,
      );
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<Organization>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const existing = await this.repository.getById(id, manager);

    const operations = (data as any).operations as
      | DeepPartial<TeamOperation>[]
      | undefined;
    delete (data as any).operations;

    const nextType =
      (data.type as OrganizationTypeEnum | undefined) || existing.type;

    if (operations) {
      this.assertOperationPayload(nextType, operations);
    }

    if (nextType !== OrganizationTypeEnum.TEAM) {
      await manager.softDelete(TeamOperation, { teamId: id } as any);
      return;
    }

    if (operations) {
      await this.syncOperations(id, operations, manager);
    }
  }

  async getPublicInfoByCode(
    code: string,
  ): Promise<Partial<Organization> | null> {
    const organization = await this.repository.findByOption({
      where: { code },
      select: {
        ...OrganizationSelectFull,
      },
      relations: {
        ...OrganizationRelations,
      },
    });

    if (!organization) {
      return null;
    }

    return organization;
  }

  async updateSortOrder(
    data: { id: string; sortOrder: number }[],
    manager?: EntityManager,
  ): Promise<void> {
    try {
      await withTransaction(async (trxManager) => {
        for (const item of data) {
          await this.repository.update(
            item.id,
            { sortOrder: item.sortOrder },
            trxManager,
          );
        }
      });
    } catch (error) {
      logger.error("[Organization] updateSortOrder failed:", error);
      throw new BadRequestError("Cập nhật thứ tự không thành công");
    }
  }

  private assertOperationPayload(
    orgType: OrganizationTypeEnum,
    operations: DeepPartial<TeamOperation>[],
  ): void {
    const duplicateErrors = this.checkDuplicate(
      operations as Record<string, any>[],
      ["operationId"],
      "operations",
    );

    if (duplicateErrors.length > 0) {
      throw new ValidationError("Dữ liệu không hợp lệ", duplicateErrors);
    }

    if (orgType !== OrganizationTypeEnum.TEAM && operations.length > 0) {
      throw new BadRequestError("Chỉ đơn vị TEAM mới được gán operation");
    }
  }

  private async syncOperations(
    organizationId: string,
    incoming: DeepPartial<TeamOperation>[],
    manager: EntityManager,
  ): Promise<void> {
    const existing = await manager.find(TeamOperation, {
      where: { teamId: organizationId } as any,
    });

    const existingById = new Map(existing.map((item) => [item.id, item]));
    const incomingIds = new Set(
      incoming.map((item) => item.id).filter((id): id is string => !!id),
    );

    const invalidIds = Array.from(incomingIds).filter(
      (operationId) => !existingById.has(operationId),
    );

    if (invalidIds.length > 0) {
      throw new ValidationError("Dữ liệu không hợp lệ", [
        {
          field: "operations",
          message: "Có operation không thuộc tổ chức này",
        },
      ]);
    }

    const toDeleteIds = existing
      .filter((item) => !incomingIds.has(item.id))
      .map((item) => item.id);

    if (toDeleteIds.length > 0) {
      await manager.softDelete(TeamOperation, toDeleteIds);
    }

    const toSave = incoming
      .filter((item) => !!item.operationId)
      .map((item) => ({
        ...item,
        teamId: organizationId,
      }));

    if (toSave.length > 0) {
      await manager.save(TeamOperation, toSave as any);
    }
  }
}
