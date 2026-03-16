const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Stripe not configured' }) };
  }

  try {
    const { productId, productName, price, image } = JSON.parse(event.body);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: productName,
            images: image ? [image] : [],
            description: 'Handcrafted fine jewelry by Nelly Creative Studios, New York City',
          },
          unit_amount: Math.round(parseFloat(price) * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://nellycreativestudios.com/pages/checkout-success.html',
      cancel_url: 'https://nellycreativestudios.com/pages/boutique.html',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'FR', 'DE', 'IT', 'ES', 'NL', 'CH', 'SE', 'NO', 'DK', 'JP', 'SG', 'HK', 'AE', 'MX'],
      },
      phone_number_collection: { enabled: true },
      metadata: { productId: productId || '' },
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Stripe error:', err.message);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
