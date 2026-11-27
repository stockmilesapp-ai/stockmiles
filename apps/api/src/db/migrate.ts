import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createPool } from './client.ts';

const MIGRATIONS_FOLDER = fileURLToPath(new URL('../../drizzle', import.meta.url));
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

// Migrations run only against the local Docker database. A hosted database needs
// MIGRATE_ALLOW_HOST set to its exact host name, which only Veera does, on purpose.
export function assertMigrationAllowed(databaseUrl: string, allowHost?: string): void {
  const host = new URL(databaseUrl).hostname;
  if (LOCAL_HOSTS.has(host) || host === allowHost) return;
  throw new Error(
    `Refusing to migrate "${host}": only local databases are allowed. ` +
      `To migrate this hosted database on purpose, set MIGRATE_ALLOW_HOST=${host}.`,
  );
}

// Applies every .sql file in apps/api/drizzle that this database has not run yet.
export async function runMigrations(databaseUrl: string, allowHost?: string): Promise<void> {
  assertMigrationAllowed(databaseUrl, allowHost);
  if (!existsSync(`${MIGRATIONS_FOLDER}/meta/_journal.json`)) return; // nothing generated yet
  const pool = createPool(databaseUrl);
  try {
    await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await pool.end();
  }
}

// pnpm db:migrate runs this file directly with DATABASE_URL from .env.
if (import.meta.main) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not set');
  await runMigrations(databaseUrl, process.env.MIGRATE_ALLOW_HOST);
  console.log(`Migrations applied to ${new URL(databaseUrl).host}`);
}
