import { ContainerModule } from "inversify";
import { FundTransferRepository } from "./fundTransfer.repository";
import { FundTransferService } from "./fundTransfer.service";
import { FundTransferController } from "./fundTransfer.controller";
import { FundTransferRouter } from "./fundTransfer.route";
import { FUND_TRANSFER_TYPES } from "./fundTransfer.types";

export const fundTransferModule = new ContainerModule((bind) => { bind(FUND_TRANSFER_TYPES.Repository).to(FundTransferRepository).inSingletonScope(); bind(FUND_TRANSFER_TYPES.Service).to(FundTransferService).inSingletonScope(); bind(FUND_TRANSFER_TYPES.Controller).to(FundTransferController).inSingletonScope(); bind(FUND_TRANSFER_TYPES.Router).to(FundTransferRouter).inSingletonScope(); });
