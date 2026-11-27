import { runMigrations } from '../db/migrate.ts';

// Runs once before the api tests: brings the local test database up to the latest migration.
export default async function setup(): Promise<void> {
  await runMigrations(
    process.env.TEST_DATABASE_URL ??
      'postgres://stockmiles:stockmiles@localhost:5433/stockmiles_test',
  );
}
