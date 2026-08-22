import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { Client } from "pg";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const rootDir = process.cwd();
const sqlFile = path.resolve(rootDir, "sync-loyalty-points-manual.sql");

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

  console.log("[loyalty-sync] Connecting to database...");
  await client.connect();

  try {
    console.log(`[loyalty-sync] Running ${path.basename(sqlFile)} ...`);
    const sql = await readSql(sqlFile);
    await client.query(sql);
    console.log("[loyalty-sync] Completed successfully.");
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error("[loyalty-sync] Failed:", error.message || error);
  process.exit(1);
});
