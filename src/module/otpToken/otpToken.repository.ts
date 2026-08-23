import { OtpToken } from "@/database/models/OtpToken";
import { SimpleRepository } from "../_shared/simple.repository";
export class OtpTokenRepository extends SimpleRepository<OtpToken> { constructor() { super(OtpToken); } }
