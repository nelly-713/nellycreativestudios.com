export async function onRequestPost(context) {
  const STRIPE_KEY = context.env.STRIPE_SECRET_KEY;
  if (!STRIPE_KEY) return new Response(JSON.stringify({error:'Stripe not configured'}), {status:500, headers:cors()});

  try {
    const {productId, productName, price, image} = await context.request.json();
    const params = new URLSearchParams({
      'payment_method_types[]': 'card',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][product_data][name]': productName,
      'line_items[0][price_data][product_data][description]': 'Handcrafted fine jewelry by Nelly Creative Studios, New York City',
      'line_items[0][price_data][unit_amount]': String(Math.round(parseFloat(price) * 100)),
      'line_items[0][quantity]': '1',
      'mode': 'payment',
      'success_url': 'https://nellycreativestudios.com/pages/checkout-success.html',
      'cancel_url': 'https://nellycreativestudios.com/pages/boutique.html',
      'phone_number_collection[enabled]': 'true',
      'metadata[productId]': productId || '',
    });
    if (image) params.append('line_items[0][price_data][product_data][images][]', image);
    ['US','CA','GB','AU','FR','DE','IT','ES','NL','CH','SE','NO','DK','JP','SG','HK','AE','MX'].forEach(function(country) {
      params.append('shipping_address_collection[allowed_countries][]', country);
    });

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {'Authorization': 'Bearer ' + STRIPE_KEY, 'Content-Type': 'application/x-www-form-urlencoded'},
      body: params
    });
    const session = await res.json();

    if (session.error) {
      return new Response(JSON.stringify({error: session.error.message}), {status: 400, headers: cors()});
    }
    if (!session.url) {
      return new Response(JSON.stringify({error: 'Stripe returned no checkout URL'}), {status: 500, headers: cors()});
    }

    return new Response(JSON.stringify({url: session.url}), {status:200, headers:cors()});
  } catch(err) {
    return new Response(JSON.stringify({error: err.message}), {status:500, headers:cors()});
  }
}

export async function onRequestOptions() {
  return new Response('', {status:200, headers:cors()});
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}