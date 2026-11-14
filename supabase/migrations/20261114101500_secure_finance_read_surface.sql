-- Issue #61: expose only authorized, read-only farmer financial summaries.
-- The inspected view owner is postgres. Keep owner-based view evaluation so
-- finance users do not need broad SELECT access to the sensitive farmers table.
-- The WHERE clause is the explicit authorization boundary for every returned row.


CREATE OR REPLACE VIEW public.farmer_finance_summary
WITH (security_barrier = true, security_invoker = false)
AS
WITH ledger_totals AS (
    SELECT
        fle.farmer_id,
        COALESCE(SUM(CASE WHEN fle.entry_type = 'EGG_EARNING' THEN fle.credit ELSE 0::numeric END), 0::numeric) AS egg_earnings,
        COALESCE(SUM(CASE WHEN fle.entry_type = 'EXPENSE' THEN fle.debit ELSE 0::numeric END), 0::numeric) AS expenses,
        COALESCE(SUM(CASE WHEN fle.entry_type = 'PAYMENT' THEN fle.debit ELSE 0::numeric END), 0::numeric) AS payments,
        COALESCE(SUM(fle.credit), 0::numeric) - COALESCE(SUM(fle.debit), 0::numeric) AS outstanding_balance
    FROM public.farmer_ledger_entries fle
    GROUP BY fle.farmer_id
),
recovery_totals AS (
    SELECT
        fcr.farmer_id,
        SUM(fcr.recovered_amount) AS total_credit_recovered
    FROM public.farmer_credit_recoveries fcr
    GROUP BY fcr.farmer_id
),
payment_reservations AS (
    SELECT
        fp.farmer_id,
        SUM(fp.amount) AS reserved_payments
    FROM public.farmer_payments fp
    WHERE fp.status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text])
    GROUP BY fp.farmer_id
)
SELECT
    f.id AS farmer_id,
    f.farmer_id AS farmer_code,
    f.full_name,
    COALESCE(l.egg_earnings, 0::numeric) AS egg_earnings,
    COALESCE(l.expenses, 0::numeric) AS expenses,
    COALESCE(l.payments, 0::numeric) AS payments,
    COALESCE(l.outstanding_balance, 0::numeric) AS outstanding_balance,
    COALESCE(r.total_credit_recovered, 0::numeric) AS total_credit_recovered,
    COALESCE(fc.outstanding_amount, 0::numeric) AS outstanding_credit,
    COALESCE(fc.available_credit, 0::numeric) AS available_credit,
    GREATEST(
        COALESCE(l.outstanding_balance, 0::numeric)
        - COALESCE(pr.reserved_payments, 0::numeric),
        0::numeric
    ) AS available_payable
FROM public.farmers f
LEFT JOIN ledger_totals l ON l.farmer_id = f.id
LEFT JOIN recovery_totals r ON r.farmer_id = f.id
LEFT JOIN public.farmer_credit fc ON fc.farmer_id = f.id
LEFT JOIN payment_reservations pr ON pr.farmer_id = f.id
WHERE public.can_access_bodhi_finance()
   OR public.farmer_in_user_scope(f.id);

-- The summary is derived data: authenticated clients get SELECT only.
REVOKE ALL PRIVILEGES ON TABLE public.farmer_finance_summary
FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.farmer_finance_summary TO authenticated;

-- Preserve farmer-own access while adding finance and geographic-scope access.
DROP POLICY IF EXISTS "Finance and scoped management can view farmer credit"
ON public.farmer_credit;
CREATE POLICY "Finance and scoped management can view farmer credit"
ON public.farmer_credit
FOR SELECT
TO authenticated
USING (
    public.can_access_bodhi_finance()
    OR public.farmer_in_user_scope(farmer_id)
);

-- This table was RLS-enabled but had no authenticated SELECT grant or policy
-- in the audit. Add read-only access under the same role/scope boundary.
GRANT SELECT ON TABLE public.farmer_credit_recoveries TO authenticated;

DROP POLICY IF EXISTS "Finance and scoped management can view credit recoveries"
ON public.farmer_credit_recoveries;
CREATE POLICY "Finance and scoped management can view credit recoveries"
ON public.farmer_credit_recoveries
FOR SELECT
TO authenticated
USING (
    public.can_access_bodhi_finance()
    OR public.farmer_in_user_scope(farmer_id)
);

