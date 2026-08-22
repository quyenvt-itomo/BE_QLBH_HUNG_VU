import { ContainerModule } from "inversify";
import { LOGIN_APPROVAL_TYPES } from "./loginApproval.types";
import { LoginApprovalController } from "./loginApproval.controller";
import { LoginApprovalService } from "./loginApproval.service";
import { LoginApprovalRepository } from "./loginApproval.repository";
import { LoginApprovalRouter } from "./loginApproval.route";

export const loginApprovalModule = new ContainerModule((bind) => {
  bind<LoginApprovalController>(
    LOGIN_APPROVAL_TYPES.LoginApprovalController,
  ).to(LoginApprovalController);
  bind<LoginApprovalService>(LOGIN_APPROVAL_TYPES.LoginApprovalService).to(
    LoginApprovalService,
  );
  bind<LoginApprovalRepository>(
    LOGIN_APPROVAL_TYPES.LoginApprovalRepository,
  ).to(LoginApprovalRepository);
  bind<LoginApprovalRouter>(LOGIN_APPROVAL_TYPES.LoginApprovalRouter).to(
    LoginApprovalRouter,
  );
});
