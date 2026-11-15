-- Restore scoped access required by the SECURITY INVOKER farmer finance summary.
-- Finance users need credit balances; farmer-scoped users may only see their own
-- farmer's credit and recovery totals.
DROP POLICY IF EXISTS "Farmers can view own credit" ON public.farmer_credit;
CREATE POLICY "RBAC can view farmer credit"
ON public.farmer_credit
FOR SELECT
TO authenticated
USING (
  public.can_access_bodhi_finance()
  OR public.farmer_in_user_scope(farmer_id)
);

GRANT SELECT ON public.farmer_credit_recoveries TO authenticated;
CREATE POLICY "RBAC can view farmer credit recoveries"
ON public.farmer_credit_recoveries
FOR SELECT
TO authenticated
USING (
  public.can_access_bodhi_finance()
  OR public.farmer_in_user_scope(farmer_id)
);
