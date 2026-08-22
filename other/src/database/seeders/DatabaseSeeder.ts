import { DatabaseConfig } from "@/config/database";
import { AuthUtils } from "@/shared/utils/auth.utils";
import { User } from "../models/User";
import { Attribute } from "../models/Attribute";
import { SystemRole } from "../models/SystemRole";
import { systemRoleSeeder } from "./systemRole";
import { attributeSeeders } from "./attribute";

export class DatabaseSeeder {
  static async run(): Promise<void> {
    console.log("🌱 Starting database seeding...");

    try {
      // Initialize database connection
      await DatabaseConfig.initialize();

      const adminRepository = DatabaseConfig.getRepository(User);

      const existingAdmins = await adminRepository.find();
      if (existingAdmins.length > 0) {
        await adminRepository.remove(existingAdmins);
      }
      console.log("✅ Cleared existing data");

      // Create users
      const hashedPassword = await AuthUtils.hashPassword("123456");

      const admins = await adminRepository.save([
        {
          username: "admin",
          password: hashedPassword,
          name: "Admin",
          code: "ADMINISTRATOR",
          isDefault: true,
        },
      ]);
      console.log("✅ Created users: ", admins);

      const systemRoleRepository = DatabaseConfig.getRepository(SystemRole);
      const existingAttributes = await systemRoleRepository.find();
      if (existingAttributes.length > 0) {
        await systemRoleRepository.remove(existingAttributes);
      }
      console.log("✅ Cleared existing system roles");

      // Seed system roles
      const systemRoles = await systemRoleRepository.save(
        systemRoleSeeder,
      );
      console.log("✅ Created system roles: ", systemRoles);

      const attributeRepository = DatabaseConfig.getRepository(Attribute);
      const existingAttributesData = await attributeRepository.find();

      if (existingAttributesData.length > 0) {
        await attributeRepository.remove(existingAttributesData);
      }
      console.log("✅ Cleared existing attributes");

      // Seed attributes
      // (Assuming attributeSeeder is defined and imported)
      const attributes = await attributeRepository.save(attributeSeeders);
      console.log("✅ Created attributes: ", attributes);

      console.log("🌱 Database seeding completed successfully.");
    } catch (error) {
      console.error("❌ Database seeding failed:", error);
      throw error;
    } finally {
      // Close database connection
      await DatabaseConfig.destroy();
    }
  }
}
