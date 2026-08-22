import { BaseRepository } from "@/shared/base/BaseRepository";
import {
  Warehouse,
  WarehouseSnapshot,
} from "@/database/models/company/Warehouse";
import { WarehouseSelectFull, WarehouseRelations } from "./warehouse.select";
import { injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";

@injectable()
export class WarehouseRepository extends BaseRepository<Warehouse> {
  protected entityClass = Warehouse;
  protected selectedFields = WarehouseSelectFull;
  protected relations = WarehouseRelations;

  async attachInfo<
    T extends {
      warehouseId?: string | null;
      warehouseSnapshot?: DeepPartial<WarehouseSnapshot> | null;
    },
  >(data: T, manager?: EntityManager): Promise<void> {
    if (
      data.warehouseId &&
      (!data.warehouseSnapshot ||
        data.warehouseSnapshot.id !== data.warehouseId)
    )
      data.warehouseSnapshot = await this.getSnapshot(
        data.warehouseId,
        manager,
      );
  }

  async getSnapshot(
    warehouseId: string,
    manager?: EntityManager,
  ): Promise<WarehouseSnapshot | null> {
    const w = await this.findById(warehouseId, manager);
    if (!w) return null;
    return { id: w.id, name: w.name, code: w.code };
  }
}
