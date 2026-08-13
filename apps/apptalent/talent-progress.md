# 🚀 MASTER PROGRESS & ROADMAP: ORLAND APPTALENT
**Terakhir Diperbarui:** 28 Maret 2026 (Malang, Jawa Timur)
**Status Fase:** UI/UX Front-End Selesai (Menuju API/Backend Integration)

---

## ✅ BAB 1: FITUR FRONT-END YANG SUDAH RAMPUNG (100% UI)
Berikut adalah menu dan antarmuka yang sudah berhasil dibangun di `apptalent`:

1.  **Dashboard:** Progress bar profil, metrik analitik (Views, AI Searches), Jadwal terdekat, dan **VIP Digital Pass 3D** (Kartu ID putar dengan animasi QR Code).
2.  **Smart Match AI (`/jobs/match`):** Mesin pencari *casting* dengan dua mode (Swipe Cards 3D ala Tinder & Mode Daftar Klasik).
3.  **Studio Self-Tape (`/audition`):** Akses kamera langsung dari *browser* dengan *overlay Viewfinder* dan Teleprompter Kaca (Glassmorphism).
4.  **Dompet Pendapatan (`/payouts`):** UI "Black Card" elegan, riwayat transaksi, dan sistem keamanan *setup* Bank & PIN dengan *flow* OTP.
5.  **Comp Card Pro (`/media`):** Galeri visual ala Instagram untuk mengatur foto utama (*Headshot*) dan foto pendukung (*Full body, side profile*).
6.  **Profile Editor (`/profile`):** Formulir data diri, fisik, dan *Generator PDF* otomatis (Client-side rendering).
7.  **Messages (`/messages`):** Kloning UI WhatsApp (Smart Inbox & Chat Room) dengan centang biru dan *Floating Action Button* (Ikon Melayang).
8.  **VIP Concierge (`/help`):** Sistem *helpdesk* premium dengan 3 kategori tiket (Finansial, Set, Legal) dan tombol Darurat.
9.  **Pengaturan (`/settings`):** Tautan visual SSO, aktivasi Web Push Notifications (Native OS), dan info Pajak.

---

## 🚧 BAB 2: STATUS SIMULASI (Target Integrasi API Produksi)
Fitur-fitur ini secara visual sudah sempurna, namun datanya masih *Mock/Dummy* (Simulasi). Ini yang harus kita kerjakan di `appapi`:

1.  **Sistem Upload File (Direct-to-Storage):** * *Saat ini:* Tombol upload di Profil, Galeri, dan Video Self-Tape hanya memunculkan `alert()`.
    * *Target:* Integrasi dengan **Cloudflare R2** (untuk gambar) dan **Cloudflare Stream** (untuk kompresi video). Backend (`appapi`) harus membuat *Presigned URL* agar HP Talent mengunggah langsung ke Cloudflare, BUKAN ke *database* kita.
2.  **Mesin Smart Match AI:**
    * *Saat ini:* Menggunakan *array* statis `MOCK_JOBS`.
    * *Target:* `appapi` harus memiliki algoritma pencocokan. Klien (*appclient*) *posting job* mencari "Tinggi 170cm, Wanita", API akan mengirim *job* tersebut ke aplikasi Talent yang memenuhi kriteria.
3.  **Sistem Real-Time Chat & Notifikasi:**
    * *Saat ini:* Balasan tertunda dengan `setTimeout`.
    * *Target:* Menggunakan **WebSocket** (Cloudflare Durable Objects) untuk *chatting real-time* Klien-Talent, dan integrasi VAPID keys untuk Web Push Notification sungguhan.
4.  **Autentikasi Lapis 2 (Dompet & OTP):**
    * *Saat ini:* Simulasi klik tombol lanjut.
    * *Target:* Integrasi API **Resend.com** di `appapi` untuk mengirim 4-Digit OTP ke email Talent saat mau mengatur PIN. Saldo dompet harus ditarik dari *database ledger* Orland.

---

## ⚙️ BAB 3: PENGATURAN & PIHAK KETIGA YANG DIBUTUHKAN
Untuk membawa aplikasi ini ke *Production*, kita perlu menyiapkan akun/kunci rahasia berikut di Cloudflare/Lingkungan Server:

* **Autentikasi (SSO):** Google OAuth 2.0 Client ID (atau layanan seperti Clerk/Auth0).
* **Email Transaksional:** Resend.com API Key (Untuk OTP, Notifikasi Kontrak, dan Notifikasi Helpdesk ke Admin).
* **Penyimpanan Media:** Cloudflare R2 Bucket (untuk gambar/PDF) & Cloudflare Stream (untuk Video).
* **Database Relasional:** Cloudflare D1 (SQLite) atau Supabase (PostgreSQL) untuk menyimpan data Talent, Transaksi, dan Chat.

---

## 🔗 BAB 4: SINKRONISASI EKOSISTEM (`appapi` & `appclient`)
Agar `apptalent` bisa hidup, kita harus membangun sisi seberangnya:

1.  **Kebutuhan untuk Klien (PH, TVC, KOL Specialist) di `appclient`:**
    * **Dashboard Klien:** Form untuk membuat *Open Casting* baru (Judul, Honor, Kriteria Fisik, Batas Waktu).
    * **Talent Browser:** UI gaya Tinder (tapi kebalikan), di mana klien memilah portofolio Talent yang sudah melamar/di-*match* oleh sistem.
    * **KOL Specialist Tools:** Khusus untuk klien Influencer/KOL, mereka butuh melihat *Engagement Rate* (ER) dan *Followers* TikTok/IG dari Talent.
    * **Check-In Scanner:** Modul untuk membuka Kamera HP Klien/Satpam guna me- *scan* **QR Code VIP Pass** dari HP Talent di lokasi syuting.
2.  **Kebutuhan `appapi` (Jantung Data):**
    * Endpoint `/api/match`: Logika perjodohan Kriteria Klien vs Data Fisik Talent.
    * Endpoint `/api/finance/withdraw`: Validasi PIN 6-Digit sebelum mengurangi saldo database.
    * Endpoint `/api/helpdesk/ticket`: Menerima laporan tiket dan meneruskannya ke email Admin via Resend.

---

## 👤 BAB 5: UPGRADE PROFIL TALENT (TAHAP SELANJUTNYA)
Untuk menjadikan profil Talent di Orland berkelas Internasional, kita harus menambahkan data ini di *database* dan antarmuka Editor Profil:

1.  **Social Media Linkage (Krusial untuk KOL/Influencer):**
    * Tautan profil Instagram, TikTok, YouTube.
    * *(Advanced)*: Integrasi API pihak ketiga untuk menarik jumlah *Followers* secara otomatis.
2.  **Detail Ukuran Fisik Pro (Professional Measurements):**
    * Ukuran Sepatu (Shoe Size), Lingkar Dada (Bust/Chest), Lingkar Pinggang (Waist), Lingkar Pinggul (Hips), Warna Mata, Warna Rambut. (Wajib untuk model *Fashion/Runway*).
3.  **Keahlian Khusus (Skill Tags):**
    * Pilihan *chip/tag* untuk: Berkuda, Beladiri, Berenang, Bahasa Asing, Menyanyi, Menari. Klien TVC sering mencari *skill* spesifik.
4.  **Verifikasi KYC (Know Your Customer):**
    * Menu khusus untuk *upload* foto KTP dan Swafoto KTP untuk verifikasi legalitas sebelum tanda tangan kontrak (NDA/SPK).

---
**KESIMPULAN:**
Aplikasi Talent (`apptalent`) sudah memiliki fondasi UX/UI kelas dunia. Langkah selanjutnya adalah fokus pada perakitan "Mesin" (`appapi`) dan "Dashboard Pengendali Klien" (`appclient`) agar sistem *Smart Match*, Transaksi Keuangan, dan Pesan dapat beroperasi secara nyata.
