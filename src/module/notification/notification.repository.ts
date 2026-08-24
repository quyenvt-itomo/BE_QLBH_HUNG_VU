import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { Notification } from "@/database/models/Notification";
import { injectable } from "inversify";
import {
  NotificationSelectFull,
  NotificationSelectList,
  NotificationRelations,
  NotificationRelationsList,
  NotificationRelationSelects,
  NotificationRelationSelectsForList,
} from "./notification.select";
import { SelectQueryBuilder } from "typeorm";
import { NotificationQuery } from "./notification.validator";

@injectable()
export class NotificationRepository extends BaseRepository<Notification> {
  protected entityClass = Notification;
  protected selectedFields = NotificationSelectFull;
  protected selectedFieldsForList = NotificationSelectList;
  protected relations = NotificationRelations;
  protected relationsForList = NotificationRelationsList;
  protected relationSelects = NotificationRelationSelects;
  protected relationSelectsForList = NotificationRelationSelectsForList;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Notification>,
    options: IFindPaginationOptions<Notification>,
  ): Promise<void> {
    const alias = qb.alias;

    const { userId } = (options.moreQuery as NotificationQuery) || {};

    if (userId) {
      qb.andWhere(`${alias}.userId = :userId`, { userId });
    }
  }
}
