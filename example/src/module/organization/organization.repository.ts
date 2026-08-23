import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import {
  OrganizationSelectFull,
  OrganizationRelations,
} from "./organization.select";
import {
  Organization,
  OrganizationSnapshot,
} from "@/database/models/Organization";
import { FileCategory } from "@/database/models/File";
import { DeepPartial, EntityManager, SelectQueryBuilder } from "typeorm";
import { OrganizationQueryDto } from "./organization.validator";

export class OrganizationRepository extends BaseRepository<Organization> {
  protected entityClass = Organization;
  protected selectedFields = OrganizationSelectFull;
  protected relations = OrganizationRelations;
  protected multipleFile: boolean = true;
  protected singleFileCategories: string[] = [FileCategory.LOGO];
  protected nestedFileFields?: string[] | undefined = ["manager"];
  protected sortOrderScope?: keyof Organization | undefined = "parentId";

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Organization>,
    options: IFindPaginationOptions<Organization>,
  ): Promise<void> {
    const alias = qb.alias;
    const storeId = options.storeId;
    const { parentId, managerId, types, getAll } =
      (options.moreQuery as OrganizationQueryDto) || {};

    if (storeId && !getAll) {
      const descendants = await this.findDescendants(storeId);
      const descendantIds = descendants.map((x) => x.id);

      qb.andWhere(`${alias}.id IN (:...ids)`, { ids: descendantIds });
    }

    if (this.checkArrayFilter(types)) {
      qb.andWhere(`${alias}.type IN (:...types)`, { types });
    }

    if (parentId) {
      qb.andWhere(`${alias}.parentId = :parentId`, { parentId });
    }

    if (managerId) {
      qb.andWhere(`${alias}.managerId = :managerId`, { managerId });
    }
  }

  //  Lấy danh sách đơn vị thuộc gia phả từ một đơn vị gốc
  async findDescendants(rootId: string): Promise<Organization[]> {
    const allOrganizations = await this.findAll();
    return this.collectOrganizationFamily(rootId, allOrganizations);
  }

  private collectOrganizationFamily(
    organizationId: string,
    orgs: Organization[],
  ): Organization[] {
    const result: Organization[] = [];

    // Map parentId -> children
    const childrenMap = new Map<string | null, Organization[]>();

    for (const org of orgs) {
      const key = org.parentId ?? null;

      if (!childrenMap.has(key)) {
        childrenMap.set(key, []);
      }

      childrenMap.get(key)!.push(org);
    }

    // Tìm node gốc
    const root = orgs.find((x) => x.id === organizationId);
    if (!root) return [];

    // DFS đệ quy
    const traverse = (node: Organization) => {
      result.push(node);

      const children = childrenMap.get(node.id) ?? [];

      for (const child of children) {
        traverse(child);
      }
    };

    traverse(root);

    return result;
  }

  async getSnapshot(
    id?: string | null,
    manager?: EntityManager,
  ): Promise<OrganizationSnapshot | null> {
    if (!id) return null;
    const org = await this.findById(id, manager);
    if (!org) return null;
    return {
      id: org.id,
      name: org.name,
      code: org.code,
      type: org.type,
    };
  }

  /**
   * Tự động gán snapshot cho tất cả các trường organization-* có trong data.
   * Khi có thêm entity mới cần snapshot organization mới, chỉ cần thêm cặp field vào đây.
   */
  async attachInfo<
    T extends {
      departmentId?: string | null;
      departmentSnapshot?: DeepPartial<OrganizationSnapshot> | null;
      organizationId?: string | null;
      organizationSnapshot?: DeepPartial<OrganizationSnapshot> | null;
    },
  >(data: T, manager?: EntityManager): Promise<void> {
    // departmentId → departmentSnapshot
    if (
      data.departmentId &&
      (!data.departmentSnapshot ||
        (data.departmentSnapshot as any).id !== data.departmentId)
    )
      data.departmentSnapshot = await this.getSnapshot(
        data.departmentId,
        manager,
      );

    // organizationId → organizationSnapshot
    if (
      data.organizationId &&
      (!data.organizationSnapshot ||
        (data.organizationSnapshot as any).id !== data.organizationId)
    )
      data.organizationSnapshot = await this.getSnapshot(
        data.organizationId,
        manager,
      );
  }
}
