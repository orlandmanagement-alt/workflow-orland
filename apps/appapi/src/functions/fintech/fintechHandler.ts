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

async function resolveActorIds(c: Context<{ Bindings: Bindings; Variables: Variables }>, userId: string) {
  const [client, talent] = await Promise.all([
    c.env.DB_CORE.prepare('SELECT id FROM clients WHERE user_id = ?').bind(userId).first<any>(),
    c.env.DB_CORE.prepare('SELECT id FROM talents WHERE user_id = ?').bind(userId).first<any>(),
  ]);

  return {
    clientId: client?.id as string | undefined,
    talentId: talent?.id as string | undefined,
  };
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
  const userId = c.get('userId');
  const role = c.get('userRole');

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

    if (role !== 'admin' && role !== 'superadmin') {
      const actor = await resolveActorIds(c, userId);
      const hasAccess =
        (role === 'client' && actor.clientId && actor.clientId === contract.client_id) ||
        (role === 'talent' && actor.talentId && actor.talentId === contract.talent_id);

      if (!hasAccess) {
        return c.json({ error: 'Forbidden' }, 403);
      }
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
 * GET /api/v1/contracts
 * List contracts for current user
 */
app.get('/contracts', async (c) => {
  const userId = c.get('userId');
  const role = c.get('userRole');

  try {
    let query = `
      SELECT c.*, p.title as project_title, t.name as talent_name
      FROM contracts c
      LEFT JOIN projects p ON c.job_id = p.id
      LEFT JOIN talents t ON c.talent_id = t.id
    `;

    if (role === 'client') {
      query += ` WHERE c.client_id = (SELECT id FROM clients WHERE user_id = ?)`;
    } else if (role === 'talent') {
      query += ` WHERE c.talent_id = (SELECT id FROM talents WHERE user_id = ?)`;
    } else {
      query += ` WHERE c.client_id = ? OR c.talent_id = ?`;
    }

    query += ' ORDER BY c.created_at DESC LIMIT 200';

    const rows = role === 'admin' || role === 'superadmin'
      ? await c.env.DB_CORE.prepare(query).bind(userId, userId).all<any>()
      : await c.env.DB_CORE.prepare(query).bind(userId).all<any>();

    return c.json({ status: 'success', data: rows.results || [] });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to fetch contracts' }, 500);
  }
});

/**
 * POST /api/v1/contracts/sign-bulk
 * Bulk sign contracts as current role
 */
app.post('/contracts/sign-bulk', async (c) => {
  const userId = c.get('userId');
  const userRole = c.get('userRole');

  try {
    const body = await c.req.json<{
      contract_ids: string[];
      signature_data: string;
      signer_type?: 'talent' | 'client';
    }>();

    const contractIds = Array.isArray(body.contract_ids) ? body.contract_ids : [];
    if (contractIds.length === 0) {
      return c.json({ error: 'contract_ids is required' }, 400);
    }

    const signerType = body.signer_type || (userRole === 'talent' ? 'talent' : 'client');
    const signature = body.signature_data;
    const actor = await resolveActorIds(c, userId);

    if (!signature) {
      return c.json({ error: 'signature_data is required' }, 400);
    }

    const updated: string[] = [];
    const failed: Array<{ contract_id: string; reason: string }> = [];
    const now = new Date().toISOString();

    for (const contractId of contractIds.slice(0, 100)) {
      try {
        const contractRow = await c.env.DB_CORE.prepare(
          'SELECT id, client_id, talent_id FROM contracts WHERE id = ?'
        ).bind(contractId).first<any>();

        if (!contractRow) {
          failed.push({ contract_id: contractId, reason: 'not_found' });
          continue;
        }

        const isAdmin = userRole === 'admin' || userRole === 'superadmin';
        const allowedAsTalent = signerType === 'talent' && actor.talentId === contractRow.talent_id;
        const allowedAsClient = signerType === 'client' && actor.clientId === contractRow.client_id;

        if (!isAdmin && !allowedAsTalent && !allowedAsClient) {
          failed.push({ contract_id: contractId, reason: 'forbidden' });
          continue;
        }

        const col = signerType === 'talent' ? 'signature_talent' : 'signature_client';
        await c.env.DB_CORE.prepare(`
          UPDATE contracts
          SET ${col} = ?, updated_at = ?
          WHERE id = ?
        `).bind(signature, now, contractId).run();

        const signedState = await c.env.DB_CORE.prepare(
          'SELECT signature_talent, signature_client FROM contracts WHERE id = ?'
        ).bind(contractId).first<any>();

        if (signedState?.signature_talent && signedState?.signature_client) {
          await c.env.DB_CORE.prepare(
            'UPDATE contracts SET status = ?, updated_at = ? WHERE id = ?'
          ).bind('signed', now, contractId).run();
        }

        updated.push(contractId);
      } catch {
        failed.push({ contract_id: contractId, reason: 'update_failed' });
      }
    }

    return c.json({
      status: 'success',
      data: {
        total: contractIds.length,
        signed_count: updated.length,
        failed_count: failed.length,
        contracts: updated,
        failed,
      },
    });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed bulk signing' }, 500);
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
  const userRole = c.get('userRole');

  try {
    const payload = await c.req.json<Partial<SignatureData> & {
      signature_data?: string;
      signer_type?: 'talent' | 'client';
    }>();

    const signature = payload.signature || payload.signature_data;
    const platform = payload.platform || payload.signer_type;
    const isValidPlatform = platform === 'talent' || platform === 'client';

    if (!signature || !isValidPlatform) {
      return c.json({
        error: 'Invalid signature data or platform'
      }, 400);
    }

    // Verify contract exists and user is party to it
    const targetContract = await c.env.DB_CORE.prepare(
      'SELECT talent_id, client_id FROM contracts WHERE id = ?'
    ).bind(contractId).first<any>();

    if (!targetContract) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    const actor = await resolveActorIds(c, userId);
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';

    // Verify user is authorized to sign
    if (!isAdmin && platform === 'talent' && actor.talentId !== targetContract.talent_id) {
      return c.json({ error: 'Unauthorized to sign as talent' }, 403);
    }
    if (!isAdmin && platform === 'client' && actor.clientId !== targetContract.client_id) {
      return c.json({ error: 'Unauthorized to sign as client' }, 403);
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
  const userId = c.get('userId');
  const role = c.get('userRole');

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

    if (role !== 'admin' && role !== 'superadmin') {
      const actor = await resolveActorIds(c, userId);
      const hasAccess =
        (role === 'client' && actor.clientId && actor.clientId === invoice.client_id) ||
        (role === 'talent' && actor.talentId && actor.talentId === invoice.talent_id);

      if (!hasAccess) {
        return c.json({ error: 'Forbidden' }, 403);
      }
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
 * GET /api/v1/invoices
 * List invoices for current user
 */
app.get('/invoices', async (c) => {
  const userId = c.get('userId');
  const role = c.get('userRole');

  try {
    let query = `
      SELECT i.*, c.id as contract_id, t.name as talent_name
      FROM invoices i
      LEFT JOIN contracts c ON i.contract_id = c.id
      LEFT JOIN talents t ON c.talent_id = t.id
    `;

    if (role === 'client') {
      query += ` WHERE c.client_id = (SELECT id FROM clients WHERE user_id = ?)`;
    } else if (role === 'talent') {
      query += ` WHERE c.talent_id = (SELECT id FROM talents WHERE user_id = ?)`;
    } else {
      query += ` WHERE c.client_id = ? OR c.talent_id = ?`;
    }

    query += ` ORDER BY i.created_at DESC LIMIT 200`;

    const rows = role === 'admin' || role === 'superadmin'
      ? await c.env.DB_CORE.prepare(query).bind(userId, userId).all<any>()
      : await c.env.DB_CORE.prepare(query).bind(userId).all<any>();

    return c.json({ status: 'success', data: rows.results || [] });
  } catch (error) {
    return c.json({ status: 'error', message: 'Failed to fetch invoices' }, 500);
  }
});

/**
 * POST /api/v1/invoices/:id/payment
 * Process payment simulation (mock Xendit/Midtrans webhook)
 */
app.post('/invoices/:id/payment', async (c) => {
  const invoiceId = c.req.param('id');
  const userId = c.get('userId');
  const role = c.get('userRole');

  try {
    const payload = await c.req.json<{
      paymentMethod?: string;
      payment_method?: string;
      referenceId?: string;
      reference_id?: string;
    }>();

    const paymentMethod = payload.paymentMethod || payload.payment_method || 'bank_transfer';
    const referenceId = payload.referenceId || payload.reference_id || '';

    const invoice = await c.env.DB_CORE.prepare(`
      SELECT i.contract_id, i.amount, c.client_id
      FROM invoices i
      LEFT JOIN contracts c ON c.id = i.contract_id
      WHERE i.id = ?
    `).bind(invoiceId).first<any>();

    if (!invoice) {
      return c.json({ error: 'Invoice not found' }, 404);
    }

    if (role !== 'admin' && role !== 'superadmin') {
      const actor = await resolveActorIds(c, userId);
      if (role !== 'client' || actor.clientId !== invoice.client_id) {
        return c.json({ error: 'Forbidden' }, 403);
      }
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
    `).bind('completed', now, invoice.contract_id).run();

    return c.json({
      status: 'success',
      message: 'Payment processed successfully',
      data: {
        invoiceId,
        status: 'paid',
        amount: invoice.amount,
        paymentMethod,
        referenceId,
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
