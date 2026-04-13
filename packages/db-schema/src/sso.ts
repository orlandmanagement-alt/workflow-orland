import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Skema untuk DB_SSO (Otentikasi & Akses) - harus 1:1 dengan DB live
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  passwordHash: text('password_hash').notNull(),
  passwordSalt: text('password_salt').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  userType: text('user_type', { enum: ['talent', 'client', 'admin', 'agency'] }).notNull(),
  isActive: integer('is_active').default(1),
  emailVerified: integer('email_verified').default(0),
  emailVerifiedAt: text('email_verified_at'),
  phoneVerified: integer('phone_verified').default(0),
  phoneVerifiedAt: text('phone_verified_at'),
  pinRequired: integer('pin_required').default(0),
  pinHash: text('pin_hash'),
  pinSalt: text('pin_salt'),
  profileCompleted: integer('profile_completed').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  lastLogin: text('last_login'),
  lastLoginIp: text('last_login_ip'),
  twoFactorEnabled: integer('two_factor_enabled').default(0),
  twoFactorMethod: text('two_factor_method'),
});

export const sessions = sqliteTable('sessions', {
  sessionId: text('session_id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sidToken: text('sid_token'),
  tokenHash: text('token_hash'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  lastActivity: text('last_activity').default(sql`CURRENT_TIMESTAMP`),
  isActive: integer('is_active').default(1),
});

export const otpCodes = sqliteTable('otp_codes', {
  otpId: text('otp_id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  code: text('code').notNull(),
  method: text('method', { enum: ['email', 'sms'] }),
  attempts: integer('attempts').default(0),
  maxAttempts: integer('max_attempts').default(3),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  expiresAt: text('expires_at').notNull(),
  verifiedAt: text('verified_at'),
});

export const pinCodes = sqliteTable('pin_codes', {
  pinId: text('pin_id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  pinHash: text('pin_hash').notNull(),
  pinSalt: text('pin_salt').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  tokenId: text('token_id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull(),
  used: integer('used').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  expiresAt: text('expires_at').notNull(),
  usedAt: text('used_at'),
  ipAddress: text('ip_address'),
});

export const loginAttempts = sqliteTable('login_attempts', {
  attemptId: text('attempt_id').primaryKey(),
  userId: text('user_id'),
  email: text('email'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  method: text('method', { enum: ['password', 'otp', 'pin'] }),
  success: integer('success').default(0),
  failureReason: text('failure_reason'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const accountLockouts = sqliteTable('account_lockouts', {
  lockoutId: text('lockout_id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  reason: text('reason'),
  failedAttempts: integer('failed_attempts'),
  lockedAt: text('locked_at').default(sql`CURRENT_TIMESTAMP`),
  unlocksAt: text('unlocks_at').notNull(),
  isActive: integer('is_active').default(1),
});

export const roles = sqliteTable('roles', {
  roleId: text('role_id').primaryKey(),
  roleName: text('role_name').notNull().unique(),
  description: text('description'),
  isSystem: integer('is_system').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const permissions = sqliteTable('permissions', {
  permissionId: text('permission_id').primaryKey(),
  permissionName: text('permission_name').notNull().unique(),
  description: text('description'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const rolePermissions = sqliteTable(
  'role_permissions',
  {
    rolePermissionId: text('role_permission_id').primaryKey(),
    roleId: text('role_id')
      .notNull()
      .references(() => roles.roleId, { onDelete: 'cascade' }),
    permissionId: text('permission_id')
      .notNull()
      .references(() => permissions.permissionId, { onDelete: 'cascade' }),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    rolePermissionUnique: uniqueIndex('role_permissions_role_permission_unique').on(
      table.roleId,
      table.permissionId
    ),
  })
);

export const userRoles = sqliteTable(
  'user_roles',
  {
    userRoleId: text('user_role_id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: text('role_id')
      .notNull()
      .references(() => roles.roleId, { onDelete: 'cascade' }),
    assignedAt: text('assigned_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userRoleUnique: uniqueIndex('user_roles_user_role_unique').on(table.userId, table.roleId),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type OtpCode = typeof otpCodes.$inferSelect;
export type NewOtpCode = typeof otpCodes.$inferInsert;
export type PinCode = typeof pinCodes.$inferSelect;
export type NewPinCode = typeof pinCodes.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type NewLoginAttempt = typeof loginAttempts.$inferInsert;
export type AccountLockout = typeof accountLockouts.$inferSelect;
export type NewAccountLockout = typeof accountLockouts.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
