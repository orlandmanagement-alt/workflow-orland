CREATE TABLE IF NOT EXISTS live_casting_boards (board_id TEXT PRIMARY KEY, project_id TEXT NOT NULL, role_title TEXT, status TEXT DEFAULT 'Active', expires_at DATETIME);
CREATE INDEX IF NOT EXISTS idx_liveboard_project_id ON live_casting_boards(project_id);

CREATE TABLE IF NOT EXISTS live_board_candidates (candidate_id TEXT PRIMARY KEY, board_id TEXT NOT NULL, talent_id TEXT, guest_name TEXT, guest_phone TEXT, status TEXT DEFAULT 'Waiting');
CREATE INDEX IF NOT EXISTS idx_livecand_board_id ON live_board_candidates(board_id);
CREATE INDEX IF NOT EXISTS idx_livecand_talent_id ON live_board_candidates(talent_id);
