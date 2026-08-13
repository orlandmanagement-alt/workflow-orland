# 🚀 MASTER PROGRESS & ROADMAP: ORLAND APPCLIENT (B2B Portal)
**Terakhir Diperbarui:** 28 Maret 2026 (Malang, Jawa Timur)
**Status Fase:** Inisialisasi Proyek & Stubbing UI (UI Seragam dengan `apptalent`)

---

## ✅ BAB 1: KONFIGURASI GLOBAL & AUTH (SINKRON DENGAN APPTALENT)
Fitur dasar ini sudah disalin dari `apptalent` untuk memastikan keseragaman teknik dan visual:

1.  **Tailwind CSS & PostCSS:** Menggunakan *design system*, warna, dan *spacing* yang sama.
2.  **Typescript Config:** Menggunakan standar pengecekan kode yang sama.
3.  **Auth State (Zustand):** File `src/store/useAppStore.ts` disalin utuh. Login SSO/JWT di `appclient` akan menggunakan logika yang sama dengan `apptalent`, hanya berbeda *endpoint* API (Client Login vs Talent Login).
4.  **Sticky Header B2B:** Header menempel di atas dengan UI Selector Perusahaan (untuk staf PH yang mengelola banyak anak perusahaan).

---

## 🚧 BAB 2: ROADMAP PEMBANGUNAN HALAMAN & KOMPONEN (BERDASARKAN CSV)
Berikut adalah daftar antarmuka yang harus dibangun di `appclient`, dipetakan berdasarkan rute URL dan prioritas:

### A. Core B2B Modules (Prioritas Tinggi)
1.  **Layout & Sidebar (`/dashboard/*`):** Navigasi profesional ala platform Enterprise (Jira/Asana). Lokasi: `src/components/layout/ClientLayout.tsx`.
2.  **Login & KYB Setup (`/login` & `/setup`):** Form login SSO/Password. Jika akun baru, muncul *multi-step wizard* untuk upload dokumen legal (NIB, NPWP, KTP Direktur) ke Cloudflare R2. Lokasi: `src/pages/auth/client-login.tsx`.
3.  **Command Center (Home) (`/dashboard`):** Analitik B2B, grafik pengeluaran (*Burn Rate*), total proyek aktif, dan tabel "Tugas yang Butuh Review Anda" (Draft KOL/Selftape). Lokasi: `src/pages/dashboard/index.tsx`.
4.  **Project Hub & Kanban (`/dashboard/projects`):** Daftar *campaign/event*. Toggle view antara List (Tabel TanStack) dan Kanban Board (dnd-kit). Lokasi: `src/pages/projects/index.tsx`.
5.  **Project Detail (`/dashboard/projects/[id]`):** Pusat kontrol proyek. Rich Text Editor (TipTap) untuk Brief, upload Moodboard, Budget Tracker. Lokasi: `src/pages/projects/[id]/index.tsx`.
6.  **Talent Discovery & AI Match (`/dashboard/talents/search`):** Pencarian *talent* canggih dengan filter budget/skill. Fitur "Cari Mirip" dengan upload foto (AI Vision). Lokasi: `src/pages/talents/search.tsx`.
7.  **Booking & Roster Manager (`/dashboard/projects/[id]/roster`):** Manajemen status *talent* dalam proyek (Shortlist -> Offered -> Booked). Lokasi: `src/pages/projects/[id]/roster.tsx`.

### B. Role-Specific Tools (Alat Bantu Sektoral)
* **[PH] Live Casting Board (SSE) (`/dashboard/projects/[id]/live-board`):** Layar monitor *real-time* Sutradara untuk *extras* di lokasi syuting (Pake Server-Sent Events).
* **[KOL] Content Approval Hub (`/dashboard/projects/[id]/kol-drafts`):** Review video draft (TikTok/Reels) dengan penanda waktu (*timestamp*) revisi.
* **[EO] Technical Riders & Gantt Chart (`/dashboard/tools/eo/riders`):** Checklist alat musik artis & Multi-Stage Gantt Chart untuk festival musik.
* **[WO] Minute-by-Minute Rundown & Floorplan (`/dashboard/tools/wo/rundown`):** Tabel jadwal presisi (menit ke menit) dan denah gedung *panzoom*.

---

## ⚙️ BAB 3: INTEGRASI API & BACKEND (`appapi` Needs)
Agar Front-End `appclient` ini hidup, Backend (`appapi`) harus menyediakan *endpoint* berikut:

1.  **Autentikasi:** `POST /api/v1/auth/client/login` & `GET /api/v1/auth/me`.
2.  **Onboarding (KYB):** `POST /api/v1/kyb/clients/{id}/documents` (Menerima NIB, NPWP).
3.  **Talent Search & AI:** `POST /api/v1/search/talents` & `POST /api/v1/ai/search-similarity` (AI Vision).
4.  **Project Management:** `GET/POST /api/v1/projects` & `PUT /api/v1/projects/{id}/notes`.
5.  **Finansial:** `GET /api/v1/projects/{id}/escrow-status` & `PUT /api/v1/invoices/{id}/upload-proof`.

---

## 👤 BAB 4: UPGRADE DATA PROFILE (SINKRONISASI SSO)
**Analisis Masalah:** SSO tidak menyimpan no rekening.

**Solusi & Struktur Data:**
Data legalitas dan finansial Klien **TIDAK BOLEH** bersandar pada SSO Google/Apple. SSO hanya "Kunci Pintu". Data finansial harus disimpan di database internal Orland (`appapi`) dan dihubungkan (*mapping*) dengan ID SSO.

Data Profile Klien yang harus ditambahkan di database/API (`appapi`):
1.  **Data Perusahaan (KYB):** Nama PT/CV, NIB (Nomor Induk Berusaha), NPWP Perusahaan, Alamat Kantor, No Telp Perusahaan.
2.  **Data Anggota Tim:** Email (untuk login SSO), Nama Lengkap, Peran (Admin PH, Sutradara, Finance), Hak Akses (Edit vs View Only).
3.  **Data Finansial:** No Rekening Bank (untuk pengembalian Escrow/Refund), PIN Keamanan 6-Digit (Secondary Auth).
