import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Schema group: DB_LOGS
export const auditTrails = sqliteTable('audit_trails', {
  id: text('id').primaryKey(),
  actorUserId: text('actor_user_id'),
  actorRole: text('actor_role'),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  beforeJson: text('before_json'),
  afterJson: text('after_json'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  severity: text('severity').default('info'),
  createdAt: integer('created_at').notNull(),
});

export const apiRequestLogs = sqliteTable('api_request_logs', {
  id: text('id').primaryKey(),
  requestId: text('request_id'),
  userId: text('user_id'),
  method: text('method'),
  path: text('path'),
  statusCode: integer('status_code'),
  latencyMs: integer('latency_ms'),
  errorMessage: text('error_message'),
  createdAt: integer('created_at').notNull(),
});

export const notificationsV2 = sqliteTable('notifications_v2', {
  notifId: text('notif_id').primaryKey(),
  userId: text('user_id').notNull(),
  notifType: text('notif_type').notNull(),
  title: text('title'),
  message: text('message'),
  priority: text('priority').default('medium'),
  isRead: integer('is_read').default(0),
  createdAt: integer('created_at').notNull(),
});

export const messagesV2 = sqliteTable('messages_v2', {
  messageId: text('message_id').primaryKey(),
  threadId: text('thread_id').notNull(),
  senderId: text('sender_id').notNull(),
  recipientId: text('recipient_id'),
  body: text('body').notNull(),
  isRead: integer('is_read').default(0),
  createdAt: integer('created_at').notNull(),
});

export const webhookLogs = sqliteTable('webhook_logs', {
  id: text('id').primaryKey(),
  webhookId: text('webhook_id'),
  eventType: text('event_type'),
  payloadJson: text('payload_json'),
  httpStatus: integer('http_status'),
  responseBody: text('response_body'),
  createdAt: integer('created_at').notNull(),
});
