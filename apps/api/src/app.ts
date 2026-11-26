import type { HealthResponse } from '@stockmiles/shared';
import Fastify from 'fastify';
import type { Config } from './config.ts';
import { createPool } from './db/client.ts';
import { registerWebApp } from './web.ts';

// Builds the Fastify app without starting it. server.ts starts it;
// tests call buildApp() and use app.inject() instead of a real port.
export function buildApp(config: Config) {
  const app = Fastify({
    logger:
      config.NODE_ENV === 'test'
        ? false
        : {
            level: config.LOG_LEVEL,
            transport: config.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
          },
  });

  const pool = config.DATABASE_URL ? createPool(config.DATABASE_URL) : undefined;
  // An idle connection can drop (database restart, network). Without this listener
  // Node treats the error as unhandled and the whole server crashes.
  pool?.on('error', (error) => app.log.error({ err: error }, 'idle database connection failed'));
  // Close database connections when the server stops (and when a test closes the app).
  app.addHook('onClose', async () => {
    await pool?.end();
  });

  // Liveness: "the server process is up". Never touches the database, so the
  // hosting platform's health check neither restarts the app during a database
  // outage nor hammers the database with login attempts (Render checks every few seconds).
  app.get('/api/health/live', async () => ({ status: 'ok' as const }));

  // Full status for people and the web page, including the database.
  app.get('/api/health', async (request, reply): Promise<HealthResponse> => {
    if (!pool) return { status: 'ok', db: 'not_configured' };
    try {
      await pool.query('select 1');
      return { status: 'ok', db: 'ok' };
    } catch (error) {
      request.log.error({ err: error }, 'database health check failed');
      reply.code(503);
      return { status: 'ok', db: 'error' };
    }
  });

  // Set only in the Docker image. In development Vite serves the web app.
  if (config.WEB_DIST_DIR) {
    registerWebApp(app, config.WEB_DIST_DIR);
  }

  return app;
}
