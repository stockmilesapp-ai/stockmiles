import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// pending   = signed in with Google, but no tenant / store / warehouse access given yet.
// active    = signed in AND has at least one active membership (or is platform staff).
// suspended = blocked by platform staff; cannot use StockMiles at all.
// Rules for moving between these: docs/domain/access.md §3.
export const userStatus = pgEnum('user_status', ['pending', 'active', 'suspended']);

// One row per person (one Google account), across all tenants.
export const users = pgTable('users', {
  // UUIDv7 made by the app, never by the database, so records can be created offline.
  id: uuid().primaryKey(),
  // Google's permanent account id. We identify people by this, not by email (email can change).
  // Explicit name: drizzle would otherwise name it from the TS key (users_googleSub_unique).
  googleSub: text().notNull().unique('users_google_sub_unique'),
  // Stored lowercase (the login code lowercases it).
  email: text().notNull().unique(),
  // Name parts from Google; some accounts have no given/family name.
  firstName: text(),
  lastName: text(),
  fullName: text().notNull(),
  avatarUrl: text(),
  // A user row exists only after a successful Google login, so every new user starts as pending.
  status: userStatus().notNull().default('pending'),
  lastLoginAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
