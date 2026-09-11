import { ContainerModule } from "inversify";
import { AnalysisController } from "./analysis.controller";
import { AnalysisRepository } from "./analysis.repository";
import { AnalysisRouter } from "./analysis.route";
import { AnalysisService } from "./analysis.service";
import { ANALYSIS_TYPES } from "./analysis.types";

export const analysisModule = new ContainerModule((bind) => {
  bind(ANALYSIS_TYPES.Repository).to(AnalysisRepository).inSingletonScope();
  bind(ANALYSIS_TYPES.Service).to(AnalysisService).inSingletonScope();
  bind(ANALYSIS_TYPES.Controller).to(AnalysisController).inSingletonScope();
  bind(ANALYSIS_TYPES.Router).to(AnalysisRouter).inSingletonScope();
});
