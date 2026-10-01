export async function onRequestPost(context) {
  const RESEND_API_KEY = context.env.RESEND_API_KEY;
  const FROM_EMAIL = context.env.FROM_EMAIL || 'nelly@nellycreativestudios.com';

  try {
    const body = await context.request.text();
    const event = JSON.parse(body);

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const amount = (pi.amount / 100).toFixed(2);
      const productName = pi.metadata?.productName || 'Fine Jewelry';
      const customerEmail = pi.receipt_email || pi.metadata?.customerEmail || '';
      const customerName = pi.shipping?.name || pi.metadata?.customerName || 'there';
      const shipping = pi.shipping?.address;
      const shippingLines = shipping
        ? [shipping.line1, shipping.line2, shipping.city, shipping.state, shipping.postal_code, shipping.country]
            .filter(Boolean).join(', ')
        : '';

      console.log('Payment succeeded:', productName, '$' + amount);

      if (RESEND_API_KEY) {
        // Notify Nelly
        const notifyRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {'Authorization': 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json'},
          body: JSON.stringify({
            from: `Nelly Creative Studios Website <${FROM_EMAIL}>`,
            to: [FROM_EMAIL],
            reply_to: customerEmail || FROM_EMAIL,
            subject: `New order: ${productName} — $${amount}`,
            text: `New purchase on nellycreativestudios.com\n\nItem: ${productName}\nAmount: $${amount}\nCustomer: ${customerName}\nEmail: ${customerEmail || 'n/a'}\nShipping: ${shippingLines || 'n/a'}\n\nPayment Intent ID: ${pi.id}`
          })
        });
        if (!notifyRes.ok) {
          console.log('Owner notification email failed:', await notifyRes.text());
        }

        // Confirm with the customer, if we have their email
        if (customerEmail) {
          const customerRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {'Authorization': 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json'},
            body: JSON.stringify({
              from: `Nelly Creative Studios <${FROM_EMAIL}>`,
              to: [customerEmail],
              reply_to: FROM_EMAIL,
              subject: 'Order confirmed — Nelly Creative Studios',
              text: `Hi ${customerName},\n\nThank you for your purchase! We've confirmed your order for ${productName} ($${amount}).\n\n${shippingLines ? 'Shipping to: ' + shippingLines + '\n\n' : ''}We'll be in touch shortly with next steps.\n\nNelly Creative Studios`,
              html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F5F0;font-family:Georgia,serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F0;padding:40px 20px"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;max-width:560px;width:100%"><tr><td style="background:#0A0A0A;padding:32px 40px;text-align:center"><p style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.3em;text-transform:uppercase;color:#B8962E;margin:0">Nelly Creative Studios</p></td></tr><tr><td style="padding:48px 40px 32px"><p style="font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:#B8962E;margin:0 0 16px;font-family:Arial,sans-serif">Order Confirmed</p><p style="font-size:22px;color:#0A0A0A;margin:0 0 24px">Hi ${customerName},</p><p style="font-size:15px;line-height:1.9;color:#555;margin:0 0 24px;font-family:Arial,sans-serif">Thank you for your purchase. We're preparing your order and will be in touch shortly with next steps.</p><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E8E8;margin-bottom:32px"><tr><td style="padding:24px"><p style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#999;margin:0 0 16px;font-family:Arial,sans-serif">Order Summary</p><p style="font-size:14px;line-height:1.8;color:#333;margin:0 0 4px;font-family:Arial,sans-serif">${productName}</p><p style="font-size:14px;line-height:1.8;color:#333;margin:0;font-family:Arial,sans-serif">$${amount}</p></td></tr></table><p style="font-size:13px;line-height:1.8;color:#999;margin:0;font-family:Arial,sans-serif">Questions about your order? Just reply to this email.</p></td></tr><tr><td style="background:#F5F5F0;padding:24px 40px;text-align:center;border-top:1px solid #E8E8E8"><p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#999;margin:0;font-family:Arial,sans-serif">Nelly Creative Studios · Fine Jewelry · New York City</p></td></tr></table></td></tr></table></body></html>`
            })
          });
          if (!customerRes.ok) {
            console.log('Customer confirmation email failed:', await customerRes.text());
          }
        }
      } else {
        console.log('RESEND_API_KEY not set — skipping order emails');
      }
    }

    return new Response(JSON.stringify({received: true}), {status:200, headers:{'Content-Type':'application/json'}});
  } catch(err) {
    return new Response('Webhook Error: ' + err.message, {status:400});
  }
}
