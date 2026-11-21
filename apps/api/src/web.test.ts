import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from './app.ts';
import { loadConfig } from './config.ts';

describe('serving the web app', () => {
  let distDir: string;
  let app: ReturnType<typeof buildApp>;

  beforeAll(() => {
    distDir = mkdtempSync(join(tmpdir(), 'stockmiles-web-'));
    mkdirSync(join(distDir, 'assets'));
    writeFileSync(join(distDir, 'index.html'), '<html>app</html>');
    writeFileSync(join(distDir, 'sw.js'), '// sw');
    writeFileSync(join(distDir, 'assets', 'index-abc123.js'), '// js');
    app = buildApp(loadConfig({ NODE_ENV: 'test', WEB_DIST_DIR: distDir }));
  });

  afterAll(async () => {
    await app.close();
    rmSync(distDir, { recursive: true, force: true });
  });

  it('serves index.html at /', async () => {
    const response = await app.inject({ url: '/' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('app');
  });

  it('serves index.html for app routes (SPA fallback)', async () => {
    const response = await app.inject({ url: '/stores/123?tab=stock' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('app');
    expect(response.headers['cache-control']).toBe('no-cache');
  });

  it('caches hashed assets for a year, but not sw.js', async () => {
    const asset = await app.inject({ url: '/assets/index-abc123.js' });
    expect(asset.headers['cache-control']).toContain('immutable');
    const sw = await app.inject({ url: '/sw.js' });
    expect(sw.headers['cache-control']).toBe('no-cache');
  });

  it('returns JSON 404 for unknown API routes and missing files', async () => {
    const api = await app.inject({ url: '/api/nothing' });
    expect(api.statusCode).toBe(404);
    expect(api.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Not found' } });
    const file = await app.inject({ url: '/missing.png' });
    expect(file.statusCode).toBe(404);
  });

  it('still answers the API', async () => {
    const response = await app.inject({ url: '/api/health' });
    expect(response.json()).toEqual({ status: 'ok' });
  });
});
