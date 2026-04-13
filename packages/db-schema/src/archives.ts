import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Schema group: DB_ARCHIVES
export const archivedProjects = sqliteTable('archived_projects', {
  archiveId: text('archive_id').primaryKey(),
  originalProjectId: text('original_project_id').notNull(),
  clientId: text('client_id'),
  title: text('title'),
  status: text('status'),
  projectPayloadJson: text('project_payload_json').notNull(),
  archivedReason: text('archived_reason'),
  archivedAt: integer('archived_at').notNull(),
});

export const archivedJobApplications = sqliteTable('archived_job_applications', {
  archiveId: text('archive_id').primaryKey(),
  originalJobApplicationId: text('original_job_application_id').notNull(),
  originalProjectId: text('original_project_id'),
  talentId: text('talent_id'),
  status: text('status'),
  payloadJson: text('payload_json').notNull(),
  archivedAt: integer('archived_at').notNull(),
});

export const archivedContracts = sqliteTable('archived_contracts', {
  archiveId: text('archive_id').primaryKey(),
  originalContractId: text('original_contract_id').notNull(),
  clientId: text('client_id'),
  talentId: text('talent_id'),
  contractStatus: text('contract_status'),
  payloadJson: text('payload_json').notNull(),
  archivedAt: integer('archived_at').notNull(),
});

export const archivedFinancials = sqliteTable('archived_financials', {
  archiveId: text('archive_id').primaryKey(),
  sourceTable: text('source_table').notNull(),
  sourceId: text('source_id').notNull(),
  clientId: text('client_id'),
  talentId: text('talent_id'),
  amount: real('amount'),
  payloadJson: text('payload_json').notNull(),
  archivedAt: integer('archived_at').notNull(),
});

export const softDeletedEntities = sqliteTable('soft_deleted_entities', {
  archiveId: text('archive_id').primaryKey(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  deletedByUserId: text('deleted_by_user_id'),
  deleteReason: text('delete_reason'),
  entityPayloadJson: text('entity_payload_json').notNull(),
  deletedAt: integer('deleted_at').notNull(),
});
