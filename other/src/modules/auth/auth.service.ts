import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { LoginDto, VerifyOtpDto } from "./auth.validator";
import { AuthUtils } from "@/shared/utils/auth.utils";
import { AuthTokens } from "@/shared/types/interfaces";
import {
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} from "@/shared/types/errors";
import { Response } from "express";
import { AuthRepository } from "./auth.repository";
import { AuthRelations, AuthSelectFull } from "./auth.select";
import { User } from "@/database/models/User";
import { ErrorsMessages } from "@/shared/constants/errors";
import dayjs from "dayjs";
import { VerifyOtpRepository } from "../verifyOtp/verifyOtp.repository";
import { AUTH_TYPES } from "./auth.types";
import { VERIFY_OTP_TYPES } from "../verifyOtp";
import { Store } from "@/database/models/Store";
import { STORE_TYPES, StoreRepository } from "../store";
import {
  createPermissionsByContext,
  PermissionStructure,
} from "@/shared/middleware/permission.middleware";
import { FileHelper } from "@/shared/utils/file.helper";
import { Fund } from "@/database/models/Fund";
import { FUND_TYPES, FundRepository } from "../fund";
import { In } from "typeorm";
import { Role } from "@/database/models/store/Role";
import { SHIFT_TYPES } from "../shift/shift.types";
import { ShiftRepository } from "../shift/shift.repository";
import { Shift } from "@/database/models/store/Shift";
import { ShiftService } from "../shift/shift.service";
import { ApiResponse } from "@/shared/types/interfaces";

@injectable()
export class AuthService extends BaseService<User> {
  protected repository: AuthRepository;
  protected relations = AuthRelations;
  protected selectedFields = AuthSelectFull;
  constructor(
    @inject(AUTH_TYPES.AuthRepository)
    authRepository: AuthRepository,
    @inject(STORE_TYPES.StoreRepository)
    private storeRepository: StoreRepository,
    @inject(FUND_TYPES.FundRepository)
    private fundRepository: FundRepository,
    @inject(VERIFY_OTP_TYPES.VerifyOtpRepository)
    private verifyOtpRepository: VerifyOtpRepository,
    @inject(SHIFT_TYPES.ShiftRepository)
    private shiftRepository: ShiftRepository,
    @inject(SHIFT_TYPES.ShiftService)
    private shiftService: ShiftService,
  ) {
    super();
    this.repository = authRepository;
  }

  async login(
    loginData: LoginDto,
    res: Response,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    // Find user by email
    const user = await this.repository.findByIdentifier(loginData.identifier);
    if (!user) {
      throw new UnauthorizedError("Invalid credentials", {
        field: "identifier",
        code: ErrorsMessages.not_found,
      });
    }

    // Check password
    const isPasswordValid = await AuthUtils.comparePassword(
      loginData.password,
      user.password as string,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials", {
        field: "password",
        code: ErrorsMessages.incorrect,
      });
    }

    // Generate tokens
    const tokens = AuthUtils.generateTokens({
      userId: user.id,
      username: user.username,
    });

    AuthUtils.setTokenCookies(res, tokens);

    return { user, tokens };
  }

  async logout(userId: string): Promise<void> {
    await this.repository.updateRefreshToken(userId, null);
  }

  async getCurrent(
    userId: string,
    storeCode?: string,
  ): Promise<{
    user: User;
    currentStore: Store | null;
    permissions: PermissionStructure;
    systemPermissions: PermissionStructure;
    stores: Store[];
    defaultFund: Fund | null;
    role: Role | null;
    currentShift?: Shift | null;
  }> {
    const user = await this.repository.findOne({
      where: { id: userId },
      relations: { systemRole: true, storeUsers: { store: true, role: true } },
    });

    if (!user) {
      throw new NotFoundError("User not found", {
        field: "user",
        code: ErrorsMessages.not_found,
      });
    }

    const allStores = await this.storeRepository.findByOptions({
      order: { createdAt: "ASC" },
    });
    const userStores = (user.storeUsers || []).map((su) => su.store);

    let currentStore: Store | null = null;
    let role: Role | null = null;
    let permissions: PermissionStructure = {};
    let systemPermissions = user.systemRole?.permissions || {};
    let stores = await FileHelper.attachFilesToEntities(userStores);
    const defaultFund = await this.fundRepository.findOne({
      where: {
        isDefault: true,
        store: {
          code: storeCode ? storeCode : In(userStores.map((s) => s.code)),
        },
      },
    });

    // Xác định currentStore nếu có storeCode
    if (storeCode) {
      currentStore = await this.storeRepository.findOne({
        where: { code: storeCode },
      });

      if (!currentStore) {
        throw new UnauthorizedError("Store not found", {
          field: "store",
          code: ErrorsMessages.not_found,
        });
      }
    }

    const currentShift = await this.shiftRepository.getUserCurrentShift(
      userId,
      currentStore?.id,
    );

    // 1️⃣ ADMIN
    if (user.username === "admin") {
      permissions = createPermissionsByContext("store");
      systemPermissions = createPermissionsByContext("system");
      stores = await FileHelper.attachFilesToEntities(allStores);

      return {
        user,
        currentStore,
        permissions,
        systemPermissions,
        stores,
        defaultFund,
        role,
        currentShift,
      };
    }

    // 2️⃣ Normal User
    if (currentStore) {
      const storeUser = user.storeUsers?.find(
        (su) => su.storeId === currentStore?.id,
      );
      if (!storeUser) {
        throw new UnauthorizedError("You do not have access to this store", {
          field: "store",
          code: ErrorsMessages.invalid_credentials,
        });
      }
      permissions = storeUser.role?.permissions || {};
      role = storeUser.role || null;
    } else if (!user.systemRoleId) {
      // Nếu user không có systemRoleId và không chọn store thì lấy store đầu tiên
      currentStore = userStores[0] || null;
      const storeUser = user.storeUsers?.find(
        (su) => su.storeId === currentStore?.id,
      );
      permissions = storeUser?.role?.permissions || {};
    }

    return {
      user,
      currentStore,
      permissions,
      systemPermissions,
      stores,
      defaultFund,
      role,
      currentShift,
    };
  }

  async updateInfo(userId: string, data: Partial<User>): Promise<void> {
    await this.repository.update(userId, data);
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    const isOldPasswordValid = await AuthUtils.comparePassword(
      oldPassword,
      user.password as string,
    );
    if (!isOldPasswordValid) {
      throw new UnauthorizedError("Old password is incorrect");
    }
    const newHashedPassword = await AuthUtils.hashPassword(newPassword);
    await this.repository.getRepository().update(userId, {
      password: newHashedPassword,
    } as any);
  }

  async verifyOtp(data: VerifyOtpDto, otpId: string): Promise<void> {
    const { otp } = data;
    const verifyOtp = await this.verifyOtpRepository.findById(otpId);
    if (!verifyOtp) {
      throw new BadRequestError("Invalid or expired OTP", [
        {
          field: "otp",
          code: ErrorsMessages.session_expired,
        },
      ]);
    }

    if (verifyOtp.isUsed) {
      throw new BadRequestError("OTP has already been used", [
        {
          field: "otp",
          code: ErrorsMessages.already_used,
        },
      ]);
    }

    if (verifyOtp.otp !== otp) {
      throw new BadRequestError("Incorrect OTP", [
        {
          field: "otp",
          code: ErrorsMessages.incorrect,
        },
      ]);
    }

    const isExpired = verifyOtp.expiresAt
      ? dayjs().isAfter(dayjs(verifyOtp.expiresAt))
      : false;
    if (isExpired) {
      throw new UnauthorizedError("Invalid or expired OTP", [
        {
          field: "otp",
          code: ErrorsMessages.session_expired,
        },
      ]);
    }

    await this.verifyOtpRepository.update(verifyOtp.id, {
      isUsed: true,
    });
  }

  async getMyShifts(
    userId: string,
    query: any,
    req: Request,
  ): Promise<ApiResponse<Shift[]>> {
    const options = {
      ...query,
      userIds: [userId],
    };

    return await this.shiftService.findAllWithPagination(
      options,
      undefined,
      req as any,
    );
  }
}
