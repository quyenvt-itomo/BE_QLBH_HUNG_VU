import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { Attribute, AttributeType } from "@/database/models/Attribute";
import { AttributeRepository } from "./attribute.repository";
import { ATTRIBUTE_TYPES } from "./attribute.types";
import { ForbiddenError } from "@/shared/types/errors";
import {
  ActionMap,
  ActionValue,
  RequestContext,
} from "@/shared/types/interfaces";
import { DeepPartial, EntityManager, ILike } from "typeorm";

@injectable()
export class AttributeService extends BaseService<Attribute> {
  protected repository: AttributeRepository;
  protected uniqueFields: (keyof Attribute)[] = ["name"];
  protected uniqueScope: (keyof Attribute)[] = ["type"];
  protected searchableFields = ["name"];
  protected shouldAttachFiles(): boolean {
    return false;
  }

  constructor(
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    repository: AttributeRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<Attribute>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const existing = await this.repository.getById(id, manager);
    const canUpdate = await this.canUpdate(existing, req);
    if (!canUpdate.can) throw new ForbiddenError(canUpdate.reason);
  }

  async validateBeforeDelete(
    data: Attribute,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const canDelete = await this.canDelete(data, req);
    if (!canDelete.can) throw new ForbiddenError(canDelete.reason);
  }
  protected async attachActions(
    entity: Attribute & { _actions?: ActionMap },
    req?: RequestContext,
  ): Promise<void> {
    entity._actions = await this.getActions(entity, req);
  }

  private async getActions(
    entity: Attribute | null,
    req?: RequestContext,
  ): Promise<ActionMap> {
    const actions = this.getDefaultAction();
    if (!entity) return actions;
    actions.update = await this.canUpdate(entity, req);
    actions.delete = await this.canDelete(entity, req);
    return actions;
  }

  async canUpdate(
    entity: Attribute,
    req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.isDefault || entity.companyId === null)
      return {
        can: false,
        reason: "Không thể sửa thuộc tính mặc định của hệ thống",
      };

    return { can: true };
  }

  async canDelete(
    entity: Attribute,
    req?: RequestContext,
  ): Promise<ActionValue> {
    if (entity.isDefault || entity.companyId === null)
      return {
        can: false,
        reason: "Không thể xóa thuộc tính mặc định của hệ thống",
      };
    return { can: true };
  }

  /**
   * Tìm attribute theo tên + type (không phân biệt hoa thường).
   * Nếu không có thì tự động tạo mới.
   * Trả về { id, name } để dùng làm snapshot.
   */
  async findOrCreate(
    name: string,
    type: AttributeType,
    req?: RequestContext,
  ): Promise<{ id: string; name: string }> {
    let attr = await this.repository.findOne({
      where: { name: ILike(name), type },
    } as any);
    if (!attr) {
      attr = (await this.create(
        { name, type, code: null, note: null } as any,
        undefined,
        req,
      )) as any;
    }
    return { id: attr!.id, name: attr!.name };
  }
}
