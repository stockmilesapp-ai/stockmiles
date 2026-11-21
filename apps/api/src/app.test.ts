import { healthResponse } from '@stockmiles/shared';
import { describe, expect, it } from 'vitest';
import { buildApp } from './app.ts';
import { loadConfig } from './config.ts';

describe('GET /api/health', () => {
  it('returns ok in the shared schema shape', async () => {
    const app = buildApp(loadConfig({ NODE_ENV: 'test' }));
    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(200);
    expect(healthResponse.parse(response.json())).toEqual({ status: 'ok' });
    await app.close();
  });
});

describe('loadConfig', () => {
  it('uses defaults when nothing is set', () => {
    expect(loadConfig({})).toMatchObject({ PORT: 3000, NODE_ENV: 'development' });
  });

  it('rejects an invalid PORT', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/PORT/);
  });
});
