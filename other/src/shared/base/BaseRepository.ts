import {
  Repository,
  EntityTarget,
  FindOptionsWhere,
  DeepPartial,
  EntityManager,
  FindManyOptions,
  IsNull,
  DataSource,
  FindOneOptions,
  FindOptionsRelations,
  SelectQueryBuilder,
  Brackets,
  ObjectLiteral,
  In,
} from "typeorm";
import { DatabaseConfig } from "@/config/database";
import { NotFoundError } from "@/shared/types/errors";
import { injectable } from "inversify";
import { generateCode, getEntityByType } from "../utils/code.utils";
import { FileStatusEnum } from "../constants/enum";
import logger from "../utils/logger";
import { ErrorsMessages } from "../constants/errors";
import fs from "fs/promises";
import { OPERATOR_MAP, rangeSuffixes } from "../types/interfaces";
import { Request } from "express";

export interface IFindPaginationOptions<T> extends FindManyOptions<T> {
  keyword?: string; // Keyword for text search
  searchFields?: (keyof T | string)[]; // Fields to search in
  type?: string; // Example field for filtering by type
  status?: string; // Example field for filtering by status
  startAt?: Date; // Example field for filtering by date range
  endAt?: Date; // Example field for filtering by date range
  dateFilter?: string; // Specific date field to apply the date range filter
  sortBy?: string; // Field to sort by
  sortOrder?: "ASC" | "DESC"; // Sort direction
  isFinished?: boolean; // Example field for filtering by completion status
  storeId?: string; // Example field for filtering by store ID
  filterOptions?: (keyof T)[]; // Additional filter options
  filterDate?: string;
  summaryFields?: (keyof T)[]; // Các trường có kiểu số cần tính tổng (ví dụ: ['plannedHours', 'actualHours'])
  moreQuery?: any; // Additional complex queries
}

@injectable()
export abstract class BaseRepository<T extends ObjectLiteral> {
  protected abstract entityClass: EntityTarget<T>;
  protected dataSource: DataSource;
  protected enableFileAttachment: boolean = true; // Có thể override trong repo con
  /**
   * Cho phép nhiều file cùng category cho 1 entity
   * - false (default): Mỗi entity chỉ được 1 file/category tại 1 thời điểm (giữ file mới nhất)
   * - true: Không giới hạn số file
   */
  protected multipleFile: boolean = false;
  /**
   * Danh sách các trường nested (object[] hoặc object) trên entity mà
   * repo con có thể khai báo để BaseRepository gắn files cho các phần tử con.
   *
   * Hỗ trợ path notation để chỉ định chính xác entity cần load files:
   * - ['variants'] → gắn file cho từng variant
   * - ['lines.productVariant'] → gắn file cho productVariant trong mỗi orderLine
   * - ['lines', 'lines.productVariant'] → gắn file cho cả orderLine và productVariant
   *
   * Nếu không khai báo, repository sẽ fallback quét mọi trường để phát hiện mảng object có `id`.
   *
   * ⚠️ LƯU Ý: Nested entities LUÔN chỉ giữ 1 file/category (bất kể multipleFile của parent)
   */
  protected nestedFileFields?: string[];

  /**
   * Select fields cho detail query (findById, findOne)
   * Mặc định sẽ lấy đầy đủ thông tin
   */
  protected selectedFields?: any;
  /**
   * Select fields cho list query (find, findAll, findWithPagination)
   * Nếu không được set, sẽ fallback về selectedFields
   * Dùng để giảm dữ liệu trả về khi query danh sách
   */
  protected selectedFieldsForList?: any;

  /**
   * Relations cho detail query (findById, findOne)
   * Mặc định sẽ join đầy đủ thông tin
   */
  protected relations: FindOptionsRelations<T>;
  /**
   * Relations cho list query (find, findAll, findWithPagination)
   * Nếu không được set, sẽ fallback về relations
   * Dùng để giảm dữ liệu trả về khi query danh sách
   */
  protected relationsForList?: FindOptionsRelations<T>;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<T>,
    options: IFindPaginationOptions<T>,
  ): Promise<void> {
    // mặc định không làm gì — repo con override khi cần join/group/select thêm
  }

  private isTextLikeColumnType(columnType: unknown): boolean {
    const normalizedType =
      typeof columnType === "string"
        ? columnType.toLowerCase()
        : typeof columnType === "function"
          ? columnType.name.toLowerCase()
          : String(columnType).toLowerCase();

    return [
      "string",
      "text",
      "varchar",
      "char",
      "character",
      "character varying",
      "citext",
    ].includes(normalizedType);
  }

  /**
   * Recursively join relations from FindOptionsRelations config
   * Ví dụ: { variants: { options: true, unit: true } }
   */
  private joinRelations(
    qb: SelectQueryBuilder<T>,
    relations: FindOptionsRelations<T> | boolean,
    parentAlias: string = "entity",
  ): void {
    if (!relations || typeof relations === "boolean") return;

    Object.keys(relations).forEach((relationKey) => {
      const relationValue = (relations as any)[relationKey];
      const relationAlias = `${parentAlias}_${relationKey}`;

      qb.leftJoinAndSelect(`${parentAlias}.${relationKey}`, relationAlias);

      // Đệ quy nếu có nested relations
      if (relationValue && typeof relationValue === "object") {
        this.joinRelations(qb, relationValue, relationAlias);
      }
    });
  }

  // sửa trong BaseRepository
  protected mapRawEntities(rawAndEntities: {
    entities: T[];
    raw: any[];
  }): any[] {
    return rawAndEntities.entities.map((entity, index) => {
      const raw = rawAndEntities.raw[index];
      const extras: any = {};

      // auto map các alias có prefix entity_
      Object.keys(raw).forEach((key) => {
        if (key.startsWith("entity_total")) {
          const field = key.replace("entity_", "");
          extras[field] = raw[key];
        }
      });

      return { ...entity, ...extras };
    });
  }

  constructor() {
    // Initialize repository in postConstruct or through method call
    this.dataSource = DatabaseConfig;
  }

  public getRepository(manager?: EntityManager): Repository<T> {
    if (manager) {
      return manager.getRepository(this.entityClass);
    }
    return this.dataSource.getRepository(this.entityClass);
  }

  /**
   * Find many
   */
  async find(
    options?: FindManyOptions<T>,
    manager?: EntityManager,
  ): Promise<T[]> {
    const repo = this.getRepository(manager);

    // Ưu tiên options, sau đó dùng ForList, cuối cùng fallback
    const finalOptions: FindManyOptions<T> = {
      ...options,
      select:
        options?.select || this.selectedFieldsForList || this.selectedFields,
      relations: options?.relations || this.relationsForList || this.relations,
    };

    const entities = await repo.find(finalOptions);

    // Auto-attach files if enabled
    if (this.enableFileAttachment) {
      return await this.attachFilesToEntities(entities);
    }

    return entities;
  }

  /**
   * Find one
   */
  async findOne(
    options: FindOneOptions<T>,
    manager?: EntityManager,
  ): Promise<T | null> {
    const repo = this.getRepository(manager);

    // Ưu tiên options, sau đó dùng selectedFields và relations cho detail
    const finalOptions: FindOneOptions<T> = {
      ...options,
      select: options?.select || this.selectedFields,
      relations: options?.relations || this.relations,
    };

    const entity = await repo.findOne(finalOptions);

    // Auto-attach files if enabled
    if (entity && this.enableFileAttachment) {
      return await this.attachFilesToEntity(entity);
    }

    return entity;
  }

  // Soft delete aware methods
  async findById(
    id: string,
    manager?: EntityManager,
    req?: Request,
    includeDeleted: boolean = false,
  ): Promise<T | null> {
    const repo = this.getRepository(manager);

    // Nếu không có extendQueryBuilder thì dùng find với select
    if (
      this.extendQueryBuilder === BaseRepository.prototype.extendQueryBuilder
    ) {
      const options: FindOneOptions<T> = {
        where: { id } as any,
        select: this.selectedFields,
        relations: this.relations,
      };

      if (!includeDeleted) {
        options.where = { ...options.where, deletedAt: IsNull() } as any;
      } else {
        options.withDeleted = true;
      }

      const entity = await repo.findOne(options);
      if (entity && this.enableFileAttachment) {
        return await this.attachFilesToEntity(entity);
      }
      return entity;
    }

    // Dùng query builder khi có extendQueryBuilder
    const qb = repo.createQueryBuilder("entity");
    qb.where("entity.id = :id", { id });

    // Xử lý soft delete
    if (!includeDeleted) {
      qb.andWhere("entity.deletedAt IS NULL");
    } else {
      qb.withDeleted();
    }

    // Join relations nếu có (đệ quy cho nested relations)
    if (this.relations) {
      this.joinRelations(qb, this.relations, "entity");
    }

    // Gọi extendQueryBuilder để thêm các select/extra fields
    await this.extendQueryBuilder(qb, { moreQuery: req?.query });

    // Nếu có extra select/group thì mapRawEntities, ngược lại getOne
    const hasGroupBy = (qb as any).expressionMap?.groupBys?.length > 0;
    const hasExtraSelect = (qb as any).expressionMap?.selects?.some((s: any) =>
      s.aliasName?.startsWith("entity_"),
    );

    let entity: T | null;
    if (hasGroupBy || hasExtraSelect) {
      const rawAndEntities = await qb.getRawAndEntities();
      const data = this.mapRawEntities(rawAndEntities);
      entity = data[0] || null;
    } else {
      entity = await qb.getOne();
    }

    // Auto-attach files from MasterFile
    if (entity && this.enableFileAttachment) {
      return await this.attachFilesToEntity(entity);
    }
    return entity;
  }

  async findAll(
    manager?: EntityManager,
    includeDeleted: boolean = false,
  ): Promise<T[]> {
    const options: FindManyOptions<T> = {
      select: this.selectedFieldsForList || this.selectedFields,
      relations: this.relationsForList || this.relations,
    };
    if (!includeDeleted) {
      options.where = { deletedAt: IsNull() } as any;
    } else {
      options.withDeleted = true;
    }
    const entities = await this.getRepository(manager).find(options);

    // Auto-attach files from MasterFile
    if (this.enableFileAttachment) {
      return await this.attachFilesToEntities(entities);
    }
    return entities;
  }

  async findWithPagination(
    options: IFindPaginationOptions<T>,
    manager?: EntityManager,
    includeDeleted = false,
  ): Promise<{ data: T[]; total: number; summary?: any }> {
    const page = options.skip || 1;
    const size = options.take || 20;

    const repository = this.getRepository(manager);
    const qb = repository.createQueryBuilder("entity");

    // Join relations: ưu tiên relationsForList cho list query
    const defaultRelations = this.relationsForList || this.relations;
    const allRelations = { ...defaultRelations, ...options.relations };
    if (allRelations && Object.keys(allRelations).length > 0) {
      this.joinRelations(qb, allRelations, "entity");
    }

    if (options.keyword) {
      let textSearchableFields: string[] = [];

      const resolveFieldAlias = (field: string): string | null => {
        if (!field.includes(".")) return `entity.${field}`;

        const [relation, column] = field.split(".");

        const joinAttr = (qb as any).expressionMap.joinAttributes.find(
          (j: any) => j.relation?.propertyName === relation,
        );

        if (!joinAttr) return null; // relation chưa join → bỏ qua

        return `${joinAttr.alias.name}.${column}`;
      };

      // ===== 1. Xác định danh sách field cần search =====
      if (options.searchFields && options.searchFields.length > 0) {
        textSearchableFields = options.searchFields
          .map((f) => resolveFieldAlias(String(f)))
          .filter(Boolean) as string[];
      } else {
        // Auto-detect string-like columns from TypeORM metadata (safe in dist runtime)
        const autoDetectedFields = repository.metadata.columns
          .filter((column) => this.isTextLikeColumnType(column.type))
          .map((column) => `entity.${column.propertyName}`);

        textSearchableFields.push(...autoDetectedFields);

        // Thêm field từ relations (name, code)
        const allRelations = { ...this.relations, ...options.relations };
        if (allRelations) {
          Object.keys(allRelations).forEach((relationKey) => {
            ["name", "code"].forEach((col) => {
              const resolved = resolveFieldAlias(`${relationKey}.${col}`);
              if (resolved) textSearchableFields.push(resolved);
            });
          });
        }
      }

      // ===== 2. Apply WHERE search =====
      if (textSearchableFields.length > 0) {
        qb.andWhere(
          new Brackets((qb1) => {
            textSearchableFields.forEach((field, idx) => {
              const isLikelyUuidField = field.toLowerCase().includes("id");

              const fieldExpression = isLikelyUuidField
                ? `CAST(${field} AS TEXT)`
                : field;

              const condition = `
                      unaccent(LOWER(${fieldExpression}))
                      ILIKE unaccent(LOWER(:keyword))
                    `;

              if (idx === 0) {
                qb1.where(condition, { keyword: `%${options.keyword}%` });
              } else {
                qb1.orWhere(condition);
              }
            });
          }),
        );
      }
    }

    await this.extendQueryBuilder(qb, options);

    // ===== Filters =====
    // nếu trong options có storeId thì và entity có storeId thì filter theo storeId
    if (options.storeId) {
      const entityMetadata = repository.metadata;
      const hasTenantIdColumn = entityMetadata.columns.some(
        (col) => col.propertyName === "storeId",
      );
      if (hasTenantIdColumn) {
        qb.andWhere("entity.storeId = :storeId", {
          storeId: options.storeId,
        });
      }
    }

    // ===== Range Filters (Gte, Gt, Eq, Lte, Lt) =====
    // Xử lý các trường range filter từ moreQuery hoặc options
    const rangeFilterSource = options.moreQuery || options;

    if (rangeFilterSource && typeof rangeFilterSource === "object") {
      const entityMetadata = repository.metadata;
      const entityColumns = entityMetadata.columns.map(
        (col) => col.propertyName,
      );

      Object.keys(rangeFilterSource).forEach((key) => {
        // Kiểm tra nếu key có suffix là Gte, Gt, Eq, Lte, Lt
        const matchedSuffix = rangeSuffixes.find((suffix) =>
          key.endsWith(suffix),
        );

        if (matchedSuffix) {
          // Cắt suffix để lấy tên field
          const fieldName = key.slice(0, -matchedSuffix.length);

          // Kiểm tra field có tồn tại trong entity không
          if (entityColumns.includes(fieldName)) {
            const value = rangeFilterSource[key];

            if (value != null && value !== "") {
              const operator = OPERATOR_MAP[matchedSuffix];
              const paramName = `${fieldName}_${matchedSuffix}`;

              qb.andWhere(`entity.${fieldName} ${operator} :${paramName}`, {
                [paramName]: value,
              });
            }
          }
        }
      });
    }

    if (includeDeleted) {
      qb.andWhere("entity.deletedAt IS NOT NULL");
    } else {
      qb.andWhere("entity.deletedAt IS NULL");
    }

    if (options.status !== undefined) {
      qb.andWhere("entity.status = :status", { status: options.status });
    }

    if (options.type !== undefined) {
      // Only apply `type` filter when the entity actually has a `type` column
      const hasTypeColumn = repository.metadata.columns.some(
        (col) => col.propertyName === "type",
      );
      if (hasTypeColumn) {
        qb.andWhere("entity.type = :type", { type: options.type });
      }
    }

    if (options.isFinished !== undefined) {
      qb.andWhere("entity.isFinished = :isFinished", {
        isFinished: options.isFinished,
      });
    }

    // BETWEEN createdAt
    if (options.startAt && options.endAt) {
      const dateField = options.dateFilter || "createdAt";
      qb.andWhere(`entity.${dateField} BETWEEN :start AND :end`, {
        start: new Date(options.startAt),
        end: new Date(options.endAt),
      });
    }

    // ===== Sorting =====
    if (options.sortBy && options.sortOrder) {
      let sortField: string | null = null;

      // Nếu sortBy có dấu chấm (relation field), kiểm tra xem relation đã được join chưa
      if (options.sortBy.includes(".")) {
        const [relationName] = options.sortBy.split(".");
        const isJoined = (qb as any).expressionMap.joinAttributes.some(
          (j: any) => j.relation?.propertyName === relationName,
        );
        if (isJoined) {
          sortField = options.sortBy;
        }
      } else {
        // Chỉ cho phép sort theo column của entity
        const entityColumns = repository.metadata.columns.map(
          (col) => col.propertyName,
        );
        if (entityColumns.includes(options.sortBy)) {
          sortField = `entity.${options.sortBy}`;
        }
        // Nếu không phải column thì bỏ qua, để repo con tự custom
      }

      // Nếu sortField hợp lệ thì apply orderBy
      if (sortField) {
        qb.orderBy(sortField, options.sortOrder);
      }
      // Nếu sortBy không hợp lệ thì KHÔNG áp dụng sorting (để repo con tự xử lý)
    } else {
      // Chỉ khi không truyền sortBy thì mới fallback về createdAt
      qb.orderBy("entity.createdAt", "DESC");
    }

    // Tạo clone query cho summary (không có pagination)
    let summary: any = {};
    if (options.summaryFields && options.summaryFields.length > 0) {
      const summaryQb = qb.clone();

      // Xóa skip và take khỏi summary query
      summaryQb.skip(0).take(undefined as any);

      // Xóa order by để tối ưu performance
      (summaryQb as any).expressionMap.orderBys = [];

      // Lưu lại các computed selects (có prefix entity_) trước khi xóa
      const computedSelects =
        (summaryQb as any).expressionMap?.selects?.filter((s: any) =>
          s.aliasName?.startsWith("entity_"),
        ) || [];

      // Xóa joins không cần thiết (giữ lại selects cho computed fields)
      (summaryQb as any).expressionMap.joinAttributes = [];

      // Build sum selects
      const sumSelects: string[] = [];

      options.summaryFields.forEach((field) => {
        const fieldStr = String(field);

        // Kiểm tra xem field có phải là computed field không
        // Thử tìm cả camelCase và lowercase
        let computedSelect = computedSelects.find(
          (s: any) => s.aliasName === `entity_${fieldStr}`,
        );

        // Nếu không tìm thấy, thử lowercase
        if (!computedSelect) {
          computedSelect = computedSelects.find(
            (s: any) => s.aliasName === `entity_${fieldStr.toLowerCase()}`,
          );
        }

        if (computedSelect) {
          // Nếu là computed field, wrap subquery trong SUM
          // Lấy expression gốc từ computed select
          const subqueryExpression = computedSelect.selection;
          sumSelects.push(
            `COALESCE(SUM((${subqueryExpression})), 0) as ${fieldStr}_sum`,
          );
        } else {
          // Nếu là column thông thường
          sumSelects.push(
            `COALESCE(SUM(entity.${fieldStr}), 0) as ${fieldStr}_sum`,
          );
        }
      });

      // Clear selects và set lại với sum
      (summaryQb as any).expressionMap.selects = [];
      summaryQb.select(sumSelects);

      const summaryResult = await summaryQb.getRawOne();

      // Map kết quả summary - xử lý lowercase keys
      options.summaryFields.forEach((field) => {
        const fieldStr = String(field);
        // PostgreSQL trả về lowercase key
        const summaryKey = `${fieldStr.toLowerCase()}_sum`;
        const value = summaryResult[summaryKey];

        // Nếu field đã có prefix "total" thì giữ nguyên, không thêm "total" nữa
        const summaryFieldName = fieldStr.toLowerCase().startsWith("total")
          ? fieldStr
          : `total${fieldStr.charAt(0).toUpperCase() + fieldStr.slice(1)}`;

        summary[summaryFieldName] = parseFloat(value) || 0;
      });
    }

    qb.skip((page - 1) * size).take(size);

    // ===== Execute =====
    const hasGroupBy = (qb as any).expressionMap?.groupBys?.length > 0;
    const hasExtraSelect = (qb as any).expressionMap?.selects?.some((s: any) =>
      s.aliasName?.startsWith("entity_"),
    );

    if (hasGroupBy || hasExtraSelect) {
      const [rawAndEntities, total] = await Promise.all([
        qb.getRawAndEntities(),
        qb.getCount(),
      ]);
      let data = this.mapRawEntities(rawAndEntities);
      if (this.enableFileAttachment && Array.isArray(data)) {
        data = await this.attachFilesToEntities(data);
      }
      return {
        data,
        total,
        summary: Object.keys(summary).length > 0 ? summary : undefined,
      };
    } else {
      const [data, total] = await qb.getManyAndCount();
      let finalData = data;
      if (this.enableFileAttachment && Array.isArray(data)) {
        finalData = await this.attachFilesToEntities(data);
      }

      return {
        data: finalData,
        total,
        summary: Object.keys(summary).length > 0 ? summary : undefined,
      };
    }
  }

  async findByOptions(
    options: FindManyOptions<T>,
    manager?: EntityManager,
  ): Promise<T[]> {
    const data = await this.getRepository(manager).find(options);
    if (this.enableFileAttachment && Array.isArray(data))
      return await this.attachFilesToEntities(data);
    return data;
  }

  async findByOption(
    options: FindOneOptions<T>,
    manager?: EntityManager,
    includeDeleted: boolean = false,
  ): Promise<T | null> {
    if (!includeDeleted) {
      options.where = { ...options.where, deletedAt: IsNull() } as any;
    }

    const data = await this.getRepository(manager).findOne(options);
    if (data && this.enableFileAttachment) await this.attachFilesToEntity(data);
    return data;
  }

  async findAndCount(
    options: FindManyOptions<T>,
    manager?: EntityManager,
    includeDeleted: boolean = false,
  ): Promise<[T[], number]> {
    if (!includeDeleted) {
      options.where = { ...options.where, deletedAt: IsNull() } as any;
    } else {
      options.withDeleted = true;
    }
    return await this.getRepository(manager).findAndCount(options);
  }

  async create(data: DeepPartial<T>, manager?: EntityManager): Promise<T> {
    const repo = this.getRepository(manager);
    const entityInfo = repo.metadata;
    const entityName = entityInfo?.name || "Entity";
    const hasCodeColumn = repo.metadata.columns.some(
      (column) => column.propertyName === "code",
    );
    if (hasCodeColumn && !(data as any).code) {
      const entity = getEntityByType(entityName);
      if (!entity) {
        throw new NotFoundError("Entity not found", {
          field: "entityType",
          code: ErrorsMessages.not_found,
        });
      }
      const code = await generateCode(entity, entityName);
      (data as any).code = code;
    }
    const entity = repo.create(data);
    const saved = await repo.save(entity);

    // Handle files after creation: move files from tempId to realId
    const tempId = (saved as any).tempId;
    const id = (saved as any).id;
    if (tempId && id) {
      await this.handleFilesOnCreate(id, tempId, saved);
    }

    return saved;
  }

  /**
   * Create many
   */
  async createMany(
    data: DeepPartial<T>[],
    manager?: EntityManager,
  ): Promise<T[]> {
    const repo = this.getRepository(manager);
    const entities = repo.create(data as any[]);
    const saved = await repo.save(entities as any);
    return saved as T[];
  }

  /**
   * Update
   */
  async update(
    id: string,
    data: Partial<T>,
    manager?: EntityManager,
  ): Promise<T | null> {
    const repo = this.getRepository(manager);
    await repo.update(id, data as any);

    // Get updated entity để xử lý nested files
    const updatedEntity = await repo.findOne({
      where: { id } as any,
      relations: this.relations,
    });

    // Handle files after update: activate all files
    await this.handleFilesOnUpdate(id, manager, updatedEntity);

    if (manager) {
      if (updatedEntity && this.enableFileAttachment) {
        await this.attachFilesToEntity(updatedEntity as any);
      }
      return updatedEntity || null;
    }

    return this.findById(id);
  }

  /**
   * Delete (hard delete)
   */
  async delete(id: string, manager?: EntityManager): Promise<boolean> {
    // Handle files before deletion
    await this.handleFilesOnDelete(id, manager);

    const result = await this.getRepository(manager).delete(id as any);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Soft delete
   */
  async softDelete(id: string, manager?: EntityManager): Promise<boolean> {
    // Handle files before soft deletion
    await this.handleFilesOnDelete(id, manager);

    const result = await this.getRepository(manager).softDelete(id as any);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Soft delete many
   */
  async softDeleteMany(
    options: FindOptionsWhere<T>,
    manager?: EntityManager,
  ): Promise<number> {
    const result = await this.getRepository(manager).softDelete(options);
    return result.affected ?? 0;
  }

  /**
   * Count
   */
  async count(
    options?: FindManyOptions<T>,
    manager?: EntityManager,
  ): Promise<number> {
    return this.getRepository(manager).count(options);
  }

  /**
   * Check exists
   */
  async exists(
    where: FindOptionsWhere<T>,
    manager?: EntityManager,
  ): Promise<boolean> {
    const count = await this.getRepository(manager).count({ where });
    return count > 0;
  }

  /**
   * Query builder
   */
  async createQueryBuilder(
    alias: string,
    manager?: EntityManager,
  ): Promise<SelectQueryBuilder<T>> {
    return this.getRepository(manager).createQueryBuilder(alias);
  }

  /**
   * Attach files to a single entity
   * Tự động gọi khi query entity
   * Hỗ trợ nested entities thông qua nestedFileFields
   */
  private async attachFilesToEntity(entity: T & { id?: string }): Promise<T> {
    if (!entity || !entity.id) {
      return entity;
    }

    try {
      // Get File repository from store schema
      const fileRepo = this.dataSource.getRepository("File");

      // Collect all entity IDs (root + nested)
      const collectedIds: string[] = [entity.id];

      // Helper function to get value from path (e.g., "lines.productVariant")
      const getValueByPath = (obj: any, path: string): any[] => {
        const parts = path.split(".");
        let current: any = obj;

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];

          if (!current) {
            return [];
          }

          // If current is an array, map over each item to get the property
          if (Array.isArray(current)) {
            const mapped = current
              .map((item) => item?.[part])
              .filter((val) => val !== null && val !== undefined);
            current = mapped;
          } else {
            // Normal object property access
            current = current[part];

            if (!current) {
              return [];
            }
          }
        }

        // Flatten if result is nested array
        if (Array.isArray(current)) {
          return current.flat();
        }
        if (current && typeof current === "object") {
          return [current];
        }
        return [];
      };

      // Collect nested entity IDs based on nestedFileFields
      if (this.nestedFileFields && this.nestedFileFields.length > 0) {
        for (const fieldPath of this.nestedFileFields) {
          const values = getValueByPath(entity, fieldPath);

          for (const item of values) {
            if (item && typeof item === "object" && item.id) {
              collectedIds.push(item.id);
            }
          }
        }
      }

      // Get files for all collected IDs
      const files = await fileRepo.find({
        where: {
          entityId: In(collectedIds),
          status: FileStatusEnum.ACTIVE,
          deletedAt: null,
        } as any,
        order: { createdAt: "ASC" } as any,
      });

      // Group files by entityId and category
      const filesByEntity: Record<string, Record<string, any[]>> = {};

      for (const file of files) {
        const entityId = (file as any).entityId;
        if (!entityId) continue;

        if (!filesByEntity[entityId]) {
          filesByEntity[entityId] = {};
        }

        const category = (file as any).category || "uncategorized";
        if (!filesByEntity[entityId][category]) {
          filesByEntity[entityId][category] = [];
        }

        filesByEntity[entityId][category].push(file);
      }

      // Attach files to root entity
      const entAny: any = { ...entity };
      if (entity.id && filesByEntity[entity.id]) {
        Object.assign(entAny, filesByEntity[entity.id]);
      }

      // Attach files to nested entities based on paths
      if (this.nestedFileFields && this.nestedFileFields.length > 0) {
        for (const fieldPath of this.nestedFileFields) {
          const parts = fieldPath.split(".");
          let current: any = entAny;

          // Navigate to parent of target field
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) break;
            current = current[parts[i]];
          }

          const lastPart = parts[parts.length - 1];

          // Attach files to array items
          if (Array.isArray(current)) {
            for (let i = 0; i < current.length; i++) {
              const item = current[i];
              if (!item) continue;

              const target = parts.length === 1 ? item : item[lastPart];

              if (Array.isArray(target)) {
                // Target is array
                item[lastPart] = target.map((subItem: any) => {
                  if (!subItem || !subItem.id) return subItem;
                  const childFiles = filesByEntity[subItem.id] || {};
                  return { ...subItem, ...childFiles };
                });
              } else if (target && typeof target === "object" && target.id) {
                // Target is single object
                const childFiles = filesByEntity[target.id] || {};
                item[lastPart] = { ...target, ...childFiles };
              } else if (parts.length === 1 && item.id) {
                // Direct array item
                const childFiles = filesByEntity[item.id] || {};
                current[i] = { ...item, ...childFiles };
              }
            }
          } else if (current[lastPart]) {
            // Handle nested field (array or single object)
            const target = current[lastPart];

            if (Array.isArray(target)) {
              // Target is array - attach files to each item
              current[lastPart] = target.map((item: any) => {
                if (!item || !item.id) return item;
                const childFiles = filesByEntity[item.id] || {};
                return { ...item, ...childFiles };
              });
            } else if (target && typeof target === "object" && target.id) {
              // Target is single object
              const childFiles = filesByEntity[target.id] || {};
              current[lastPart] = { ...target, ...childFiles };
            }
          }
        }
      }

      return entAny as T;
    } catch (error) {
      // Silent fail - không ảnh hưởng query chính
      logger.warn(`Failed to attach files to entity ${entity.id}:`, error);
      return entity;
    }
  }

  /**
   * Attach files to multiple entities
   * Tự động gọi khi query danh sách entities
   */
  private async attachFilesToEntities(
    entities: (T & { id?: string })[],
  ): Promise<T[]> {
    if (!entities || entities.length === 0) {
      return entities;
    }

    try {
      const collectedIds: string[] = [];

      // Helper function to get value from path
      const getValueByPath = (obj: any, path: string): any[] => {
        const parts = path.split(".");
        let current: any = obj;

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];

          if (!current) {
            return [];
          }

          // If current is an array, map over each item to get the property
          if (Array.isArray(current)) {
            const mapped = current
              .map((item) => item?.[part])
              .filter((val) => val !== null && val !== undefined);
            current = mapped;
          } else {
            // Normal object property access
            current = current[part];

            if (!current) {
              return [];
            }
          }
        }

        // Flatten if result is nested array
        if (Array.isArray(current)) {
          return current.flat();
        }
        if (current && typeof current === "object") {
          return [current];
        }
        return [];
      };

      // Collect all entity IDs
      for (const e of entities) {
        if (e.id) collectedIds.push(e.id as string);

        // Collect nested IDs based on nestedFileFields
        if (this.nestedFileFields && this.nestedFileFields.length > 0) {
          for (const fieldPath of this.nestedFileFields) {
            const values = getValueByPath(e, fieldPath);

            for (const item of values) {
              if (item && typeof item === "object" && item.id) {
                collectedIds.push(item.id);
              }
            }
          }
        }
      }

      const uniqueIds = Array.from(new Set(collectedIds));
      if (uniqueIds.length === 0) return entities;

      // Get File repository from store schema
      const fileRepo = this.dataSource.getRepository("File");
      const allFiles = await fileRepo.find({
        where: {
          entityId: In(uniqueIds),
          status: FileStatusEnum.ACTIVE,
          deletedAt: null,
        } as any,
        order: { createdAt: "ASC" } as any,
      });

      if (allFiles.length > 0) {
        allFiles.slice(0, 5).forEach((f: any) => {});
        if (allFiles.length > 5) {
        }
      }

      // Group files by entityId and category
      const filesByEntity: Record<string, Record<string, any[]>> = {};

      for (const file of allFiles) {
        const entityId = (file as any).entityId;
        if (!entityId) continue;

        if (!filesByEntity[entityId]) {
          filesByEntity[entityId] = {};
        }

        const category = (file as any).category || "uncategorized";
        if (!filesByEntity[entityId][category]) {
          filesByEntity[entityId][category] = [];
        }

        filesByEntity[entityId][category].push(file);
      }

      // Attach files to root entities and nested entities
      return entities.map((entity) => {
        if (!entity.id) return entity;

        const entAny: any = { ...entity };

        // Attach files to root entity
        if (entity.id && filesByEntity[entity.id]) {
          Object.assign(entAny, filesByEntity[entity.id]);
        }

        // Attach files to nested entities based on paths
        if (this.nestedFileFields && this.nestedFileFields.length > 0) {
          for (const fieldPath of this.nestedFileFields) {
            const parts = fieldPath.split(".");
            let current: any = entAny;

            // Navigate to parent of target field
            for (let i = 0; i < parts.length - 1; i++) {
              if (!current[parts[i]]) break;
              current = current[parts[i]];
            }

            const lastPart = parts[parts.length - 1];

            // Attach files to array items
            if (Array.isArray(current)) {
              for (let i = 0; i < current.length; i++) {
                const item = current[i];
                if (!item) continue;

                const target = parts.length === 1 ? item : item[lastPart];

                if (Array.isArray(target)) {
                  // Target is array
                  item[lastPart] = target.map((subItem: any) => {
                    if (!subItem || !subItem.id) return subItem;
                    const childFiles = filesByEntity[subItem.id] || {};
                    return { ...subItem, ...childFiles };
                  });
                } else if (target && typeof target === "object" && target.id) {
                  // Target is single object
                  const childFiles = filesByEntity[target.id] || {};
                  item[lastPart] = { ...target, ...childFiles };
                } else if (parts.length === 1 && item.id) {
                  // Direct array item
                  const childFiles = filesByEntity[item.id] || {};
                  current[i] = { ...item, ...childFiles };
                }
              }
            } else if (current[lastPart]) {
              // Handle nested field (array or single object)
              const target = current[lastPart];

              if (Array.isArray(target)) {
                // Target is array - attach files to each item
                current[lastPart] = target.map((item: any) => {
                  if (!item || !item.id) return item;
                  const childFiles = filesByEntity[item.id] || {};
                  return { ...item, ...childFiles };
                });
              } else if (target && typeof target === "object" && target.id) {
                // Target is single object
                const childFiles = filesByEntity[target.id] || {};
                current[lastPart] = { ...target, ...childFiles };
              }
            }
          }
        }

        return entAny as T;
      });
    } catch (error) {
      // Silent fail - không ảnh hưởng query chính
      logger.warn(
        `Failed to attach files to ${entities.length} entities:`,
        error,
      );
      return entities;
    }
  }

  /**
   * Handle files after entity creation
   * Chuyển files từ tempId sang realId và active
   * Tự động xử lý nested entities thông qua nestedFileFields
   */
  protected async handleFilesOnCreate(
    entityId: string,
    tempId?: string,
    savedEntity?: any,
  ): Promise<void> {
    if (!tempId) return;

    try {
      const fileRepo = this.dataSource.getRepository("File");

      // Update files from tempId to realId and set status to ACTIVE
      const result = await fileRepo.update(
        {
          entityId: tempId,
        },
        {
          entityId: entityId,
          status: FileStatusEnum.ACTIVE,
          expiresAt: null,
        },
      );
      logger.info(
        `Updated ${result.affected} files from tempId ${tempId} to entityId ${entityId}`,
      );
      logger.info(
        `Updated files from tempId ${tempId} to entityId ${entityId}`,
      );

      // Xử lý files cho nested entities (ví dụ: variants trong product)
      if (
        savedEntity &&
        this.nestedFileFields &&
        this.nestedFileFields.length > 0
      ) {
        for (const fieldKey of this.nestedFileFields) {
          const nestedData = savedEntity[fieldKey];

          // Kiểm tra nếu là array
          if (Array.isArray(nestedData) && nestedData.length > 0) {
            for (const nestedItem of nestedData) {
              if (nestedItem && nestedItem.tempId && nestedItem.id) {
                await fileRepo.update(
                  { entityId: tempId },
                  {
                    entityId,
                    status: FileStatusEnum.ACTIVE,
                    expiresAt: null,
                  },
                );
                logger.info(
                  `Updated files for nested ${fieldKey}: ${nestedItem.tempId} -> ${nestedItem.id}`,
                );
              }
            }
          }
          // Kiểm tra nếu là object đơn
          else if (
            nestedData &&
            typeof nestedData === "object" &&
            nestedData.tempId &&
            nestedData.id
          ) {
            await fileRepo.update(
              { entityId: tempId },
              {
                entityId,
                status: FileStatusEnum.ACTIVE,
                expiresAt: null,
              },
            );
            logger.info(
              `Updated files for nested ${fieldKey}: ${nestedData.tempId} -> ${nestedData.id}`,
            );
          }
        }
      }
    } catch (error) {
      logger.error(
        `Failed to handle files on create for entity ${entityId}:`,
        error,
      );
    }
  }

  /**
   * Handle files after entity update
   * Activate all files linked to entity
   * Tự động xử lý nested entities thông qua nestedFileFields
   */
  protected async handleFilesOnUpdate(
    entityId: string,
    manager?: EntityManager,
    updatedEntity?: any,
  ): Promise<void> {
    try {
      const fileRepo = manager
        ? manager.getRepository("File")
        : this.dataSource.getRepository("File");

      // Nếu multipleFile = false, xóa files cũ trước khi activate files mới
      if (!this.multipleFile) {
        // Get all pending files for this entity (files mới upload)
        const pendingFiles = await fileRepo.find({
          where: {
            entityId: entityId,
            status: FileStatusEnum.PENDING,
            deletedAt: null,
          } as any,
          order: { createdAt: "DESC" } as any,
        });

        // Group pending files by category
        const pendingByCategory: Record<string, any[]> = {};
        for (const file of pendingFiles) {
          const category = (file as any).category || "default";
          if (!pendingByCategory[category]) {
            pendingByCategory[category] = [];
          }
          pendingByCategory[category].push(file);
        }

        // For each category, delete old active files
        for (const [category, files] of Object.entries(pendingByCategory)) {
          if (files.length > 0) {
            // Soft delete old active files in this category
            await fileRepo
              .createQueryBuilder()
              .softDelete()
              .where("entityId = :entityId", { entityId })
              .andWhere("category = :category", { category })
              .andWhere("status = :status", { status: FileStatusEnum.ACTIVE })
              .andWhere("deletedAt IS NULL")
              .execute();

            logger.info(`Deleted old active files for category "${category}"`);
          }
        }
      }

      // Activate all pending files
      // const updateResult =
      await fileRepo
        .createQueryBuilder()
        .update()
        .set({
          status: FileStatusEnum.ACTIVE,
          expiresAt: null,
        })
        .where("entityId = :entityId", { entityId })
        .andWhere("status = :status", { status: FileStatusEnum.PENDING })
        .andWhere("deletedAt IS NULL")
        .execute();

      // logger.info(
      //   `Activated ${updateResult.affected} files for entity ${entityId}`,
      // );

      // Xử lý files cho nested entities (ví dụ: variants trong product)
      if (
        updatedEntity &&
        this.nestedFileFields &&
        this.nestedFileFields.length > 0
      ) {
        for (const fieldKey of this.nestedFileFields) {
          const nestedData = updatedEntity[fieldKey];

          // Kiểm tra nếu là array
          if (Array.isArray(nestedData) && nestedData.length > 0) {
            for (const nestedItem of nestedData) {
              if (nestedItem && nestedItem.id) {
                // ⚠️ Nested entities LUÔN chỉ giữ 1 file/category (single file mode)
                const pendingFiles = await fileRepo.find({
                  where: {
                    entityId: nestedItem.id,
                    status: FileStatusEnum.PENDING,
                    deletedAt: null,
                  } as any,
                });

                const pendingByCategory: Record<string, any[]> = {};
                for (const file of pendingFiles) {
                  const category = (file as any).category || "default";
                  if (!pendingByCategory[category]) {
                    pendingByCategory[category] = [];
                  }
                  pendingByCategory[category].push(file);
                }

                // Xóa files cũ trước khi activate files mới
                for (const [category] of Object.entries(pendingByCategory)) {
                  await fileRepo
                    .createQueryBuilder()
                    .softDelete()
                    .where("entityId = :entityId", {
                      entityId: nestedItem.id,
                    })
                    .andWhere("category = :category", { category })
                    .andWhere("status = :status", {
                      status: FileStatusEnum.ACTIVE,
                    })
                    .andWhere("deletedAt IS NULL")
                    .execute();
                }

                // Activate pending files
                await fileRepo
                  .createQueryBuilder()
                  .update()
                  .set({
                    status: FileStatusEnum.ACTIVE,
                    expiresAt: null,
                  })
                  .where("entityId = :entityId", { entityId: nestedItem.id })
                  .andWhere("status = :status", {
                    status: FileStatusEnum.PENDING,
                  })
                  .andWhere("deletedAt IS NULL")
                  .execute();
              }
            }
          }
          // Kiểm tra nếu là object đơn
          else if (
            nestedData &&
            typeof nestedData === "object" &&
            nestedData.id
          ) {
            // ⚠️ Nested entities LUÔN chỉ giữ 1 file/category (single file mode)
            const pendingFiles = await fileRepo.find({
              where: {
                entityId: nestedData.id,
                status: FileStatusEnum.PENDING,
                deletedAt: null,
              } as any,
            });

            const pendingByCategory: Record<string, any[]> = {};
            for (const file of pendingFiles) {
              const category = (file as any).category || "default";
              if (!pendingByCategory[category]) {
                pendingByCategory[category] = [];
              }
              pendingByCategory[category].push(file);
            }

            // Xóa files cũ trước khi activate files mới
            for (const [category] of Object.entries(pendingByCategory)) {
              await fileRepo
                .createQueryBuilder()
                .softDelete()
                .where("entityId = :entityId", { entityId: nestedData.id })
                .andWhere("category = :category", { category })
                .andWhere("status = :status", {
                  status: FileStatusEnum.ACTIVE,
                })
                .andWhere("deletedAt IS NULL")
                .execute();
            }

            // Activate pending files
            await fileRepo
              .createQueryBuilder()
              .update()
              .set({
                status: FileStatusEnum.ACTIVE,
                expiresAt: null,
              })
              .where("entityId = :entityId", { entityId: nestedData.id })
              .andWhere("status = :status", { status: FileStatusEnum.PENDING })
              .andWhere("deletedAt IS NULL")
              .execute();
          }
        }
      }
    } catch (error) {
      logger.error(
        `Failed to handle files on update for entity ${entityId}:`,
        error,
      );
    }
  }

  /**
   * Handle files after entity deletion
   * Delete all files linked to entity (DB + physical storage)
   * Tự động xử lý nested entities thông qua nestedFileFields
   */
  protected async handleFilesOnDelete(
    entityId: string,
    manager?: EntityManager,
  ): Promise<void> {
    try {
      const fileRepo = manager
        ? manager.getRepository("File")
        : this.dataSource.getRepository("File");

      // Get entity với relations để lấy nested entities
      const repo = this.getRepository(manager);

      const entity = await repo.findOne({
        where: { id: entityId } as any,
        relations: this.relations,
      });

      // Collect tất cả entityIds cần xóa files (entity chính + nested entities)
      const entityIdsToDelete: string[] = [entityId];

      // Thu thập IDs của nested entities
      if (entity && this.nestedFileFields && this.nestedFileFields.length > 0) {
        for (const fieldKey of this.nestedFileFields) {
          const nestedData = (entity as any)[fieldKey];

          // Kiểm tra nếu là array
          if (Array.isArray(nestedData) && nestedData.length > 0) {
            for (const nestedItem of nestedData) {
              if (nestedItem && nestedItem.id) {
                entityIdsToDelete.push(nestedItem.id);
              }
            }
          }
          // Kiểm tra nếu là object đơn
          else if (
            nestedData &&
            typeof nestedData === "object" &&
            nestedData.id
          ) {
            entityIdsToDelete.push(nestedData.id);
          }
        }
      }

      // Get all files linked to entity và nested entities
      const files = await fileRepo.find({
        where: {
          entityId: In(entityIdsToDelete),
        } as any,
      });

      // Delete physical files
      for (const file of files) {
        try {
          const filePath = (file as any).path;
          const thumbnailPath = (file as any).thumbnailPath;

          if (filePath) {
            await fs.unlink(filePath).catch(() => {
              // File might not exist, ignore error
            });
          }

          if (thumbnailPath) {
            await fs.unlink(thumbnailPath).catch(() => {
              // Thumbnail might not exist, ignore error
            });
          }
        } catch (error) {
          logger.warn(
            `Failed to delete physical file ${(file as any).path}:`,
            error,
          );
        }
      }

      // Delete files from database
      await fileRepo.delete({
        entityId: In(entityIdsToDelete),
      } as any);

      logger.info(
        `Deleted ${files.length} files for entity ${entityId} and nested entities`,
      );
    } catch (error) {
      logger.error(
        `Failed to handle files on delete for entity ${entityId}:`,
        error,
      );
    }
  }

  checkArrayFilter(value?: any): boolean {
    return value && Array.isArray(value) && value.length > 0;
  }
}
