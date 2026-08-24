import {
  DeepPartial,
  EntityManager,
  IsNull,
  SelectQueryBuilder,
} from "typeorm";
import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import {
  Attribute,
  AttributeSnapshot,
  AttributeType,
} from "@/database/models/Attribute";
import { AttributeRelations, AttributeSelectFull } from "./attribute.select";

export class AttributeRepository extends BaseRepository<Attribute> {
  protected entityClass = Attribute;
  protected selectedFields = AttributeSelectFull;
  protected relations = AttributeRelations;
  protected enableFileAttachment: boolean = false;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Attribute>,
    options: IFindPaginationOptions<Attribute>,
  ): Promise<void> {
    super.extendQueryBuilder?.(qb, options);

    const type = (options.moreQuery as { type?: AttributeType } | undefined)
      ?.type;
    if (type) {
      qb.andWhere(`${qb.alias}.type = :attributeType`, {
        attributeType: type,
      });
    }
  }

  async getHierarchyRows(
    type: AttributeType,
    manager?: EntityManager,
  ): Promise<Pick<Attribute, "id" | "parentId" | "type">[]> {
    return await this.getRepository(manager).find({
      select: { id: true, parentId: true, type: true },
      where: { type, deletedAt: IsNull() } as any,
    });
  }

  async getDescendantIds(
    ids: string[],
    type: AttributeType,
    manager?: EntityManager,
  ): Promise<string[]> {
    const roots = Array.from(new Set(ids.filter(Boolean)));
    if (!roots.length) return [];

    const rows = await this.getHierarchyRows(type, manager);
    const childrenByParent = new Map<string, string[]>();

    for (const row of rows) {
      if (!row.parentId) continue;
      const children = childrenByParent.get(row.parentId) || [];
      children.push(row.id);
      childrenByParent.set(row.parentId, children);
    }

    const result = new Set(roots);
    const queue = [...roots];
    while (queue.length) {
      const parentId = queue.shift()!;
      for (const childId of childrenByParent.get(parentId) || []) {
        if (result.has(childId)) continue;
        result.add(childId);
        queue.push(childId);
      }
    }

    return Array.from(result);
  }

  async getAttributeByName(
    name: string,
    type: AttributeType,
    manager?: EntityManager,
  ): Promise<Attribute | null> {
    return await this.findOne({
      where: { name, type },
    });
  }

  async getSnapshot(
    id?: string | null,
    manager?: EntityManager,
  ): Promise<AttributeSnapshot | null> {
    if (!id) return null;
    const attribute = await this.findById(id, manager);
    if (!attribute) return null;

    return {
      id: attribute.id,
      name: attribute.name,
    };
  }

  /**
   * Gán unitId → unitSnapshot cho line hoặc entity chính.
   * Dùng trong validateBeforeCreate để populate snapshot.
   */
  async attachUnitInfo<
    T extends {
      unitId?: string | null;
      unitSnapshot?: DeepPartial<AttributeSnapshot> | null;
    },
  >(data: T, manager?: EntityManager): Promise<void> {
    if (
      data.unitId &&
      (!data.unitSnapshot || (data.unitSnapshot as any).id !== data.unitId)
    ) {
      data.unitSnapshot = await this.getSnapshot(data.unitId, manager);
    }
  }
}
