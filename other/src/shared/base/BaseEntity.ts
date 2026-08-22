import {
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  Column,
  ColumnOptions,
} from "typeorm";

export interface UserSnapshot {
  id: string;
  name: string;
  code: string;
  username: string;
}

/**
 * Base Entity with Soft Delete Support
 * Tất cả entities nên extend từ class này để có soft delete functionality
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: true, default: null })
  tempId?: string | null;

  @Column({ name: "note", type: "text", nullable: true })
  note?: string | null;

  @Column({ type: "uuid", nullable: true, default: null })
  createdBy?: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  createdBySnapshot?: UserSnapshot | null;

  @Column({ type: "uuid", nullable: true, default: null })
  updatedBy?: string | null;
  @Column({ type: "jsonb", nullable: true, default: null })
  updatedBySnapshot?: UserSnapshot | null;

  @CreateDateColumn({ name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updatedAt", nullable: true, default: null })
  updatedAt!: Date | null;

  @DeleteDateColumn({ name: "deletedAt", nullable: true })
  deletedAt?: Date | null;

  @Column({ name: "isDefault", type: "boolean", default: false })
  isDefault!: boolean;

  // Helper methods
  get isDeleted(): boolean {
    return this.deletedAt !== null && this.deletedAt !== undefined;
  }
}

export const BaseNumericColumnOptions: ColumnOptions = {
  type: "numeric",
  precision: 15,
  scale: 2,
  default: 0,
  transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value || "0"),
  },
};

export const BaseFactorNumericColumnOptions: ColumnOptions = {
  ...BaseNumericColumnOptions,
  default: 1,
};

export const BaseNullableNumericColumnOptions: ColumnOptions = {
  ...BaseNumericColumnOptions,
  nullable: true,
  default: null,
  transformer: {
    to: (value: number | null) => value,
    from: (value: string | null) => (value === null ? null : parseFloat(value)),
  },
};

export const BaseSortOrderColumnOptions: ColumnOptions = {
  type: "numeric",
  precision: 10,
  scale: 4,
  default: 10,
  transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value || "0"),
  },
};
