import { Entity, Column } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import {
  EntityTypeEnum,
  FileCategoryEnum,
  FileStatusEnum,
  FileTypeEnum,
} from "@/shared/constants/enum";

// ============================== ATTRIBUTE ENTITIES ==============================
@Entity("files")
export class File extends BaseEntity {
  @Column({ type: "varchar", length: 255, unique: true })
  fileName: string;
  @Column({ type: "varchar", length: 255 })
  originalName: string;
  @Column({ type: "varchar", length: 1024 })
  path: string;
  @Column({ type: "varchar", length: 1024 })
  url: string;
  @Column({ type: "bigint" })
  size: number;
  @Column({ type: "varchar", enum: FileTypeEnum })
  type: FileTypeEnum;

  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  entityType: EntityTypeEnum | null;
  @Column({ type: "uuid", nullable: true, default: null })
  entityId: string | null;

  @Column({ type: "varchar", length: 1024, nullable: true, default: null })
  thumbnailPath: string | null;
  @Column({ type: "varchar", length: 1024, nullable: true, default: null })
  thumbnailUrl: string | null;

  @Column({ type: "varchar", enum: FileCategoryEnum })
  category: FileCategoryEnum;
  @Column({ type: "boolean", default: true })
  isPublic: boolean;
  @Column({ type: "boolean", default: false })
  isMain: boolean;
  @Column({ type: "varchar", length: 255, nullable: true })
  alt: string | null;

  @Column({
    type: "varchar",
    default: FileStatusEnum.PENDING,
  })
  status: FileStatusEnum;

  @Column({ type: "timestamptz", nullable: true, default: null })
  expiresAt: Date | null;
}
