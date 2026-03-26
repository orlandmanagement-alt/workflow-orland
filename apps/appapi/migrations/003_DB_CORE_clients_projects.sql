CREATE TABLE IF NOT EXISTS clients (client_id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE, company_name TEXT, client_type TEXT, npwp_number TEXT, is_active INTEGER DEFAULT 1);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

CREATE TABLE IF NOT EXISTS client_members (member_id TEXT PRIMARY KEY, client_id TEXT NOT NULL, user_id TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_cm_client_id ON client_members(client_id);
CREATE INDEX IF NOT EXISTS idx_cm_user_id ON client_members(user_id);

CREATE TABLE IF NOT EXISTS projects (project_id TEXT PRIMARY KEY, client_id TEXT NOT NULL, title TEXT, status TEXT DEFAULT 'Draft');
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);

CREATE TABLE IF NOT EXISTS project_roles (role_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, role_name TEXT NOT NULL, quantity_needed INTEGER DEFAULT 1, budget_per_talent REAL);
CREATE INDEX IF NOT EXISTS idx_project_roles_project_id ON project_roles(project_id);
