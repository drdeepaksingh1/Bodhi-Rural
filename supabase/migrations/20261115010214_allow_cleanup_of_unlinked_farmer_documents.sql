-- Permit applicants to clean up only their own uploaded documents that
-- were never attached to a farmer application. Linked KYC evidence is protected.
drop policy if exists "Applicants can delete unlinked farmer documents"
  on storage.objects;

create policy "Applicants can delete unlinked farmer documents"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id in ('farmer-photos', 'farmer-aadhaar', 'farmer-bank-documents')
    and (storage.foldername(name))[1] = auth.uid()::text
    and not exists (
      select 1
      from public.farmer_applications fa
      where fa.user_id = auth.uid()
        and (
          (bucket_id = 'farmer-photos' and fa.farmer_photo_url = name)
          or
          (bucket_id = 'farmer-aadhaar' and fa.aadhaar_document_url = name)
          or
          (bucket_id = 'farmer-bank-documents' and fa.bank_passbook_url = name)
        )
    )
  );
