import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Skema untuk DB_SSO (Otentikasi & Akses)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // admin, casting_director, talent, client
  isActive: integer('is_active').default(1),
  createdAt: integer('created_at').notNull(),
});
