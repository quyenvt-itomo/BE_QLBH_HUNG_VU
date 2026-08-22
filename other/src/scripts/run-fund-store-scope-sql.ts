import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { Client } from "pg";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const rootDir = process.cwd();

const sqlFiles = [
  path.resolve(rootDir, "migrate-fund-store-scope.sql"),
  path.resolve(rootDir, "backfill-store-funds.sql"),
];

async function readSql(filePath: string): Promise<string> {
  const sql = await fs.readFile(filePath, "utf8");
  if (!sql.trim()) {
    throw new Error(`SQL file is empty: ${filePath}`);
  }
  return sql;
}

function getDbConfig() {
  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "postgres",
  };
}

async function run(): Promise<void> {
  const db = getDbConfig();
  const client = new Client(db);

  console.log("[fund-store-scope] Connecting to database...");
  await client.connect();

  try {
    for (const filePath of sqlFiles) {
      console.log(`[fund-store-scope] Running ${path.basename(filePath)} ...`);
      const sql = await readSql(filePath);
      await client.query(sql);
      console.log(`[fund-store-scope] Done ${path.basename(filePath)}`);
    }

    console.log("[fund-store-scope] All SQL scripts completed successfully.");
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error("[fund-store-scope] Failed:", error.message || error);
  process.exit(1);
});
