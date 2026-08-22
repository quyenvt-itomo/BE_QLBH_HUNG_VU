import { injectable, inject } from "inversify";
import { UserService } from "./user.service";
import { BaseController } from "@/shared/base/BaseController";
import { USER_TYPES } from "./user.types";
import { User } from "@/database/models/User";
import { Request, Response, NextFunction } from "express";
import { AssignCompanyUserDto } from "./user.validator";

@injectable()
export class UserController extends BaseController<User> {
  protected service: UserService;
  constructor(@inject(USER_TYPES.UserService) service: UserService) {
    super();
    this.service = service;
  }

  /**
   * Cho phép công ty liên kết cập nhật roleId & employeeId
   * của một user trong ngữ cảnh công ty mình.
   */
  assignCompanyUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: AssignCompanyUserDto = req.body;
      await this.service.assignCompanyUser(id, dto, req as any);
      res.json({ success: true, message: "Cập nhật thành công" });
    } catch (error) {
      next(error);
    }
  };
}
