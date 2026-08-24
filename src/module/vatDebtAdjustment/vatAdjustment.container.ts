import { ContainerModule } from "inversify";
import { VatAdjustmentRepository } from "./vatAdjustment.repository";
import { VatAdjustmentService } from "./vatAdjustment.service";
import { VatAdjustmentController } from "./vatAdjustment.controller";
import { VatAdjustmentRouter } from "./vatAdjustment.route";
import { VAT_ADJUSTMENT_TYPES } from "./vatAdjustment.types";

export const vatAdjustmentModule = new ContainerModule((bind) => { bind(VAT_ADJUSTMENT_TYPES.Repository).to(VatAdjustmentRepository).inSingletonScope(); bind(VAT_ADJUSTMENT_TYPES.Service).to(VatAdjustmentService).inSingletonScope(); bind(VAT_ADJUSTMENT_TYPES.Controller).to(VatAdjustmentController).inSingletonScope(); bind(VAT_ADJUSTMENT_TYPES.Router).to(VatAdjustmentRouter).inSingletonScope(); });
