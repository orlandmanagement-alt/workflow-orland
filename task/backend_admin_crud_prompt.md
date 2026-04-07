# Workflow Analisis & Prompt Pembuatan Admin CRUD Orland Management

Berikut adalah cetak biru (blueprint) status pengembangan sistem Admin (*appadmin*) dan *Backend API* (*appapi*), beserta instruksi Prompt khusus yang bisa Anda berikan ke saya (Antigravity) pada sesi selanjutnya untuk membangun sistem CRUD Admin secara massal dan otomatis.

---

## 1. Status Workflow Saat Ini (Sudah vs Belum)

### ✅ APA YANG SUDAH SELESAI DIBUAT
1. **Otentikasi & Keamanan Dasar**
   - Middleware pengecekan Cookie Sesi (`sid`) terverifikasi dengan `DB_SSO`.
   - Deteksi *Role-Based Access Control* (variabel `userRole` sudah tersedia di API backend, mengetahui mana yang `admin` dan mana yang `talent`/`client`).
2. **Struktur UI App Admin (`apps/appadmin`)**
   - Rangka halaman untuk `auth`, `dashboard`, `disputes`, `finance`, `projects`, dan `users` sudah tersedia kerangkanya (*scaffolded*).
3. **Master Endpoints (Talent & Client)**
   - API untuk modul mandiri masing-masing pihak (cth: `PUT /talents/me`, unggah ke R2 Cloudflare) sudah bekerja 100%.

### ❌ APA YANG BELUM DIBUAT (TARGET CRUD ADMIN)
1. **Modul Master Users (API & UI Admin)**
   - API `GET /api/v1/admin/users` (Melihat seluruh user, filter, pagination).
   - API `PATCH /api/v1/admin/users/:id/status` (Banned / Suspend / Active / Reset Password).
2. **Modul Verifikasi Talents & Clients (API & UI Admin)**
   - Menyetujui (*Approve*) atau Menolak Dokumen KYC KTP dan KYB Perusahaan.
   - Mengubah status pendaftaran Talent dari *Pending* menjadi *Verified*.
3. **Modul Moderasi Projects / Casting (API & UI Admin)**
   - *God-mode view* untuk Admin menghapus *project/job* fiktif, menutup lowongan paksa, atau membatalkan *booking*.
4. **Modul Keuangan Pribadi (Admin Finance)**
   - Memroses dan menyetujui penarikan dana (*Withdrawal/Payout*) klien/talent.
5. **Modul Dispute / Sengketa**
   - Fitur admin untuk menjadi hakim (*arbitrator*) antara klien dan talent jika pekerjaan bermasalah.

---

## 2. Magic Prompt untuk Antigravity

**Copy paste teks di bawah ini dan kirimkan ke saya (Agent Antigravity) di permintaan Anda berikutnya untuk memulai eksekusi:**

***

> **PROMPT START**
> 
> Antigravity, saat ini kita fokus membangun sistem Backend API (di `apps/appapi`) serta integrasi Antarmuka-nya di (`apps/appadmin`) untuk fitur God-Mode CRUD Admin Orland Management.
> 
> Tugas Anda dalam sesi ini:
> 1. Buat folder baru `apps/appapi/src/functions/admin/` dan buatkan file `adminCrudHandler.ts`.
> 2. Di dalam file tersebut, ciptakan router Hono JS khusus Admin yang di-lindungi (hanya tereksekusi jika variabel `userRole` === 'super_admin' || 'admin' yang bisa membaca).
> 3. Endpoints yang harus Anda buat meliputi:
>    - `GET /api/v1/admin/users`: Tarik semua data dari `DB_SSO.users` beserta statusnya ke dalam array, lengkapi fitur search (via parameter query SQLite `LIKE`).
>    - `PATCH /api/v1/admin/users/:id/status`: Ubah status user: 'active', 'suspended', 'deleted'.
>    - `GET /api/v1/admin/talents/pending`: List talent yang profilnya belum disetujui / review KYC pending.
>    - `POST /api/v1/admin/talents/:id/verify`: Set DB status verifikasi talent ke positif dan buka akses API publiknya.
>    - `GET /api/v1/admin/projects`: Melihat daftar semua job/casting lintas organisasi/klien, lengkap dengan status pembookingannya.
>    - `DELETE /api/v1/admin/projects/:id`: Hapus keras atau tandai sebagai pelanggaran pada *project* tersebut.
> 4. Pastikan meregistrasikan `adminCrudHandler` ini ke `apps/appapi/src/index.ts` dengan membungkus rute di bawah pengaman Admin.
> 5. Setelah sisi API selesai, pilih minimal SATU halaman krusial yakni **Tabel Master Users** di rute `apps/appadmin/src/pages/users/index.tsx` dan integrasikan API Fetch (`/admin/users`) tersebut ke dalam Tabel UI gaya Enterprise SaaS Tailwind. Berikan fungsi tombol "Banned" dan "Hapus" yang aktif.
> 
> Lakukan seluruh pengerjaan ini tanpa meminta _approval_ di setiap langkahnya. Langsung tulis kodenya (API dan UI secara terintegrasi) dan buatkan sebuah *Walkthrough* jika semuanya telah usai.
> 
> **PROMPT END**
