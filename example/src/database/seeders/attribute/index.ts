import DatabaseConfig from "@/config/database";
import logger from "@/shared/utils/logger";
import { attributeSeeders } from "./seedData";
import { Attribute } from "@/database/models/Attribute";

async function runSeeders() {
  try {
    await DatabaseConfig.initialize();

    logger.info("🌱 Starting database seeding...");

    await DatabaseConfig.transaction(async (transactionalEntityManager) => {
      // Lọc đi những attribute đã tồn tại để tránh duplicate
      const existingAttributes = await transactionalEntityManager.find(
        Attribute,
        {
          where: attributeSeeders.map((attr) => ({
            name: attr.name,
            type: attr.type,
          })),
        },
      );

      const existingSet = new Set(
        existingAttributes.map((attr) => `${attr.name}-${attr.type}`),
      );

      const newAttributes = attributeSeeders.filter(
        (attr) => !existingSet.has(`${attr.name}-${attr.type}`),
      );

      await transactionalEntityManager.save(Attribute, newAttributes);
    });

    logger.info("🌱 Database seeding completed successfully.");
  } catch (error) {
    console.error("Error parsing Excel file:", error);
    return;
  }
}

runSeeders();
