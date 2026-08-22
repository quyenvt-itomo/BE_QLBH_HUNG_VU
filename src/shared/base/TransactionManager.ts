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

/**
 * Execute callback trong một PostgreSQL savepoint.
 * Nếu callback throw error, savepoint sẽ được rollback và transaction tiếp tục bình thường.
 * Nếu callback thành công, savepoint được release.
 *
 * QUAN TRỌNG: Trong PostgreSQL, khi một query trong transaction bị lỗi,
 * TOÀN BỘ transaction chuyển sang trạng thái "aborted" và mọi query tiếp theo
 * đều bị từ chối. Savepoint là cách duy nhất để cô lập lỗi và tiếp tục transaction.
 *
 * Usage:
 *   await withSavepoint(manager, 'sp1', async () => {
 *     // risky operation - if it fails, only this savepoint rolls back
 *   });
 */
export async function withSavepoint<T>(
  manager: EntityManager,
  savepointName: string,
  callback: () => Promise<T>,
): Promise<T | undefined> {
  await manager.query(`SAVEPOINT "${savepointName}"`);
  try {
    const result = await callback();
    await manager.query(`RELEASE SAVEPOINT "${savepointName}"`);
    return result;
  } catch (error) {
    await manager.query(`ROLLBACK TO SAVEPOINT "${savepointName}"`);
    console.error(
      `[Savepoint] Rolled back savepoint "${savepointName}":`,
      (error as Error)?.message,
    );
    return undefined;
  }
}
