const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    if (webhookSecret) {
      stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
    } else {
      stripeEvent = JSON.parse(event.body);
    }
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // Handle successful payment
  if (stripeEvent.type === 'payment_intent.succeeded') {
    const paymentIntent = stripeEvent.data.object;
    const amount = (paymentIntent.amount / 100).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
    const productName = paymentIntent.metadata.productName || 'Fine Jewelry';
    const email = paymentIntent.receipt_email;
    const shipping = paymentIntent.shipping;

    console.log(`
      ✅ Payment succeeded!
      Amount: $${amount}
      Product: ${productName}
      Customer: ${email}
      Shipping: ${shipping ? JSON.stringify(shipping.address) : 'N/A'}
    `);

    // Note: For actual email sending, integrate with SendGrid, Mailgun, or Postmark
    // Add SENDGRID_API_KEY to Netlify env vars and uncomment below:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Email to customer
    await sgMail.send({
      to: email,
      from: 'nelly@jewelrybynelly.com',
      subject: `Your Nelly Creative Studios Order — ${productName}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:2rem">
          <h1 style="font-size:1.5rem;color:#B8962E">Thank you for your order</h1>
          <p>Dear ${shipping?.name || 'Valued Customer'},</p>
          <p>Your order has been received and payment confirmed.</p>
          <p><strong>Order details:</strong><br>
          ${productName}<br>
          Total: $${amount}</p>
          <p>Your piece is now in Nelly's hands. Please allow 2–4 weeks for creation and delivery.</p>
          <p>Questions? Reply to this email or write to nelly@jewelrybynelly.com</p>
          <p style="color:#888;font-size:0.8rem;margin-top:2rem">Nelly Creative Studios · New York City</p>
        </div>
      `
    });

    // Notification to Nelly
    await sgMail.send({
      to: 'nelly@jewelrybynelly.com',
      from: 'nelly@jewelrybynelly.com',
      subject: `New Order — ${productName} — $${amount}`,
      html: `
        <p><strong>New order received!</strong></p>
        <p>Product: ${productName}</p>
        <p>Amount: $${amount}</p>
        <p>Customer: ${email}</p>
        <p>Shipping to: ${shipping ? JSON.stringify(shipping.address) : 'N/A'}</p>
      `
    });
    */
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
