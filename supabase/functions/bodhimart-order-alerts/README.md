# BodhiMart order alerts

Order placement queues an alert per channel for the buyer and for each linked seller order. Messages acknowledge placement without claiming payment has cleared. Buyers and sellers can opt into SMS and WhatsApp from Order notification preferences with a verified Supabase Auth mobile number. Email uses the verified account address.

## Activate

1. Configure a Twilio India DLT sender with approved buyer and seller transactional SMS templates. Set each matching body exactly as approved, using `{order}` for the single order reference variable. Configure a WhatsApp sender and two approved utility templates with order reference as variable 1. Verify the sending address in SendGrid.
2. Set the Edge Function secrets listed in `required` in `index.ts`. Supabase supplies the project URL and service-role key. Generate a unique random worker token and store it in the Edge Function and Supabase Vault. Use separate production and test credentials.
3. Apply the database migration. Deploy the function using `supabase functions deploy bodhimart-order-alerts --no-verify-jwt` so it can authenticate the scheduler with its dedicated worker token. Configure a Supabase Cron job to POST to `/functions/v1/bodhimart-order-alerts` once a minute with the Vault token in the `x-bodhi-worker-token` header.
4. Set `BODHI_ORDER_ALERTS_ENABLED=true` after configuring the services. Place a test order with consented buyer and seller test accounts. Verify all six messages in provider logs.

The outbox records provider acceptance separately from delivery. Check Twilio and SendGrid delivery logs for final status. Rate limits are retried. Review ambiguous attempts in provider logs before any manual replay.
