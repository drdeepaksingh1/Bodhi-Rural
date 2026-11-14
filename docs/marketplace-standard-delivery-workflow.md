# BodhiMart Standard Delivery Workflow — Technical Design

**Status:** Design proposal; no production schema or order behavior changed.

## 1. Current verified state

- `marketplace_orders` has a master-order status check that includes `DISPATCHED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, and `DELIVERED`.
- `marketplace_seller_orders` has a separate seller-portion status check that includes `READY_FOR_DISPATCH`, `DISPATCHED`, and `DELIVERED`, but not `IN_TRANSIT` or `OUT_FOR_DELIVERY`.
- The current seller workflow advances a packed standard-delivery order to `READY_FOR_DISPATCH`.
- The existing pickup RPC accepts only a `READY` seller order with `delivery_method = 'PICKUP'`; it then marks that seller portion delivered and completes the parent only when all seller portions are terminal.
- No carrier, tracking number, dispatch timestamp, delivery timestamp, recipient confirmation, or proof-of-delivery fields currently exist on either order table.
- Current production data has one `PICKUP / READY` seller portion and no standard-delivery seller orders at the time of inspection.
- Order tables expose SELECT policies for customers, sellers and super-admin; there are no direct INSERT/UPDATE policies for authenticated clients. Mutations must remain behind SECURITY DEFINER RPCs with explicit authorization.

## 2. Proposed state model

### Seller portion — standard delivery

`PLACED → ACCEPTED → PROCESSING → PACKED → READY_FOR_DISPATCH → DISPATCHED → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED`

Terminal/exception states remain `CANCELLED` and `RETURNED`.

Pickup remains its own path:

`PLACED → ACCEPTED → PROCESSING → PACKED → READY → DELIVERED`

A pickup seller portion must never be eligible for dispatch/transit RPCs. A standard-delivery portion must never be eligible for pickup completion.

### Parent customer order

The parent status is an aggregate, not a browser-controlled field:
- `READY_FOR_DISPATCH`: at least one active seller portion is ready and no active portion has been dispatched.
- `DISPATCHED`: all non-terminal portions have been dispatched or progressed further, and none has progressed to transit.
- `IN_TRANSIT`: at least one active portion is in transit, with no portion yet out for delivery.
- `OUT_FOR_DELIVERY`: at least one active portion is out for delivery and remaining active portions are at least dispatched.
- `DELIVERED`: every seller portion is in a terminal completion state (`DELIVERED`, `CANCELLED`, or `RETURNED`) and at least one is delivered; cancellation/refund rules must be reconciled before changing an all-cancelled parent.

The aggregation logic must explicitly handle mixed multi-seller orders and preserve existing parent terminal states such as `CANCELLED`, `RETURNED`, and `REFUNDED`.

## 3. Proposed data additions

Prefer a dedicated `marketplace_delivery_events` append-only table rather than putting mutable tracking history on order rows. Suggested fields:
- `id` UUID primary key
- `seller_order_id` UUID foreign key
- `order_id` UUID foreign key for parent-order aggregation and lookup
- `event_type` constrained to `DISPATCHED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`
- `actor_user_id` UUID, `actor_role` text snapshot
- `event_at` timestamptz
- `carrier_name`, `tracking_number` nullable text
- `recipient_name` nullable text
- `proof_object_path` nullable text (private Storage object path, not a public URL)
- `notes` nullable text
- `created_at` timestamptz

Use a unique/idempotency key or a locked state transition to prevent duplicate event processing. Keep proof files in a private Storage bucket with seller/customer/admin-scoped access; do not store public object URLs. Do not collect full identity documents or unnecessary personal data as proof.

Whether tracking fields belong on the event row or a separate shipment table can be finalized when carrier/parcel model is confirmed. Multi-package shipments may eventually require a shipment entity rather than one tracking number per seller order.

## 4. RPC and authorization design

No browser direct writes to either order table or delivery events.

Suggested RPC boundaries:
- `seller_dispatch_marketplace_order(p_seller_order_id, p_carrier_name, p_tracking_number, p_notes)`: authenticated active owner of the seller portion; only standard delivery and `READY_FOR_DISPATCH`.
- `seller_advance_marketplace_delivery(p_seller_order_id, p_event_type, p_notes)`: only if seller-managed delivery is selected; enforce exact next transition and disallow delivery completion without the required proof/recipient confirmation.
- If an external courier or central logistics team owns tracking, replace the second RPC with a management/logistics-only RPC and an authenticated integration webhook. Do not let a seller impersonate a courier.
- Each RPC must validate `auth.uid()`, role/seller ownership, delivery method, status, and payload; lock the seller row and parent order in a consistent order; append an event; update seller and parent status in one transaction; use a pinned `search_path`; revoke PUBLIC/anon EXECUTE; grant only to intended authenticated roles.
- Do not update payment status during dispatch or delivery. Payment capture/refund remains a separate workflow.
- Do not allow a seller to mark another seller's portion delivered.

## 5. UI changes

Seller order screen should:
- Show the current logistics stage and event timeline.
- Show dispatch action only for `READY_FOR_DISPATCH` standard-delivery portions.
- Show the next valid action only after the preceding transition succeeds.
- Display carrier/tracking details when present.
- Keep `Mark picked up` visible only for `READY + PICKUP`.
- Never infer payment success from delivery completion.

Customer order detail should show the parent aggregate and per-seller tracking timeline, while hiding internal actor IDs and private proof paths.

## 6. Required tests

- Anonymous and unrelated users cannot call any mutation RPC.
- A seller can update only their own active seller portion.
- Pickup orders are rejected by all standard-delivery RPCs; standard-delivery orders are rejected by pickup completion.
- Invalid, skipped, duplicate, and out-of-order events are rejected.
- Duplicate/concurrent requests cannot produce duplicate transitions or inconsistent parent status.
- Multi-seller parent aggregation works for mixed dispatch, transit, delivery, cancellation and return states.
- Proof access is private and correctly scoped.
- Payment status and farmer payment/ledger workflows remain unchanged.
- Existing pickup path still passes its regression tests.

## 7. Decision gate before implementation

The production workflow must not assume who physically delivers the parcel. Confirm one operating model:
1. **Seller-managed delivery:** seller records dispatch and delivery confirmation, with recipient confirmation/proof.
2. **Central logistics/courier-managed delivery:** seller records handover; an authorized logistics role or verified carrier webhook records transit and delivery.

**Recommended default:** central logistics/courier-managed delivery for stronger separation of duties. If BodhiMart currently expects sellers to deliver locally themselves, use seller-managed delivery but require recipient confirmation and private proof capture.

Until the operating model and proof requirements are selected, keep this document as design only. No migration, status mutation, or live order update is included in this change.
