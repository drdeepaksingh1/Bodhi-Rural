import { createHash, createHmac } from "node:crypto";
import {
  createMarketplaceAdminClient,
  getRazorpayCredentials,
  jsonNoStore,
  verifyHmacHex,
} from "../../../../../lib/marketplace-payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PaymentEntity = {
  id: string; order_id: string; amount: number; currency: string; status: string;
  error_code?: string | null; error_description?: string | null;
};
type RazorpayEvent = {
  event?: string;
  payload?: { payment?: { entity?: PaymentEntity } };
};

export async function POST(request: Request) {
  const credentials = getRazorpayCredentials();
  if (!credentials) return jsonNoStore({ error: "Webhook is not configured." }, 503);

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  if (!verifyHmacHex(rawBody, credentials.webhookSecret, signature)) {
    return jsonNoStore({ error: "Webhook signature is invalid." }, 400);
  }

  try {
    const event = JSON.parse(rawBody) as RazorpayEvent;
    const eventType = event.event || "unknown";
    const providerEventId = request.headers.get("x-razorpay-event-id")
      || createHash("sha256").update(rawBody).digest("hex");
    const admin = createMarketplaceAdminClient();

    const { data: prior } = await admin.from("marketplace_payment_webhook_events")
      .select("processed_at").eq("provider_event_id", providerEventId).maybeSingle();
    if (prior?.processed_at) return jsonNoStore({ received: true });

    const { error: eventError } = await admin.from("marketplace_payment_webhook_events")
      .upsert({ provider_event_id: providerEventId, event_type: eventType }, {
        onConflict: "provider_event_id",
        ignoreDuplicates: true,
      });
    if (eventError) throw eventError;

    const payment = event.payload?.payment?.entity;
    if (eventType === "payment.captured" && payment?.status === "captured") {
      const { data: transaction, error: transactionError } = await admin
        .from("marketplace_payment_transactions")
        .select("id, provider_order_id, amount_minor, currency")
        .eq("provider_order_id", payment.order_id).maybeSingle();
      if (transactionError) throw transactionError;
      if (!transaction) throw new Error("No marketplace payment attempt matches this webhook.");
      if (payment.amount !== Number(transaction.amount_minor) || payment.currency !== transaction.currency) {
        throw new Error("Captured payment does not match the marketplace order.");
      }

      const { error: confirmError } = await admin.rpc("confirm_marketplace_payment", {
        p_provider_order_id: transaction.provider_order_id,
        p_provider_payment_id: payment.id,
        p_amount_minor: payment.amount,
        p_currency: payment.currency,
      });
      if (confirmError) throw confirmError;
    } else if (eventType === "payment.failed" && payment) {
      const { error: failedError } = await admin.from("marketplace_payment_transactions")
        .update({
          provider_payment_id: payment.id || null,
          status: "FAILED",
          failure_code: payment.error_code || null,
          failure_description: payment.error_description || null,
          updated_at: new Date().toISOString(),
        }).eq("provider_order_id", payment.order_id).neq("status", "CAPTURED");
      if (failedError) throw failedError;
    }

    const { error: processedError } = await admin.from("marketplace_payment_webhook_events")
      .update({ processed_at: new Date().toISOString() }).eq("provider_event_id", providerEventId);
    if (processedError) throw processedError;
    return jsonNoStore({ received: true });
  } catch (cause) {
    console.error("Unable to process marketplace payment webhook.", cause);
    // Return a failure so the gateway can retry; only successfully handled events are marked processed.
    return jsonNoStore({ error: "Webhook processing failed." }, 500);
  }
}
