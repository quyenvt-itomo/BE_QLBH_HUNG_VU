import DatabaseConfig from "@/config/database";
import { AuthUtils } from "@/shared/utils/auth.utils";
import { User } from "../models/User";
import { Organization } from "../models/Organization";
import { organizationSeeder } from "./organization";

export class DatabaseSeeder {
  static async run(): Promise<void> {
    console.log("🌱 Starting database seeding...");

    try {
      // Initialize database connection
      await DatabaseConfig.initialize();
      const adminRepository = DatabaseConfig.getRepository(User);
      const organizationRepo = DatabaseConfig.getRepository(Organization);

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
          code: "ADMIN",
          canLogin: true,
          isDefault: true,
        },
      ]);
      console.log("✅ Created users: ", admins);
      console.log("\n🔐 Default login credentials:");
      console.log("   📧 Username: admin");
      console.log("   🔑 Password: 123456");
      const organizations = await organizationRepo.save(organizationSeeder);

      console.log("✅ Created organizations: ", organizations);
    } catch (error) {
      console.error("❌ Database seeding failed:", error);
      throw error;
    } finally {
      // Close database connection
      await DatabaseConfig.destroy();
    }
  }
}
