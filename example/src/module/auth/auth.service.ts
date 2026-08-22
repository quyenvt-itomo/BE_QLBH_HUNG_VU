import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { LoginDto } from "./auth.validator";
import { AuthUtils } from "@/shared/utils/auth.utils";
import { ApiResponse, AuthTokens } from "@/shared/types/interfaces";
import {
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "@/shared/types/errors";
import { Response } from "express";
import { AuthRepository } from "./auth.repository";
import { User } from "@/database/models/User";
import { AUTH_TYPES } from "./auth.types";
import {
  createPermissions,
  Module,
  MODULES,
  PermissionStructure,
} from "@/shared/middleware/permission.middleware";
import { CompanyType, Organization } from "@/database/models/Organization";
import { ORGANIZATION_TYPES } from "../organization/organization.types";
import { OrganizationRepository } from "../organization/organization.repository";
import { In } from "typeorm";
import { Role } from "@/database/models/company/Role";
import { Employee } from "@/database/models/company/Employee";
import { ATTRIBUTE_TYPES } from "../attribute/attribute.types";
import { AttributeRepository } from "../attribute/attribute.repository";
import { CompanyUser } from "@/database/models/CompanyUser";
import {
  LoginApproval,
  LoginApprovalStatusEnum,
  DeviceInfo,
} from "@/database/models/LoginApproval";
import DatabaseConfig from "@/config/database";
import { FileHelper } from "@/shared/utils/file.helper";

@injectable()
export class AuthService extends BaseService<User> {
  protected repository: AuthRepository;

  constructor(
    @inject(AUTH_TYPES.AuthRepository)
    authRepository: AuthRepository,
    @inject(ORGANIZATION_TYPES.OrganizationRepository)
    private organizationRepository: OrganizationRepository,
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    private attributeRepository: AttributeRepository,
  ) {
    super();
    this.repository = authRepository;
  }

  async login(
    loginData: LoginDto,
    res: Response,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    // Find user by email
    const user = await this.repository.findByUsername(loginData.username);
    if (!user) {
      throw new UnauthorizedError("Không tìm thấy tài khoản", "username");
    }

    // Check password
    const isPasswordValid = await AuthUtils.comparePassword(
      loginData.password,
      user.password as string,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError("Mật khẩu không chính xác", "password");
    }

    // Device approval check
    if (loginData.deviceId && !AuthUtils.isAdmin(user)) {
      const approvalRepo = DatabaseConfig.getRepository(LoginApproval);

      const existingApproval = await approvalRepo.findOne({
        where: {
          userId: user.id,
          deviceId: loginData.deviceId,
          status: LoginApprovalStatusEnum.APPROVED,
        },
      });

      const isApproved =
        existingApproval && new Date() <= existingApproval.expiresAt;

      if (!isApproved) {
        // Create pending approvals for each company this user belongs to
        const companyUserRepo = DatabaseConfig.getRepository(CompanyUser);
        const companyUsers = await companyUserRepo.find({
          where: { userId: user.id },
        });

        if (companyUsers.length > 0) {
          const now = new Date();
          const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

          // Delete old PENDING approvals for same user+device to avoid duplicates
          await approvalRepo
            .createQueryBuilder()
            .delete()
            .where("userId = :userId", { userId: user.id })
            .andWhere("deviceId = :deviceId", {
              deviceId: loginData.deviceId,
            })
            .andWhere("status = :status", {
              status: LoginApprovalStatusEnum.PENDING,
            })
            .execute();

          const pendingApprovals = companyUsers.map((cu) =>
            approvalRepo.create({
              userId: user.id,
              companyId: cu.companyId,
              deviceId: loginData.deviceId as string,
              deviceInfo: (loginData.deviceInfo as DeviceInfo) ?? null,
              status: LoginApprovalStatusEnum.PENDING,
              expiresAt,
            }),
          );

          await approvalRepo.save(pendingApprovals);
        }

        throw new ForbiddenError(
          "Thiết bị chưa được xác thực. Vui lòng chờ quản trị viên phê duyệt đăng nhập.",
        );
      }
    }

    // Generate tokens
    const tokens = AuthUtils.generateTokens({
      userId: user.id,
      username: user.username!,
    });

    AuthUtils.setTokenCookies(res, tokens);

    return { user, tokens };
  }

  async logout(userId: string): Promise<void> {
    await this.repository.updateRefreshToken(userId, null);
  }

  async getCurrent(userId: string, companyId?: string) {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new NotFoundError("Người dùng không tồn tại", "userId");
    }
    let permissions: PermissionStructure = {};
    let role: Role | undefined = undefined;
    let employee: Employee | undefined = undefined;
    let currentCompany: Organization | undefined;
    let allCompanys = await this.organizationRepository.findByOptions({
      where: {
        type: In(CompanyType),
      },
    });
    let importExcel: Module[] = [];
    let exportExcel: Module[] = [];

    if (AuthUtils.isAdmin(user)) {
      permissions = createPermissions();
      importExcel = [...MODULES];
      exportExcel = [...MODULES];
    } else {
      // Lọc đi những công ty mà user không có quyền truy cập
      allCompanys = allCompanys.filter((company) =>
        user.companyUsers?.some((cu) => cu.companyId === company.id),
      );
    }

    if (!allCompanys.length) {
      throw new ForbiddenError("Tài khoản không có quyền truy cập công ty nào");
    }

    const finalCompanyId = companyId || allCompanys[0]?.id;

    const companyUser = user.companyUsers?.find(
      (cu) => cu.companyId === finalCompanyId,
    );

    currentCompany = allCompanys.find((c) => c.id === finalCompanyId);
    role = companyUser?.role;
    employee = companyUser?.employee;

    if (!currentCompany) {
      throw new ForbiddenError("Tài khoản không có quyền truy cập công ty này");
    }

    if (role) {
      permissions = role.permissions;
      importExcel = role.importExcel || [];
      exportExcel = role.exportExcel || [];
    }

    const { defaultWeightUnit, defaultMeshUnit, defaultAreaUnit } =
      await this.attributeRepository.getDefaultProductUnit();

    return {
      ...user,
      permissions,
      allCompanys,
      currentCompany,
      role,
      employee,
      defaultWeightUnit,
      defaultMeshUnit,
      defaultAreaUnit,
      isAdmin: AuthUtils.isAdmin(user),
      importExcel,
      exportExcel,
    };
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new NotFoundError("Người dùng không tồn tại", "userId");
    }
    const isOldPasswordValid = await AuthUtils.comparePassword(
      oldPassword,
      user.password as string,
    );

    if (!isOldPasswordValid) {
      throw new BadRequestError("Mật khẩu cũ không chính xác", "oldPassword");
    }
    const newHashedPassword = await AuthUtils.hashPassword(newPassword);
    await this.repository.getRepository().update(userId, {
      password: newHashedPassword,
    } as any);
  }
}
