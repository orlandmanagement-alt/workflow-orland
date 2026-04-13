Berikut adalah tabel-tabel duplikat yang telah saya temukan dan gabungkan (merger):

projects vs client_projects:

Masalah: Ada dua tabel untuk menyimpan data proyek. projects versi lama sangat sederhana, sedangkan client_projects (dari migrasi 031) memiliki fitur budget, timeline, dan status casting.

Solusi: Digabung menjadi satu tabel utama bernama projects yang menampung seluruh kolom canggih dari client_projects.

talents vs managed_talents vs talent_profiles:

Masalah: Data talent terpecah. talents untuk data dasar, managed_talents (dari migrasi 028) untuk fitur akun agensi & impersonasi, dan talent_profiles (dari migrasi 030) untuk matriks AI.

Solusi: Digabung menjadi 2 tabel utama saja. Tabel talents untuk akun, login, relasi agensi (agency_id, portfolio lock), dan tabel talent_profiles khusus untuk atribut fisik, bio, dan parameter AI matching.

project_talents vs job_applications:

Masalah: Keduanya mencatat talent yang masuk ke proyek. project_talents adalah versi lama (Booking), sedangkan job_applications versi baru (Application tracking & AI Match).

Solusi: Digabung menjadi tabel job_applications sebagai sumber kebenaran tunggal (Single Source of Truth) dari fase applied, shortlisted, hingga hired (booking).

Tabel KOL (kol_briefs, kol_content_drafts, dll) dan Tabel EO/WO (eo_hospitality_riders, wo_rundowns, dll):

Masalah: Ada versi lama yang sangat sederhana dan versi baru (dari migrasi 032 & 033) yang memiliki fitur approval, JSON array, dan tracking.

Solusi: Saya mempertahankan struktur dari migrasi terbaru (032 & 033) yang lebih lengkap fiturnya, dan menghapus versi lamanya.

agencies:

Masalah: Ada beberapa definisi tabel agencies.

Solusi: Digabung mengambil field company info, statistik talent dari versi terbaru, serta URL logo dan fitur white-label dari versi sebelumnya.