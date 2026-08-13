/**
 * Email Notification Service
 * Purpose: Send invitation and transactional emails
 */

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export interface InviteEmailData {
  talent_email: string;
  talent_name: string;
  project_title: string;
  company_name: string;
  project_description?: string;
  budget?: string;
  deadline?: string;
  match_score?: number;
  match_reason?: string;
  invite_url: string;
  expires_in_days: number;
}

export class EmailNotificationService {
  private senderName: string = 'Orland Management';
  private senderEmail: string = 'noreply@orlandmanagement.com';

  /**
   * Send talent invitation email
   */
  async sendInviteEmail(
    fetchFn: typeof fetch,
    emailServiceUrl: string,
    data: InviteEmailData,
    apiKey: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const template = this.generateInviteEmailTemplate(data);

      const response = await fetchFn(`${emailServiceUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          to: data.talent_email,
          from: {
            email: this.senderEmail,
            name: this.senderName,
          },
          subject: template.subject,
          html: template.htmlBody,
          text: template.textBody,
          metadata: {
            type: 'talent_invite',
            talent_name: data.talent_name,
            project_title: data.project_title,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `Email service error: ${response.status}`,
        };
      }

      const result = await response.json() as any;
      return {
        success: true,
        messageId: result.id || result.message_id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmationEmail(
    fetchFn: typeof fetch,
    emailServiceUrl: string,
    data: {
      talent_email: string;
      talent_name: string;
      project_title: string;
      shoot_date: string;
      location: string;
      rate: number;
      instructions_url: string;
    },
    apiKey: string
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      const template = this.generateBookingConfirmationTemplate(data);

      const response = await fetchFn(`${emailServiceUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          to: data.talent_email,
          from: {
            email: this.senderEmail,
            name: this.senderName,
          },
          subject: template.subject,
          html: template.htmlBody,
          text: template.textBody,
          metadata: {
            type: 'booking_confirmation',
            project_title: data.project_title,
          },
        }),
      });

      if (!response.ok) {
        return { success: false };
      }

      const result = await response.json() as any;
      return {
        success: true,
        messageId: result.id || result.message_id,
      };
    } catch (error: any) {
      console.error('Failed to send booking confirmation email:', error);
      return { success: false };
    }
  }

  /**
   * Send payment notification email
   */
  async sendPaymentNotificationEmail(
    fetchFn: typeof fetch,
    emailServiceUrl: string,
    data: {
      talent_email: string;
      talent_name: string;
      amount: number;
      project_title: string;
      status: 'approved' | 'pending' | 'completed';
      transaction_id: string;
    },
    apiKey: string
  ): Promise<{ success: boolean }> {
    try {
      const template = this.generatePaymentNotificationTemplate(data);

      await fetchFn(`${emailServiceUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          to: data.talent_email,
          from: {
            email: this.senderEmail,
            name: this.senderName,
          },
          subject: template.subject,
          html: template.htmlBody,
          text: template.textBody,
          metadata: {
            type: 'payment_notification',
            status: data.status,
          },
        }),
      });

      return { success: true };
    } catch (error: any) {
      console.error('Failed to send payment notification:', error);
      return { success: false };
    }
  }

  // ============================================================================
  // EMAIL TEMPLATE GENERATORS
  // ============================================================================

  private generateInviteEmailTemplate(data: InviteEmailData): EmailTemplate {
    const expiryDate = new Date(Date.now() + data.expires_in_days * 24 * 60 * 60 * 1000)
      .toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

    const htmlBody = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px 20px;
    }
    .project-card {
      background: #f9f9f9;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .project-card h3 {
      margin: 0 0 10px 0;
      color: #667eea;
    }
    .project-details {
      font-size: 14px;
      color: #666;
      margin: 10px 0;
    }
    .cta-button {
      display: inline-block;
      background: #667eea;
      color: white;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 4px;
      margin: 20px 0;
      font-weight: bold;
      text-align: center;
    }
    .cta-button:hover {
      background: #5568d3;
    }
    .match-score {
      display: inline-block;
      background: #e3f2fd;
      color: #667eea;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      margin: 10px 0;
    }
    .footer {
      background: #f0f0f0;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Kamu Diundang untuk Sebuah Proyek!</h1>
    </div>
    
    <div class="content">
      <p>Halo <strong>${data.talent_name}</strong>,</p>
      
      <p>${data.company_name} telah memilihmu untuk berpartisipasi dalam proyek mereka. Kami percaya kamu adalah talenta yang sempurna untuk ini!</p>
      
      <div class="project-card">
        <h3>📽️ ${data.project_title}</h3>
        ${data.project_description ? `<p>${this.escapeHtml(data.project_description.substring(0, 150))}...</p>` : ''}
        <div class="project-details">
          ${data.budget ? `<div>💰 Budget: ${data.budget}</div>` : ''}
          ${data.deadline ? `<div>📅 Deadline: ${new Date(data.deadline).toLocaleDateString('id-ID')}</div>` : ''}
        </div>
      </div>

      ${data.match_score ? `
        <div style="text-align: center;">
          <span class="match-score">Match Score: ${Math.round(data.match_score)}%</span>
          ${data.match_reason ? `<p style="font-size: 13px; color: #666; margin: 10px 0;">✓ ${this.escapeHtml(data.match_reason)}</p>` : ''}
        </div>
      ` : ''}

      <p style="text-align: center;">
        <a href="${data.invite_url}" class="cta-button">Lihat Detail Proyek →</a>
      </p>
      
      <p style="color: #999; font-size: 12px;">
        Link ini berlaku hingga <strong>${expiryDate}</strong>. Jangan lewatkan kesempatan ini!
      </p>
    </div>
    
    <div class="footer">
      <p>Email ini dikirim kepada ${data.talent_email}</p>
      <p>&copy; 2026 Orland Management. Semua hak dilindungi.</p>
    </div>
  </div>
</body>
</html>
    `;

    const textBody = `
Kamu Diundang untuk Sebuah Proyek!

Halo ${data.talent_name},

${data.company_name} telah memilihmu untuk berpartisipasi dalam proyek mereka.

Proyek: ${data.project_title}
${data.project_description ? `Deskripsi: ${data.project_description.substring(0, 150)}...` : ''}
${data.budget ? `Budget: ${data.budget}` : ''}
${data.deadline ? `Deadline: ${new Date(data.deadline).toLocaleDateString('id-ID')}` : ''}

Match Score: ${data.match_score}%
${data.match_reason ? `Alasan: ${data.match_reason}` : ''}

Lihat detail proyek:
${data.invite_url}

Link ini berlaku hingga ${expiryDate}.

---
Orland Management
    `;

    return {
      subject: `Kamu Diundang: ${data.project_title} oleh ${data.company_name}`,
      htmlBody,
      textBody,
    };
  }

  private generateBookingConfirmationTemplate(data: {
    talent_name: string;
    project_title: string;
    shoot_date: string;
    location: string;
    rate: number;
    instructions_url: string;
  }): EmailTemplate {
    const shootDate = new Date(data.shoot_date).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 4px; }
    .details { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .cta { display: inline-block; background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Booking Terkonfirmasi!</h1>
    </div>
    <p>Halo ${data.talent_name},</p>
    <p>Selamat! Booking kamu untuk proyek <strong>${data.project_title}</strong> telah terkonfirmasi.</p>
    <div class="details">
      <h3>Detail Shoot:</h3>
      <p><strong>Tanggal:</strong> ${shootDate}</p>
      <p><strong>Lokasi:</strong> ${data.location}</p>
      <p><strong>Rate:</strong> Rp ${data.rate.toLocaleString('id-ID')}</p>
    </div>
    <p><a href="${data.instructions_url}" class="cta">Lihat Instruksi Lengkap →</a></p>
  </div>
</body>
</html>
    `;

    return {
      subject: `Booking Terkonfirmasi: ${data.project_title}`,
      htmlBody,
      textBody: `Booking Terkonfirmasi!\n\nHalo ${data.talent_name},\n\nBooking kamu untuk ${data.project_title} telah terkonfirmasi.\n\nTanggal: ${shootDate}\nLokasi: ${data.location}\nRate: ${data.rate}\n\nLihat instruksi: ${data.instructions_url}`,
    };
  }

  private generatePaymentNotificationTemplate(data: {
    talent_name: string;
    amount: number;
    project_title: string;
    status: 'approved' | 'pending' | 'completed';
    transaction_id: string;
  }): EmailTemplate {
    const statusLabel = {
      approved: '✅ Disetujui',
      pending: '⏳ Tertunda',
      completed: '💰 Selesai',
    }[data.status];

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 4px; }
    .amount { font-size: 32px; color: #2196F3; font-weight: bold; text-align: center; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Notifikasi Pembayaran</h1>
    </div>
    <p>Halo ${data.talent_name},</p>
    <p>Status pembayaran untuk proyek <strong>${data.project_title}</strong>:</p>
    <div class="amount">Rp ${data.amount.toLocaleString('id-ID')}</div>
    <p style="text-align: center;"><strong>${statusLabel}</strong></p>
    <p style="color: #999; font-size: 12px;">Transaction ID: ${data.transaction_id}</p>
  </div>
</body>
</html>
    `;

    return {
      subject: `Notifikasi Pembayaran: ${data.project_title}`,
      htmlBody,
      textBody: `Notifikasi Pembayaran\n\nProyek: ${data.project_title}\nNominal: Rp ${data.amount.toLocaleString('id-ID')}\nStatus: ${statusLabel}`,
    };
  }

  /**
   * HTML escape helper
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

export default EmailNotificationService;
