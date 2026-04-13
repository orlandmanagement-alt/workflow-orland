DB_CORE core_database

> SELECT name, sql FROM sqlite_master WHERE type='table';
name	sql
_cf_KV	CREATE TABLE _cf_KV ( key TEXT PRIMARY KEY, value BLOB ) WITHOUT ROWID
talent_experiences	CREATE TABLE talent_experiences (exp_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, title TEXT, year INTEGER, description TEXT)
talent_certifications	CREATE TABLE talent_certifications (cert_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, cert_name TEXT, issued_by TEXT, year INTEGER)
talent_bank_accounts	CREATE TABLE talent_bank_accounts (account_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, bank_name TEXT, account_number TEXT, account_name TEXT)
talent_rate_cards	CREATE TABLE talent_rate_cards (rate_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, service_name TEXT, amount REAL)
talent_internal_notes	CREATE TABLE talent_internal_notes (note_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, author_user_id TEXT, note_text TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)
clients	CREATE TABLE clients (client_id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE, company_name TEXT, client_type TEXT, npwp_number TEXT, is_active INTEGER DEFAULT 1)
client_members	CREATE TABLE client_members (member_id TEXT PRIMARY KEY, client_id TEXT NOT NULL, user_id TEXT NOT NULL)
projects	CREATE TABLE projects (project_id TEXT PRIMARY KEY, client_id TEXT NOT NULL, title TEXT, status TEXT DEFAULT 'Draft', moodboards TEXT DEFAULT '[]', budget_total INTEGER DEFAULT 0)
project_roles	CREATE TABLE project_roles (role_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, role_name TEXT NOT NULL, quantity_needed INTEGER DEFAULT 1, budget_per_talent REAL)
project_talents	CREATE TABLE project_talents (booking_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, talent_id TEXT NOT NULL, status TEXT DEFAULT 'Shortlisted', contract_signed INTEGER DEFAULT 0, review_rating REAL, review_notes TEXT)
audition_medias	CREATE TABLE audition_medias (media_id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, file_url TEXT, uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP)
invoices	CREATE TABLE invoices (invoice_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, client_id TEXT NOT NULL, amount REAL, status TEXT DEFAULT 'Unpaid', proof_url TEXT, due_date DATE)
payouts	CREATE TABLE payouts (payout_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, booking_id TEXT NOT NULL, amount REAL, status TEXT DEFAULT 'Pending', processed_at DATETIME)
financial_splits	CREATE TABLE financial_splits (split_id TEXT PRIMARY KEY, invoice_id TEXT NOT NULL, agency_amount REAL, talent_amount REAL)
talent_schedules	CREATE TABLE talent_schedules (schedule_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, booking_id TEXT, activity_type TEXT, start_time DATETIME, end_time DATETIME, location_name TEXT)
schedule_qrs	CREATE TABLE schedule_qrs (qr_id TEXT PRIMARY KEY, schedule_id TEXT NOT NULL, qr_hash TEXT, expires_at DATETIME)
talent_media	CREATE TABLE talent_media (media_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, media_url TEXT, media_type TEXT, is_primary INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0)
kol_briefs	CREATE TABLE kol_briefs (brief_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, content TEXT, guidelines JSON)
kol_content_drafts	CREATE TABLE kol_content_drafts (draft_id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, video_url TEXT, status TEXT DEFAULT 'Pending Review', feedback TEXT)
kol_tracking_links	CREATE TABLE kol_tracking_links (link_id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, url TEXT, clicks INTEGER DEFAULT 0)
wo_rundowns	CREATE TABLE wo_rundowns (rundown_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, timeline JSON)
wo_song_lists	CREATE TABLE wo_song_lists (list_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, must_play JSON, do_not_play JSON)
eo_technical_riders	CREATE TABLE eo_technical_riders (rider_id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, requirements JSON, is_approved INTEGER DEFAULT 0)
eo_hospitality_riders	CREATE TABLE eo_hospitality_riders (rider_id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, requirements JSON, is_approved INTEGER DEFAULT 0)
kyc_documents	CREATE TABLE kyc_documents (doc_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, id_card_url TEXT, selfie_url TEXT)
kyb_documents	CREATE TABLE kyb_documents (doc_id TEXT PRIMARY KEY, entity_id TEXT NOT NULL, entity_type TEXT NOT NULL, doc_url TEXT)
kyb_verifications	CREATE TABLE kyb_verifications (verification_id TEXT PRIMARY KEY, entity_id TEXT NOT NULL, entity_type TEXT NOT NULL, status TEXT)
vendors	CREATE TABLE vendors (vendor_id TEXT PRIMARY KEY, name TEXT, service_type TEXT, kyb_status TEXT DEFAULT 'Pending')
master_categories	CREATE TABLE master_categories (category_id TEXT PRIMARY KEY, category_name TEXT NOT NULL UNIQUE)
master_skills	CREATE TABLE master_skills (skill_id TEXT PRIMARY KEY, skill_name TEXT NOT NULL UNIQUE)
live_casting_boards	CREATE TABLE live_casting_boards (board_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, role_title TEXT, status TEXT DEFAULT 'Active', expires_at DATETIME)
live_board_candidates	CREATE TABLE live_board_candidates (candidate_id TEXT PRIMARY KEY, board_id TEXT NOT NULL, talent_id TEXT, guest_name TEXT, guest_phone TEXT, status TEXT DEFAULT 'Waiting')
dispute_tickets	CREATE TABLE dispute_tickets (ticket_id TEXT PRIMARY KEY, reporter_user_id TEXT NOT NULL, project_id TEXT, issue TEXT, status TEXT DEFAULT 'Open')
project_evaluations	CREATE TABLE project_evaluations (eval_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, feedback TEXT, rating INTEGER)
project_usage_rights	CREATE TABLE project_usage_rights (right_id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, duration_months INTEGER, region TEXT, fee REAL)
project_logistics	CREATE TABLE project_logistics (logistic_id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, item_type TEXT, details TEXT, voucher_url TEXT)
vehicle_routes	CREATE TABLE vehicle_routes (route_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, driver_name TEXT, waypoints JSON)
casting_rooms	CREATE TABLE casting_rooms (room_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, meeting_link TEXT, scheduled_at DATETIME)
casting_room_recordings	CREATE TABLE casting_room_recordings (recording_id TEXT PRIMARY KEY, room_id TEXT NOT NULL, video_url TEXT)
agency_inventories	CREATE TABLE agency_inventories (item_id TEXT PRIMARY KEY, item_name TEXT, category TEXT, quantity INTEGER)
inventory_transactions	CREATE TABLE inventory_transactions (transaction_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, item_id TEXT NOT NULL, checkout_date DATETIME DEFAULT CURRENT_TIMESTAMP, checkin_date DATETIME, status TEXT)
talent_disciplinary	CREATE TABLE talent_disciplinary (sp_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, issuer_user_id TEXT, reason TEXT, issued_at DATETIME DEFAULT CURRENT_TIMESTAMP)
client_webhooks	CREATE TABLE client_webhooks (webhook_id TEXT PRIMARY KEY, client_id TEXT NOT NULL, endpoint_url TEXT, event_type TEXT)
legal_documents	CREATE TABLE legal_documents (doc_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, doc_type TEXT, file_url TEXT)
ph_scripts	CREATE TABLE ph_scripts (script_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, file_url TEXT, breakdown_data JSON)
ph_call_sheets	CREATE TABLE ph_call_sheets (sheet_id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, call_time DATETIME, details JSON)
brand_budgets	CREATE TABLE brand_budgets (budget_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, max_budget REAL, current_spend REAL)
wo_floorplans	CREATE TABLE wo_floorplans (plan_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, image_url TEXT, details JSON)
eo_gate_passes	CREATE TABLE eo_gate_passes (pass_id TEXT PRIMARY KEY, booking_id TEXT NOT NULL, qr_data TEXT, scanned_at DATETIME)
eo_stages	CREATE TABLE eo_stages (stage_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, stage_name TEXT)
client_shared_notes	CREATE TABLE client_shared_notes (note_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, content TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)
agency_resources	CREATE TABLE agency_resources (resource_id TEXT PRIMARY KEY, title TEXT, file_url TEXT)
casting_calls	CREATE TABLE casting_calls (call_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, description TEXT, expires_at DATETIME)
casting_submissions	CREATE TABLE casting_submissions (sub_id TEXT PRIMARY KEY, call_id TEXT NOT NULL, applicant_name TEXT, portfolio_url TEXT)
casting_voting_links	CREATE TABLE casting_voting_links (link_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, url_hash TEXT, expires_at DATETIME)
event_infrastructures	CREATE TABLE event_infrastructures (infra_id TEXT PRIMARY KEY, name TEXT, description TEXT, price REAL)
infrastructure_requests	CREATE TABLE infrastructure_requests (request_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, details JSON, status TEXT)
project_verifications	CREATE TABLE project_verifications (verification_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, status TEXT, notes TEXT)
project_escrows	CREATE TABLE project_escrows (escrow_id TEXT PRIMARY KEY, project_id TEXT NOT NULL UNIQUE, amount_held REAL, status TEXT)
academy_courses	CREATE TABLE academy_courses (course_id TEXT PRIMARY KEY, title TEXT, description TEXT)
academy_enrollments	CREATE TABLE academy_enrollments (enrollment_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, course_id TEXT NOT NULL, enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP)
talent_taxes	CREATE TABLE talent_taxes (tax_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, npwp TEXT, tax_rate REAL, year INTEGER)
talents	CREATE TABLE talents ( talent_id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE, full_name TEXT, category TEXT, gender TEXT, height INTEGER, weight INTEGER, birth_date TEXT, base_rate REAL DEFAULT 0, kyc_status TEXT DEFAULT 'Pending', bio TEXT, is_active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP )

DB_SSO sso_database
SELECT name, sql FROM sqlite_master WHERE type='table';
name	sql
_cf_KV	CREATE TABLE _cf_KV ( key TEXT PRIMARY KEY, value BLOB ) WITHOUT ROWID
otp_requests	CREATE TABLE otp_requests ( id TEXT PRIMARY KEY, identifier TEXT NOT NULL, code TEXT NOT NULL, purpose TEXT NOT NULL, expires_at INTEGER NOT NULL )
sessions	CREATE TABLE sessions ( id TEXT PRIMARY KEY, user_id TEXT NOT NULL, role TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL )
users	CREATE TABLE users ( id TEXT PRIMARY KEY, full_name TEXT NOT NULL, email TEXT UNIQUE, phone TEXT UNIQUE, password_hash TEXT, pin_hash TEXT, role TEXT NOT NULL DEFAULT 'talent', social_provider TEXT, social_id TEXT, status TEXT DEFAULT 'pending', created_at INTEGER NOT NULL, fail_count INTEGER DEFAULT 0, locked_until INTEGER )

DB_ARCHIVE archive_database
SELECT name, sql FROM sqlite_master WHERE type='table';
name	sql
_cf_KV	CREATE TABLE _cf_KV ( key TEXT PRIMARY KEY, value BLOB ) WITHOUT ROWID
notifications	CREATE TABLE notifications (notif_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT, message TEXT, is_read INTEGER DEFAULT 0, created_at DATETIME)
messages	CREATE TABLE messages (message_id TEXT PRIMARY KEY, thread_id TEXT NOT NULL, sender_id TEXT, body TEXT, sent_at DATETIME)
talent_attendances	CREATE TABLE talent_attendances (attendance_id TEXT PRIMARY KEY, schedule_id TEXT NOT NULL, talent_id TEXT NOT NULL, check_in_time DATETIME, lat REAL, lng REAL)
communication_logs	CREATE TABLE communication_logs (log_id TEXT PRIMARY KEY, user_id TEXT, channel TEXT, message TEXT, sent_at DATETIME)
projects	CREATE TABLE projects (project_id TEXT PRIMARY KEY, client_id TEXT NOT NULL, title TEXT, status TEXT)
invoices	CREATE TABLE invoices (invoice_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, client_id TEXT NOT NULL, amount REAL, status TEXT, proof_url TEXT, due_date DATE)

DB_LOGS logs_database
SELECT name, sql FROM sqlite_master WHERE type='table';
name	sql
_cf_KV	CREATE TABLE _cf_KV ( key TEXT PRIMARY KEY, value BLOB ) WITHOUT ROWID
talent_social_accounts	CREATE TABLE talent_social_accounts (account_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, platform TEXT, username TEXT)
social_metrics_history	CREATE TABLE social_metrics_history (metric_id TEXT PRIMARY KEY, account_id TEXT NOT NULL, followers INTEGER, recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP)
talent_attendances	CREATE TABLE talent_attendances (attendance_id TEXT PRIMARY KEY, schedule_id TEXT NOT NULL, talent_id TEXT NOT NULL, check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP, lat REAL, lng REAL)
notifications	CREATE TABLE notifications (notif_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT, message TEXT, is_read INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)
message_threads	CREATE TABLE message_threads (thread_id TEXT PRIMARY KEY, project_id TEXT)
messages	CREATE TABLE messages (message_id TEXT PRIMARY KEY, thread_id TEXT NOT NULL, sender_id TEXT, body TEXT, sent_at DATETIME DEFAULT CURRENT_TIMESTAMP)
kol_sentiment_logs	CREATE TABLE kol_sentiment_logs (log_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, positive_score REAL, negative_score REAL, analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP)
kol_social_scrapes	CREATE TABLE kol_social_scrapes (scrape_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, found_keywords JSON, scraped_at DATETIME)
kyc_verifications	CREATE TABLE kyc_verifications (verification_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, liveness_score REAL, status TEXT)
communication_logs	CREATE TABLE communication_logs (log_id TEXT PRIMARY KEY, user_id TEXT, channel TEXT, message TEXT, sent_at DATETIME DEFAULT CURRENT_TIMESTAMP)
talent_brand_safety_logs	CREATE TABLE talent_brand_safety_logs (log_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, risk_score REAL, findings JSON, scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP)
kyc_logs	CREATE TABLE kyc_logs (log_id TEXT PRIMARY KEY, nik TEXT, response JSON, checked_at DATETIME DEFAULT CURRENT_TIMESTAMP)