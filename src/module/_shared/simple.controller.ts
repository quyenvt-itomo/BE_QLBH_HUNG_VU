import { BaseController } from "@/shared/base/BaseController";
import { SimpleService } from "./simple.service";
import { BaseEntity } from "@/shared/base/BaseEntity";

export class SimpleController<T extends BaseEntity> extends BaseController<T> {
  protected service: SimpleService<T>;
  constructor(service: SimpleService<T>) {
    super();
    this.service = service;
  }
}
