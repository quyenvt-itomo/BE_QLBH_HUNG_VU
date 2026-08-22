import { BaseRepository } from "@/shared/base/BaseRepository";
import { AttributeSelectFull, AttributeRelations } from "./attribute.select";
import { Attribute } from "@/database/models/Attribute";
import { AttributeTypeEnum } from "@/shared/constants/enum";

type AttributesByAncestor = Attribute & {
  familyIds: string[];
};

/**
 * Attribute Repository -  Entity
 * Sử dụng BaseRepository để truy vấn trên tenant schemas
 */
export class AttributeRepository extends BaseRepository<Attribute> {
  protected entityClass = Attribute;
  protected selectedFields = AttributeSelectFull;
  protected relations = AttributeRelations;

  /**
   * Find by type
   */
  findByType(type: AttributeTypeEnum): Promise<Attribute[]> {
    const repo = this.getRepository();
    return repo.find({
      where: { type },
      relations: { fundCategories: true },
      order: { name: "ASC" },
    });
  }

  /**
   * Thu thập gia phả (family) của các product category
   */
  async collectProductCategoryFamilyIds(ids: string[]): Promise<string[]> {
    if (!ids.length) return [];

    const repo = this.getRepository();
    const attributes = await repo.find({
      select: ["id", "parentId"],
      where: {
        type: AttributeTypeEnum.PRODUCT_CATEGORY,
      },
    });
    const childrenMap = new Map<string | null, string[]>();

    for (const attr of attributes) {
      const parentId = attr.parentId ?? null;

      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }

      childrenMap.get(parentId)!.push(attr.id);
    }
    const result = new Set<string>();

    const dfs = (id: string) => {
      if (result.has(id)) return;

      result.add(id);

      const children = childrenMap.get(id);
      if (!children) return;

      for (const childId of children) {
        dfs(childId);
      }
    };
    for (const id of ids) {
      dfs(id);
    }

    return Array.from(result);
  }

  /**
   * Tổng hợp các attribute theo tổ tiên
   */
  async aggregateAttributesByAncestors(): Promise<AttributesByAncestor[]> {
    const allAttributes = await this.findByType(
      AttributeTypeEnum.PRODUCT_CATEGORY,
    );

    // Map parentId -> children[]
    const childrenMap = new Map<string | null, Attribute[]>();

    for (const attr of allAttributes) {
      const parentId = attr.parentId ?? null;

      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }

      childrenMap.get(parentId)!.push(attr);
    }

    // Cache để tránh tính lại
    const memo = new Map<string, string[]>();

    const getDescendants = (attr: Attribute): string[] => {
      if (memo.has(attr.id)) {
        return memo.get(attr.id)!;
      }

      const children = childrenMap.get(attr.id) || [];

      let familyIds = [attr.id];

      for (const child of children) {
        familyIds = familyIds.concat(getDescendants(child));
      }

      memo.set(attr.id, familyIds);

      return familyIds;
    };

    return allAttributes.map((attr) => {
      return {
        ...attr,
        familyIds: getDescendants(attr),
      } as AttributesByAncestor;
    });
  }
}
