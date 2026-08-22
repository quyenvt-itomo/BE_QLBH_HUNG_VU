import { BaseRepository } from "@/shared/base/BaseRepository";
import { PartnerSubType } from "@/database/models/PartnerSubType";
import {
  PartnerSubTypeSelectFull,
  PartnerSubTypeRelations,
} from "./partnerSubType.select";
import { injectable } from "inversify";

/**
 * PartnerSubType Repository - Tenant Entity
 * Sử dụng BaseRepository để truy vấn trên tenant schemas
 */
@injectable()
export class PartnerSubTypeRepository extends BaseRepository<PartnerSubType> {
  protected entityClass = PartnerSubType;
  protected selectedFields = PartnerSubTypeSelectFull;
  protected relations = PartnerSubTypeRelations;
}
