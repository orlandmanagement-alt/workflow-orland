CREATE TABLE IF NOT EXISTS kyc_documents (doc_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, id_card_url TEXT, selfie_url TEXT);
CREATE INDEX IF NOT EXISTS idx_kycdocs_talent_id ON kyc_documents(talent_id);

CREATE TABLE IF NOT EXISTS kyb_documents (doc_id TEXT PRIMARY KEY, entity_id TEXT NOT NULL, entity_type TEXT NOT NULL, doc_url TEXT);
CREATE INDEX IF NOT EXISTS idx_kybdocs_entity ON kyb_documents(entity_id, entity_type);

CREATE TABLE IF NOT EXISTS kyb_verifications (verification_id TEXT PRIMARY KEY, entity_id TEXT NOT NULL, entity_type TEXT NOT NULL, status TEXT);
CREATE INDEX IF NOT EXISTS idx_kybver_entity ON kyb_verifications(entity_id, entity_type);

CREATE TABLE IF NOT EXISTS vendors (vendor_id TEXT PRIMARY KEY, name TEXT, service_type TEXT, kyb_status TEXT DEFAULT 'Pending');
