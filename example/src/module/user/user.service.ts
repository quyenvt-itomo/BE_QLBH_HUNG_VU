import type {
  RequestContext,
  ActionMap,
  ActionValue,
} from "@/shared/types/interfaces";
import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { UserRepository } from "./user.repository";
import { User } from "@/database/models/User";
import { DeepPartial, EntityManager, Not } from "typeorm";
import { AuthUtils } from "@/shared/utils/auth.utils";
import { USER_TYPES } from "./user.types";
import {
  BadRequestError,
  ForbiddenError,
  IError,
  ValidationError,
} from "@/shared/types/errors";
import { CreateUserDto } from "./user.validator";
import { ROLE_TYPES } from "../role/role.types";
import { RoleRepository } from "../role/role.repository";
import { StoreUser } from "@/database/models/StoreUser";
import { Role } from "@/database/models/company/Role";
import { Employee } from "@/database/models/company/Employee";
import { EMPLOYEE_TYPES } from "../employee/employee.types";
import { EmployeeRepository } from "../employee/employee.repository";
import { withTransaction } from "@/shared/base/TransactionManager";

type UserWriteData = DeepPartial<User> & Record<string, any>;

type StoreUserWritePayload = {
  storeId: string;
  roleId: string | null;
  employeeId: string | null;
  employeeSnapshot: Awaited<
    ReturnType<EmployeeRepository["getSnapshot"]>
  > | null;
};

@injectable()
export class UserService extends BaseService<User> {
  protected repository: UserRepository;
  protected uniqueFields: (keyof User)[] = [
    "username",
    "code",
    "email",
    "phone",
  ];
  protected searchableFields = ["name", "code", "email", "phone"];

  constructor(
    @inject(USER_TYPES.UserRepository)
    repository: UserRepository,
    @inject(ROLE_TYPES.RoleRepository)
    private roleRepository: RoleRepository,
    @inject(EMPLOYEE_TYPES.EmployeeRepository)
    private employeeRepository: EmployeeRepository,
  ) {
    super();
    this.repository = repository;
  }

  // =====================================================
  // ACTIONS (canUpdate / canDelete)
  // =====================================================

  protected async attachActions(
    entity: User & { _actions?: ActionMap },
    req?: RequestContext,
  ): Promise<void> {
    entity._actions = await this.getActions(entity, req);
  }

  async getActions(entity: User, req?: RequestContext): Promise<ActionMap> {
    const actions = this.getDefaultAction();
    actions.update = await this.canUpdate(entity, req);
    actions.delete = await this.canDelete(entity, req);
    return actions;
  }

  async canUpdate(entity: User, req?: RequestContext): Promise<ActionValue> {
    // Admin được sửa tất cả
    if (req?.userContext?.isAdmin) {
      return { can: true };
    }
    // User thường: chỉ sửa được user do chính công ty mình tạo
    const storeId = req?.storeContext?.storeId;
    if (entity.sourceStoreId && entity.sourceStoreId !== storeId) {
      return {
        can: false,
        reason: "Chỉ công ty sở hữu tài khoản này mới có thể sửa",
      };
    }
    return { can: true };
  }

  async canDelete(entity: User, req?: RequestContext): Promise<ActionValue> {
    if (AuthUtils.isAdmin(entity)) {
      return { can: false, reason: "Không thể xóa tài khoản admin" };
    }
    // Admin được xóa tất cả (trừ admin)
    if (req?.userContext?.isAdmin) {
      return { can: true };
    }
    const storeId = req?.storeContext?.storeId;
    if (entity.sourceStoreId && entity.sourceStoreId !== storeId) {
      return {
        can: false,
        reason: "Chỉ công ty sở hữu tài khoản này mới có thể xóa",
      };
    }
    return { can: true };
  }

  // =====================================================
  // UNIQUE VALIDATION - kèm thông tin công ty khi trùng
  // =====================================================

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
        if (item[s as string] != null)
          baseWhere[s as string] = item[s as string];
      }
      if (item.id) baseWhere.id = Not(item.id);
      const found = await this.repository.findByOptions({
        where: orConditions.map((or) => ({ ...baseWhere, ...or })),
        relations: { sourceStore: true },
      } as any);
      if (found.length > 0) {
        const existingUser = found[0] as any;
        const companyName = existingUser?.sourceStore?.name || "hệ thống";
        const fieldLabels: Record<string, string> = {
          username: "Tên đăng nhập",
          code: "Mã",
          email: "Email",
          phone: "Số điện thoại",
        };
        for (const field of fields) {
          const val = item[field as string];
          const exists = found.find(
            (f) => val != null && (f as any)[field as string] === val,
          );
          if (exists) {
            const label = fieldLabels[field as string] || String(field);
            errors.push({
              field: String(field),
              message: `${label} này đã được đặt cho một tài khoản của ${companyName}, nếu muốn tài khoản đó có thể thao tác trong không gian công ty của bạn vui lòng liên hệ quản trị viên hệ thống`,
            });
          }
        }
      }
    }
    return errors;
  }

  // =====================================================
  // VALIDATE BEFORE CREATE
  // =====================================================

  async validateBeforeCreate(
    data: DeepPartial<User> & CreateUserDto,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    if (data.password) {
      data.password = await AuthUtils.hashPassword(data.password);
    }
    await this.prepareStoreUsersForWrite(data, manager, req, false);
  }

  // =====================================================
  // VALIDATE BEFORE UPDATE
  // =====================================================

  async validateBeforeUpdate(
    id: string,
    data: DeepPartial<User>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    // Kiểm tra quyền sửa trước
    const existing = await this.repository.findById(id, manager, req);
    if (existing) {
      const canUpdate = await this.canUpdate(existing, req);
      if (!canUpdate.can) {
        throw new ForbiddenError(canUpdate.reason || "Không thể sửa");
      }
    }
    await this.prepareStoreUsersForWrite(data, manager, req, true, existing);
  }

  // =====================================================
  // VALIDATE BEFORE DELETE
  // =====================================================

  async validateBeforeDelete(
    data: User,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {
    const canDelete = await this.canDelete(data, req);
    if (!canDelete.can) {
      throw new ForbiddenError(canDelete.reason || "Không thể xóa");
    }
  }

  // =====================================================
  // ASSIGN COMPANY USER — cho phép công ty liên kết cập nhật
  // roleId & employeeId của user trong ngữ cảnh công ty mình
  // mà không cần quyền sửa toàn bộ User
  // =====================================================

  async assignStoreUser(
    userId: string,
    data: { roleId?: string | null; employeeId?: string | null },
    req?: RequestContext,
  ): Promise<void> {
    const storeId = req?.storeContext?.storeId;
    if (!storeId) {
      throw new ValidationError("Thiếu thông tin công ty", "storeId");
    }

    await withTransaction(async (manager) => {
      // Validate references thuộc công ty
      await this.validateStoreUserReferences(
        storeId,
        data.roleId,
        data.employeeId,
        manager,
      );

      // Chỉ cập nhật nếu user đã có StoreUser trong công ty này
      const cu = await manager.findOne(StoreUser, {
        where: { userId, storeId } as any,
      });

      if (!cu) {
        throw new BadRequestError(
          "Tài khoản này không thuộc danh sách người dùng của công ty bạn",
        );
      }

      const employeeSnapshot = data.employeeId
        ? await this.employeeRepository.getSnapshot(data.employeeId, manager)
        : null;

      if (data.roleId !== undefined) cu.roleId = data.roleId ?? null;
      if (data.employeeId !== undefined) {
        cu.employeeId = data.employeeId ?? null;
      }
      await manager.save(StoreUser, cu);
    });
  }

  // =====================================================
  // VALIDATE ROLE & EMPLOYEE THUỘC CÔNG TY
  // =====================================================

  private async validateRoleEmployeeBelongToStore(
    companyUsers: DeepPartial<StoreUser>[],
    manager: EntityManager,
  ): Promise<void> {
    const errors: IError[] = [];
    for (let i = 0; i < companyUsers.length; i++) {
      const cu = companyUsers[i];
      const p = `companyUsers.${i}`;
      if (cu.roleId) {
        const role = await manager.findOne(Role, {
          where: { id: cu.roleId as string } as any,
        });
        if (!role)
          errors.push({
            field: `${p}.roleId`,
            message: "Vai trò không tồn tại",
          });
        else if (role.storeId && cu.storeId && role.storeId !== cu.storeId)
          errors.push({
            field: `${p}.roleId`,
            message: "Vai trò không thuộc công ty đã chọn",
          });
      }
      if (cu.employeeId) {
        const emp = await manager.findOne(Employee, {
          where: { id: cu.employeeId as string } as any,
        });
        if (!emp)
          errors.push({
            field: `${p}.employeeId`,
            message: "Nhân viên không tồn tại",
          });
        else if (emp.storeId !== cu.storeId)
          errors.push({
            field: `${p}.employeeId`,
            message: "Nhân viên không thuộc công ty đã chọn",
          });
      }
    }
    if (errors.length > 0)
      throw new ValidationError("Dữ liệu không hợp lệ", errors);
  }

  private async resolveStoreUserInput(
    data: UserWriteData,
    req?: RequestContext,
  ): Promise<{
    isAdmin: boolean;
    storeId: string | null;
    companyUsers: DeepPartial<StoreUser>[] | undefined;
    roleId: string | null | undefined;
    employeeId: string | null | undefined;
  }> {
    const isAdmin = !!req?.userContext?.isAdmin;
    const storeId = req?.storeContext?.storeId || null;
    const rawData = data as Record<string, any>;
    const companyUsers = rawData.companyUsers as
      | DeepPartial<StoreUser>[]
      | undefined;
    const roleId = rawData.roleId as string | null | undefined;
    const employeeId = rawData.employeeId as string | null | undefined;

    delete rawData.companyUsers;
    delete rawData.roleId;
    delete rawData.employeeId;

    return { isAdmin, storeId, companyUsers, roleId, employeeId };
  }

  private buildStoreUserPayload(
    storeId: string,
    roleId: string | null | undefined,
    employeeId: string | null | undefined,
    includeSnapshot: boolean,
    snapshot?: Awaited<ReturnType<EmployeeRepository["getSnapshot"]>> | null,
  ): StoreUserWritePayload {
    return {
      storeId,
      roleId: roleId ?? null,
      employeeId: employeeId ?? null,
      employeeSnapshot: includeSnapshot ? (snapshot ?? null) : null,
    };
  }

  private async prepareStoreUsersForWrite(
    data: UserWriteData,
    manager: EntityManager,
    req?: RequestContext,
    isUpdate: boolean = false,
    existing?: User | null,
  ): Promise<void> {
    const { isAdmin, storeId, companyUsers, roleId, employeeId } =
      await this.resolveStoreUserInput(data, req);

    if (!storeId) {
      throw new ValidationError("Thiếu thông tin công ty", "storeId");
    }

    const rawData = data as Record<string, any>;
    rawData.sourceStoreId = rawData.sourceStoreId ?? storeId;

    if (isAdmin) {
      if (!companyUsers?.length) return;
      this.assertNoDuplicateStoreUsers(companyUsers);
      await this.validateRoleEmployeeBelongToStore(companyUsers, manager);
      if (isUpdate && existing) {
        await this.syncStoreUsers(existing.id, companyUsers, manager);
      } else {
        rawData.companyUsers = companyUsers;
      }
      return;
    }

    await this.validateStoreUserReferences(
      storeId,
      roleId,
      employeeId,
      manager,
    );

    if (isUpdate) {
      const existingCu = existing?.companyUsers?.find(
        (cu) => cu.storeId === storeId,
      );
      const payload = this.buildStoreUserPayload(
        storeId,
        roleId,
        employeeId,
        false,
      );

      if (existingCu) {
        if (roleId !== undefined) existingCu.roleId = roleId ?? null;
        if (employeeId !== undefined)
          existingCu.employeeId = employeeId ?? null;
        await manager.save(StoreUser, existingCu);
      } else if (roleId !== undefined || employeeId !== undefined) {
        await manager.save(StoreUser, {
          userId: existing?.id,
          ...payload,
        });
      }
      return;
    }

    rawData.companyUsers = [
      this.buildStoreUserPayload(storeId, roleId, employeeId, false),
    ];
  }

  private assertNoDuplicateStoreUsers(
    companyUsers: DeepPartial<StoreUser>[],
  ): void {
    const dup = this.checkDuplicate(companyUsers, ["storeId"], "companyUsers");
    if (dup.length > 0) {
      throw new ValidationError("Dữ liệu không hợp lệ", dup);
    }
  }

  private async validateStoreUserReferences(
    storeId: string,
    roleId: string | null | undefined,
    employeeId: string | null | undefined,
    manager: EntityManager,
  ): Promise<void> {
    if (roleId) {
      const role = await this.roleRepository.findById(roleId, manager);
      if (!role) throw new ValidationError("Vai trò không tồn tại", "roleId");
      if (role.storeId && role.storeId !== storeId) {
        throw new ValidationError(
          "Vai trò không thuộc công ty đang thao tác",
          "roleId",
        );
      }
    }

    if (employeeId) {
      const employee = await this.employeeRepository.findById(
        employeeId,
        manager,
      );
      if (!employee)
        throw new ValidationError("Nhân viên không tồn tại", "employeeId");
      if (employee.storeId !== storeId) {
        throw new ValidationError(
          "Nhân viên không thuộc công ty đang thao tác",
          "employeeId",
        );
      }
    }
  }

  // =====================================================
  // SYNC COMPANY USERS
  // =====================================================

  private async syncStoreUsers(
    userId: string,
    incoming: DeepPartial<StoreUser>[],
    manager: EntityManager,
  ): Promise<void> {
    const existing = await manager.find(StoreUser, {
      where: { userId } as any,
    });
    const existingById = new Map(existing.map((item) => [item.id, item]));
    const incomingIds = new Set(
      incoming.map((item) => item.id).filter((id): id is string => !!id),
    );
    const invalidIds = Array.from(incomingIds).filter(
      (cuId) => !existingById.has(cuId),
    );
    if (invalidIds.length > 0)
      throw new ValidationError("Dữ liệu không hợp lệ", [
        {
          field: "companyUsers",
          message: "Có companyUser không thuộc user này",
        },
      ]);
    const toDeleteIds = existing
      .filter((item) => !incomingIds.has(item.id))
      .map((item) => item.id);
    if (toDeleteIds.length > 0)
      await manager.softDelete(StoreUser, toDeleteIds);
    const employeeIds = Array.from(
      new Set(
        incoming
          .map((item) => item.employeeId)
          .filter((id): id is string => !!id),
      ),
    );
    const snapshots = new Map<
      string,
      Awaited<ReturnType<EmployeeRepository["getSnapshot"]>>
    >();
    for (const employeeId of employeeIds) {
      snapshots.set(
        employeeId,
        await this.employeeRepository.getSnapshot(employeeId, manager),
      );
    }
    const toSave = incoming.map((item) => ({
      id: item.id,
      storeId: item.storeId,
      userId,
      roleId: item.roleId || null,
      employeeId: item.employeeId || null,
      employeeSnapshot: item.employeeId
        ? (snapshots.get(item.employeeId) ?? null)
        : null,
    }));
    if (toSave.length > 0) await manager.save(StoreUser, toSave as any);
  }
}
