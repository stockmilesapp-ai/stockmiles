import { healthResponse } from '@stockmiles/shared';
import { describe, expect, it } from 'vitest';
import { buildApp } from './app.ts';
import { loadConfig } from './config.ts';

// Local Docker test database (pnpm db:up). Never a hosted database.
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgres://stockmiles:stockmiles@localhost:5433/stockmiles_test';

async function getHealth(env: Record<string, string>) {
  const app = buildApp(loadConfig({ NODE_ENV: 'test', ...env }));
  try {
    const response = await app.inject({ method: 'GET', url: '/api/health' });
    return { statusCode: response.statusCode, body: healthResponse.parse(response.json()) };
  } finally {
    await app.close();
  }
}

describe('GET /api/health', () => {
  it('reports db ok when the database answers', async () => {
    const health = await getHealth({ DATABASE_URL: TEST_DATABASE_URL });
    expect(health).toEqual({ statusCode: 200, body: { status: 'ok', db: 'ok' } });
  });

  it('reports db error with 503 when the database is unreachable', async () => {
    const health = await getHealth({
      DATABASE_URL: 'postgres://stockmiles:stockmiles@127.0.0.1:1/nothing',
    });
    expect(health).toEqual({ statusCode: 503, body: { status: 'ok', db: 'error' } });
  });

  it('reports not_configured when DATABASE_URL is not set', async () => {
    const health = await getHealth({});
    expect(health).toEqual({ statusCode: 200, body: { status: 'ok', db: 'not_configured' } });
  });
});

describe('GET /api/health/live', () => {
  it('answers ok without touching an unreachable database', async () => {
    const app = buildApp(
      loadConfig({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgres://stockmiles:stockmiles@127.0.0.1:1/nothing',
      }),
    );
    try {
      const response = await app.inject({ method: 'GET', url: '/api/health/live' });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: 'ok' });
    } finally {
      await app.close();
    }
  });
});

describe('loadConfig', () => {
  it('uses defaults when nothing is set', () => {
    expect(loadConfig({})).toMatchObject({ PORT: 3000, NODE_ENV: 'development' });
  });

  it('rejects an invalid PORT', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/PORT/);
  });

  it('rejects a DATABASE_URL that is not a URL', () => {
    expect(() => loadConfig({ DATABASE_URL: 'not a url' })).toThrow(/DATABASE_URL/);
  });
});
