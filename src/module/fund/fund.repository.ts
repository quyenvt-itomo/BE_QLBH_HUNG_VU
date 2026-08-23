import { Fund } from "@/database/models/Fund";
import { SimpleRepository } from "../_shared/simple.repository";
export class FundRepository extends SimpleRepository<Fund> { constructor() { super(Fund); } }
