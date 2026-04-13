import { defineConfig } from 'drizzle-kit';

const target = (process.env.DB_TARGET || 'core').toLowerCase();

const schemaByTarget: Record<string, string> = {
  sso: './src/sso.ts',
  core: './src/core.ts',
  logs: './src/logs.ts',
  archives: './src/archives.ts',
};

const outByTarget: Record<string, string> = {
  sso: '../../apps/appapi/migrations/d1-sso',
  core: '../../apps/appapi/migrations/d1-core',
  logs: '../../apps/appapi/migrations/d1-logs',
  archives: '../../apps/appapi/migrations/d1-archives',
};

const schema = schemaByTarget[target] || schemaByTarget.core;
const out = outByTarget[target] || outByTarget.core;

export default defineConfig({
  schema,
  out,
  dialect: 'sqlite',
  strict: true,
  verbose: true,
});
