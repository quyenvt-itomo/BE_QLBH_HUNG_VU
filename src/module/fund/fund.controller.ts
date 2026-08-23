import { Fund } from "@/database/models/Fund";
import { SimpleController } from "../_shared/simple.controller";
import { FundService } from "./fund.service";
export class FundController extends SimpleController<Fund> { constructor(service: FundService) { super(service); } }
