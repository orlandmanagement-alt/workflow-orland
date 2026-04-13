CREATE TABLE IF NOT EXISTS dispute_tickets (ticket_id TEXT PRIMARY KEY, reporter_user_id TEXT NOT NULL, project_id TEXT, issue TEXT, status TEXT DEFAULT 'Open');
CREATE INDEX IF NOT EXISTS idx_dispute_user_id ON dispute_tickets(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_dispute_project_id ON dispute_tickets(project_id);

CREATE TABLE IF NOT EXISTS project_evaluations (eval_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, feedback TEXT, rating INTEGER);
CREATE INDEX IF NOT EXISTS idx_evals_project_id ON project_evaluations(project_id);
