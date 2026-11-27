// @ts-expect-error The Supabase Edge runtime resolves npm: imports.
import { Webhook } from 'npm:standardwebhooks@1.0.0';

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): void;
};

type SmsHook = { sms?: { otp?: string; phone?: string } };

function fail(status: number, message: string) {
  return Response.json({ error: { http_code: status, message } }, { status });
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return fail(405, 'Method not allowed.');

  const signingSecret = Deno.env.get('BODHI_SEND_SMS_HOOK_SECRET');
  if (!signingSecret?.startsWith('v1,whsec_')) {
    return fail(503, 'SMS verification is not configured.');
  }

  let payload: SmsHook;
  try {
    const verifier = new Webhook(signingSecret.slice('v1,whsec_'.length));
    payload = verifier.verify(await request.text(), Object.fromEntries(request.headers)) as SmsHook;
  } catch {
    return fail(401, 'Invalid SMS hook signature.');
  }

  const apiKey = Deno.env.get('FAST2SMS_API_KEY');
  const sender = Deno.env.get('FAST2SMS_DLT_SENDER_ID') ?? '';
  const message = Number(Deno.env.get('FAST2SMS_DLT_MESSAGE_ID'));
  if (!apiKey || !/^[A-Za-z]{3,6}$/.test(sender) || !Number.isSafeInteger(message) || message <= 0) {
    return fail(503, 'SMS verification is not configured.');
  }

  // Use the destination supplied for this OTP, especially during a phone change.
  const phone = payload?.sms?.phone;
  const otp = payload?.sms?.otp;
  const match = typeof phone === 'string' ? /^\+?91([6-9][0-9]{9})$/.exec(phone) : null;
  if (!match || typeof otp !== 'string' || !/^[0-9]{6,10}$/.test(otp)) {
    return fail(422, 'Invalid SMS destination or verification code.');
  }

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(3500),
      headers: { authorization: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_id: sender,
        message,
        variables_values: otp,
        route: 'dlt',
        numbers: match[1],
      }),
    });
    if (response.ok && (await response.json())?.return === true) return Response.json({});
  } catch {
    // Keep credentials, phone numbers, codes and provider responses out of logs.
  }
  return fail(502, 'Could not send the verification SMS.');
});
