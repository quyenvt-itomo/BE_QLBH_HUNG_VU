import DatabaseConfig from "@/config/database";
import { injectable } from "inversify";
import { EntityManager } from "typeorm";
@injectable()
export class TransactionService {
  async getManager(): Promise<EntityManager> {
    return DatabaseConfig.manager;
  }

  getSnapshotDates(fromDate: Date): Date[] {
    const snapshotDates: Date[] = [];
    const now = new Date();
    const startDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), 1);
    for (
      let dt = startDate;
      dt <= endDate;
      dt = new Date(dt.getFullYear(), dt.getMonth() + 1, 1)
    ) {
      snapshotDates.push(new Date(dt));
    }
    return snapshotDates;
  }
}
