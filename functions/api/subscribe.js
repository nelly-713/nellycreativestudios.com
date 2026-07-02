export async function onRequestPost(context) {
  const RESEND_API_KEY = context.env.RESEND_API_KEY;
  const FROM_EMAIL = context.env.FROM_EMAIL || 'nelly@nellycreativestudios.com';
  if (!RESEND_API_KEY) return new Response('Missing RESEND_API_KEY', {status:500});

  try {
    const data = await context.request.json();

    // Honeypot check — if bot-field has a value, it's a bot; report success without sending
    if (data['bot-field']) {
      return new Response(JSON.stringify({success:true}), {status:200, headers:{'Content-Type':'application/json'}});
    }

    const email = (data.email || '').trim();
    if (!email) return new Response('Missing email', {status:400});

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {'Authorization': 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        from: `Nelly Creative Studios Website <${FROM_EMAIL}>`,
        to: [FROM_EMAIL],
        reply_to: email,
        subject: 'New newsletter signup',
        text: `New newsletter signup from the website:\n\n${email}\n\nAdd this address to your mailing list.`
      })
    });

    if (resendRes.status >= 400) {
      const err = await resendRes.text();
      return new Response('Email failed: ' + err, {status:500});
    }
    return new Response(JSON.stringify({success:true}), {status:200, headers:{'Content-Type':'application/json'}});
  } catch(err) {
    return new Response(err.message, {status:500});
  }
}

export async function onRequestOptions() {
  return new Response('', {status: 200, headers: cors()});
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}
