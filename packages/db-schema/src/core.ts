import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Skema untuk DB_CORE (Data Master Operasional)
export const talents = sqliteTable('talents', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(), // Relasi logis ke users.id di DB_SSO
  category: text('category'),
  portfolioUrl: text('portfolio_url'),
  city: text('city'),
  heightCm: real('height_cm'),
  updatedAt: integer('updated_at').notNull(),
});

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('active'), // active, completed, archived
  clientId: text('client_id').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
