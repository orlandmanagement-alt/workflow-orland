CREATE TABLE IF NOT EXISTS project_usage_rights (right_id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, duration_months INTEGER, region TEXT, fee REAL);
CREATE INDEX IF NOT EXISTS idx_rights_booking_id ON project_usage_rights(booking_id);

CREATE TABLE IF NOT EXISTS project_logistics (logistic_id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, item_type TEXT, details TEXT, voucher_url TEXT);
CREATE INDEX IF NOT EXISTS idx_logistics_booking_id ON project_logistics(booking_id);

CREATE TABLE IF NOT EXISTS vehicle_routes (route_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, driver_name TEXT, waypoints JSON);
CREATE INDEX IF NOT EXISTS idx_routes_project_id ON vehicle_routes(project_id);

CREATE TABLE IF NOT EXISTS casting_rooms (room_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, meeting_link TEXT, scheduled_at DATETIME);
CREATE INDEX IF NOT EXISTS idx_casting_project_id ON casting_rooms(project_id);

CREATE TABLE IF NOT EXISTS casting_room_recordings (recording_id TEXT PRIMARY KEY, room_id TEXT NOT NULL, video_url TEXT);
CREATE INDEX IF NOT EXISTS idx_recordings_room_id ON casting_room_recordings(room_id);

CREATE TABLE IF NOT EXISTS agency_inventories (item_id TEXT PRIMARY KEY, item_name TEXT, category TEXT, quantity INTEGER);
CREATE TABLE IF NOT EXISTS inventory_transactions (transaction_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, item_id TEXT NOT NULL, checkout_date DATETIME DEFAULT CURRENT_TIMESTAMP, checkin_date DATETIME, status TEXT);
CREATE INDEX IF NOT EXISTS idx_inv_talent_id ON inventory_transactions(talent_id);

CREATE TABLE IF NOT EXISTS talent_disciplinary (sp_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, issuer_user_id TEXT, reason TEXT, issued_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_disc_talent_id ON talent_disciplinary(talent_id);

CREATE TABLE IF NOT EXISTS client_webhooks (webhook_id TEXT PRIMARY KEY, client_id TEXT NOT NULL, endpoint_url TEXT, event_type TEXT);
CREATE INDEX IF NOT EXISTS idx_wh_client_id ON client_webhooks(client_id);

CREATE TABLE IF NOT EXISTS legal_documents (doc_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, doc_type TEXT, file_url TEXT);
CREATE INDEX IF NOT EXISTS idx_legaldocs_project_id ON legal_documents(project_id);

CREATE TABLE IF NOT EXISTS ph_scripts (script_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, file_url TEXT, breakdown_data JSON);
CREATE INDEX IF NOT EXISTS idx_scripts_project_id ON ph_scripts(project_id);

CREATE TABLE IF NOT EXISTS ph_call_sheets (sheet_id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, call_time DATETIME, details JSON);
CREATE INDEX IF NOT EXISTS idx_sheets_booking_id ON ph_call_sheets(booking_id);

CREATE TABLE IF NOT EXISTS brand_budgets (budget_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, max_budget REAL, current_spend REAL);
CREATE INDEX IF NOT EXISTS idx_budgets_project_id ON brand_budgets(project_id);

CREATE TABLE IF NOT EXISTS wo_floorplans (plan_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, image_url TEXT, details JSON);
CREATE INDEX IF NOT EXISTS idx_plans_project_id ON wo_floorplans(project_id);

CREATE TABLE IF NOT EXISTS eo_gate_passes (pass_id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, qr_data TEXT, scanned_at DATETIME);
CREATE INDEX IF NOT EXISTS idx_passes_booking_id ON eo_gate_passes(booking_id);

CREATE TABLE IF NOT EXISTS eo_stages (stage_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, stage_name TEXT);
CREATE INDEX IF NOT EXISTS idx_stages_project_id ON eo_stages(project_id);

CREATE TABLE IF NOT EXISTS client_shared_notes (note_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, content TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_sharednotes_project_id ON client_shared_notes(project_id);

CREATE TABLE IF NOT EXISTS agency_resources (resource_id TEXT PRIMARY KEY, title TEXT, file_url TEXT);

CREATE TABLE IF NOT EXISTS casting_calls (call_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, description TEXT, expires_at DATETIME);
CREATE INDEX IF NOT EXISTS idx_opencalls_project_id ON casting_calls(project_id);

CREATE TABLE IF NOT EXISTS casting_submissions (sub_id TEXT PRIMARY KEY, call_id TEXT NOT NULL, applicant_name TEXT, portfolio_url TEXT);
CREATE INDEX IF NOT EXISTS idx_submissions_call_id ON casting_submissions(call_id);

CREATE TABLE IF NOT EXISTS casting_voting_links (link_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, url_hash TEXT, expires_at DATETIME);
CREATE INDEX IF NOT EXISTS idx_voting_project_id ON casting_voting_links(project_id);

CREATE TABLE IF NOT EXISTS event_infrastructures (infra_id TEXT PRIMARY KEY, name TEXT, description TEXT, price REAL);
CREATE TABLE IF NOT EXISTS infrastructure_requests (request_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, details JSON, status TEXT);
CREATE INDEX IF NOT EXISTS idx_infrareq_project_id ON infrastructure_requests(project_id);

CREATE TABLE IF NOT EXISTS project_verifications (verification_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, status TEXT, notes TEXT);
CREATE INDEX IF NOT EXISTS idx_projver_project_id ON project_verifications(project_id);

CREATE TABLE IF NOT EXISTS project_escrows (escrow_id TEXT PRIMARY KEY, project_id TEXT NOT NULL UNIQUE, amount_held REAL, status TEXT);
CREATE INDEX IF NOT EXISTS idx_escrow_project_id ON project_escrows(project_id);

CREATE TABLE IF NOT EXISTS academy_courses (course_id TEXT PRIMARY KEY, title TEXT, description TEXT);
CREATE TABLE IF NOT EXISTS academy_enrollments (enrollment_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, course_id TEXT NOT NULL, enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_enroll_talent_id ON academy_enrollments(talent_id);

CREATE TABLE IF NOT EXISTS talent_taxes (tax_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, npwp TEXT, tax_rate REAL, year INTEGER);
CREATE INDEX IF NOT EXISTS idx_taxes_talent_id ON talent_taxes(talent_id);
