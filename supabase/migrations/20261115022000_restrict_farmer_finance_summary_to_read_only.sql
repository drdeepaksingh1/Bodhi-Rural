-- The farmer finance summary is a read-only aggregate view.
-- Authenticated clients may read it, but must not retain unnecessary DML privileges.
REVOKE ALL PRIVILEGES ON TABLE public.farmer_finance_summary FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.farmer_finance_summary TO authenticated;
