import { ContainerModule } from "inversify";
import { FundTransferService } from "./fundTransfer.service";
import { FundTransferController } from "./fundTransfer.controller";
import { FundTransferRepository } from "./fundTransfer.repository";
import { FundTransferRouter } from "./fundTransfer.route";
import { FUND_TRANSFER_TYPES } from "./fundTransfer.types";

const fundTransferModule = new ContainerModule((bind) => {
  bind<FundTransferService>(FUND_TRANSFER_TYPES.FundTransferService).to(
    FundTransferService,
  );
  bind<FundTransferController>(FUND_TRANSFER_TYPES.FundTransferController).to(
    FundTransferController,
  );
  bind<FundTransferRepository>(FUND_TRANSFER_TYPES.FundTransferRepository).to(
    FundTransferRepository,
  );
  bind<FundTransferRouter>(FUND_TRANSFER_TYPES.FundTransferRouter).to(
    FundTransferRouter,
  );
});

export { fundTransferModule };
