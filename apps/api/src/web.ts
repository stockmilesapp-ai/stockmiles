import { extname, sep } from 'node:path';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';

// Serves the built React app (apps/web/dist) from the same origin as the API,
// so the browser never makes cross-site requests and cookies stay first-party.
export function registerWebApp(app: FastifyInstance, root: string) {
  app.register(fastifyStatic, {
    root,
    cacheControl: false,
    setHeaders(reply, filePath) {
      // Files in assets/ have a content hash in their name, so they never change.
      // Everything else (index.html, sw.js, manifest) must be checked on every load,
      // otherwise phones keep an old version of the app.
      const immutable = filePath.includes(`${sep}assets${sep}`);
      reply.header('Cache-Control', immutable ? 'public, max-age=31536000, immutable' : 'no-cache');
    },
  });

  app.setNotFoundHandler((request, reply) => {
    const path = request.url.split('?')[0] ?? '';
    const isRead = request.method === 'GET' || request.method === 'HEAD';
    const isPage = isRead && !path.startsWith('/api/') && extname(path) === '';
    if (isPage) {
      // A React Router path such as /stores/123: the browser app decides what to show.
      return reply.header('Cache-Control', 'no-cache').sendFile('index.html');
    }
    return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Not found' } });
  });
}
