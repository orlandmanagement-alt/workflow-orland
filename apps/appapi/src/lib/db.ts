import { drizzle } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';

export interface MultiDbBindings {
  DB_SSO: D1Database;
  DB_CORE: D1Database;
  DB_LOGS: D1Database;
  DB_ARCHIVES: D1Database;
}

export const initDatabases = (env: MultiDbBindings) => {
  const dbSso = drizzle(env.DB_SSO);
  const dbCore = drizzle(env.DB_CORE);
  const dbLogs = drizzle(env.DB_LOGS);
  const dbArchives = drizzle(env.DB_ARCHIVES);

  return {
    sso: dbSso,
    core: dbCore,
    logs: dbLogs,
    archives: dbArchives,
  };
};
