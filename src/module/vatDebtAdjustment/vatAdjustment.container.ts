import { createSimpleModule } from "../_shared/simple.bind";
import { VatAdjustmentRepository } from "./vatAdjustment.repository";
import { VatAdjustmentService } from "./vatAdjustment.service";
import { VatAdjustmentController } from "./vatAdjustment.controller";
import { VatAdjustmentRouter } from "./vatAdjustment.route";
import { VAT_ADJUSTMENT_TYPES } from "./vatAdjustment.types";

export const vatAdjustmentModule = createSimpleModule(
  VAT_ADJUSTMENT_TYPES,
  VatAdjustmentRepository,
  VatAdjustmentService,
  VatAdjustmentController,
  VatAdjustmentRouter,
);
