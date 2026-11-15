-- Staff applicants may attach document metadata and storage paths only.
-- Verification state and reviewer audit fields are controlled by management workflows.
REVOKE INSERT ON TABLE public.staff_application_documents FROM authenticated;
GRANT INSERT (application_id, document_type, file_name, storage_path)
ON TABLE public.staff_application_documents TO authenticated;
