import { z } from 'zod';

export const healthResponse = z.object({
  status: z.literal('ok'),
  // not_configured: the server has no DATABASE_URL yet (allowed until the hosted database exists).
  db: z.enum(['ok', 'error', 'not_configured']),
});

export type HealthResponse = z.infer<typeof healthResponse>;
