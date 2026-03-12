/**
 * Netlify serverless function: /api/subscribe
 * Forwards subscription to Formspree. Set FORMSPREE_FORM_ID in Netlify env.
 * Create a form at formspree.io with your email (temona007@gmail.com) to get the ID.
 */
exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: '' };
  }

  const formId = process.env.FORMSPREE_FORM_ID;
  if (!formId) {
    console.error('FORMSPREE_FORM_ID not set');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const email = (body.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email' }) };
  }

  try {
    const res = await fetch(`https://formspree.io/f/${formId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (res.ok) {
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }
    throw new Error('Formspree error');
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong' }) };
  }
};
