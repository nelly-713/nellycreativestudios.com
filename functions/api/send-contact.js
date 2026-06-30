export async function onRequestPost(context) {
  const SENDGRID_API_KEY = context.env.SENDGRID_API_KEY;
  const FROM_EMAIL = context.env.FROM_EMAIL || 'nelly@jewelrybynelly.com';
  if (!SENDGRID_API_KEY) return new Response('Missing SENDGRID_API_KEY', {status:500});

  try {
    const payload = await context.request.json();
    const data = payload.payload || payload;
    const firstName = data['first-name'] || '';
    const lastName = data['last-name'] || '';
    const email = data['email'] || '';
    const enquiry = data['enquiry-type'] || '';
    const message = data['message'] || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'there';

    if (!email) return new Response('Missing email', {status:400});

    const htmlBody = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F0;font-family:Georgia,serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F0;padding:40px 20px"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;max-width:560px;width:100%"><tr><td style="background:#0A0A0A;padding:32px 40px;text-align:center"><p style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.3em;text-transform:uppercase;color:#B8962E;margin:0">Nelly Creative Studios</p></td></tr><tr><td style="padding:48px 40px 32px"><p style="font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:#B8962E;margin:0 0 16px;font-family:Arial,sans-serif">Message Received</p><p style="font-size:22px;color:#0A0A0A;margin:0 0 24px">Hi ${fullName},</p><p style="font-size:15px;line-height:1.9;color:#555;margin:0 0 24px;font-family:Arial,sans-serif">Thank you for reaching out to Nelly Creative Studios. We've received your message and will be in touch with you shortly — typically within 1–2 business days.</p><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E8E8;margin-bottom:32px"><tr><td style="padding:24px"><p style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#999;margin:0 0 16px;font-family:Arial,sans-serif">Your Message</p>${enquiry ? '<p style="font-size:13px;color:#B8962E;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px;font-family:Arial,sans-serif">' + enquiry + '</p>' : ''}<p style="font-size:14px;line-height:1.8;color:#333;margin:0;font-family:Arial,sans-serif">${message}</p></td></tr></table><p style="font-size:13px;line-height:1.8;color:#999;margin:0;font-family:Arial,sans-serif">In the meantime, explore our collection at <a href="https://nellycreativestudios.com/pages/boutique.html" style="color:#B8962E">nellycreativestudios.com</a></p></td></tr><tr><td style="background:#F5F5F0;padding:24px 40px;text-align:center;border-top:1px solid #E8E8E8"><p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#999;margin:0;font-family:Arial,sans-serif">Nelly Creative Studios · Fine Jewelry · New York City</p></td></tr></table></td></tr></table></body></html>`;

    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {'Authorization': 'Bearer ' + SENDGRID_API_KEY, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        personalizations: [{to: [{email, name: fullName}]}],
        from: {email: FROM_EMAIL, name: 'Nelly Creative Studios'},
        reply_to: {email: FROM_EMAIL, name: 'Nelly Creative Studios'},
        subject: 'We received your message — Nelly Creative Studios',
        content: [
          {type: 'text/plain', value: `Hi ${fullName},\n\nThank you for reaching out. We'll be in touch within 1–2 business days.\n\nNelly Creative Studios`},
          {type: 'text/html', value: htmlBody}
        ]
      })
    });

    if (sgRes.status >= 400) {
      const err = await sgRes.text();
      return new Response('Email failed: ' + err, {status:500});
    }
    return new Response(JSON.stringify({success:true}), {status:200, headers:{'Content-Type':'application/json'}});
  } catch(err) {
    return new Response(err.message, {status:500});
  }
}