-- Applicants may submit only application payload fields.
-- Approval metadata and generated identifiers remain server/database controlled.
REVOKE INSERT ON TABLE public.farmer_applications FROM authenticated;

GRANT INSERT (
  user_id,
  full_name,
  father_husband_name,
  mobile,
  alternate_mobile,
  date_of_birth,
  gender,
  state_id,
  district_id,
  block_id,
  panchayat_id,
  village_id,
  farm_name,
  farm_type,
  land_area,
  shed_available,
  shed_capacity,
  aadhaar_number,
  aadhaar_document_url,
  bank_account_name,
  bank_name,
  bank_branch,
  bank_account_number,
  ifsc_code,
  bank_passbook_url,
  farmer_photo_url,
  status
) ON TABLE public.farmer_applications TO authenticated;
