export const QUICK_DELIVERY_TIERS = [
  { radiusKm: 0.5, endsAfterSeconds: 10 },
  { radiusKm: 1, endsAfterSeconds: 20 },
  { radiusKm: 2, endsAfterSeconds: 30 },
  { radiusKm: 3, endsAfterSeconds: 40 },
  { radiusKm: 10, endsAfterSeconds: 55 },
] as const;

export type DispatchItem = { productId: string; quantity: number };

export type DispatchSeller = {
  sellerId: string;
  distanceKm: number;
  isAvailable: boolean;
  availableStock: ReadonlyMap<string, number>;
};

export type DeliveryPlan =
  | { mode: "QUICK"; offers: { sellerId: string; tierIndex: number }[] }
  | { mode: "STANDARD" }
  | { mode: "UNAVAILABLE" };

// Recompute eligibility against authoritative stock before confirming an offer.
export function planDelivery(
  items: readonly DispatchItem[],
  sellers: readonly DispatchSeller[],
  standardAvailable: boolean,
): DeliveryPlan {
  const quantities = new Map<string, number>();
  for (const { productId, quantity } of items) {
    const total = (quantities.get(productId) ?? 0) + quantity;
    if (!productId || !Number.isSafeInteger(quantity) || quantity <= 0 || !Number.isSafeInteger(total)) {
      throw new RangeError("Invalid dispatch item");
    }
    quantities.set(productId, total);
  }
  if (quantities.size === 0) throw new RangeError("Dispatch requires at least one item");

  const offers = [];
  for (const seller of sellers) {
    if (!seller.isAvailable || !Number.isFinite(seller.distanceKm) || seller.distanceKm < 0) continue;
    const tierIndex = QUICK_DELIVERY_TIERS.findIndex((tier) => seller.distanceKm <= tier.radiusKm);
    if (tierIndex < 0) continue;

    const inStock = [...quantities].every(([productId, quantity]) => {
      const stock = seller.availableStock.get(productId);
      return stock !== undefined && Number.isFinite(stock) && stock >= quantity;
    });
    if (inStock) offers.push({ sellerId: seller.sellerId, tierIndex });
  }

  if (offers.length) return { mode: "QUICK", offers };
  return { mode: standardAvailable ? "STANDARD" : "UNAVAILABLE" };
}
