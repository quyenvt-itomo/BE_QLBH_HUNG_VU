import { EntityTarget, ObjectLiteral, SelectQueryBuilder } from "typeorm";
import { BaseRepository } from "@/shared/base/BaseRepository";

export class SimpleRepository<T extends ObjectLiteral> extends BaseRepository<T> {
  protected entityClass: EntityTarget<T>;
  protected selectedFields?: any;
  protected relations: any = {};

  constructor(entityClass: EntityTarget<T>, selectedFields?: any, relations: any = {}) {
    super();
    this.entityClass = entityClass;
    this.selectedFields = selectedFields;
    this.relations = relations;
  }

  protected async extendQueryBuilder(qb: SelectQueryBuilder<T>, options: { moreQuery?: Record<string, unknown>; storeId?: string }): Promise<void> {
    const storeId = options.moreQuery?.storeId || options.storeId;
    if (storeId && this.getRepository().metadata.findColumnWithPropertyName("storeId")) qb.andWhere(`${qb.alias}.storeId = :storeId`, { storeId });
  }
}
