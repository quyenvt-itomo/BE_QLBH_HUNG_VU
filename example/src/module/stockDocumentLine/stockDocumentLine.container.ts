import { ContainerModule } from "inversify";
import { STOCK_DOCUMENT_LINE_TYPES } from "./stockDocumentLine.types";
import { StockDocumentLineController } from "./stockDocumentLine.controller";
import { StockDocumentLineService } from "./stockDocumentLine.service";
import { StockDocumentLineRepository } from "./stockDocumentLine.repository";
import { StockDocumentLineRouter } from "./stockDocumentLine.route";

export const stockDocumentLineModule = new ContainerModule((bind) => {
  bind<StockDocumentLineController>(
    STOCK_DOCUMENT_LINE_TYPES.StockDocumentLineController,
  ).to(StockDocumentLineController);
  bind<StockDocumentLineService>(
    STOCK_DOCUMENT_LINE_TYPES.StockDocumentLineService,
  ).to(StockDocumentLineService);
  bind<StockDocumentLineRepository>(
    STOCK_DOCUMENT_LINE_TYPES.StockDocumentLineRepository,
  ).to(StockDocumentLineRepository);
  bind<StockDocumentLineRouter>(
    STOCK_DOCUMENT_LINE_TYPES.StockDocumentLineRouter,
  ).to(StockDocumentLineRouter);
});
