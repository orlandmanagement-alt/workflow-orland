-- Menambahkan array JSON untuk multi link dan foto tambahan
ALTER TABLE talents ADD COLUMN showreels TEXT DEFAULT '[]';
ALTER TABLE talents ADD COLUMN audios TEXT DEFAULT '[]';
ALTER TABLE talents ADD COLUMN additional_photos TEXT DEFAULT '[]';
