# BodhiMart order alerts

The default channel is email, from BodhiMart <ceo@brlps.co.in> via Resend. Order placement queues alerts for the buyer and each linked seller. Email uses their verified account addresses. Messages acknowledge placement without claiming payment clearance.

## Activate email

1. Confirm the sending domain brlps.co.in is verified in Resend. Create a sending-only Resend API key restricted to the verified domain.
2. Set the Edge Function secrets RESEND_API_KEY and BODHI_ORDER_ALERT_WORKER_TOKEN. Keep the same worker token in Supabase Vault for the scheduler. Supabase supplies the project URL and service-role key.
3. Apply the database migration and deploy the worker with `supabase functions deploy bodhimart-order-alerts --no-verify-jwt` to use its dedicated worker-token authentication. Configure Supabase Cron to POST to `/functions/v1/bodhimart-order-alerts` with the token in the `x-bodhi-worker-token` header once a minute.
4. Set BODHI_ORDER_ALERTS_ENABLED=true and leave BODHI_ORDER_ALERT_CHANNELS set to email. Place a test order with verified buyer and seller test accounts and confirm receipt.

To add SMS or WhatsApp later, include the desired channel in BODHI_ORDER_ALERT_CHANNELS and set its provider secrets in channelSettings. SMS uses approved India DLT templates with {order} as the order-reference variable. WhatsApp uses approved templates with variable 1 for that reference. Both use the account's verified mobile number after opt-in.

The outbox records provider acceptance separately from delivery. Rate limits are retried. Check provider logs before replaying ambiguous sends.
