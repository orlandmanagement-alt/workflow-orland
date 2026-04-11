/**
 * UTILS - ORLAND MANAGEMENT SECURITY & COMMS
 * Berfokus pada integritas data dan pengiriman email profesional.
 */

// 1. VALIDASI EMAIL (WAJIB: Menghindari serangan domain kosong)
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// 2. DATA HASHING (Mendukung algoritma lama untuk kompatibilitas)
export async function hashData(text: string): Promise<string | null> {
  if (!text) return null;
  const encoder = new TextEncoder();
  const data = encoder.encode(text + "orland_enterprise_salt_999");
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 3. TURNSTILE VERIFICATION (Cloudflare Security)
export async function verifyTurnstile(token: string | undefined, ip: string, secret: string): Promise<boolean> {
  if (!token) return false;
  const formData = new FormData();
  formData.append('secret', secret);
  formData.append('response', token);
  formData.append('remoteip', ip || '');
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: formData });
    const data: any = await res.json();
    return !!data.success;
  } catch (e) { return false; }
}

// 4. ENTERPRISE MAIL SYSTEM (Resend + MailChannels Fallback)
export async function sendMail(env: any, toEmail: string, token: string, purpose: string): Promise<{ success: boolean }> {
  // DINAMIS: Redirect kembali ke domain asal (Talent/Client)
  const host = env.TALENT_URL || "https://talent.orlandmanagement.com";
  let subject, html;

  if (purpose === 'activation') {
    subject = "🔑 Aktivasi Akun Orland Management";
    html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 30px; text-align: center;">
          <h1 style="color: #38bdf8; margin: 0; font-size: 24px; letter-spacing: -1px;">ORLAND<span style="color: white; font-weight: 200;">MANAGEMENT</span></h1>
        </div>
        <div style="padding: 40px; color: #334155; line-height: 1.6;">
          <h2 style="color: #1e293b; margin-top: 0;">Satu langkah lagi, Wira Surya!</h2>
          <p>Terima kasih telah bergabung. Silakan klik tombol di bawah untuk memverifikasi email dan mengaktifkan dashboard Anda:</p>
          <div style="text-align: center; margin: 35px 0;">
            <a href="${host}/auth/callback?token=${token}&action=activate" 
               style="background-color: #2563eb; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
               Aktifkan Akun Sekarang
            </a>
          </div>
          <p style="font-size: 13px; color: #64748b;">Link ini akan kedaluwarsa dalam 24 jam. Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
        </div>
      </div>`;
  } else if (purpose === 'reset') {
    subject = "🔄 Reset Kata Sandi Orland Management";
    html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #ef4444;">Permintaan Reset Sandi</h2>
        <p>Gunakan link di bawah ini untuk mengubah kata sandi Anda. Berlaku selama 30 menit.</p>
        <a href="${host}/auth/reset?token=${token}" style="display:inline-block; padding:12px 25px; background:#ef4444; color:white; text-decoration:none; border-radius:5px; font-weight:bold;">Atur Ulang Sandi</a>
      </div>`;
  } else {
    subject = "🛡️ Kode OTP Orland Management";
    html = `
      <div style="font-family: sans-serif; padding: 40px; text-align: center; background: #f8fafc; border-radius: 20px;">
        <p style="color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Kode Verifikasi Masuk</p>
        <h1 style="font-size: 48px; color: #2563eb; letter-spacing: 10px; margin: 20px 0;">${token}</h1>
        <p style="color: #94a3b8; font-size: 12px;">Berlaku selama 3 menit. Jangan berikan kode ini kepada siapapun.</p>
      </div>`;
  }

  // --- LOGIKA PENGIRIMAN ---
  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          from: 'Orland Auth <auth@orlandmanagement.com>', 
          to: toEmail, 
          subject, 
          html 
        })
      });
      if (res.ok) return { success: true };
    } catch (e) { console.warn("Resend gagal, beralih ke MailChannels..."); }
  }

  try {
    const mcData = {
      personalizations: [{ to: [{ email: toEmail }] }],
      from: { email: "auth@orlandmanagement.com", name: "Orland Security" },
      subject, content: [{ type: "text/html", value: html }]
    };
    const res = await fetch("https://api.mailchannels.net/tx/v1/send", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify(mcData) 
    });
    return { success: res.ok || res.status === 202 };
  } catch (e) { return { success: false }; }
}