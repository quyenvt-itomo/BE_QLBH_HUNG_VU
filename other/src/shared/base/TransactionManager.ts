import { EntityManager } from "typeorm";
import DatabaseConfig from "@/config/database";

/**
 * Execute callback trong tenant transaction
 * Search path sẽ được set local cho transaction
 */
export async function withTransaction<T>(
  callback: (manager: EntityManager) => Promise<T>,
): Promise<T> {
  return DatabaseConfig.transaction(async (manager) => {
    // Set search_path local cho transaction
    // LOCAL nghĩa là chỉ apply trong transaction này
    await manager.query(`SET LOCAL search_path TO public`);

    try {
      return await callback(manager);
    } catch (error) {
      // search_path sẽ tự động reset khi transaction rollback
      throw error;
    }
  });
}
