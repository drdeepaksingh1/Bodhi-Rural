import { createMarketplaceAdminClient, jsonNoStore } from "../../../../lib/marketplace-payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!cronSecret || authorization !== "Bearer " + cronSecret) {
    return jsonNoStore({ error: "Unauthorized." }, 401);
  }

  try {
    const admin = createMarketplaceAdminClient();
    const { data, error } = await admin.rpc("expire_unpaid_marketplace_orders", {
      p_older_than_minutes: 30,
    });
    if (error) throw error;
    return jsonNoStore({ success: true, expiredOrders: Number(data || 0) });
  } catch (cause) {
    console.error("Unable to expire unpaid marketplace orders.", cause);
    return jsonNoStore({ error: "Unable to expire unpaid orders." }, 500);
  }
}
