import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { PaymentTermRepository } from "./paymentTerm.repository";
import { PAYMENT_TERM_TYPES } from "./paymentTerm.types";
import { PaymentTerm } from "@/database/models/company/PaymentTerm";

@injectable()
export class PaymentTermService extends BaseService<PaymentTerm> {
  protected repository: PaymentTermRepository;
  protected uniqueFields: (keyof PaymentTerm)[] = ["code"];
  protected uniqueScope?: (keyof PaymentTerm)[] = ["companyId"];
  protected searchableFields = ["code", "name"];

  constructor(
    @inject(PAYMENT_TERM_TYPES.PaymentTermRepository)
    repository: PaymentTermRepository,
  ) {
    super();
    this.repository = repository;
  }
}
