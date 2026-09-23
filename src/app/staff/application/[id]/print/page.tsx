'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../../../lib/supabase/client';

type Application = {
  id: string;
  application_number: string;
  user_id: string;

  mobile: string | null;
  otp_verified_at: string | null;

  full_name: string | null;
  father_husband_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;

  email: string | null;
  alternate_mobile: string | null;
  address: string | null;

  state_id: string | null;
  district_id: string | null;
  block_id: string | null;
  panchayat_id: string | null;
  village_id: string | null;

  highest_qualification: string | null;
  course: string | null;
  institution: string | null;
  passing_year: number | null;

  previous_organization: string | null;
  previous_designation: string | null;
  total_experience_years: number | null;

  proposed_department: string | null;
  proposed_designation: string | null;
  proposed_role_id: string | null;

  proposed_state_id: string | null;
  proposed_district_id: string | null;
  proposed_block_id: string | null;
  proposed_panchayat_id: string | null;

  status: string | null;
  current_stage: string | null;
  rejection_reason: string | null;

  submitted_at: string | null;
  approved_at: string | null;
};

type Location = {
  id: string;
  name: string;
  location_type: string;
};

export default function StaffApplicationPrintPage() {
  const supabase = createClient();

  const [application, setApplication] =
    useState<Application | null>(null);

  const [locations, setLocations] =
    useState<Record<string, string>>({});

  const [roleName, setRoleName] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadApplication();
  }, []);

  async function loadApplication() {
    try {
      setLoading(true);
      setError('');

      const path = window.location.pathname;
      const parts = path.split('/').filter(Boolean);

      const printIndex = parts.indexOf('print');

      if (printIndex < 1) {
        throw new Error('Application ID is missing.');
      }

      const applicationId =
        parts[printIndex - 1];

      if (!applicationId) {
        throw new Error('Application ID is missing.');
      }

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error(
          'Please login before viewing this application.'
        );
      }

      const {
        data,
        error: applicationError,
      } = await supabase
        .from('staff_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (applicationError) {
        throw new Error(applicationError.message);
      }

      if (!data) {
        throw new Error('Application not found.');
      }

      setApplication(data as Application);

      const locationIds = [
        data.state_id,
        data.district_id,
        data.block_id,
        data.panchayat_id,
        data.village_id,
        data.proposed_state_id,
        data.proposed_district_id,
        data.proposed_block_id,
        data.proposed_panchayat_id,
      ].filter(Boolean);

      if (locationIds.length > 0) {
        const {
          data: locationData,
          error: locationError,
        } = await supabase
          .from('locations')
          .select(
            'id, name, location_type'
          )
          .in('id', locationIds);

        if (!locationError && locationData) {
          const map: Record<string, string> = {};

          (locationData as Location[]).forEach(
            (item) => {
              map[item.id] = item.name;
            }
          );

          setLocations(map);
        }
      }

      if (data.proposed_role_id) {
        const {
          data: roleData,
          error: roleError,
        } = await supabase
          .from('roles')
          .select('id, name, code')
          .eq('id', data.proposed_role_id)
          .single();

        if (!roleError && roleData) {
          setRoleName(
            `${roleData.name} (${roleData.code})`
          );
        }
      }
    } catch (err: any) {
      setError(
        err?.message ||
          'Unable to load staff application.'
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDate(
    value: string | null
  ) {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    );
  }

  function getLocation(
    id: string | null
  ) {
    if (!id) return '-';

    return locations[id] || '-';
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-xl bg-white px-8 py-6 shadow">
          <p className="text-sm text-slate-600">
            Loading staff application...
          </p>
        </div>
      </main>
    );
  }

  if (error || !application) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow">
          <h1 className="text-xl font-bold text-red-700">
            Unable to Load Application
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            {error || 'Application not found.'}
          </p>

          <button
            type="button"
            onClick={() => window.close()}
            className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Close
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-slate-200 px-4 py-8 print:bg-white print:p-0">

        {/* ACTION BAR */}

        <div className="mx-auto mb-5 flex max-w-4xl justify-end gap-3 print:hidden">

          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
          >
            Print / Save as PDF
          </button>

          <button
            type="button"
            onClick={() => window.close()}
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>

        </div>

        {/* A4 DOCUMENT */}

        <article className="mx-auto max-w-4xl bg-white p-8 shadow-lg print:max-w-none print:p-0 print:shadow-none">

          {/* HEADER */}

          <header className="border-b-4 border-green-700 pb-5">

            <div className="flex items-center gap-4">

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-green-50 text-3xl font-bold text-green-700">
                B
              </div>

              <div className="flex-1">

                <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900">
                  BODHI RURAL LIVELIHOOD AND AGRI PRIVATE LIMITED
                </h1>

                <p className="mt-1 text-sm font-medium text-green-700">
                  Empowering Rural India for a Sustainable Future
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Official Staff Recruitment & Employment System
                </p>

              </div>

              <div className="text-right">

                <p className="text-xs font-semibold text-slate-500">
                  APPLICATION NO.
                </p>

                <p className="mt-1 text-lg font-bold text-green-800">
                  {application.application_number}
                </p>

              </div>

            </div>

          </header>

          {/* TITLE */}

          <div className="mt-7 text-center">

            <h2 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
              Staff Employment Application
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Applicant Submission Copy
            </p>

          </div>

          {/* APPLICATION STATUS */}

          <section className="mt-6 grid grid-cols-4 gap-3">

            <InfoBox
              label="Application No."
              value={application.application_number}
            />

            <InfoBox
              label="Application Date"
              value={formatDate(
                application.submitted_at
              )}
            />

            <InfoBox
              label="Status"
              value={
                application.status || '-'
              }
            />

            <InfoBox
              label="Current Stage"
              value={
                application.current_stage || '-'
              }
            />

          </section>

          {/* 1 */}

          <Section title="1. Applicant Information">

            <div className="grid grid-cols-2 gap-x-8 gap-y-5">

              <Field
                label="Full Name"
                value={application.full_name}
              />

              <Field
                label="Father / Husband Name"
                value={
                  application.father_husband_name
                }
              />

              <Field
                label="Date of Birth"
                value={formatDate(
                  application.date_of_birth
                )}
              />

              <Field
                label="Gender"
                value={application.gender}
              />

              <Field
                label="Blood Group"
                value={
                  application.blood_group ===
                  'UNKNOWN'
                    ? 'Unknown'
                    : application.blood_group
                }
              />

              <Field
                label="Mobile Number"
                value={application.mobile}
              />

              <Field
                label="Email Address"
                value={application.email}
              />

              <Field
                label="Alternate Mobile"
                value={
                  application.alternate_mobile
                }
              />

            </div>

            <div className="mt-5">
              <Field
                label="Residential Address"
                value={application.address}
              />
            </div>

          </Section>

          {/* 2 */}

          <Section title="2. Current Address / Location">

            <div className="grid grid-cols-2 gap-x-8 gap-y-5">

              <Field
                label="State"
                value={getLocation(
                  application.state_id
                )}
              />

              <Field
                label="District"
                value={getLocation(
                  application.district_id
                )}
              />

              <Field
                label="Block"
                value={getLocation(
                  application.block_id
                )}
              />

              <Field
                label="Panchayat"
                value={getLocation(
                  application.panchayat_id
                )}
              />

              <Field
                label="Village"
                value={getLocation(
                  application.village_id
                )}
              />

            </div>

          </Section>

          {/* 3 */}

          <Section title="3. Educational Qualification">

            <div className="grid grid-cols-2 gap-x-8 gap-y-5">

              <Field
                label="Highest Qualification"
                value={
                  application.highest_qualification
                }
              />

              <Field
                label="Course / Specialization"
                value={application.course}
              />

              <Field
                label="Institution"
                value={
                  application.institution
                }
              />

              <Field
                label="Passing Year"
                value={
                  application.passing_year
                    ? String(
                        application.passing_year
                      )
                    : '-'
                }
              />

            </div>

          </Section>

          {/* 4 */}

          <Section title="4. Previous Employment / Experience">

            <div className="grid grid-cols-2 gap-x-8 gap-y-5">

              <Field
                label="Previous Organization"
                value={
                  application.previous_organization
                }
              />

              <Field
                label="Previous Designation"
                value={
                  application.previous_designation
                }
              />

              <Field
                label="Total Experience"
                value={
                  application.total_experience_years !==
                  null
                    ? `${application.total_experience_years} Years`
                    : '-'
                }
              />

            </div>

          </Section>

          {/* 5 */}

          <Section title="5. Proposed Employment">

            <div className="grid grid-cols-2 gap-x-8 gap-y-5">

              <Field
                label="Proposed Department"
                value={
                  application.proposed_department
                }
              />

              <Field
                label="Proposed Designation"
                value={
                  application.proposed_designation
                }
              />

              <Field
                label="Proposed System Role"
                value={roleName || '-'}
              />

              <Field
                label="Proposed State"
                value={getLocation(
                  application.proposed_state_id
                )}
              />

              <Field
                label="Proposed District"
                value={getLocation(
                  application.proposed_district_id
                )}
              />

              <Field
                label="Proposed Block"
                value={getLocation(
                  application.proposed_block_id
                )}
              />

              <Field
                label="Proposed Panchayat"
                value={getLocation(
                  application.proposed_panchayat_id
                )}
              />

            </div>

          </Section>

          {/* 6 */}

          <Section title="6. Applicant Declaration">

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">

              <p className="text-sm leading-6 text-slate-700">
                I declare that the information provided
                by me in this staff employment application
                is true and complete to the best of my
                knowledge and belief.
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                I understand that the information provided
                may be verified by Bodhi Rural Livelihood
                and Agri Private Limited during the
                recruitment and approval process.
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                I understand that submission of this
                application does not constitute appointment
                and does not itself generate a permanent
                Staff ID.
              </p>

            </div>

          </Section>

          {/* 7 */}

          <Section title="7. Digital Submission Verification">

            <div className="grid grid-cols-2 gap-x-8 gap-y-5">

              <Field
                label="Application Number"
                value={
                  application.application_number
                }
              />

              <Field
                label="Submitted On"
                value={formatDate(
                  application.submitted_at
                )}
              />

              <Field
                label="Email Verification"
                value={
                  application.otp_verified_at
                    ? 'VERIFIED'
                    : 'NOT VERIFIED'
                }
              />

              <Field
                label="Application Status"
                value={
                  application.status
                }
              />

            </div>

          </Section>

          {/* APPROVAL */}

          <Section title="8. Internal Approval Record">

            <div className="grid grid-cols-3 gap-4">

              <ApprovalBox title="HR Review" />

              <ApprovalBox title="CEO Review" />

              <ApprovalBox title="Chairman / MD Review" />

            </div>

          </Section>

          {/* STAFF ID NOTICE */}

          <section className="mt-7 rounded-lg border border-green-200 bg-green-50 p-4">

            <p className="text-sm font-semibold text-green-900">
              Staff ID Generation
            </p>

            <p className="mt-1 text-xs leading-5 text-green-800">
              A permanent Staff ID in the BRLP000001
              format will be generated only after
              completion of the applicable approval process
              and final approval by the authorized authority.
            </p>

          </section>

          {/* FOOTER */}

          <footer className="mt-10 border-t border-slate-300 pt-5 text-center">

            <p className="text-xs font-bold text-slate-800">
              BODHI RURAL LIVELIHOOD AND AGRI PRIVATE LIMITED
            </p>

            <p className="mt-1 text-xs text-green-700">
              Empowering Rural India for a Sustainable Future
            </p>

            <p className="mt-2 text-[10px] text-slate-500">
              This document is an official digitally
              generated application copy.
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Application No:
              {' '}
              {application.application_number}
            </p>

          </footer>

        </article>

      </main>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          body {
            background: white !important;
          }

          button {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">

      <h3 className="border-b-2 border-green-100 pb-2 text-base font-bold text-green-800">
        {title}
      </h3>

      <div className="mt-4">
        {children}
      </div>

    </section>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>

      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 min-h-[20px] break-words text-sm font-medium text-slate-900">
        {value || '-'}
      </p>

    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-green-100 bg-green-50 p-3">

      <p className="text-[10px] font-semibold uppercase text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-slate-900">
        {value}
      </p>

    </div>
  );
}

function ApprovalBox({
  title,
}: {
  title: string;
}) {
  return (
    <div className="min-h-[105px] rounded-lg border border-slate-300 p-4">

      <p className="text-sm font-bold text-slate-800">
        {title}
      </p>

      <div className="mt-8 border-b border-slate-300" />

      <p className="mt-2 text-[10px] text-slate-500">
        Decision / Date / Remarks
      </p>

    </div>
  );
}
