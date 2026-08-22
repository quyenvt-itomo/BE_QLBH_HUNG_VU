import { FileCategory, FileType } from "@/database/models/File";
import path from "path";

export interface IMovedFile {
  tempPaths: string[];
  entityType: string;
  entityId: string;
  category: FileCategory;
  targetFolder: string;
  isPublic?: boolean;
}

export class FileStorageUtils {
  static detectFileType(fileName: string): FileType {
    const ext = path.extname(fileName).toLowerCase();

    if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
      return FileType.IMAGE;
    }
    if ([".mp4", ".mov"].includes(ext)) {
      return FileType.VIDEO;
    }
    if ([".mp3"].includes(ext)) {
      return FileType.AUDIO;
    }
    if ([".pdf", ".doc", ".docx", "xlsx"].includes(ext)) {
      return FileType.DOCUMENT;
    }
    return FileType.OTHER;
  }
}
