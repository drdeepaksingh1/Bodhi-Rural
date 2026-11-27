declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};
export {};

type Alert = {
  id: number;
  audience: 'buyer' | 'seller';
  channel: 'sms' | 'whatsapp' | 'email';
  reference: string;
  destination: string | null;
  attempts: number;
};

type Status = 'accepted' | 'skipped' | 'pending' | 'failed' | 'review';

const setting = (key: string) => Deno.env.get(key)?.trim() ?? '';
const respond = (status: number, body: Record<string, unknown>) => Response.json(body, { status });
const required = [
  'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'BODHI_ORDER_ALERT_WORKER_TOKEN',
  'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_SMS_SENDER', 'TWILIO_DLT_PE_ID',
  'TWILIO_BUYER_SMS_TEMPLATE_ID', 'TWILIO_SELLER_SMS_TEMPLATE_ID',
  'TWILIO_BUYER_SMS_BODY', 'TWILIO_SELLER_SMS_BODY',
  'TWILIO_WHATSAPP_SENDER', 'TWILIO_BUYER_WHATSAPP_CONTENT_SID', 'TWILIO_SELLER_WHATSAPP_CONTENT_SID',
  'SENDGRID_API_KEY', 'BODHI_ORDER_EMAIL_FROM',
];

function providerRequest(row: Alert, destination: string): Promise<Response> {
  const buyer = row.audience === 'buyer';
  const role = buyer ? 'BUYER' : 'SELLER';
  const account = setting('TWILIO_ACCOUNT_SID');
  const signal = AbortSignal.timeout(8000);

  if (row.channel === 'email') {
    const subject = buyer ? 'Your BodhiMart order was placed' : 'New BodhiMart seller order';
    const portal = buyer ? '/bodhimart/orders' : '/bodhimart/seller/orders';
    const message = subject + '.\nOrder reference: ' + row.reference
      + '\nView order: https://www.brlps.co.in' + portal;
    return fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST', signal, redirect: 'error',
      headers: { Authorization: 'Bearer ' + setting('SENDGRID_API_KEY'), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: destination }] }],
        from: { email: setting('BODHI_ORDER_EMAIL_FROM') },
        subject,
        content: [{ type: 'text/plain', value: message }],
      }),
    });
  }

  const fields = row.channel === 'sms'
    ? new URLSearchParams({
      From: setting('TWILIO_SMS_SENDER'),
      To: destination,
      Body: setting('TWILIO_' + role + '_SMS_BODY').replace('{order}', () => row.reference),
      DltPEId: setting('TWILIO_DLT_PE_ID'),
      DltTemplateId: setting('TWILIO_' + role + '_SMS_TEMPLATE_ID'),
    })
    : new URLSearchParams({
      From: 'whatsapp:' + setting('TWILIO_WHATSAPP_SENDER'),
      To: 'whatsapp:' + destination,
      ContentSid: setting('TWILIO_' + role + '_WHATSAPP_CONTENT_SID'),
      ContentVariables: JSON.stringify({ '1': row.reference }),
    });
  return fetch('https://api.twilio.com/2010-04-01/Accounts/' + account + '/Messages.json', {
    method: 'POST', signal, redirect: 'error',
    headers: { Authorization: 'Basic ' + btoa(account + ':' + setting('TWILIO_AUTH_TOKEN')) },
    body: fields,
  });
}

async function send(row: Alert): Promise<Status> {
  if (!row.destination || (row.channel === 'sms' && !/^\+91[6-9]\d{9}$/.test(row.destination))) return 'skipped';
  try {
    const result = await providerRequest(row, row.destination);
    await result.body?.cancel();
    if (result.ok) return 'accepted';
    if (result.status === 429) return row.attempts < 4 ? 'pending' : 'failed';
    return result.status >= 500 ? 'review' : 'failed';
  } catch {
    // A timeout can occur after the provider accepted the message.
    return 'review';
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return respond(405, { error: 'Method not allowed' });
  const token = setting('BODHI_ORDER_ALERT_WORKER_TOKEN');
  if (!token || request.headers.get('x-bodhi-worker-token') !== token) return respond(401, { error: 'Unauthorized' });
  if (setting('BODHI_ORDER_ALERTS_ENABLED') !== 'true' || required.some((key) => !setting(key))) {
    return respond(503, { error: 'Order alert delivery is disabled or incomplete' });
  }

  const key = setting('SUPABASE_SERVICE_ROLE_KEY');
  const api = setting('SUPABASE_URL').replace(/\/$/, '') + '/rest/v1/';
  const headers = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
  const claim = await fetch(api + 'rpc/bodhimart_claim_order_alerts', {
    method: 'POST', headers, body: '{}', signal: AbortSignal.timeout(8000),
  });
  if (!claim.ok) return respond(502, { error: 'Unable to claim alerts' });
  const jobs = await claim.json() as Alert[];
  let recorded = 0;
  for (let offset = 0; offset < jobs.length; offset += 5) {
    await Promise.all(jobs.slice(offset, offset + 5).map(async (row) => {
      const status = await send(row);
      try {
        const saved = await fetch(api + 'bodhimart_order_alert_outbox?id=eq.' + row.id
          + '&status=eq.sending&attempts=eq.' + row.attempts, {
          method: 'PATCH', headers, signal: AbortSignal.timeout(8000),
          body: JSON.stringify({
            status,
            ...(status === 'pending' ? { next_attempt_at: new Date(Date.now() + 60_000 * 2 ** row.attempts).toISOString() } : {}),
          }),
        });
        if (saved.ok) recorded++;
        await saved.body?.cancel();
      } catch {
        // Unrecorded attempts become review items after the lease expires.
      }
    }));
  }
  return respond(recorded === jobs.length ? 200 : 502, { claimed: jobs.length, recorded });
});
