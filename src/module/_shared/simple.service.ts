import { DeepPartial, EntityManager } from "typeorm";
import { BaseService } from "@/shared/base/BaseService";
import { RequestContext } from "@/shared/types/interfaces";
import { generateCode } from "@/shared/utils/code.utils";
import { SimpleRepository } from "./simple.repository";

export class SimpleService<T extends import("@/shared/base/BaseEntity").BaseEntity> extends BaseService<T> {
  protected repository: SimpleRepository<T>;
  constructor(repository: SimpleRepository<T>, private readonly scope: "global" | "store" | "mixed", private readonly codeType?: string) {
    super();
    this.repository = repository;
  }
  async validateBeforeCreate(data: DeepPartial<T>, _manager: EntityManager, req?: RequestContext): Promise<void> {
    const payload = data as any;
    const storeId = payload.storeId || req?.storeContext?.storeId;
    if (this.scope === "store" && !storeId) throw new Error("store.required");
    if (this.scope === "store") payload.storeId = storeId;
    if (this.codeType && !payload.code) payload.code = await generateCode(this.codeType, storeId);
  }
  async validateBeforeUpdate(_id: string, data: DeepPartial<T>, _manager: EntityManager, req?: RequestContext): Promise<void> {
    if (this.scope !== "store") return;
    const storeId = req?.storeContext?.storeId;
    if (storeId) (data as any).storeId = storeId;
  }
}
