// ── Send Hint Email via SendGrid ──
// Triggered when hint form is submitted via Netlify Forms webhook

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'nelly@jewelrybynelly.com';

  if (!SENDGRID_API_KEY) {
    return { statusCode: 500, body: 'Missing SENDGRID_API_KEY' };
  }

  try {
    const payload = JSON.parse(event.body);
    const data = payload.payload || payload;

    const recipientName  = data['recipient-name']  || '';
    const recipientEmail = data['recipient-email']  || '';
    const productName    = data['product-name']     || 'a beautiful piece';
    const productUrl     = data['product-url']      || 'https://nellycreativestudios.com/pages/boutique.html';
    const message        = data['message']          || '';

    if (!recipientEmail) {
      return { statusCode: 400, body: 'Missing recipient email' };
    }

    const greeting = recipientName ? `Hi ${recipientName},` : 'Hi there,';
    const personalNote = message
      ? `<p style="font-size:16px;line-height:1.8;color:#1B2A4A;margin:0 0 24px">${message}</p>`
      : `<p style="font-size:16px;line-height:1.8;color:#1B2A4A;margin:0 0 24px">Someone thought of you and wanted to share this piece from Nelly Creative Studios.</p>`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F5F0;font-family:'Georgia',serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F0;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;max-width:560px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:#0A0A0A;padding:32px 40px;text-align:center">
            <p style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.3em;text-transform:uppercase;color:#B8962E;margin:0">Nelly Creative Studios</p>
            <p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin:6px 0 0;font-family:Arial,sans-serif">New York City</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:48px 40px 32px">
            <p style="font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:#B8962E;margin:0 0 16px;font-family:Arial,sans-serif">A Hint Just For You</p>
            <p style="font-size:24px;font-weight:400;color:#0A0A0A;margin:0 0 32px;line-height:1.3">${greeting}</p>
            ${personalNote}
            <p style="font-size:15px;line-height:1.8;color:#555;margin:0 0 32px;font-family:Arial,sans-serif">They have their eye on something special and wanted you to see it.</p>

            <!-- Product block -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E8E8;margin-bottom:32px">
              <tr>
                <td style="padding:24px">
                  <p style="font-size:13px;letter-spacing:0.15em;text-transform:uppercase;color:#555;margin:0 0 8px;font-family:Arial,sans-serif">The Piece</p>
                  <p style="font-size:17px;color:#0A0A0A;margin:0 0 20px;line-height:1.4">${productName}</p>
                  <a href="${productUrl}" style="display:inline-block;background:#B8962E;color:#0A0A0A;text-decoration:none;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;padding:14px 28px;font-family:Arial,sans-serif">View This Piece →</a>
                </td>
              </tr>
            </table>

            <p style="font-size:13px;line-height:1.8;color:#999;margin:0;font-family:Arial,sans-serif">Questions? Reply to this email or write to <a href="mailto:${FROM_EMAIL}" style="color:#B8962E">${FROM_EMAIL}</a></p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F5F5F0;padding:24px 40px;text-align:center;border-top:1px solid #E8E8E8">
            <p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#999;margin:0;font-family:Arial,sans-serif">Nelly Creative Studios · Fine Jewelry · New York City</p>
            <p style="font-size:11px;color:#BBB;margin:8px 0 0;font-family:Arial,sans-serif">You received this because someone wanted to share a piece with you.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const textBody = `${greeting}\n\n${message || 'Someone thought of you and wanted to share this piece from Nelly Creative Studios.'}\n\n${productName}\n${productUrl}\n\nQuestions? Email ${FROM_EMAIL}`;

    // Send via SendGrid
    const sgResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: recipientEmail, name: recipientName || undefined }]
        }],
        from: { email: FROM_EMAIL, name: 'Nelly Creative Studios' },
        reply_to: { email: FROM_EMAIL, name: 'Nelly Creative Studios' },
        subject: `Someone has their eye on something special for you`,
        content: [
          { type: 'text/plain', value: textBody },
          { type: 'text/html',  value: htmlBody }
        ]
      })
    });

    if (sgResponse.status >= 400) {
      const err = await sgResponse.text();
      console.error('SendGrid error:', err);
      return { statusCode: 500, body: 'Email send failed: ' + err };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error('send-hint error:', err);
    return { statusCode: 500, body: err.message };
  }
};
