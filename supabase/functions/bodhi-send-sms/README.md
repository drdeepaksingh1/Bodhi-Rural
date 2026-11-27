# Bodhi Rural SMS verification

This Supabase Auth hook sends Indian mobile verification codes through the Fast2SMS DLT route. Use a DLT-approved header and message with exactly one template variable, for the OTP.

1. Add `FAST2SMS_API_KEY`, `FAST2SMS_DLT_SENDER_ID`, and `FAST2SMS_DLT_MESSAGE_ID` to Supabase Edge Function secrets. Use the message ID shown in Fast2SMS DLT Manager.
2. In Supabase Authentication → Hooks, configure Send SMS as an HTTPS hook for the deployed function URL. Set the hook signing secret (including its `v1,whsec_` prefix) as the Edge Function secret `BODHI_SEND_SMS_HOOK_SECRET` before enabling that hook. The function uses signed requests in place of a gateway JWT.
3. Review OTP send limits and verify a number on an existing email-confirmed test account. Test changing it as well. Confirm the hook receives the intended phone in `sms.phone`.
4. Set `NEXT_PUBLIC_BODHI_SMS_VERIFICATION=true` and redeploy the app after a successful test. This reveals the registration screens; mandatory role checks require separate server-side enforcement.

The hook sends SMS for Supabase Auth requests. Order notifications use their separate email worker.
