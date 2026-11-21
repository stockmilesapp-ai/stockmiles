import pg from 'pg';

// The only way into the database. Nothing else in the app imports 'pg';
// from F2 Drizzle wraps this same pool.
export function createPool(databaseUrl: string): pg.Pool {
  return new pg.Pool({
    connectionString: databaseUrl,
    max: 10,
    // Fail fast when the database is unreachable, instead of hanging the request.
    connectionTimeoutMillis: 5_000,
  });
}
