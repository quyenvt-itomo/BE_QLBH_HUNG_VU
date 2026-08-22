import { injectable, inject } from "inversify";
import { BaseService, SearchableField } from "@/shared/base/BaseService";
import { OperationLog } from "@/database/models/OperationLog";
import { LogRepository } from "./log.repository";
import { LOG_TYPES } from "./log.types";

@injectable()
export class LogService extends BaseService<OperationLog> {
  protected repository: LogRepository;
  protected searchableFields: string[] = [
    "action",
    "targetEntity",
    "endpoint",
    "actorSnapshot.code",
    "actorSnapshot.name",
    "targetSnapshot.code",
    "targetSnapshot.name",
  ];

  constructor(@inject(LOG_TYPES.LogRepository) repository: LogRepository) {
    super();
    this.repository = repository;
  }
}
