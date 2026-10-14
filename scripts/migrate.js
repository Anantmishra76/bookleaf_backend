import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pool from "../config/db.js";

export const runMigrations = async (client) => {
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  const folder = new URL("../migrations/", import.meta.url);
  const files = (await fs.readdir(folder)).filter(file => file.endsWith(".sql")).sort();
  for (const file of files) {
    const existing = await client.query("SELECT name FROM schema_migrations WHERE name = $1", [file]);
    if (existing.rows.length) continue;

    const sql = await fs.readFile(new URL(file, folder), "utf8");
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
    console.log(`Applied migration: ${file}`);
  }
};

const migrate = async () => {
  let client;
  try {
    if (!process.env.DATABASE_URL?.trim()) throw new Error("DATABASE_URL is required");
    client = await pool.connect();
    await client.query("BEGIN");
    await runMigrations(client);
    await client.query("COMMIT");
    console.log("Database setup complete.");
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Database setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
};

// Importing runMigrations for a test should not start database setup.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await migrate();
}
