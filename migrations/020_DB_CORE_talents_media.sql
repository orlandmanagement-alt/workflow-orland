-- Menambahkan kolom media (Comp Card) dan Sosmed tambahan ke tabel talents
ALTER TABLE talents ADD COLUMN headshot TEXT;
ALTER TABLE talents ADD COLUMN side_view TEXT;
ALTER TABLE talents ADD COLUMN full_height TEXT;
ALTER TABLE talents ADD COLUMN instagram TEXT;
ALTER TABLE talents ADD COLUMN tiktok TEXT;
ALTER TABLE talents ADD COLUMN twitter TEXT;
ALTER TABLE talents ADD COLUMN phone TEXT;
ALTER TABLE talents ADD COLUMN email TEXT;
