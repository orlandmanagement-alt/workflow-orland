/**
 * Fintech & E-Signature Handler
 * Manages contracts, digital signatures, and payment workflows
 */

import { Hono } from 'hono';
import { Context } from 'hono';
import type { Bindings, Variables } from '../../index';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

interface ContractData {
  job_id: string;
  talent_id: string;
  agency_id?: string;
  client_id: string;
  fee: number;
  description?: string;
}

interface SignatureData {
  signature: string; // Base64 encoded signature image
  timestamp: string;
  platform: 'talent' | 'client';
}

/**
 * ===== CONTRACT MANAGEMENT =====
 */

/**
 * POST /api/v1/contracts/generate
 * Create a new contract for a booking
 */
app.post('/contracts/generate', async (c) => {
  const userId = c.get('userId');
  const userRole = c.get('userRole');

  try {
    const contractData: ContractData = await c.req.json();

    // Verify user is either the client or involved admin/agency
    if (userRole === 'client') {
      const clientVerify = await c.env.DB_CORE.prepare(
        'SELECT id FROM clients WHERE user_id = ?'
      ).bind(userId).first<any>();

      if (!clientVerify || clientVerify.id !== contractData.client_id) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
    }

    const contractId = `contract_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Verify job and talents exist
    const [jobExists, talentExists] = await Promise.all([
      c.env.DB_CORE.prepare('SELECT id, title FROM projects WHERE id = ?')
        .bind(contractData.job_id).first<any>(),
      c.env.DB_CORE.prepare('SELECT id, name FROM talents WHERE id = ?')
        .bind(contractData.talent_id).first<any>()
    ]);

    if (!jobExists || !talentExists) {
      return c.json({ error: 'Job or talent not found' }, 404);
    }

    const now = new Date().toISOString();

    // Create contract
    await c.env.DB_CORE.prepare(`
      INSERT INTO contracts (id, job_id, talent_id, agency_id, client_id, fee, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      contractId,
      contractData.job_id,
      contractData.talent_id,
      contractData.agency_id || null,
      contractData.client_id,
      contractData.fee,
      'draft',
      now,
      now
    ).run();

    // Create associated invoice with 50% escrow hold
    const invoiceId = `invoice_${contractId}`;
    await c.env.DB_CORE.prepare(`
      INSERT INTO invoices (id, contract_id, amount, status, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      invoiceId,
      contractId,
      Math.floor(contractData.fee * 0.5), // Escrow 50%
      'pending',
      now
    ).run();

    return c.json({
      status: 'success',
      message: 'Contract created successfully',
      data: {
        contractId,
        invoiceId,
        jobTitle: jobExists.title,
        talentName: talentExists.name,
        fee: contractData.fee,
        escrowAmount: Math.floor(contractData.fee * 0.5),
        status: 'draft'
      }
    }, 201);
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to generate contract' }, 500);
  }
});

/**
 * GET /api/v1/contracts/:id
 * Get contract details
 */
app.get('/contracts/:id', async (c) => {
  const contractId = c.req.param('id');

  try {
    const contract = await c.env.DB_CORE.prepare(`
      SELECT 
        c.*,
        p.title as job_title,
        t.name as talent_name,
        a.agency_name,
        cl.name as client_name
      FROM contracts c
      LEFT JOIN projects p ON c.job_id = p.id
      LEFT JOIN talents t ON c.talent_id = t.id
      LEFT JOIN agencies a ON c.agency_id = a.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE c.id = ?
    `).bind(contractId).first<any>();

    if (!contract) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    // Get associated invoice
    const invoice = await c.env.DB_CORE.prepare(
      'SELECT * FROM invoices WHERE contract_id = ?'
    ).bind(contractId).first<any>();

    return c.json({
      status: 'success',
      data: { ...contract, invoice }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to fetch contract' }, 500);
  }
});

/**
 * ===== DIGITAL SIGNATURES =====
 */

/**
 * POST /api/v1/contracts/:id/sign
 * Add digital signature to contract
 */
app.post('/contracts/:id/sign', async (c) => {
  const contractId = c.req.param('id');
  const userId = c.get('userId');

  try {
    const { signature, platform } = await c.req.json<SignatureData>();

    if (!signature || !['talent', 'client'].includes(platform)) {
      return c.json({
        error: 'Invalid signature data or platform'
      }, 400);
    }

    // Verify contract exists and user is party to it
    const contract = await c.env.DB_CORE.prepare(
      'SELECT talent_id, client_id FROM contracts WHERE id = ?'
    ).bind(contractId).first<any>();

    if (!contract) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    // Verify user is authorized to sign
    if (platform === 'talent' && contract.talent_id !== userId) {
      return c.json({ error: 'Unauthorized to sign as talent' }, 403);
    }

    // Add signature
    const columnName = platform === 'talent' ? 'signature_talent' : 'signature_client';
    const now = new Date().toISOString();

    await c.env.DB_CORE.prepare(`
      UPDATE contracts 
      SET ${columnName} = ?, updated_at = ?
      WHERE id = ?
    `).bind(signature, now, contractId).run();

    // Check if both parties have signed
    const updatedContract = await c.env.DB_CORE.prepare(
      'SELECT signature_talent, signature_client FROM contracts WHERE id = ?'
    ).bind(contractId).first<any>();

    const bothSigned = updatedContract.signature_talent && updatedContract.signature_client;

    if (bothSigned) {
      // Update contract status to signed
      await c.env.DB_CORE.prepare(
        'UPDATE contracts SET status = ?, updated_at = ? WHERE id = ?'
      ).bind('signed', now, contractId).run();

      // Update invoice status to escrow
      await c.env.DB_CORE.prepare(
        'UPDATE invoices SET status = ? WHERE contract_id = ?'
      ).bind('escrow_released', contractId).run();
    }

    return c.json({
      status: 'success',
      message: `${platform} signature added`,
      data: {
        contractId,
        signed: platform,
        bothSigned,
        contractStatus: bothSigned ? 'signed' : 'awaiting signatures'
      }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to add signature' }, 500);
  }
});

/**
 * ===== PAYMENT & ESCROW MANAGEMENT =====
 */

/**
 * GET /api/v1/invoices/:id
 * Get invoice details with payment status
 */
app.get('/invoices/:id', async (c) => {
  const invoiceId = c.req.param('id');

  try {
    const invoice = await c.env.DB_CORE.prepare(`
      SELECT 
        i.*,
        c.talent_id,
        c.client_id,
        c.agency_id,
        c.fee,
        t.name as talent_name
      FROM invoices i
      LEFT JOIN contracts c ON i.contract_id = c.id
      LEFT JOIN talents t ON c.talent_id = t.id
      WHERE i.id = ?
    `).bind(invoiceId).first<any>();

    if (!invoice) {
      return c.json({ error: 'Invoice not found' }, 404);
    }

    // Calculate split
    const talentCut = Math.floor(invoice.fee * 0.8); // Talent gets 80%
    const agencyCut = Math.floor(invoice.fee * 0.1); // Agency gets 10%
    const platformCut = invoice.fee - talentCut - agencyCut; // Platform gets remainder

    return c.json({
      status: 'success',
      data: {
        ...invoice,
        split: {
          talent: talentCut,
          agency: agencyCut,
          platform: platformCut
        }
      }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to fetch invoice' }, 500);
  }
});

/**
 * POST /api/v1/invoices/:id/payment
 * Process payment simulation (mock Xendit/Midtrans webhook)
 */
app.post('/invoices/:id/payment', async (c) => {
  const invoiceId = c.req.param('id');
  const userId = c.get('userId');

  try {
    const { paymentMethod, referenceId } = await c.req.json<{
      paymentMethod: string;
      referenceId: string;
    }>();

    const invoice = await c.env.DB_CORE.prepare(
      'SELECT contract_id, amount FROM invoices WHERE id = ?'
    ).bind(invoiceId).first<any>();

    if (!invoice) {
      return c.json({ error: 'Invoice not found' }, 404);
    }

    const now = new Date().toISOString();

    // Update invoice status to paid
    await c.env.DB_CORE.prepare(`
      UPDATE invoices 
      SET status = ?, updated_at = ?
      WHERE id = ?
    `).bind('paid', now, invoiceId).run();

    // Update contract status to completed
    await c.env.DB_CORE.prepare(`
      UPDATE contracts 
      SET status = ?, updated_at = ?
      WHERE id = ?
    `).bind('completed', invoice.contract_id, now).run();

    return c.json({
      status: 'success',
      message: 'Payment processed successfully',
      data: {
        invoiceId,
        status: 'paid',
        amount: invoice.amount,
        paymentMethod,
        processedAt: now
      }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to process payment' }, 500);
  }
});

/**
 * GET /api/v1/dashboard/escrow
 * Get escrow summary for client
 */
app.get('/dashboard/escrow', async (c) => {
  const userId = c.get('userId');

  try {
    // Get all contracts for this client
    const contracts = await c.env.DB_CORE.prepare(`
      SELECT 
        c.id,
        c.status,
        c.fee,
        t.name,
        i.status as invoice_status,
        i.amount
      FROM contracts c
      LEFT JOIN talents t ON c.talent_id = t.id
      LEFT JOIN invoices i ON c.id = i.contract_id
      WHERE c.client_id = (SELECT id FROM clients WHERE user_id = ?)
      ORDER BY c.created_at DESC
    `).bind(userId).all<any>();

    // Calculate totals
    let totalEscrow = 0;
    let totalPaid = 0;
    let totalPending = 0;
    const holdingContracts = [];

    for (const contract of contracts.results) {
      if (contract.invoice_status === 'escrow_released') {
        holdingContracts.push({
          contractId: contract.id,
          talent: contract.name,
          amount: contract.fee,
          status: 'In Transit'
        });
        totalEscrow += contract.fee;
      } else if (contract.invoice_status === 'paid') {
        totalPaid += contract.amount;
      } else {
        totalPending += contract.amount;
      }
    }

    return c.json({
      status: 'success',
      data: {
        summary: {
          totalEscrow,
          totalPaid,
          totalPending,
          escrowCount: holdingContracts.length
        },
        holding: holdingContracts
      }
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to fetch escrow data' }, 500);
  }
});

export default app;
