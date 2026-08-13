/**
 * KUMPULAN SKEMA DATABASE KEUANGAN (D1 SQL TRANSLATION)
 * Berikut adalah representasi schema Table yang harus ada di Backend Hono/D1.
 */

/* 
-- Tabel Contracts (Kontrak Digital)
CREATE TABLE contracts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  client_id TEXT NOT NULL REFERENCES users(id),
  talent_id TEXT NOT NULL REFERENCES users(id),
  role_id TEXT NOT NULL REFERENCES project_roles(id),
  fee_agreed INTEGER NOT NULL,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'signed', 'cancelled')),
  talent_signature_base64 TEXT,
  talent_typed_signature TEXT,
  talent_signed_at DATETIME,
  talent_ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Invoices (Tagihan B2B Klien)
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES users(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  contract_ids JSON NOT NULL, -- Array dari ID kontrak untuk roll-up 1 invoice > multiple talent
  subtotal_fee INTEGER NOT NULL,
  agency_fee INTEGER NOT NULL, -- (Subtotal * 10%)
  tax_amount INTEGER NOT NULL, -- (Subtotal + Agency Fee) * 11% PPN
  grand_total INTEGER NOT NULL,
  status TEXT DEFAULT 'unpaid' CHECK(status IN ('unpaid', 'processing', 'paid', 'overdue')),
  payment_proof_url TEXT,
  due_date DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  paid_at DATETIME
);

-- Tabel Payouts (Sistem Distribusi Cuan Talent)
CREATE TABLE payouts (
  id TEXT PRIMARY KEY,
  talent_id TEXT NOT NULL REFERENCES users(id),
  invoice_id TEXT NOT NULL REFERENCES invoices(id), 
  contract_id TEXT NOT NULL REFERENCES contracts(id),
  amount INTEGER NOT NULL, 
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'cleared', 'requested', 'transferred')),
  requested_at DATETIME,
  transferred_at DATETIME,
  transfer_proof_url TEXT,
  bank_account_info JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
*/

export interface FinanceContract {
  id: string;
  project_id: string;
  project_title: string;
  client_name: string;
  talent_id: string;
  role_name: string;
  fee_agreed: number; // Disimpan utuh, potongan ditangani backend
  status: 'draft' | 'sent' | 'signed';
  talent_signed_at?: string;
}

export interface Invoice {
  id: string; // Ex: INV-2026-OM-001
  project_id: string;
  project_name: string;
  client_name: string;
  client_address: string;
  contract_ids: string[];
  subtotal_fee: number;
  agency_fee: number; // 10%
  tax_amount: number; // 11% PPN dari subtotal+agency
  grand_total: number;
  status: 'unpaid' | 'processing' | 'paid';
  due_date: string;
}

export interface TalentBalanceInfo {
  total_balance: number;   // Uang 'cleared' siap ditarik
  pending_clearance: number; // Uang kontrak yang Invoicenya belum dilunasi klien
}

export interface PayoutRequest {
  id: string;
  amount: number;
  status: 'pending' | 'requested' | 'transferred';
  requested_at: string;
  transferred_at?: string;
}
