// KRUSIAL: Mempertahankan algoritma lama agar password user lama tidak rusak
export async function hashData(text: string): Promise<string | null> {
  if (!text) return null;
  const encoder = new TextEncoder();
  const data = encoder.encode(text + "orland_enterprise_salt_999");
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

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

export async function sendMail(env: any, toEmail: string, token: string, purpose: string): Promise<{ success: boolean }> {
  const host = "https://sso.orlandmanagement.com";
  let subject, html;

  if (purpose === 'activation') {
    subject = "Aktivasi Akun Orland Management";
    html = `<div style="font-family:sans-serif; padding:20px; color:#333;"><h2>Satu Langkah Lagi!</h2><p>Klik tombol di bawah ini untuk mengaktifkan akun Anda (Berlaku 24 Jam):</p><br><a href="${host}/?activation_token=${token}" style="background-color:#2563eb; color:white; padding:12px 24px; text-decoration:none; border-radius:5px; font-weight:bold; display:inline-block;">Aktifkan Akun Saya</a></div>`;
  } else if (purpose === 'reset') {
    subject = "Reset Password Orland Management";
    html = `<div style="font-family:sans-serif; padding:20px; color:#333;"><h2>Reset Password</h2><p>Link ini berlaku selama 30 Menit.</p><br><a href="${host}/?reset_token=${token}" style="background-color:#ef4444; color:white; padding:12px 24px; text-decoration:none; border-radius:5px; font-weight:bold; display:inline-block;">Reset Password Sekarang</a></div>`;
  } else {
    subject = "Kode OTP Orland Management";
    html = `<div style="font-family:sans-serif; padding:20px; color:#333;"><h2>Verifikasi Keamanan</h2><p>Berikut kode OTP Anda (Berlaku 3 Menit):</p><h1 style="letter-spacing:5px; color:#2563eb;">${token}</h1></div>`;
  }

  if (env.RESEND_API_KEY) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'Orland Management <no-reply@orlandmanagement.com>', to: toEmail, subject, html })
      });
      if (resendRes.ok) return { success: true };
    } catch (e) {}
  }
  try {
    const mcData = {
      personalizations: [{ to: [{ email: toEmail }] }],
      from: { email: "no-reply@orlandmanagement.com", name: "Orland Security" },
      subject, content: [{ type: "text/html", value: html }]
    };
    const mcRes = await fetch("https://api.mailchannels.net/tx/v1/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mcData) });
    return { success: mcRes.ok || mcRes.status === 202 };
  } catch (e) { return { success: false }; }
}
