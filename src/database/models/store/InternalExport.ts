import { Column, Entity, OneToMany } from "typeorm";
import { StoreEntity } from "./StoreEntity";
import { InternalExportLine } from "./InternalExportLine";

export enum InternalExportType {
  DAMAGED = "damaged",
  USAGE = "usage",
}

@Entity("internal_exports")
export class InternalExport extends StoreEntity {
  @Column({ type: "enum", enum: InternalExportType, default: InternalExportType.USAGE })
  type: InternalExportType;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  occurredAt: Date;

  @Column({ type: "varchar", length: 50 })
  code: string;

  @Column({ type: "text", nullable: true, default: null })
  reason: string | null;

  @OneToMany(() => InternalExportLine, (line) => line.internalExport, {
    cascade: true,
  })
  lines: InternalExportLine[];
}
