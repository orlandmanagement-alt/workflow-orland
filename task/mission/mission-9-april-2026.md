# MISSION 1 : Implement Premium Tiers, Agency Role, and Secure Feature Gating

## 1. CONTEXT & ARCHITECTURE
We are upgrading our enterprise talent management SaaS (Orland Management). 
The stack remains:
- **Frontend:** React/Vite (AppTalent, AppClient, AppAgency).
- **Backend:** Hono.js on Cloudflare Workers (`appapi`).
- **Database:** Cloudflare D1 (`DB_CORE`, `DB_SSO`).
- **Storage:** Cloudflare R2 (`orland-media`).

We are introducing Monetization (Premium Tiers) and a new B2B User Role (Agency).

## 2. DATABASE SCHEMA UPDATES (D1)
Execute the following schema changes:
1. **`users` table:** Add `account_tier` ENUM ('free', 'premium') DEFAULT 'free'.
2. **`talents` table:** Add `agency_id` (nullable, FK to `agencies.id`).
3. **`credits` table:** Add `image_url` (string, nullable) to store experience thumbnails.
4. **NEW `agencies` table:** `id`, `user_id`, `agency_name`, `description`, `created_at`.
5. **NEW `agency_talents` table:** (Optional, if many-to-many is needed, otherwise use `agency_id` in talents table).

## 3. FEATURE 1: PREMIUM TALENT LOGIC
**Rules:**
- **Media Uploads:** Free talents can only upload 3 additional photos. Premium talents can upload up to 10.
- **Public Profile API (`GET /api/v1/public/talents/:id`):** - If the talent is `premium`, the API must return their UNMASKED email, phone, and FULL social media links (IG, TikTok, FB).
  - If the talent is `free` AND the requester is not a Premium Client, the API MUST mask the email (e.g., `au***@gmail.com`) and phone (e.g., `08********32`), and hide social media links.
  - *Security Note:* The masking MUST happen in the Backend (Hono.js), not just hidden in the frontend, to prevent data scraping.

## 4. FEATURE 2: PREMIUM CLIENT LOGIC
**Rules:**
- **Contact Access:** If a Client is logged in and their `account_tier` is `premium`, the API (`GET /api/v1/talents/:id`) will bypass the Talent's free status and return UNMASKED contacts and social media.
- **Premium Tools:** Create a middleware `requirePremium` in Hono.js to protect premium tool endpoints (e.g., `/api/v1/tools/advanced-search`).

## 5. FEATURE 3: CREDIT/EXPERIENCE PHOTO UPLOAD
**Frontend Action (`Step4_Credits.tsx` or similar):**
- Add a file upload input in the Credit Form.
- Update the `processImage` utility to include an aggressive compression mode: `maxWidth: 400, quality: 0.6` to ensure the thumbnail is strictly < 100kb.
- Upload to R2 using the existing Presigned URL flow (`/media/upload-url`), storing it in the `talents/credits` folder.
**Backend Action:**
- Update the `POST /api/v1/talents/me/credits` payload to accept and save `image_url`.

## 6. FEATURE 4: NEW "AGENCY" ROLE WORKFLOW
**Rules & Features to Implement:**
1. **Agency Dashboard:** Build a UI for Agencies to perform CRUD operations on multiple talents under their management.
2. **Batch Casting Apply (`POST /api/v1/agency/projects/:id/apply`):** Allow the agency to send an array of `talent_ids` to apply for a job simultaneously.
3. **Agency Catalog:** Create a public endpoint `GET /api/v1/public/agency/:id/roster` that returns a list of all talents managed by this agency.
4. **Contact Redirection:** When a client views an Agency-managed talent, the booking WhatsApp button/email must point to the Agency's contact, not the individual Talent's contact.

## 7. EXECUTION PLAN
Please output the code in the following order:
1. **D1 SQL Queries:** The `ALTER TABLE` and `CREATE TABLE` commands.
2. **Backend API (Hono.js):** - Masking logic utility function.
   - Updated `/public/talents/:id` route showing the secure gating.
   - The `requirePremium` middleware.
3. **Frontend Utility:** The updated `imageCompressor.ts` handling the <100kb thumbnail constraint.
4. **Frontend UI:** The React component for the Agency Roster list (fetching from the new API).

# MISSION 2: Architect Bulk Operations, Agency Roles, and Premium Tiers (Orland SaaS)

## 1. CONTEXT & ARCHITECTURE
We are upgrading Orland Management SaaS to an Enterprise B2B/B2C platform.
- **Roles:** Admin, Agency (B2B), Talent (B2C), Client.
- **Stack:** React/Vite (Frontend), Hono.js + Cloudflare Workers (Backend), Cloudflare D1 (DB), R2 (Storage).
- **Core Goal:** Implement monetized features (Premium) and "Bulk/Mass Input" capabilities for Admins and Agencies to streamline data entry, alongside drag-and-drop sorting and CSV parsing.

## 2. DATABASE SCHEMA UPDATES (Cloudflare D1)
Execute these schema changes:
1. **`users` table:** Add `account_tier` ENUM ('free', 'premium') DEFAULT 'free'. Add `role` ENUM ('admin', 'agency', 'talent', 'client').
2. **`talents` table:** Add `agency_id` (FK to `agencies.id`).
3. **`media` (Photos) & `assets` (Videos) tables:** Add `sort_order` (INTEGER) and `view_count` (INTEGER) DEFAULT 0.
4. **NEW `agencies` table:** `id`, `user_id`, `agency_name`, `description`, `created_at`.

## 3. FEATURE 1: MULTI-UPLOAD & DRAG-AND-DROP SORTING
**Target:** Photos & Media (Admin/Agency/Premium Talent).
- **Frontend:** Implement a `<MultiDropzone>` component allowing selection of up to 50 images.
- **Compression:** Compress all images client-side concurrently using `Promise.all` before requesting R2 Presigned URLs.
- **Sorting:** Implement `dnd-kit` or `react-beautiful-dnd` to allow users to visually drag-and-drop photos to reorder them. 
- **Backend:** Create a `PUT /api/v1/media/reorder` endpoint that accepts an array of `{ id, sort_order }` to bulk update the D1 database.

## 4. FEATURE 2: BULK YOUTUBE URL & VIEW TRACKING
**Target:** Video Assets.
- **Frontend:** Create a textarea where users can paste multiple YouTube URLs separated by newlines or commas.
- **Backend Sync:** Create an endpoint `POST /api/v1/assets/youtube/bulk`. The backend must parse the URLs, extract the Video IDs, and ideally fetch metadata (Thumbnails, View Count) via YouTube Data API (or standard oEmbed).
- **Sorting:** By default, sort videos in the public profile by `view_count` DESC, or fallback to the manual `sort_order`.

## 5. FEATURE 3: CSV IMPORT FOR CREDITS & TALENT PROFILES
**Target:** Admin & Agency.
- **Frontend:** Implement a CSV parser using `PapaParse`. 
  - *Credit Import:* Map columns (Title, Company, Date, About).
  - *Talent Import:* Allow Agencies to batch-create 100 talents at once (Name, Gender, Height, etc.).
- **Backend:** Create `POST /api/v1/agency/talents/bulk` and `POST /api/v1/talents/me/credits/bulk` to handle array inserts into D1 efficiently using batched statements.

## 6. FEATURE 4: PREMIUM GATING & DATA PROTECTION
- **Public Profile API (`GET /api/v1/public/talents/:id`):**
  - If Talent is Free AND Requester is NOT Premium Client: Mask email (`au***@gmail.com`) and phone (`08******32`). Return max 3 photos.
  - If Talent is Premium OR Requester is Premium Client: Return UNMASKED data, full social links (IG, TikTok), and all photos.
- **Middleware:** Create `requirePremium` and `requireAgencyOrAdmin` middlewares in Hono.js to protect bulk endpoints.

## 7. EXECUTION PLAN (Step-by-Step)
Please implement the code in this exact order:
1. **D1 SQL Queries:** Output the schema migrations for tables and columns (`sort_order`, `view_count`).
2. **Backend API (Hono.js):** - `requirePremium` & masking utilities.
   - Bulk Insert endpoints for CSV data (Credits & Talents).
   - Reorder endpoint (`/reorder`).
3. **Frontend CSV Parser:** Component using `PapaParse` to map and upload bulk credits.
4. **Frontend Bulk Upload & Sort:** The React component integrating dropzone and `dnd-kit` for photos/YouTube URLs.


# MISSION 3: Architect Phase 2 "Scale-Up" for Orland Management SaaS

## 1. CONTEXT & ARCHITECTURE
We are moving to Phase 2 of the Orland Management B2B/B2C Platform.
- **Roles:** Admin, Agency, Talent, Client.
- **Stack:** React/Vite, Hono.js, Cloudflare D1, R2, and introducing **Cloudflare Workers AI**.
- **Goal:** Implement Enterprise Fintech features, AI-powered Smart Matching, White-Labeling for Agencies, Profile Analytics, and Calendar Synchronization.

## 2. DATABASE SCHEMA UPDATES (Cloudflare D1)
Execute these schema changes to support Phase 2:
1. **NEW `contracts` table:** `id`, `job_id`, `talent_id`, `agency_id`, `client_id`, `status` ENUM ('draft', 'signed', 'completed'), `fee` INTEGER, `signature_talent`, `signature_client`, `created_at`.
2. **NEW `invoices` table:** `id`, `contract_id`, `amount`, `status` ENUM ('pending', 'paid', 'escrow_released'), `payment_url`.
3. **NEW `profile_views` table:** `id`, `talent_id`, `viewer_id` (nullable), `viewed_at`.
4. **`agencies` table update:** Add `custom_domain` (string, nullable) and `watermark_url` (string, nullable).
5. **NEW `availability` table:** `id`, `talent_id`, `start_date`, `end_date`, `status` ENUM ('booked', 'unavailable').

## 3. FEATURE 1: FINTECH & E-SIGNATURE (ESCROW)
**Target:** Client, Agency, Talent.
- **Backend:** - Create `POST /api/v1/contracts/generate` to create a PDF contract/agreement dynamically.
  - Create `POST /api/v1/contracts/:id/sign` to accept digital signatures (base64 images or cryptographic hashes).
  - Create payment webhooks for Escrow tracking (mock integration with Midtrans/Xendit logic).
- **Frontend:** Build a Split-Payment Dashboard showing "Pending in Escrow", "Agency Cut (20%)", and "Talent Cut (80%)".

## 4. FEATURE 2: CLOUDFLARE WORKERS AI (SMART MATCHING)
**Target:** Client.
- **Backend Setup:** Bind `@cf/meta/llama-3-8b-instruct` (or similar text-generation model) to the Hono Worker.
- **API (`POST /api/v1/ai/match`):**
  - Accept a free-text prompt from the client (e.g., "Need an Asian female, 20s, for a beauty commercial").
  - Use Cloudflare AI to parse the prompt, extract JSON parameters (Gender: Female, Ethnicity: Asian, Category: Commercial).
  - Query the D1 `talents` table using the AI-extracted parameters and return the best matches.

## 5. FEATURE 3: WHITE-LABELING & WATERMARKING
**Target:** Premium Agencies.
- **Frontend:** Build an Agency Settings page to input `custom_domain` and upload a `watermark_url` to R2.
- **Backend API:** When a client downloads a Comp Card PDF (`GET /api/v1/public/talents/:id/compcard`), check if the talent belongs to a Premium Agency. If yes, dynamically stamp the agency's watermark over the PDF/Images before returning the buffer.

## 6. FEATURE 4: ANALYTICS & GAMIFICATION
**Target:** Talent & Agency.
- **Backend:** Create a middleware that logs every request to `/api/v1/public/talents/:id` into the `profile_views` table.
- **Frontend Dashboard:** Implement `recharts` or `chart.js` to show a 7-day or 30-day line chart of Profile Views. Include a "Rank/Score" metric to gamify the experience (e.g., "You are in the top 10% of Actors this week!").

## 7. FEATURE 5: CALENDAR SYNC
**Target:** Talent & Agency.
- **Frontend:** Implement a Calendar UI (`react-big-calendar` or similar) in the Public Profile.
- **Backend:** Create CRUD endpoints for the `availability` table (`POST /api/v1/talents/me/availability`). Allow talents to mark dates in red (booked).

## 8. EXECUTION PLAN
Please output the implementation in this exact order:
1. **D1 SQL Queries:** Schema migrations for the 5 new/updated tables.
2. **Workers AI Implementation:** The Hono.js route for AI Smart Matching using Cloudflare's AI binding.
3. **Fintech Logic:** Backend routes for Contracts and E-Signature handling.
4. **Analytics Frontend:** The React component for the Profile Views chart.
5. **Calendar UI:** The React component for checking availability on the public profile.


# MISSION 4: Architect Client Project Tools (Bulk Actions, Import & Export)

## 1. CONTEXT & ARCHITECTURE
We are expanding the Orland Management SaaS platform to provide Enterprise-grade tools for Clients (Production Houses, Brands, Casting Directors).
- **Goal:** Implement Bulk Import for Casting Breakdowns, Mass Casting Invites, Bulk Status Updates, and "Casting Deck" PDF/CSV Exports.
- **Stack:** React/Vite, Hono.js, Cloudflare D1, R2, PapaParse (CSV), and a PDF generation library (e.g., pdfmake, jspdf, or html2pdf).

## 2. DATABASE SCHEMA UPDATES (Cloudflare D1)
Execute the following schema creation and alterations:
1. **`projects` table:** Ensure fields exist for `id`, `client_id`, `title`, `description`, `status` ENUM ('draft', 'active', 'closed'), `created_at`.
2. **NEW `project_roles` table:** `id`, `project_id` (FK), `role_name`, `gender`, `age_min` (INTEGER), `age_max` (INTEGER), `specific_requirements`, `created_at`.
3. **NEW `project_applications` table:** `id`, `project_role_id` (FK), `talent_id` (FK), `status` ENUM ('invited', 'applied', 'shortlisted', 'audition', 'booked', 'rejected'), `client_rating` (INTEGER DEFAULT 0), `updated_at`.

## 3. FEATURE 1: CSV CASTING BREAKDOWN IMPORT
**Target:** Client Project Dashboard.
- **Frontend:** Use `PapaParse` to allow clients to upload a CSV file containing columns: [Role Name, Gender, Min Age, Max Age, Requirements].
- **Backend:** Create a bulk insert endpoint `POST /api/v1/projects/:projectId/roles/bulk` that accepts the parsed array and uses D1 batched statements to instantly create all roles for the project.

## 4. FEATURE 2: MASS CASTING INVITES & BULK STATUS MOVE
**Target:** Client Talent Search & Kanban Board.
- **Backend:** - Create `POST /api/v1/projects/roles/:roleId/invites/bulk` accepting an array of `talent_ids`. Insert them into `project_applications` with status `invited`.
  - Create `PUT /api/v1/projects/applications/status/bulk` accepting an array of `application_ids` and a `new_status` to bulk-update their progress.
- **Frontend:** Implement a checkbox selection system in the Talent Grid. When multiple talents are selected, show a floating action bar to "Invite to Project".

## 5. FEATURE 3: "CASTING DECK" EXPORT (PDF & CSV)
**Target:** Client Shortlist Dashboard.
- **Backend (CSV Export):** Create `GET /api/v1/projects/:projectId/export/csv`. Join `project_applications`, `project_roles`, and `talents` to generate a CSV string and return it with `Content-Type: text/csv`.
- **Frontend (PDF Export):** Implement a "Download Casting Deck" button. Fetch the shortlisted talents' data (Headshot, Name, Measurements). Use a library (e.g., `jspdf` + `jspdf-autotable` or a printable hidden HTML div with `window.print()`) to generate a beautiful Presentation Deck of the selected talents.

## 6. EXECUTION PLAN (Step-by-Step)
Please output the implementation in this exact order:
1. **D1 SQL Queries:** The schema creation for `project_roles` and `project_applications`.
2. **Backend API (Hono.js):** - The bulk insert route for importing roles via CSV.
   - The mass invite and bulk status update routes.
   - The CSV Export route.
3. **Frontend CSV Import:** React component utilizing `PapaParse` to map and send the Casting Breakdown to the API.
4. **Frontend Mass Select UI:** The floating action bar logic for selecting multiple talents and sending the bulk invite payload.
5. **Frontend PDF Export:** The utility function to generate the Casting Deck presentation.


# MISSION 5: Architect Super Admin Dashboard, Bulk Operations & Global Moderation

## 1. CONTEXT & ARCHITECTURE
We are building the "Super Admin" module for the Orland Management SaaS platform.
- **Goal:** Equip the Super Admin with bulk import/export capabilities, KYC moderation, Agency supervision, Audit Logging, and a React DataGrid dashboard.
- **Stack:** React/Vite (Admin Frontend), Hono.js (Backend), Cloudflare D1 (Database), R2 (Storage), PapaParse (CSV Import), json2csv (CSV Export).

## 2. DATABASE SCHEMA UPDATES (Cloudflare D1)
Execute the following schema creation and alterations:
1. **`users` table update:** Add `kyc_status` ENUM ('pending', 'approved', 'rejected') DEFAULT 'pending', and `kyc_document_url` (string, nullable).
2. **NEW `audit_logs` table:** `id`, `actor_id` (FK to users), `action` (string, e.g., 'BULK_IMPORT_TALENTS'), `entity` (string), `details` (JSON string), `created_at`.
3. **NEW `system_settings` table:** `key` (string, PK), `value` (JSON string), `updated_at`.

## 3. FEATURE 1: SUPER ADMIN MIDDLEWARE & AUDIT LOGGING
**Backend (Hono.js):**
- Create `requireSuperAdmin` middleware. Reject any user whose `role !== 'admin'`.
- Create a utility function `logAudit(actorId, action, entity, details)` that inserts a record into the `audit_logs` table. Call this inside all Bulk/Admin routes.

## 4. FEATURE 2: BULK IMPORT & EXPORT (TALENTS & AGENCIES)
**Target:** Admin Tools Dashboard.
- **Frontend (Import):** Build a `<BulkImportTool>` component using `PapaParse`. Admin uploads a CSV to batch-create Talents or Agencies.
- **Backend (Import API):** Create `POST /api/v1/admin/talents/bulk-import`. Process array, use D1 batched inserts, and call `logAudit`.
- **Backend (Export API):** Create `GET /api/v1/admin/export/talents`. Accept query params (filters, date range). Fetch data from D1, convert to CSV string, and return with `Content-Disposition: attachment; filename="talents_export.csv"`.

## 5. FEATURE 3: KYC MODERATION & IMPERSONATION
**Backend (Hono.js):**
- **KYC Approval:** `PUT /api/v1/admin/users/:id/kyc` (accepts { status: 'approved' | 'rejected' }).
- **Impersonation:** `POST /api/v1/admin/impersonate/:userId`. Generates and returns a valid JWT token signed for the target user's ID, but keeping an `impersonator_id` payload to prevent security abuse.

## 6. FEATURE 4: ADMIN DASHBOARD UI/UX (React DataGrid)
**Target:** Admin Frontend.
- Build a generic `<AdminDataGrid>` component. Features needed:
  - Table structure with sticky headers.
  - Column sorting & Server-side pagination support.
  - A checkbox column for selecting multiple rows.
  - A Floating Action Bar that appears when rows are selected (Actions: "Bulk Approve KYC", "Bulk Delete", "Export Selected").

## 7. EXECUTION PLAN (Step-by-Step)
Please output the implementation in this exact order:
1. **D1 SQL Queries:** The schema creation for `audit_logs`, `system_settings`, and `users` alterations.
2. **Backend Security & Middleware:** Implement `requireSuperAdmin` and the `logAudit` utility.
3. **Backend Admin Endpoints:** - Bulk Import & Export routes.
   - KYC Moderation and Impersonation routes.
4. **Frontend UI Components:** - The `<AdminDataGrid>` reusable table component with bulk-select logic.
   - The Admin "Tools/Export" Dashboard page integrating the API.


# MISSION 6: Architect Admin Portfolio CRUD, KV Global Settings, and Secure Payment Config

## 1. CONTEXT & ARCHITECTURE
We are building two new modules for the Orland Management Admin Dashboard:
1. **Portfolio Management:** A CRUD interface for past projects/films (e.g., "Petaka Gunung Welirang") which will be consumed by an external Blogger (Blogspot) frontend via a public API.
2. **Global Settings:** An interface to manage App Name, SEO descriptions, Logos, WhatsApp Contacts, and Payment Gateway toggles.
- **Stack:** React/Vite (Admin Frontend), Hono.js (Backend API), Cloudflare D1 (Database), Cloudflare KV (Ultra-fast Caching).
- **Security Requirement:** Payment Gateway Server Secrets MUST NOT be stored in the database or exposed to the frontend. They will be managed strictly via Cloudflare Worker `c.env` secrets.

## 2. DATABASE & KV SCHEMA UPDATES
Execute the following schema creation:
1. **NEW `portfolios` table (D1):** `id` (PK), `title`, `slug`, `description`, `cover_image`, `gallery_images` (JSON string), `category`, `client_name`, `release_date`, `video_url`, `created_at`.
2. **`system_settings` table (D1):** Ensure this exists with `key` (PK), `value` (JSON string).
3. **Cloudflare KV Binding:** Ensure `ORLAND_CACHE` KV namespace is bound to the worker.

## 3. FEATURE 1: PORTFOLIO / LAST PROJECTS (API & Admin)
**Backend API (Hono.js):**
- **Admin CRUD:** `POST`, `PUT`, `DELETE` `/api/v1/admin/portfolios`. Handle JSON payload and R2 image URLs.
- **Public List:** `GET /api/v1/public/portfolios`. Support query parameters for filtering (e.g., `?category=Film`). This endpoint must be blazing fast and configured with CORS allowing the Blogger domain.

**Frontend Admin UI (`<PortfolioManager>`):**
- Build a DataGrid to list portfolios.
- Build a Form modal to add/edit projects, including a multi-image uploader for `gallery_images` and a Rich Text / Textarea for the popup details.

## 4. FEATURE 2: GLOBAL SETTINGS WITH KV CACHING
**Backend API (Hono.js):**
- **Public Read (`GET /api/v1/settings`):** - First, attempt to read `global_settings` from the KV binding (`c.env.ORLAND_CACHE.get('global_settings')`).
  - If null, fetch from D1, save to KV, and return.
- **Admin Update (`PUT /api/v1/admin/settings`):**
  - Accept a JSON payload with non-sensitive settings (AppName, ContactWA, ActivePaymentGateway, MidtransClientKey).
  - Update D1.
  - **CRITICAL:** Invalidate and overwrite the KV cache immediately so the next public read is fresh.

## 5. FEATURE 3: SECURE PAYMENT GATEWAY LOGIC
**Backend Enforcement:**
- DO NOT create API fields for `MIDTRANS_SERVER_KEY` or `PAYMU_SECRET` in the settings table.
- When a payment transaction is initiated (`POST /api/v1/payments/charge`), the backend must read the active gateway from D1/KV (e.g., `Midtrans`), but read the actual Server Secret strictly from the environment (`c.env.MIDTRANS_SERVER_KEY`).

**Frontend Admin UI (`<GlobalSettings>`):**
- **General Tab:** Inputs for App Name, Title, Description, Upload Logo (R2), WA Agent Talent, WA Agent Client.
- **Payment Tab:** Radio buttons/Toggles to select the Active Payment Gateway (Midtrans, Paymu, Doku). Inputs for Public/Client Keys only. Display a secure warning: "Server Secrets must be configured via Wrangler CLI."

## 6. EXECUTION PLAN
Please output the implementation in this exact order:
1. **D1 SQL Queries:** The schema creation for the `portfolios` table.
2. **Backend KV Caching Logic:** The Hono.js routes for `/settings` showing the Read-Through KV cache implementation.
3. **Backend Portfolio API:** The CRUD and public endpoints for portfolios.
4. **Frontend Admin Settings UI:** The React component for the `<GlobalSettings>` interface.
5. **Frontend Admin Portfolio UI:** The React component for managing past projects.
