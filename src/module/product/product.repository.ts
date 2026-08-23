import { injectable } from "inversify";
import { DeepPartial, EntityManager } from "typeorm";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { Product, ProductSnapshot } from "@/database/models/Product";

@injectable()
export class ProductRepository extends BaseRepository<Product> {
  protected entityClass = Product;
  async getSnapshot(productId: string, manager?: EntityManager): Promise<ProductSnapshot | null> {
    const product = await this.getRepository(manager).findOne({ where: { id: productId } as any });
    return product ? { id: product.id, code: product.code, name: product.name } : null;
  }
  async attachInfo<T extends { productId?: string | null; productSnapshot?: DeepPartial<ProductSnapshot> | null }>(data: T, manager?: EntityManager): Promise<void> {
    if (data.productId) data.productSnapshot = await this.getSnapshot(data.productId, manager);
  }
  async attachUnitConversion<T extends { productId?: string | null; unitId?: string | null; conversionRateAtTime?: number | null }>(data: T, manager?: EntityManager): Promise<void> {
    if (!data.productId || !data.unitId) { data.conversionRateAtTime = 1; return; }
    const product = await this.getRepository(manager).findOne({ where: { id: data.productId } as any, relations: { extraUnits: true } });
    const unit = product?.extraUnits?.find((item) => item.unitId === data.unitId);
    data.conversionRateAtTime = product?.baseUnitId === data.unitId ? 1 : (Number(unit?.conversionRate) || 1);
  }
  async getUnitCost(productId: string, unitId: string, manager?: EntityManager): Promise<number> {
    const product = await this.getRepository(manager).findOne({ where: { id: productId } as any, relations: { extraUnits: true } });
    if (!product) return 0;
    const extra = product.extraUnits?.find((item) => item.unitId === unitId);
    return product.baseUnitId === unitId ? 0 : Number(extra?.salePrice) || 0;
  }
  async attachCostInfo<T extends { productId?: string | null; unitId?: string | null; quantity?: number | null; costPriceAtTime?: number | null; totalCost?: number | null }>(data: T, manager?: EntityManager): Promise<void> {
    if (!data.productId || !data.unitId) return;
    await this.attachUnitConversion(data, manager);
    data.costPriceAtTime = await this.getUnitCost(data.productId, data.unitId, manager);
    data.totalCost = (Number(data.quantity) || 0) * (Number(data.costPriceAtTime) || 0);
  }
}
