-- Menambahkan kolom grup dan properti detail
ALTER TABLE talents ADD COLUMN interests TEXT DEFAULT '[]';
ALTER TABLE talents ADD COLUMN skills TEXT DEFAULT '[]';
ALTER TABLE talents ADD COLUMN union_affiliation TEXT;

-- Kolom Appearance
ALTER TABLE talents ADD COLUMN eye_color TEXT;
ALTER TABLE talents ADD COLUMN hair_color TEXT;
ALTER TABLE talents ADD COLUMN hip_size TEXT;
ALTER TABLE talents ADD COLUMN chest_bust TEXT;
ALTER TABLE talents ADD COLUMN body_type TEXT;
ALTER TABLE talents ADD COLUMN specific_characteristics TEXT;
ALTER TABLE talents ADD COLUMN tattoos TEXT;
ALTER TABLE talents ADD COLUMN piercings TEXT;

-- Kolom Personal tambahan
ALTER TABLE talents ADD COLUMN ethnicity TEXT;
ALTER TABLE talents ADD COLUMN location TEXT;

-- Kolom spesifik di tabel experiences (credits)
ALTER TABLE talent_experiences ADD COLUMN company TEXT;
ALTER TABLE talent_experiences ADD COLUMN month TEXT;
