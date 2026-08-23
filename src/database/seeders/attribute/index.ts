import "reflect-metadata";
import DatabaseConfig from "@/config/database";
import { Attribute, AttributeType } from "@/database/models/Attribute";
import { attributeSeeders } from "./seedData";

export async function seedAttributes(): Promise<void> {
  await DatabaseConfig.transaction(async (manager) => {
    const validTypes = Object.values(AttributeType);
    await manager
      .createQueryBuilder()
      .update(Attribute)
      .set({ deletedAt: new Date() })
      .where('"type" NOT IN (:...validTypes)', { validTypes })
      .andWhere('"deletedAt" IS NULL')
      .execute();

    for (const seed of attributeSeeders) {
      const existing = await manager.getRepository(Attribute).findOne({
        where: { name: seed.name!, type: seed.type! } as any,
      });
      if (existing) {
        await manager.getRepository(Attribute).update(existing.id, {
          isDefault: seed.isDefault ?? existing.isDefault,
          deletedAt: null,
        } as any);
      } else {
        await manager.getRepository(Attribute).save(manager.getRepository(Attribute).create(seed));
      }
    }
  });
}

if (require.main === module) {
  DatabaseConfig.initialize()
    .then(seedAttributes)
    .then(() => DatabaseConfig.destroy())
    .catch(async (error) => {
      console.error("Attribute seeding failed:", error);
      await DatabaseConfig.destroy();
      process.exitCode = 1;
    });
}
