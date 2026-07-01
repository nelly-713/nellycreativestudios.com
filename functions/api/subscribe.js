export async function onRequestPost(context) {
  const SENDGRID_API_KEY = context.env.SENDGRID_API_KEY;
  const FROM_EMAIL = context.env.FROM_EMAIL || 'nelly@jewelrybynelly.com';
  if (!SENDGRID_API_KEY) return new Response('Missing SENDGRID_API_KEY', {status:500});

  try {
    const data = await context.request.json();

    // Honeypot check — if bot-field has a value, it's a bot; report success without sending
    if (data['bot-field']) {
      return new Response(JSON.stringify({success:true}), {status:200, headers:{'Content-Type':'application/json'}});
    }

    const email = (data.email || '').trim();
    if (!email) return new Response('Missing email', {status:400});

    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {'Authorization': 'Bearer ' + SENDGRID_API_KEY, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        personalizations: [{to: [{email: FROM_EMAIL, name: 'Nelly Creative Studios'}]}],
        from: {email: FROM_EMAIL, name: 'Nelly Creative Studios Website'},
        reply_to: {email: email},
        subject: 'New newsletter signup',
        content: [
          {type: 'text/plain', value: `New newsletter signup from the website:\n\n${email}\n\nAdd this address to your mailing list.`}
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
