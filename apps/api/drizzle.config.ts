import { defineConfig } from 'drizzle-kit';

// drizzle-kit only turns the TypeScript schema into .sql files (pnpm db:generate).
// It never connects to a database; src/db/migrate.ts applies the files.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema',
  out: './drizzle',
  // displayName in TypeScript becomes display_name in the database.
  casing: 'snake_case',
});
