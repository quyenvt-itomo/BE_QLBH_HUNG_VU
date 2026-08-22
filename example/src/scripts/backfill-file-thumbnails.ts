import "reflect-metadata";
import DatabaseConfig from "@/config/database";
import { File, FileCategory, FileType } from "@/database/models/File";
import { Brackets } from "typeorm";
import fs from "fs/promises";
import { constants as fsConstants } from "fs";
import path from "path";
import sharp from "sharp";

async function generateThumbnail(inputPath: string, outputPath: string) {
  await sharp(inputPath)
    .resize(360, 360, {
      fit: "cover",
      position: "center",
    })
    .jpeg({ quality: 82 })
    .toFile(outputPath);
}

async function runBackfill() {
  const batchSizeArg = Number(process.argv[2]);
  const maxBatchesArg = Number(process.argv[3]);

  const batchSize =
    Number.isFinite(batchSizeArg) && batchSizeArg > 0 ? batchSizeArg : 200;
  const maxBatches =
    Number.isFinite(maxBatchesArg) && maxBatchesArg > 0 ? maxBatchesArg : 50;

  try {
    console.log("Starting file thumbnail backfill...");
    console.log(`batchSize=${batchSize}, maxBatches=${maxBatches}`);

    await DatabaseConfig.initialize();

    const fileRepo = DatabaseConfig.getRepository(File);

    let scanned = 0;
    let updated = 0;
    let skippedMissingSource = 0;
    let failed = 0;

    for (let batchIndex = 0; batchIndex < maxBatches; batchIndex++) {
      const files = await fileRepo
        .createQueryBuilder("file")
        .where("file.deletedAt IS NULL")
        .andWhere("file.type = :type", { type: FileType.IMAGE })
        .andWhere("file.category = :category", {
          category: FileCategory.IMAGE,
        })
        .andWhere("file.path IS NOT NULL")
        .andWhere(
          new Brackets((qb) => {
            qb.where("file.thumbnailPath IS NULL").orWhere(
              "file.thumbnailUrl IS NULL",
            );
          }),
        )
        .orderBy("file.createdAt", "ASC")
        .limit(batchSize)
        .getMany();

      if (files.length === 0) {
        break;
      }

      scanned += files.length;

      for (const file of files) {
        try {
          if (!file.path) {
            skippedMissingSource++;
            continue;
          }
          await fs.access(file.path, fsConstants.F_OK);

          const fileName = file.fileName || path.basename(file.path);
          const thumbFileName = `${path.parse(fileName).name}_thumb.jpg`;
          const sourceDir = path.dirname(file.path);
          const thumbDir = path.join(sourceDir, "thumb");
          const thumbPath = path.join(thumbDir, thumbFileName);

          const urlDir = path.posix.dirname(file.url || "");
          const thumbUrl = `${urlDir}/thumb/${thumbFileName}`;

          await fs.mkdir(thumbDir, { recursive: true });
          await generateThumbnail(file.path, thumbPath);

          await fileRepo.update(
            { id: file.id },
            {
              thumbnailPath: thumbPath,
              thumbnailUrl: thumbUrl,
            },
          );
          updated++;
        } catch (error: any) {
          if (error?.code === "ENOENT") {
            skippedMissingSource++;
            continue;
          }
          failed++;
          console.error(`Failed to backfill ${file.id}:`, error);
        }
      }
    }

    const result = {
      scanned,
      updated,
      skippedMissingSource,
      failed,
    };

    console.log("Backfill completed.");
    console.log(JSON.stringify(result, null, 2));

    await DatabaseConfig.destroy();
    process.exit(0);
  } catch (error) {
    console.error("Backfill failed:", error);

    if (DatabaseConfig.isInitialized) {
      await DatabaseConfig.destroy();
    }

    process.exit(1);
  }
}

runBackfill();
