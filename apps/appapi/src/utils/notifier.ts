export const sendNotification = async (env: any, payload: { to: string, type: 'wa' | 'email', message: string }) => {
  console.log(`[NOTIF] Mengirim ${payload.type} ke ${payload.to}: ${payload.message}`);
  
  // LOGIKA EMAIL (via Resend.com)
  if (payload.type === 'email' && env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Orland Management <system@orlandmanagement.com>',
        to: payload.to,
        subject: 'Update Status Proyek Orland',
        html: `<p>${payload.message}</p>`
      })
    });
  }

  // LOGIKA WHATSAPP (Simulasi via Webhook / API Pihak ke-3)
  if (payload.type === 'wa') {
    // Di sini Anda bisa menembak API seperti Fonnte / WooWA / Twilio
    // fetch('https://api.wa-gateway.com/send', { ... })
  }
};
