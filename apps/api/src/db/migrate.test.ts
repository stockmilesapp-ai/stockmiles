import { describe, expect, it } from 'vitest';
import { assertMigrationAllowed } from './migrate.ts';

const SUPABASE_URL =
  'postgresql://postgres.ref:secret@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

describe('assertMigrationAllowed', () => {
  it('allows the local Docker database', () => {
    expect(() =>
      assertMigrationAllowed('postgres://stockmiles:stockmiles@localhost:5433/stockmiles_dev'),
    ).not.toThrow();
    expect(() => assertMigrationAllowed('postgres://u:p@127.0.0.1:5433/db')).not.toThrow();
  });

  it('refuses a hosted database', () => {
    expect(() => assertMigrationAllowed(SUPABASE_URL)).toThrow(/Refusing to migrate/);
  });

  it('refuses when MIGRATE_ALLOW_HOST names a different host', () => {
    expect(() => assertMigrationAllowed(SUPABASE_URL, 'other.example.com')).toThrow(
      /Refusing to migrate/,
    );
  });

  it('allows a hosted database only when MIGRATE_ALLOW_HOST matches it exactly', () => {
    expect(() =>
      assertMigrationAllowed(SUPABASE_URL, 'aws-1-ap-southeast-1.pooler.supabase.com'),
    ).not.toThrow();
  });
});
