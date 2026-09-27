import { createClient } from "../../../../../lib/supabase/server";
import {
  createMarketplaceAdminClient,
  getRazorpayCredentials,
  isSameOrigin,
  jsonNoStore,
  razorpayRequest,
  verifyHmacHex,
} from "../../../../../lib/marketplace-payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GatewayPayment = {
  id: string; order_id: string; amount: number; currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  error_code?: string | null; error_description?: string | null;
};

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonNoStore({ error: "Request origin could not be verified." }, 403);
  const credentials = getRazorpayCredentials();
  if (!credentials) return jsonNoStore({ error: "Online payment is not configured yet." }, 503);

  try {
    const body = await request.json();
    const { marketplaceOrderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body || {};
    if ([marketplaceOrderId, razorpayOrderId, razorpayPaymentId, razorpaySignature].some(
      (value) => typeof value !== "string" || !value || value.length > 255
    )) return jsonNoStore({ error: "Payment confirmation details are invalid." }, 400);

    const session = createClient();
    const { data: { user }, error: authError } = await session.auth.getUser();
    if (authError || !user) return jsonNoStore({ error: "Sign in before confirming payment." }, 401);

    const admin = createMarketplaceAdminClient();
    const { data: order, error: orderError } = await admin
      .from("marketplace_orders")
      .select("id, customer_user_id, total_amount, payment_status")
      .eq("id", marketplaceOrderId).maybeSingle();
    if (orderError || !order || order.customer_user_id !== user.id) {
      return jsonNoStore({ error: "Order was not found." }, 404);
    }

    const { data: transaction, error: transactionError } = await admin
      .from("marketplace_payment_transactions")
      .select("id, provider_order_id, amount_minor, currency, status")
      .eq("order_id", order.id).eq("provider_order_id", razorpayOrderId).maybeSingle();
    if (transactionError || !transaction) return jsonNoStore({ error: "Payment attempt was not found." }, 404);

    const expectedSignature = verifyHmacHex(
      transaction.provider_order_id + "|" + razorpayPaymentId,
      credentials.keySecret,
      razorpaySignature,
    );
    if (!expectedSignature) return jsonNoStore({ error: "Payment signature could not be verified." }, 400);

    const payment = await razorpayRequest<GatewayPayment>(
      "/payments/" + encodeURIComponent(razorpayPaymentId), credentials,
    );
    if (payment.order_id !== transaction.provider_order_id
      || payment.amount !== Number(transaction.amount_minor)
      || payment.currency !== transaction.currency) {
      return jsonNoStore({ error: "Payment details do not match this order." }, 400);
    }

    if (payment.status === "captured") {
      const { error: confirmError } = await admin.rpc("confirm_marketplace_payment", {
        p_provider_order_id: transaction.provider_order_id,
        p_provider_payment_id: payment.id,
        p_amount_minor: payment.amount,
        p_currency: payment.currency,
      });
      if (confirmError) throw confirmError;
      return jsonNoStore({ paymentStatus: "PAID" });
    }

    if (payment.status === "failed") {
      await admin.from("marketplace_payment_transactions").update({
        provider_payment_id: payment.id,
        status: "FAILED",
        failure_code: payment.error_code || null,
        failure_description: payment.error_description || null,
        updated_at: new Date().toISOString(),
      }).eq("id", transaction.id).neq("status", "CAPTURED");
      return jsonNoStore({ paymentStatus: "PENDING", message: "Payment did not complete. You can retry." }, 402);
    }

    if (payment.status === "authorized") {
      await admin.from("marketplace_payment_transactions").update({
        provider_payment_id: payment.id,
        status: "AUTHORIZED",
        updated_at: new Date().toISOString(),
      }).eq("id", transaction.id);
    }
    return jsonNoStore({
      paymentStatus: order.payment_status === "PAID" ? "PAID" : "PENDING",
      message: "Payment is being confirmed. Refresh your order status shortly.",
    }, 202);
  } catch (cause) {
    console.error("Unable to verify marketplace payment.", cause);
    return jsonNoStore({ error: "Payment verification is still processing. Check your order shortly." }, 202);
  }
}
