CREATE TABLE IF NOT EXISTS kol_sentiment_logs (log_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, positive_score REAL, negative_score REAL, analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_sentiment_talent_id ON kol_sentiment_logs(talent_id);

CREATE TABLE IF NOT EXISTS kol_social_scrapes (scrape_id TEXT PRIMARY KEY, talent_id TEXT NOT NULL, found_keywords JSON, scraped_at DATETIME);
CREATE INDEX IF NOT EXISTS idx_scrapes_talent_id ON kol_social_scrapes(talent_id);
