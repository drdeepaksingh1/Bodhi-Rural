-- Require every BodhiMart seller application to belong to an authenticated account.
-- Existing unlinked applications are intentionally not auto-linked or modified.

DROP POLICY IF EXISTS "Marketplace seller applications submit"
ON public.marketplace_seller_applications;

CREATE POLICY "Marketplace seller applications submit"
ON public.marketplace_seller_applications
FOR INSERT
TO authenticated
WITH CHECK (
    status = 'SUBMITTED'
    AND user_id IS NOT NULL
    AND user_id = auth.uid()
    AND approved_by IS NULL
    AND approved_at IS NULL
);

DO $migration$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_catalog.pg_constraint
        WHERE conrelid = 'public.marketplace_seller_applications'::regclass
          AND conname = 'marketplace_seller_application_approved_requires_user'
    ) THEN
        ALTER TABLE public.marketplace_seller_applications
        ADD CONSTRAINT marketplace_seller_application_approved_requires_user
        CHECK (status <> 'APPROVED' OR user_id IS NOT NULL)
        NOT VALID;
    END IF;
END;
$migration$;

ALTER TABLE public.marketplace_seller_applications
VALIDATE CONSTRAINT marketplace_seller_application_approved_requires_user;
