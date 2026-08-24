import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { OtpTokenController } from "./otpToken.controller";
import { OTP_TOKEN_TYPES } from "./otpToken.types";
@injectable()
export class OtpTokenRouter { private router = Router(); constructor(@inject(OTP_TOKEN_TYPES.Controller) controller: OtpTokenController) { this.router.get("/", permissionMiddleware("report", "read"), controller.getAllWithPagination); this.router.get("/:id", permissionMiddleware("report", "read"), controller.getById); } getRouter() { return this.router; } }
