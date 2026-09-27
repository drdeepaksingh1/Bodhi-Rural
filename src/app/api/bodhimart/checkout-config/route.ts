import { createClient } from "../../../../lib/supabase/server";
import { getRazorpayCredentials, jsonNoStore } from "../../../../lib/marketplace-payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("marketplace_public_checkout_settings")
      .select("delivery_fee, free_delivery_threshold")
      .maybeSingle();
    if (error) throw error;

    const credentials = getRazorpayCredentials();
    return jsonNoStore({
      onlinePaymentsReady: Boolean(credentials && process.env.SUPABASE_SERVICE_ROLE_KEY),
      deliveryFee: Number(data?.delivery_fee || 0),
      freeDeliveryThreshold: data?.free_delivery_threshold == null
        ? null
        : Number(data.free_delivery_threshold),
      currency: "INR",
    });
  } catch {
    return jsonNoStore({
      onlinePaymentsReady: false,
      deliveryFee: 0,
      freeDeliveryThreshold: null,
      currency: "INR",
      message: "Checkout configuration is unavailable. Please try again later.",
    }, 503);
  }
}
