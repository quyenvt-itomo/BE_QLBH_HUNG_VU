import { injectable, inject } from "inversify";
import { StoreService } from "./store.service";
import { BaseController } from "@/shared/base/BaseController";
import { STORE_TYPES } from "./store.types";
import { Store } from "@/database/models/Store";

@injectable()
export class StoreController extends BaseController<Store> {
  protected service: StoreService;

  constructor(@inject(STORE_TYPES.StoreService) service: StoreService) {
    super();
    this.service = service;
  }
}
