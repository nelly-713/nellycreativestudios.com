export async function onRequestPost(context) {
  try {
    const body = await context.request.text();
    const event = JSON.parse(body);

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const amount = (pi.amount / 100).toFixed(2);
      const productName = pi.metadata?.productName || 'Fine Jewelry';
      console.log('Payment succeeded:', productName, '$' + amount);
    }

    return new Response(JSON.stringify({received: true}), {status:200, headers:{'Content-Type':'application/json'}});
  } catch(err) {
    return new Response('Webhook Error: ' + err.message, {status:400});
  }
}