CREATE TABLE IF NOT EXISTS master_categories (category_id TEXT PRIMARY KEY, category_name TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS master_skills (skill_id TEXT PRIMARY KEY, skill_name TEXT NOT NULL UNIQUE);
