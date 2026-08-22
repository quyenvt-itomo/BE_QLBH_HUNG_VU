import { ContainerModule } from "inversify";
import { FUND_TRANSFER_TYPES } from "./fundTransfer.types";
import { FundTransferController } from "./fundTransfer.controller";
import { FundTransferService } from "./fundTransfer.service";
import { FundTransferRepository } from "./fundTransfer.repository";
import { FundTransferRouter } from "./fundTransfer.route";

export const fundTransferModule = new ContainerModule((bind) => {
  bind<FundTransferController>(FUND_TRANSFER_TYPES.FundTransferController).to(
    FundTransferController,
  );
  bind<FundTransferService>(FUND_TRANSFER_TYPES.FundTransferService).to(
    FundTransferService,
  );
  bind<FundTransferRepository>(FUND_TRANSFER_TYPES.FundTransferRepository).to(
    FundTransferRepository,
  );
  bind<FundTransferRouter>(FUND_TRANSFER_TYPES.FundTransferRouter).to(
    FundTransferRouter,
  );
});
