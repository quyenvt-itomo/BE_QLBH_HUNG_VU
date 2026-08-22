import { injectable } from "inversify";
import { Request } from "express";
import { ApiResponse } from "@/shared/types/interfaces";
import { BaseRepository, IFindPaginationOptions } from "./BaseRepository";
import { ApiResponseHandler } from "../utils/response.utils";
import { IError, NotFoundError, ValidationError } from "../types/errors";
import {
  DeepPartial,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  In,
  Not,
  ObjectLiteral,
} from "typeorm";
import { ErrorsMessages } from "../constants/errors";
import { FileHelper } from "../utils/file.helper";
import logger from "../utils/logger";
import { RepositoryFactory } from "../utils/repositoryFactory";
import { withTransaction } from "./TransactionManager";

export interface IFindOptions<T> extends FindManyOptions<T> {
  page?: number;
  size?: number;
  keyword?: string; // Keyword for text search
  searchFields?: (keyof T)[]; // Fields to search in
  timeField?: keyof T; // Field to apply the date range filter on
  summaryFields?: (keyof T)[]; // Fields to summarize
  type?: string; // Example field for filtering by type
  status?: string; // Example field for filtering by status
  startAt?: Date; // Example field for filtering by date range
  endAt?: Date; // Example field for filtering by date range
  sortBy?: string; // Field to sort by
  sortOrder?: "ASC" | "DESC"; // Sort direction
  isFinished?: boolean; // Example field for filtering by completion status
  filterOptions?: (keyof T)[]; // Additional filter options
  projectId?: string; // Example field for filtering by project ID
  employeeId?: string; // Example field for filtering by employee ID
  fundId?: string; // Example field for filtering by fund ID
  advanceId?: string; // Example field for filtering by advance ID

  productIds?: string[]; // Example field for filtering by product IDs
  storeIds?: string[]; // Example field for filtering by store IDs
  employeeIds?: string[]; // Example field for filtering by employee IDs
  fundCategoryIds?: string[]; // Example field for filtering by fundCategory IDs
  partnerIds?: string[]; // Example field for filtering by partner IDs
  toFundIds?: string[]; // Example field for filtering by fund IDs
}

export type DateInput = Date | string | number | null | undefined;

@injectable()
export abstract class BaseService<T extends ObjectLiteral> {
  protected abstract repository: BaseRepository<T>;

  // Optional unique fields and scope to enforce DB-level uniqueness
  protected uniqueFields?: (keyof T)[];
  protected uniqueScope?: (keyof T)[];

  // Optional searchable fields for text search (keyword)
  // If not set, repository will auto-detect string fields
  protected timeField?: keyof T & string;
  protected searchableFields?: string[];
  protected summaryFields?: string[];

  /**
   * Override trong subclass để disable file attachment
   * @default true
   */
  protected shouldAttachFiles(): boolean {
    return true;
  }

  // Attach files vào 1 entity (tự động gọi nếu shouldAttachFiles = true)
  protected async attachFilesToEntity(
    entity: T | null,
  ): Promise<(T & Record<string, File[]>) | null> {
    if (!entity) return null;

    const grouped = await FileHelper.attachFilesToEntity(entity.id);

    return {
      ...entity,
      ...grouped,
    };
  }

  // Attach files vào nhiều entities (optimized, 1 query)
  protected async attachFilesToEntities(
    entities: T[],
  ): Promise<(T & Record<string, File[]>)[]> {
    if (!entities || entities.length === 0) return [];

    return await FileHelper.attachFilesToEntities(entities as any[]);
  }

  // Confirm files sau khi tạo entity (tempId → realId)
  protected async confirmEntityFiles(
    tempId: string,
    realId: string,
  ): Promise<void> {
    await FileHelper.confirmEntityFiles(tempId, realId);
  }

  protected async attachMoreDataToEntities(
    entities: T[],
    options: IFindOptions<T>,
  ): Promise<void> {
    // Override in subclass if needed
  }

  protected async attachMoreDataToEntity(
    entity: T,
    req?: Request,
  ): Promise<void> {
    // Override in subclass if needed
  }

  /**
   * Find all
   */
  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    const data = await this.repository.find(options);
    const json = JSON.stringify(data);
    const sizeInKB = Buffer.byteLength(json, "utf8") / 1024;
    logger.info(`Response size: ${sizeInKB}KB`);
    await this.attachMoreDataToEntities(data, {});

    return data;
  }

  /**
   *  Phương thức này dùng để tìm kiếm với phân trang và các điều kiện khác nhau
   *  như type, status, khoảng thời gian, và từ khóa tìm kiếm.
   *  - Nếu có type thì chỉ lấy những field tương ứng với type đó
   *  - Nếu có status thì chỉ lấy những field tương ứng với status đó
   *  - Nếu có khoảng thời gian thì chỉ lấy những field tương ứng với khoảng thời gian đó
   *  - Nếu có keyword thì tìm kiếm theo các field có thể tìm kiếm
   *  - Nếu không có keyword thì trả về tất cả các field
   * @param options
   * @returns
   */
  async findAllWithPagination(
    options: IFindOptions<T>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<ApiResponse<T[]>> {
    let page = options.page || 1;
    const size = options.size || 20;

    const optionData: IFindPaginationOptions<T> = {
      where: options.where,
      skip: page,
      take: size,
      order: {},
      keyword: options.keyword,
      searchFields: this.searchableFields, // Use configured searchableFields
      summaryFields: this.summaryFields,
      dateFilter: this.timeField,
      type: options.type,
      status: options.status,
      startAt: options.startAt,
      endAt: options.endAt,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      isFinished: options.isFinished,
      moreQuery: {
        ...options,
        fundId: req?.params.fundId || options?.fundId,
        advanceId: req?.params.advanceId || options?.advanceId,
      },
    };

    let dataRes = await this.repository.findWithPagination(optionData, manager);

    const totalPages = Math.ceil(dataRes.total / size);
    if (page > totalPages && totalPages > 0) {
      page = totalPages;

      dataRes = await this.repository.findWithPagination(
        {
          ...optionData,
          skip: page,
        },
        manager,
      );
    }

    const data = dataRes.data;
    const json = JSON.stringify(data);
    const sizeInKB = Buffer.byteLength(json, "utf8") / 1024;
    logger.info(`Response size: ${sizeInKB}KB`);
    await this.attachMoreDataToEntities(data, options);

    return ApiResponseHandler.getSuccess(
      "OK",
      data,
      {
        totalRecords: dataRes.total,
        size: size,
        currentPage: page,
        totalPages: Math.ceil(dataRes.total / size),
      },
      dataRes.summary,
    );
  }

  /**
   * Find one by ID
   */
  async findById(id: string, req?: Request): Promise<T | null> {
    const data = await this.repository.findById(id, undefined, req);
    if (data) {
      await this.attachMoreDataToEntity(data, req);
    }
    const json = JSON.stringify(data);
    const sizeInKB = Buffer.byteLength(json, "utf8") / 1024;
    logger.info(`Response size: ${sizeInKB}KB`);
    return data;
  }

  /**
   * Find one by options
   */
  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    const data = await this.repository.findOne(options);
    if (data) {
      await this.attachMoreDataToEntity(data, undefined);
    }
    const json = JSON.stringify(data);
    const sizeInKB = Buffer.byteLength(json, "utf8") / 1024;
    logger.info(`Response size: ${sizeInKB}KB`);
    return data;
  }

  /**
   * Validate data before create: Logic business riêng cho từng entity hoặc đắp thêm dữ liệu
   * @param data
   * @param manager
   * @param req
   */
  async validateBeforeCreate(
    data: DeepPartial<T>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    // Override in subclass if needed
  }

  /**
   * Sau khi tạo record thành công, thực hiện các hành động bổ sung
   * VD: Gửi thông báo, tính lại dữ liệu entity liên quan, v.v.
   * @param data
   * @param manager
   * @param req
   */
  async actionAfterCreate(
    data: T,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    // Override in subclass if needed
  }

  /**
   * Create
   */
  async create(
    data: DeepPartial<T>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<T> {
    if (manager) {
      await this.validateBeforeCreate(data, manager, req);
      // perform unique check if configured
      if (this.uniqueFields && this.uniqueFields.length > 0) {
        const errs = await this.checkExistInDb(
          data as any,
          this.uniqueFields as any,
          (this.uniqueScope as any) || [],
        );
        if (errs.length > 0) throw new ValidationError("input.invalid", errs);
      }
      // perform reference existence check if applicable
      const refErrs = await this.checkReferencesInDb?.(data, manager);
      if (refErrs && refErrs.length > 0)
        throw new ValidationError("input.invalid", refErrs);
      const createdEntity = await this.repository.create(data, manager);
      await this.actionAfterCreate(createdEntity, manager, req);
      const fullData = await this.repository.findById(
        createdEntity.id,
        manager,
      );
      return fullData || createdEntity;
    }

    return await withTransaction(async (trxManager) => {
      await this.validateBeforeCreate(data, trxManager, req);
      if (this.uniqueFields && this.uniqueFields.length > 0) {
        const errs = await this.checkExistInDb(
          data as any,
          this.uniqueFields as any,
          (this.uniqueScope as any) || [],
        );
        if (errs.length > 0) throw new ValidationError("input.invalid", errs);
      }

      // perform reference existence check if applicable (inside tenant transaction)
      const refErrs = await this.checkReferencesInDb?.(data, trxManager);
      if (refErrs && refErrs.length > 0)
        throw new ValidationError("input.invalid", refErrs);

      const createdEntity = await this.repository.create(data, trxManager);

      await this.actionAfterCreate(createdEntity, trxManager, req);

      const fullData = await this.repository.findById(
        createdEntity.id,
        trxManager,
      );

      return fullData || createdEntity;
    });
  }

  /**
   * Validate data before update: Logic business riêng cho từng entity hoặc đắp thêm dữ liệu
   * @param id
   * @param data
   * @param manager
   * @param req
   */
  async validateBeforeUpdate(
    id: string,
    data: Partial<T>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    // Override in subclass if needed
  }

  /**
   * Sau khi cập nhật record thành công, thực hiện các hành động bổ sung
   * VD: Gửi thông báo, tính lại dữ liệu entity liên quan, v.v.
   * @param data
   * @param manager
   * @param req
   */
  async actionAfterUpdate(
    data: T,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    // Override in subclass if needed
  }

  /**
   * Update
   */
  async update(
    id: string,
    data: Partial<T>,
    manager?: EntityManager,
    req?: Request,
  ): Promise<T | null> {
    if (manager) {
      await this.validateBeforeUpdate(id, data, manager, req);

      // perform unique check if configured (exclude self by providing id)
      if (this.uniqueFields && this.uniqueFields.length > 0) {
        const errs = await this.checkExistInDb(
          {
            ...data,
            id,
          },
          this.uniqueFields as any,
          (this.uniqueScope as any) || [],
        );
        if (errs.length > 0) throw new ValidationError("input.invalid", errs);
      }
      // perform reference existence check for update
      const refErrs = await this.checkReferencesInDb({ ...data, id }, manager);
      if (refErrs && refErrs.length > 0)
        throw new ValidationError("input.invalid", refErrs);

      const updatedEntity = await this.repository.update(id, data, manager);

      if (updatedEntity) {
        await this.actionAfterUpdate(updatedEntity, manager, req);
      }

      const fullData = await this.repository.findById(
        updatedEntity?.id || id,
        manager,
      );

      return fullData;
    }

    return await withTransaction(async (trxManager) => {
      await this.validateBeforeUpdate(id, data, trxManager, req);

      if (this.uniqueFields && this.uniqueFields.length > 0) {
        const errs = await this.checkExistInDb(
          {
            ...data,
            id,
          },
          this.uniqueFields as any,
          (this.uniqueScope as any) || [],
        );
        if (errs.length > 0) throw new ValidationError("input.invalid", errs);
      }

      // perform reference existence check for update inside transaction
      const refErrs = await this.checkReferencesInDb?.(
        { ...data, id },
        trxManager,
      );
      if (refErrs && refErrs.length > 0)
        throw new ValidationError("input.invalid", refErrs);

      const updatedEntity = await this.repository.update(id, data, trxManager);

      if (updatedEntity) {
        await this.actionAfterUpdate(updatedEntity, trxManager, req);
      }

      const fullData = await this.repository.findById(
        updatedEntity?.id || id,
        trxManager,
      );

      return fullData;
    });
  }

  /**
   * Validate data before delete: Logic business riêng cho từng entity hoặc đắp thêm dữ liệu
   * @param data
   * @param manager
   * @param req
   */
  async validateBeforeDelete(
    data: Partial<T>,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    // Override in subclass if needed
  }

  /**
   * Sau khi xoá record thành công, thực hiện các hành động bổ sung
   * VD: Gửi thông báo, tính lại dữ liệu entity liên quan, v.v.
   * @param data
   * @param manager
   * @param req
   */
  async actionAfterDelete(
    data: T,
    manager: EntityManager,
    req?: Request,
  ): Promise<void> {
    // Override in subclass if needed
  }

  /**
   * Delete (soft delete)
   */
  async delete(
    id: string,
    manager?: EntityManager,
    req?: Request,
  ): Promise<boolean> {
    if (manager) {
      const entity = await this.findById(id);
      if (!entity) {
        throw new NotFoundError(`id.not_found`, [
          {
            field: "id",
            code: ErrorsMessages.not_found,
          },
        ]);
      }

      await this.validateBeforeDelete(entity, manager, req);
      const result = await this.repository.delete(id, manager);
      await this.actionAfterDelete(entity, manager, req);

      return result;
    }

    return await withTransaction(async (trxManager) => {
      const entity = await this.findById(id);
      if (!entity) {
        throw new NotFoundError(`id.not_found`, [
          {
            field: "id",
            code: ErrorsMessages.not_found,
          },
        ]);
      }

      await this.validateBeforeDelete(entity, trxManager, req);
      const result = await this.repository.delete(id, trxManager);
      await this.actionAfterDelete(entity, trxManager, req);

      return result;
    });
  }

  /**
   * Count
   */
  async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count(options);
  }

  /**
   * Check exists
   */
  async exists(id: string, manager?: EntityManager): Promise<boolean> {
    return this.repository.exists({ id } as any, manager);
  }

  protected checkDuplicate<
    T extends Record<string, any>,
    K extends readonly (keyof T)[],
    S extends readonly (keyof T)[],
  >(items: T[], fields: K, prefix: string, scopes?: S): IError[] {
    const errors: IError[] = [];

    /**
     * field -> scopeKey -> value -> index
     */
    const seenMap = new Map<string, Map<string, Map<any, number>>>();

    // init
    for (const field of fields) {
      seenMap.set(field as string, new Map());
    }

    items.forEach((item, index) => {
      // tạo composite scope key
      const scopeKey = scopes?.length
        ? scopes.map((k) => item[k]).join("__")
        : "__global__";

      // nếu có scope mà thiếu value → bỏ qua
      if (
        scopes?.length &&
        scopes.some(
          (k) => item[k] === null || item[k] === undefined || item[k] === "",
        )
      ) {
        return;
      }

      fields.forEach((field) => {
        const fieldKey = field as string;
        const value = item[fieldKey];

        // bỏ qua null / undefined / empty string
        if (value === null || value === undefined || value === "") return;

        const fieldMap = seenMap.get(fieldKey)!;

        if (!fieldMap.has(scopeKey)) {
          fieldMap.set(scopeKey, new Map());
        }

        const scopedSeen = fieldMap.get(scopeKey)!;

        if (scopedSeen.has(value)) {
          errors.push({
            field: `${prefix}.${index}.${fieldKey}`,
            code: ErrorsMessages.duplicate,
          });
        } else {
          scopedSeen.set(value, index);
        }
      });
    });

    return errors;
  }

  /**
   * Check existence in DB for given fields with optional scope fields.
   * Example: fields = ["email","phone"], scope = ["partnerId"]
   * Will query (email AND partnerId) OR (phone AND partnerId)
   * Returns an array of IError (empty when no conflicts)
   */
  protected async checkExistInDb<T extends Record<string, any>>(
    items: T[] | T,
    fields: (keyof T)[],
    scopeFields: (keyof T)[] = [],
  ): Promise<IError[]> {
    const itemArray = Array.isArray(items) ? items : [items];
    const errors: IError[] = [];

    for (let i = 0; i < itemArray.length; i++) {
      const item = itemArray[i];

      const orConditions: any[] = [];

      for (const field of fields) {
        const value = item[field as string];
        if (value == null || value === "") continue;

        orConditions.push({ [field as string]: value });
      }

      if (!orConditions.length) continue;

      const baseWhere: any = { deletedAt: null };

      for (const s of scopeFields) {
        if (item[s as string] != null) {
          baseWhere[s as string] = item[s as string];
        }
      }

      if (item.id) baseWhere.id = Not(item.id);

      const found = await this.repository.findByOptions({
        where: orConditions.map((or) => ({
          ...baseWhere,
          ...or,
        })),
      } as any);

      if (found.length > 0) {
        for (const field of fields) {
          const exists = found.find((f) => {
            const val = item[field as string];
            return val != null && f[field as string] === val;
          });

          if (exists)
            errors.push({
              field: String(field),
              code: ErrorsMessages.exists,
            });
        }
      }
    }

    return errors;
  }

  /**
   * Check foreign-key references in DB for tenant entities.
   * Batches checks per related-entity to minimize queries (1 query per related entity).
   */
  protected async checkReferencesInDb(
    items: DeepPartial<T> | Partial<T> | Partial<T>[],
    manager?: EntityManager,
  ): Promise<IError[]> {
    const itemArray = Array.isArray(items) ? items : [items];
    const errors: IError[] = [];
    // get root repo metadata
    const rootRepo = await (this.repository as any).getRepository(manager);
    const entityMetadata = rootRepo.metadata;

    // map possible fk keys -> related entity name
    const relationIdToEntityMap: Record<string, string> = {};
    entityMetadata.relations.forEach((relation: any) => {
      const joinColumn = relation.joinColumns?.[0];
      const propKey = `${relation.propertyName}Id`;
      if (joinColumn?.databaseName)
        relationIdToEntityMap[joinColumn.databaseName] =
          relation.inverseEntityMetadata.name;
      relationIdToEntityMap[propKey] = relation.inverseEntityMetadata.name;
    });

    // collect ids per related entity and track occurrences
    const occurrences: Record<
      string,
      Map<string, Array<{ index: number; field: string }>>
    > = {};

    for (let i = 0; i < itemArray.length; i++) {
      const item: any = itemArray[i];
      for (const key of Object.keys(item)) {
        if (!key.endsWith("Id")) continue;
        const relatedEntity = relationIdToEntityMap[key];
        if (!relatedEntity) continue;
        const idValue = item[key];
        if (!idValue) continue;

        occurrences[relatedEntity] = occurrences[relatedEntity] || new Map();
        const mapForEntity = occurrences[relatedEntity];
        const idStr = String(idValue);
        if (!mapForEntity.has(idStr)) mapForEntity.set(idStr, []);
        mapForEntity.get(idStr)!.push({ index: i, field: key });
      }
    }

    if (Object.keys(occurrences).length === 0) return errors;

    const repoMap = RepositoryFactory.getRepositories();

    // For each related entity, batch check IDs
    await Promise.all(
      Object.keys(occurrences).map(async (relatedEntity) => {
        const idMap = occurrences[relatedEntity];
        const ids = Array.from(idMap.keys());
        const repo = repoMap[relatedEntity];
        if (!repo) {
          // mark all as not found
          idMap.forEach((arr) => {
            arr.forEach((occ) =>
              errors.push({
                field: occ.field,
                code: ErrorsMessages.not_found,
              }),
            );
          });
          return;
        }

        // query existing ids in tenant schema
        const found = await repo.findByOptions({
          where: { id: In(ids as any), deletedAt: null } as any,
        });

        const foundIds = new Set(found.map((f: any) => String(f.id)));

        idMap.forEach((arr, id) => {
          if (!foundIds.has(id)) {
            arr.forEach((occ) =>
              errors.push({
                field: occ.field,
                code: ErrorsMessages.not_found,
              }),
            );
          }
        });
      }),
    );

    return errors;
  }

  getEarliestDate(d1?: DateInput, d2?: DateInput): Date {
    const t1 = d1 != null ? new Date(d1).getTime() : null;
    const t2 = d2 != null ? new Date(d2).getTime() : null;

    if (t1 == null && t2 == null) {
      return new Date(0); // epoch
    }

    if (t1 == null) return new Date(t2!);
    if (t2 == null) return new Date(t1);

    return new Date(Math.min(t1, t2));
  }

  collectUniqueIds(ids: Array<string | null | undefined>): string[] {
    return Array.from(
      new Set(
        ids.filter(
          (id): id is string => typeof id === "string" && id.trim() !== "",
        ),
      ),
    );
  }
}
