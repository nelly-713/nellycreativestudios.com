export async function onRequestPost(context) {
  const STRIPE_KEY = context.env.STRIPE_SECRET_KEY;
  const PUB_KEY = context.env.STRIPE_PUBLISHABLE_KEY || 'pk_live_ucH6dOk31p48GWrbuoXc5DPP00zEeuRwvD';

  try {
    const {productId, productName, price} = await context.request.json();
    const amount = Math.round(parseFloat(price) * 100);

    const res = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {'Authorization': 'Bearer ' + STRIPE_KEY, 'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({
        'amount': String(amount),
        'currency': 'usd',
        'automatic_payment_methods[enabled]': 'true',
        'metadata[productId]': productId || '',
        'metadata[productName]': productName || '',
      })
    });
    const intent = await res.json();
    return new Response(JSON.stringify({clientSecret: intent.client_secret, publishableKey: PUB_KEY}), {status:200, headers:cors()});
  } catch(err) {
    return new Response(JSON.stringify({error: err.message}), {status:500, headers:cors()});
  }
}

export async function onRequestOptions() {
  return new Response('', {status:200, headers:cors()});
}

function cors() {
  return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json'};
}