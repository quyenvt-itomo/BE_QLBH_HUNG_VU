import { createSimpleModule } from "../_shared/simple.bind";
import { FundTransferRepository } from "./fundTransfer.repository";
import { FundTransferService } from "./fundTransfer.service";
import { FundTransferController } from "./fundTransfer.controller";
import { FundTransferRouter } from "./fundTransfer.route";
import { FUND_TRANSFER_TYPES } from "./fundTransfer.types";

export const fundTransferModule = createSimpleModule(
  FUND_TRANSFER_TYPES,
  FundTransferRepository,
  FundTransferService,
  FundTransferController,
  FundTransferRouter,
);
