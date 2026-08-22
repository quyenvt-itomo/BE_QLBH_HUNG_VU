import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { EntityManager, In, SelectQueryBuilder } from "typeorm";
import {
  Attribute,
  AttributeSnapshot,
  AttributeType,
  DEFAULT_AREA_UNIT,
  DEFAULT_MESH_UNIT,
  DEFAULT_WEIGHT_UNIT,
} from "@/database/models/Attribute";
import { AttributeRelations, AttributeSelectFull } from "./attribute.select";
import { DeepPartial } from "typeorm";

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

  async getDefaultProductUnit() {
    const defaultUnits = await this.findByOptions({
      where: {
        name: In([DEFAULT_WEIGHT_UNIT, DEFAULT_MESH_UNIT, DEFAULT_AREA_UNIT]),
        type: AttributeType.UNIT,
      },
    });

    const defaultWeightUnit = defaultUnits.find(
      (unit) => unit.name === DEFAULT_WEIGHT_UNIT,
    );
    const defaultMeshUnit = defaultUnits.find(
      (unit) => unit.name === DEFAULT_MESH_UNIT,
    );
    const defaultAreaUnit = defaultUnits.find(
      (unit) => unit.name === DEFAULT_AREA_UNIT,
    );

    return {
      defaultWeightUnit,
      defaultMeshUnit,
      defaultAreaUnit,
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
