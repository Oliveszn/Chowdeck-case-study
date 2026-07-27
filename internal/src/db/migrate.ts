import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

async function migrate() {
  const schemaPath = path.join(import.meta.dir, "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");

  // A dedicated connection with multipleStatements enabled — the shared
  // pool in config/db.ts deliberately doesn't enable this, since running
  // multiple statements per query is something you only want for a
  // one-off migration script, not for everyday app queries.
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { minVersion: "TLSv1.2" },
    multipleStatements: true,
  });

  console.log(`Applying schema from ${schemaPath}...`);
  await connection.query(schemaSql);
  console.log("Schema applied.");

  await connection.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
