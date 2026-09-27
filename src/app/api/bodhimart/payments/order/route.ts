import { randomUUID } from "node:crypto";
import { createClient } from "../../../../../../lib/supabase/server";
import {
  createMarketplaceAdminClient,
  getRazorpayCredentials,
  isSameOrigin,
  jsonNoStore,
  razorpayRequest,
} from "../../../../../../lib/marketplace-payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GatewayOrder = { id: string; amount: number; currency: string; status: string };

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonNoStore({ error: "Request origin could not be verified." }, 403);
  const credentials = getRazorpayCredentials();
  if (!credentials) return jsonNoStore({ error: "Online payment is not configured yet." }, 503);

  try {
    const body = await request.json();
    const marketplaceOrderId = typeof body?.marketplaceOrderId === "string" ? body.marketplaceOrderId : "";
    const attemptId = typeof body?.attemptId === "string" ? body.attemptId : "";
    if (!/^[0-9a-f-]{36}$/i.test(marketplaceOrderId) || !/^[0-9a-f-]{36}$/i.test(attemptId)) {
      return jsonNoStore({ error: "A valid order and payment attempt are required." }, 400);
    }

    const session = createClient();
    const { data: { user }, error: authError } = await session.auth.getUser();
    if (authError || !user) return jsonNoStore({ error: "Sign in before paying for this order." }, 401);

    const admin = createMarketplaceAdminClient();
    const { data: order, error: orderError } = await admin
      .from("marketplace_orders")
      .select("id, order_number, customer_user_id, total_amount, payment_status, order_status")
      .eq("id", marketplaceOrderId)
      .maybeSingle();
    if (orderError || !order || order.customer_user_id !== user.id) {
      return jsonNoStore({ error: "Order was not found." }, 404);
    }
    if (order.payment_status === "PAID") {
      return jsonNoStore({ error: "This order has already been paid." }, 409);
    }
    if (order.order_status === "CANCELLED") {
      return jsonNoStore({ error: "This order was cancelled." }, 409);
    }

    const amountMinor = Math.round(Number(order.total_amount) * 100);
    if (!Number.isSafeInteger(amountMinor) || amountMinor < 100) {
      return jsonNoStore({ error: "The order total is not a valid payment amount." }, 400);
    }

    const { data: previous, error: previousError } = await admin
      .from("marketplace_payment_transactions")
      .select("provider_order_id, amount_minor, currency, status")
      .eq("order_id", order.id)
      .eq("attempt_id", attemptId)
      .maybeSingle();
    if (previousError) throw previousError;
    if (previous) {
      return jsonNoStore({
        keyId: credentials.keyId,
        razorpayOrderId: previous.provider_order_id,
        amount: Number(previous.amount_minor),
        currency: previous.currency,
        orderNumber: order.order_number,
      });
    }

    const gatewayOrder = await razorpayRequest<GatewayOrder>("/orders", credentials, {
      method: "POST",
      body: {
        amount: amountMinor,
        currency: "INR",
        receipt: "bm_" + randomUUID().replaceAll("-", "").slice(0, 30),
        notes: { marketplace_order_id: order.id, order_number: order.order_number },
      },
    });
    if (gatewayOrder.amount !== amountMinor || gatewayOrder.currency !== "INR" || !gatewayOrder.id) {
      throw new Error("The payment provider returned an invalid order.");
    }

    const { error: insertError } = await admin.from("marketplace_payment_transactions").insert({
      order_id: order.id,
      attempt_id: attemptId,
      provider: "RAZORPAY",
      provider_order_id: gatewayOrder.id,
      amount_minor: amountMinor,
      currency: "INR",
      status: "CREATED",
    });
    if (insertError) {
      // A concurrent retry may have created the same idempotent attempt.
      const { data: raced } = await admin.from("marketplace_payment_transactions")
        .select("provider_order_id, amount_minor, currency")
        .eq("order_id", order.id).eq("attempt_id", attemptId).maybeSingle();
      if (!raced) throw insertError;
      return jsonNoStore({
        keyId: credentials.keyId,
        razorpayOrderId: raced.provider_order_id,
        amount: Number(raced.amount_minor),
        currency: raced.currency,
        orderNumber: order.order_number,
      });
    }

    return jsonNoStore({
      keyId: credentials.keyId,
      razorpayOrderId: gatewayOrder.id,
      amount: amountMinor,
      currency: "INR",
      orderNumber: order.order_number,
    });
  } catch (cause) {
    console.error("Unable to create marketplace payment order.", cause);
    return jsonNoStore({ error: "Unable to start online payment. You can retry from this page." }, 500);
  }
}
