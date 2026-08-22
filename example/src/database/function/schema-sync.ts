import DatabaseConfig from "../../config/database";

async function syncSchema() {
  try {
    console.log("🔄 Synchronizing database schema without data loss...");

    await DatabaseConfig.initialize();
    await DatabaseConfig.query(`CREATE EXTENSION IF NOT EXISTS unaccent;`);

    // Clean up orphaned constraints that may block sync (TypeORM synchronization edge case)
    await DatabaseConfig.query(`
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN
          SELECT c.conname, c.conrelid::regclass AS tbl
          FROM pg_constraint c
          WHERE c.contype = 'f'
            AND NOT EXISTS (SELECT 1 FROM pg_class WHERE oid = c.conrelid AND relkind = 'r')
        LOOP
          EXECUTE 'ALTER TABLE ' || r.tbl || ' DROP CONSTRAINT IF EXISTS "' || r.conname || '" CASCADE';
          RAISE NOTICE 'Dropped orphaned constraint: % on %', r.conname, r.tbl;
        END LOOP;
      END $$;
    `);

    // Clean up specific known orphaned/duplicate constraints from model changes
    await DatabaseConfig.query(
      `ALTER TABLE IF EXISTS production_mesh_lines DROP CONSTRAINT IF EXISTS "FK_461c5a6a3b233e6915d342a3f73" CASCADE`,
    ).catch(() => {});

    // Đồng bộ schema mà không xóa dữ liệu
    await DatabaseConfig.synchronize(false);
    console.log("✅ Database schema synchronized (data preserved)");

    await DatabaseConfig.destroy();
    console.log("🔒 Database connection closed");
  } catch (error) {
    console.error("❌ Schema synchronization error:", error);
    process.exit(1);
  }
}

syncSchema();
