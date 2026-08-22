export type PartnerModule = "customer" | "supplier";

export interface PartnerContext {
  module: PartnerModule;
  type: PartnerModule;
}
