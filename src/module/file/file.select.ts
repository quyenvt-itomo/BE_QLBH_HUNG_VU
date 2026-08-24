import { FindOptionsSelect, FindOptionsRelations } from "typeorm";
import { File } from "@/database/models/File";

/**
 * Basic fields for list view
 */
export const FileSelectBasic: FindOptionsSelect<File> = {
  id: true,
  fileName: true,
  originalName: true,
  url: true,
  thumbnailUrl: true,
  size: true,
  type: true,
  entityType: true,
  entityId: true,
  category: true,
  isMain: true,
  status: true,
  createdAt: true,
};

/**
 * Full fields for detail view
 */
export const FileSelectFull: FindOptionsSelect<File> = {
  ...FileSelectBasic,
  path: true,
  thumbnailPath: true,
  isPublic: true,
  alt: true,
  updatedAt: true,
  deletedAt: true,
};
export const FileSelectList = FileSelectBasic;

/**
 * Relations (File has no relations)
 */
export const FileRelations: FindOptionsRelations<File> = {};
export const FileRelationsList: FindOptionsRelations<File> = {};
