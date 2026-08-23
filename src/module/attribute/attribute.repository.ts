import { DeepPartial, EntityManager, SelectQueryBuilder } from "typeorm";
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
