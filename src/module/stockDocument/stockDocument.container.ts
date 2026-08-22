import { ContainerModule } from "inversify";
import { STOCK_DOCUMENT_TYPES } from "./stockDocument.types";
import { StockDocumentController } from "./stockDocument.controller";
import { StockDocumentService } from "./stockDocument.service";
import { StockDocumentRepository } from "./stockDocument.repository";
import { StockDocumentRouter } from "./stockDocument.route";

export const stockDocumentModule = new ContainerModule((bind) => {
  bind<StockDocumentController>(
    STOCK_DOCUMENT_TYPES.StockDocumentController,
  ).to(StockDocumentController);
  bind<StockDocumentService>(STOCK_DOCUMENT_TYPES.StockDocumentService).to(
    StockDocumentService,
  );
  bind<StockDocumentRepository>(
    STOCK_DOCUMENT_TYPES.StockDocumentRepository,
  ).to(StockDocumentRepository);
  bind<StockDocumentRouter>(STOCK_DOCUMENT_TYPES.StockDocumentRouter).to(
    StockDocumentRouter,
  );
});
