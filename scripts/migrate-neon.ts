import { neon } from "@neondatabase/serverless";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const sql = neon(databaseUrl);
const schema = await readFile(resolve(process.cwd(), "db/schema.sql"), "utf8");

// The schema is intentionally idempotent so this command is safe to rerun.
// Neon/Vercel should run this as an explicit deployment operation, never as part of
// the Next.js build, so a failed migration cannot silently produce a bad deployment.
const statements = schema
  .split(/;\s*(?:\r?\n|$)/)
  .map((statement) => statement.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
}

console.log(`Neon migration applied: ${statements.length} statements`);
