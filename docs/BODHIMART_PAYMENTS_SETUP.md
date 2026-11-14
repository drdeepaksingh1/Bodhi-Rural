# BodhiMart online payments and marketplace fees

## Payment provider

BodhiMart uses Razorpay Standard Checkout for INR orders. The server creates each Razorpay order from the saved marketplace order total. The browser never supplies the payable amount. Payment signatures are checked server-side, and only a captured payment can change the marketplace order to PAID. A signed webhook is also required so the order can still be reconciled if the buyer closes the checkout window.

## Configuration required before enabling online checkout

Add these values to the Bodhi-Rural project in Vercel for Preview and Production as appropriate, then redeploy:

- `RAZORPAY_KEY_ID`: Razorpay API Key ID. Use test-mode credentials while validating.
- `RAZORPAY_KEY_SECRET`: matching API Key Secret. Server only.
- `RAZORPAY_WEBHOOK_SECRET`: a new webhook signing secret created for this project in Razorpay.
- `SUPABASE_SERVICE_ROLE_KEY`: service-role/secret key for the existing Supabase project. Server only; never prefix with `NEXT_PUBLIC_`.

Keep the existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` values. Never commit gateway secrets or paste them into a chat.

Create a Razorpay webhook for:

```
https://brlps.co.in/api/bodhimart/payments/webhook
```

Subscribe to `payment.captured` and `payment.failed`. Use the exact same webhook secret in Vercel. Enable automatic payment capture in the Razorpay dashboard so successful customer payments reach the captured state. The customer checkout remains disabled until all server credentials and the database migration are present.

The `/api/cron/expire-marketplace-orders` endpoint requires `CRON_SECRET` and must be called every ten minutes to expire unpaid orders after the 30-minute retry window. This Vercel project is on the Hobby plan, which rejected the ten-minute Vercel Cron schedule. No cron schedule is currently configured. Before enabling online checkout, either upgrade the Vercel plan to one that supports this schedule or configure an external scheduler to call the production endpoint every ten minutes with `Authorization: Bearer <CRON_SECRET>`. Do not expose this secret in browser code. Until a scheduler is configured and verified, unpaid-order expiry is not automated and this payment feature must not be enabled.

## Database migration

Apply `supabase/migrations/20260927120000_marketplace_online_payments.sql` after the existing marketplace checkout migration, in the existing Supabase project. This creates private payment-attempt/webhook tables, server-only confirmation, and a commercial-settings row. It does not create a Supabase project or store card data.

## Delivery fee and seller commission

The settings row starts with zero delivery fee, no free-delivery threshold, and 0% seller commission. These are safe placeholders, not business recommendations. Before taking real payments, choose the actual policy with your finance/operations team and update the row in the Supabase SQL editor:

```sql
update public.marketplace_commercial_settings
set delivery_fee = 0.00,
    free_delivery_threshold = null,
    seller_commission_percent = 0.00,
    updated_at = now()
where id = 1;
```

Replace those example values with the approved rupee delivery charge, optional free-delivery threshold, and commission percentage. Pickup has no delivery charge. The checkout RPC calculates and stores the delivery amount and commission; customer tax continues to use the product tax rates already in the marketplace catalog. Razorpay's own processing fees are not added to the buyer's order.

## Safe rollout

1. Apply the database migration.
2. Add Razorpay test credentials and the Supabase service-role key to Vercel Preview.
3. Configure a test-mode webhook and verify it points to the endpoint above.
4. Configure and verify a scheduler that calls the protected order-expiry endpoint every ten minutes.
5. Make test purchases and verify payment success, failed-attempt retry, webhook replay, concurrent checkout, unpaid-order expiry and reservation release, and seller fulfilment blocking.
6. Configure the approved delivery and commission values.
7. After merchant onboarding and test sign-off, replace Preview/Test credentials with Live credentials in Vercel Production and redeploy.

This branch records captured payments and supports customer retries/order history. Refund initiation and automated seller payouts/splits are not enabled; refund decisions and seller settlements remain manual until the marketplace's support and settlement policy is finalized.

## Stock reservation and unpaid-order expiry

- Checkout validates available stock and increases `marketplace_inventory.reserved_quantity`; it does not reduce physical `stock_quantity`.
- Only a server-verified captured payment converts the reservation into a physical stock deduction and reduces the reserved quantity.
- A failed payment attempt is recorded but does not immediately cancel the order, because Razorpay permits another attempt against the same checkout order. The customer may retry during the 30-minute payment window.
- Any unpaid order that remains in `PLACED` status for 30 minutes—including orders with failed or abandoned payment attempts—is cancelled and its reservation released by the protected expiry endpoint, when its scheduler is configured.
- Seller fulfilment status changes are blocked by a database trigger until the parent marketplace order has `payment_status = 'PAID'`.
