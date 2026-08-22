import { BaseRepository } from "@/shared/base/BaseRepository";
import { Partner } from "@/database/models/Partner";
import { PartnerSelectFull, PartnerRelations } from "./partner.select";
import { injectable } from "inversify";
import { Brackets } from "typeorm";
import { IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { PartnerSnapshot } from "./partner.types";
import { PartnerTypeEnum } from "@/shared/constants/enum";

/**
 * Partner Repository - Tenant Entity
 * Sử dụng BaseRepository để truy vấn trên tenant schemas
 */
@injectable()
export class PartnerRepository extends BaseRepository<Partner> {
  protected entityClass = Partner;
  protected selectedFields = PartnerSelectFull;
  protected relations = PartnerRelations;

  async findByRole(
    role: PartnerTypeEnum | undefined,
    options: IFindPaginationOptions<Partner>,
  ): Promise<{ data: Partner[]; total: number }> {
    const page = options.skip || 1;
    const size = options.take || 20;

    const qb = this.getRepository().createQueryBuilder("entity");
    qb.leftJoinAndSelect("entity.subTypes", "subTypes");
    qb.leftJoinAndSelect("subTypes.group", "subTypeGroup");
    qb.leftJoinAndSelect("entity.contacts", "contacts");

    if (options.keyword) {
      let textSearchableFields: string[] = [];
      if (options.searchFields && options.searchFields.length > 0) {
        // Nếu có searchFields, chỉ dùng đúng các trường này
        textSearchableFields = options.searchFields.map((field) => {
          const fieldStr = String(field);
          return fieldStr.includes(".") ? fieldStr : `entity.${fieldStr}`;
        });
      } else {
        // Nếu không có searchFields, auto-detect các trường string
        const autoDetectedFields = this.getRepository()
          .metadata.columns.filter((column) => {
            const typeValue =
              typeof column.type === "string"
                ? column.type.toLowerCase()
                : typeof column.type === "function"
                  ? column.type.name.toLowerCase()
                  : String(column.type).toLowerCase();
            return [
              "string",
              "text",
              "varchar",
              "char",
              "character",
              "character varying",
              "citext",
            ].includes(typeValue);
          })
          .map((column) => `entity.${column.propertyName}`);
        textSearchableFields = [...autoDetectedFields];

        // Thêm search fields từ relations (mặc định search 'name')
        const allRelations = { ...this.relations, ...options.relations };
        if (allRelations) {
          Object.keys(allRelations).forEach((relationKey) => {
            ["name", "code"].forEach((field) => {
              textSearchableFields.push(`${relationKey}.${field}`);
            });
          });
        }
      }

      if (textSearchableFields.length > 0) {
        qb.andWhere(
          new Brackets((qb1) => {
            textSearchableFields.forEach((field, idx) => {
              const condition = `unaccent(LOWER(${field})) ILIKE unaccent(LOWER(:keyword))`;
              if (idx === 0)
                qb1.where(condition, { keyword: `%${options.keyword}%` });
              else qb1.orWhere(condition, { keyword: `%${options.keyword}%` });
            });
          }),
        );
      }
    }

    this.extendQueryBuilder(qb, options);

    if (role)
      qb.andWhere(
        '("subTypes"."type"::text = :role OR "entity"."type"::text = :role)',
        {
          role,
        },
      );

    qb.skip((page - 1) * size).take(size);

    const [data, total] = await qb.getManyAndCount();

    return { data, total };
  }

  async getPartnerSnapshot(partnerId: string): Promise<PartnerSnapshot | null> {
    const partner = await this.findById(partnerId);

    if (!partner) return null;

    return {
      id: partner.id,
      name: partner.name,
      code: partner.code,
      type: partner.type,
      addresses: partner.addresses,
      email: partner.email,
      phone: partner.phone,
      representative: partner.representative,
    };
  }
}
