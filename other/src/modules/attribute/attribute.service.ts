import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { Request } from "express";
import { AttributeRepository } from "./attribute.repository";
import { ATTRIBUTE_TYPES } from "./attribute.types";
import { Attribute } from "@/database/models/Attribute";
import { DeepPartial, EntityManager } from "typeorm";
import { NotFoundError, UnauthorizedError } from "@/shared/types/errors";
import { ErrorsMessages } from "@/shared/constants/errors";
import { attributeModuleMap, AttributeTypeEnum } from "@/shared/constants/enum";

/**
 * Attribute Service -  Entity
 */
@injectable()
export class AttributeService extends BaseService<Attribute> {
  protected repository: AttributeRepository;
  protected uniqueFields: (keyof Attribute)[] = ["name"];
  protected uniqueScope: (keyof Attribute)[] = ["type"];
  protected searchableFields = ["name", "note"];

  constructor(
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    repository: AttributeRepository,
  ) {
    super();
    this.repository = repository;
  }

  /**
   * Find attributes by type
   */
  async findByType(type: AttributeTypeEnum): Promise<Attribute[]> {
    return this.repository.findByType(type);
  }

  async validateBeforeCreate(
    data: DeepPartial<Attribute>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<void> {
    const module = attributeModuleMap[data.type!];
    const permissions = req?.permissions || ({} as any);
    const modulePermissions = permissions[module] || [];
    if (!modulePermissions.includes("create")) {
      throw new UnauthorizedError("Insufficient permissions");
    }
  }

  async validateBeforeUpdate(
    id: string,
    data: Partial<Attribute>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<void> {
    const attribute = await this.findById(id);
    if (!attribute) {
      throw new NotFoundError("Attribute not found", {
        field: "id",
        code: ErrorsMessages.not_found,
      });
    }
    // Validate permission for attribute type if needed
    const module = attributeModuleMap[attribute.type];
    const permissions = req?.permissions || ({} as any);
    const modulePermissions = permissions[module] || [];
    if (!modulePermissions.includes("update")) {
      throw new UnauthorizedError("Insufficient permissions");
    }
  }

  async validateBeforeDelete(
    data: Partial<Attribute>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<void> {
    const attribute = await this.findById(data.id!);
    if (!attribute) {
      throw new NotFoundError("Attribute not found", {
        field: "id",
        code: ErrorsMessages.not_found,
      });
    }

    const module = attributeModuleMap[attribute.type];
    const permissions = req?.permissions || ({} as any);
    const modulePermissions = permissions[module] || [];
    if (!modulePermissions.includes("delete")) {
      throw new UnauthorizedError("Insufficient permissions");
    }
  }
}
