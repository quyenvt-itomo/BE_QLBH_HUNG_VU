import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntityWithCompany } from "./BaseEntityWithCompany";
import { Attribute, AttributeSnapshot } from "../Attribute";

export interface JobPositionSnapshot {
  id: string;
  name: string;
  level: string | null;
  jobTitleId: string | null;
  jobTitleSnapshot: AttributeSnapshot | null;
}

@Entity("job_positions")
export class JobPosition extends BaseEntityWithCompany {
  @Column({ type: "varchar", length: 255 })
  name: string;
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  level: string | null;

  @Column({ type: "uuid", nullable: true, default: null })
  jobTitleId: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  jobTitleSnapshot: AttributeSnapshot | null; // Chức danh

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => Attribute, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "jobTitleId" })
  jobTitle: Attribute | null;
}
