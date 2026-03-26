CREATE TABLE IF NOT EXISTS system_permissions (perm_id TEXT PRIMARY KEY, perm_name TEXT UNIQUE);
CREATE TABLE IF NOT EXISTS roles (role_id TEXT PRIMARY KEY, role_name TEXT NOT NULL, permissions JSON);
