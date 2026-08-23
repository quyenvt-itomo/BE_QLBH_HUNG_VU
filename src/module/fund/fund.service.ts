import { Fund } from "@/database/models/Fund";
import { SimpleService } from "../_shared/simple.service";
import { FundRepository } from "./fund.repository";
export class FundService extends SimpleService<Fund> { constructor(repository: FundRepository) { super(repository, "store", "fund"); } }
