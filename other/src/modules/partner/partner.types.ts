import { IAddress, IRepresentative } from "@/shared/base/BaseValidator";

export const PARTNER_TYPES = {
  PartnerService: Symbol.for("PartnerService"),
  PartnerController: Symbol.for("PartnerController"),
  PartnerRepository: Symbol.for("PartnerRepository"),
  PartnerRouter: Symbol.for("PartnerRouter"),
};

export interface PartnerSnapshot {
  id: string;
  name: string;
  code: string;
  type: string;
  representative?: IRepresentative | null;
  email?: string | null;
  phone?: string | null;
  addresses?: IAddress[];
}
