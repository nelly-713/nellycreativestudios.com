export async function onRequestPost(context) {
  const RESEND_API_KEY = context.env.RESEND_API_KEY;
  const FROM_EMAIL = context.env.FROM_EMAIL || 'nelly@jewelrybynelly.com';
  if (!RESEND_API_KEY) return new Response('Missing RESEND_API_KEY', {status:500});

  try {
    const data = await context.request.json();
    const recipientName = data['recipient-name'] || '';
    const recipientEmail = data['recipient-email'] || '';
    const productName = data['product-name'] || 'a beautiful piece';
    const productUrl = data['product-url'] || 'https://nellycreativestudios.com/pages/boutique.html';
    const message = data['message'] || '';

    if (!recipientEmail) return new Response('Missing recipient email', {status:400});

    const greeting = recipientName ? 'Hi ' + recipientName + ',' : 'Hi there,';
    const personalNote = message
      ? '<p style="font-size:16px;line-height:1.8;color:#1B2A4A;margin:0 0 24px">' + message + '</p>'
      : '<p style="font-size:16px;line-height:1.8;color:#1B2A4A;margin:0 0 24px">Someone thought of you and wanted to share this piece from Nelly Creative Studios.</p>';

    const htmlBody = '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F0;font-family:Georgia,serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F0;padding:40px 20px"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;max-width:560px;width:100%"><tr><td style="background:#0A0A0A;padding:32px 40px;text-align:center"><p style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.3em;text-transform:uppercase;color:#B8962E;margin:0">Nelly Creative Studios</p><p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin:6px 0 0;font-family:Arial,sans-serif">New York City</p></td></tr><tr><td style="padding:48px 40px 32px"><p style="font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:#B8962E;margin:0 0 16px;font-family:Arial,sans-serif">A Hint Just For You</p><p style="font-size:24px;font-weight:400;color:#0A0A0A;margin:0 0 32px;line-height:1.3">' + greeting + '</p>' + personalNote + '<p style="font-size:15px;line-height:1.8;color:#555;margin:0 0 32px;font-family:Arial,sans-serif">They have their eye on something special and wanted you to see it.</p><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E8E8;margin-bottom:32px"><tr><td style="padding:24px"><p style="font-size:13px;letter-spacing:0.15em;text-transform:uppercase;color:#555;margin:0 0 8px;font-family:Arial,sans-serif">The Piece</p><p style="font-size:17px;color:#0A0A0A;margin:0 0 20px;line-height:1.4">' + productName + '</p><a href="' + productUrl + '" style="display:inline-block;background:#B8962E;color:#0A0A0A;text-decoration:none;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;padding:14px 28px;font-family:Arial,sans-serif">View This Piece &rarr;</a></td></tr></table><p style="font-size:13px;line-height:1.8;color:#999;margin:0;font-family:Arial,sans-serif">Questions? Reply to this email or write to <a href="mailto:' + FROM_EMAIL + '" style="color:#B8962E">' + FROM_EMAIL + '</a></p></td></tr><tr><td style="background:#F5F5F0;padding:24px 40px;text-align:center;border-top:1px solid #E8E8E8"><p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#999;margin:0;font-family:Arial,sans-serif">Nelly Creative Studios &middot; Fine Jewelry &middot; New York City</p></td></tr></table></td></tr></table></body></html>';

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {'Authorization': 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        from: `Nelly Creative Studios <${FROM_EMAIL}>`,
        to: [recipientEmail],
        reply_to: FROM_EMAIL,
        subject: 'Someone has their eye on something special for you',
        text: greeting + '\n\n' + (message || 'Someone thought of you.') + '\n\n' + productName + '\n' + productUrl,
        html: htmlBody
      })
    });

    if (resendRes.status >= 400) {
      const err = await resendRes.text();
      return new Response('Email send failed: ' + err, {status:500});
    }

    // Notify Nelly too — the old Netlify Forms notification path doesn't exist on Cloudflare
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {'Authorization': 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        from: `Nelly Creative Studios Website <${FROM_EMAIL}>`,
        to: [FROM_EMAIL],
        subject: 'A hint was sent — ' + productName,
        text: `A "hint" was sent via the website.\n\nRecipient: ${recipientName || '(no name given)'} <${recipientEmail}>\nPiece: ${productName}\nLink: ${productUrl}\nNote: ${message || '(none)'}`
      })
    }).catch(function() { /* recipient email already sent; don't fail the request over the internal copy */ });

    return new Response(JSON.stringify({success:true}), {status:200, headers:{'Content-Type':'application/json'}});
  } catch(err) {
    return new Response(err.message, {status:500});
  }
}