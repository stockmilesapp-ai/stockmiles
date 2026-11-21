import type { HealthResponse } from '@stockmiles/shared';
import Fastify from 'fastify';
import type { Config } from './config.ts';
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

  app.get('/api/health', async (): Promise<HealthResponse> => ({ status: 'ok' }));

  // Set only in the Docker image. In development Vite serves the web app.
  if (config.WEB_DIST_DIR) {
    registerWebApp(app, config.WEB_DIST_DIR);
  }

  return app;
}
