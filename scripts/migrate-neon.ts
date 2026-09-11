import "server-only";
import { neon } from "@neondatabase/serverless";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const sql = neon(databaseUrl);
const migrationsDir = resolve(process.cwd(), "db/migrations");

await sql`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;

const files = (await readdir(migrationsDir))
  .filter((file) => /^\d+_.+\.sql$/.test(file))
  .sort();

if (files.length === 0) {
  console.log("No Neon migrations found.");
  process.exit(0);
}

for (const file of files) {
  const version = file.split("_")[0];
  const applied = await sql`
    SELECT version FROM schema_migrations WHERE version = ${version} LIMIT 1
  `;

  if (applied.length > 0) {
    console.log(`Skipping applied migration ${file}`);
    continue;
  }

  const migration = await readFile(resolve(migrationsDir, file), "utf8");
  const statements = migration
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sql.query(statement);
  }

  await sql`INSERT INTO schema_migrations (version) VALUES (${version})`;
  console.log(`Applied Neon migration ${file}`);
}

console.log("Neon migrations complete.");
