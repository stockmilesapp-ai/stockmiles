import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  // Absolute path of the built web app (apps/web/dist). Empty in development.
  WEB_DIST_DIR: z.string().min(1).optional(),
});

export type Config = z.infer<typeof envSchema>;

// Reads settings from environment variables. Stops the app early with a clear
// message if a value is wrong, instead of failing later at runtime.
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
