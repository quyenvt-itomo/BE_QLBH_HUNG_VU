import { ContainerModule } from "inversify";
import { INVOICE_TYPES } from "./invoice.types";
import { InvoiceController } from "./invoice.controller";
import { InvoiceService } from "./invoice.service";
import { InvoiceRepository } from "./invoice.repository";
import { InvoiceRouter } from "./invoice.route";

export const invoiceModule = new ContainerModule((bind) => {
  bind<InvoiceController>(INVOICE_TYPES.InvoiceController).to(
    InvoiceController,
  );
  bind<InvoiceService>(INVOICE_TYPES.InvoiceService).to(InvoiceService);
  bind<InvoiceRepository>(INVOICE_TYPES.InvoiceRepository).to(
    InvoiceRepository,
  );
  bind<InvoiceRouter>(INVOICE_TYPES.InvoiceRouter).to(InvoiceRouter);
});
