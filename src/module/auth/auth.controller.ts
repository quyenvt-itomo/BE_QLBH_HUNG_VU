import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { asyncHandler } from "@/shared/utils/controller.utils";
import { AuthService } from "./auth.service";
import { AUTH_TYPES } from "./auth.types";
import { RequestWithUser } from "@/shared/types/interfaces";

@injectable()
export class AuthController {
  constructor(
    @inject(AUTH_TYPES.AuthService) private readonly service: AuthService,
  ) {}

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.login(req.body, res);
    const { password: _password, ...user } = result.user as any;
    res.json({
      success: true,
      statusCode: 200,
      message: "auth.login.success",
      data: user,
    });
  });
  logout = asyncHandler(async (req: RequestWithUser, res: Response) => {
    await this.service.logout(req.user!.userId);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({
      success: true,
      statusCode: 200,
      message: "auth.logout.success",
      data: true,
    });
  });
  current = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const data = await this.service.getCurrent(
      req.user!.userId,
      req.storeContext?.storeId,
    );
    const { password: _password, ...user } = data;
    res.json({ success: true, statusCode: 200, message: "OK", data: user });
  });
  update = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const data = await this.service.update(req.user!.userId, req.body);
    res.json({ success: true, statusCode: 200, message: "updated", data });
  });
  changePassword = asyncHandler(async (req: RequestWithUser, res: Response) => {
    await this.service.changePassword(
      req.user!.userId,
      req.body.oldPassword,
      req.body.newPassword,
    );
    res.json({
      success: true,
      statusCode: 200,
      message: "updated",
      data: true,
    });
  });
}
