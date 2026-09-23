'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../../../lib/supabase/client';

type LocationRow = {
  id: string;
  name: string;
  location_type: string;
  code: string | null;
};

type Application = {
  id: string;
  application_number: string;
  user_id: string | null;

  full_name: string | null;
  father_husband_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;

  email: string | null;
  mobile: string | null;
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
  submitted_at: string | null;
  created_at: string | null;
};

type RoleRow = {
  id: string;
  name: string;
  code: string;
};

const COMPANY_NAME =
  'BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED';

const TAGLINE =
  'Empowering Rural India for a Sustainable Future';

const CIN =
  'U46209BR2026PTC083153';

const REGISTERED_OFFICE =
  'Islampur, Nalanda, Bihar – 801303';

const WEBSITE =
  'www.brlps.co.in';

const EMAIL =
  'ceo@brlps.co.in';

const LOGO =
  '/branding/bodhi-rural-logo.png';

function formatDate(
  value: string | null | undefined
) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
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

function formatDateTime(
  value: string | null | undefined
) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(
    'en-IN',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );
}

function valueOrDash(
  value: string | number | null | undefined
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  return String(value);
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="info-item">
      <div className="info-label">
        {label}
      </div>

      <div className="info-value">
        {valueOrDash(value)}
      </div>
    </div>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="section">

      <div className="section-title">

        <span className="section-number">
          {number}
        </span>

        <span>{title}</span>

      </div>

      {children}

    </section>
  );
}

export default function StaffApplicationPrintPage() {

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [
    application,
    setApplication,
  ] = useState<Application | null>(null);

  const [
    role,
    setRole,
  ] = useState<RoleRow | null>(null);

  const [
    locations,
    setLocations,
  ] = useState<Record<string, string>>({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  useEffect(() => {

    async function loadApplication() {

      try {

        setLoading(true);
        setError('');

        const pathParts =
          window.location.pathname
            .split('/')
            .filter(Boolean);

        const applicationId =
          pathParts[pathParts.length - 2];

        if (!applicationId) {

          throw new Error(
            'Staff application ID was not found.'
          );

        }

        const {
          data: {
            user,
          },
        } =
          await supabase.auth.getUser();

        if (!user) {

          throw new Error(
            'Please log in to view this application.'
          );

        }

        const {
          data,
          error:
            applicationError,
        } =
          await supabase
            .from('staff_applications')
            .select(`
              id,
              application_number,
              user_id,
              full_name,
              father_husband_name,
              date_of_birth,
              gender,
              blood_group,
              email,
              mobile,
              alternate_mobile,
              address,
              state_id,
              district_id,
              block_id,
              panchayat_id,
              village_id,
              highest_qualification,
              course,
              institution,
              passing_year,
              previous_organization,
              previous_designation,
              total_experience_years,
              proposed_department,
              proposed_designation,
              proposed_role_id,
              proposed_state_id,
              proposed_district_id,
              proposed_block_id,
              proposed_panchayat_id,
              status,
              current_stage,
              submitted_at,
              created_at
            `)
            .eq(
              'id',
              applicationId
            )
            .single();

        if (applicationError) {

          throw new Error(
            applicationError.message
          );

        }

        if (!data) {

          throw new Error(
            'Staff application was not found.'
          );

        }

        if (
          data.user_id &&
          data.user_id !== user.id
        ) {

          throw new Error(
            'You are not authorized to view this application.'
          );

        }

        setApplication(
          data as Application
        );

        if (data.proposed_role_id) {

          const {
            data: roleData,
          } =
            await supabase
              .from('roles')
              .select(
                'id,name,code'
              )
              .eq(
                'id',
                data.proposed_role_id
              )
              .maybeSingle();

          if (roleData) {

            setRole(
              roleData as RoleRow
            );

          }

        }

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

        ].filter(Boolean) as string[];

        const uniqueLocationIds =
          Array.from(
            new Set(locationIds)
          );

        if (
          uniqueLocationIds.length > 0
        ) {

          const {
            data:
              locationData,
            error:
              locationError,
          } =
            await supabase.rpc(
              'get_location_names',
              {
                p_ids:
                  uniqueLocationIds,
              }
            );

          if (locationError) {

            throw new Error(
              `Unable to load location names: ${locationError.message}`
            );

          }

          const map:
            Record<string, string> =
            {};

          (
            locationData as
              | LocationRow[]
              | null
          )?.forEach(
            (location) => {

              map[
                location.id
              ] =
                location.name;

            }
          );

          setLocations(map);

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

    loadApplication();

  }, [supabase]);

  const locationName = (
    id:
      | string
      | null
      | undefined
  ) => {

    if (!id) return '—';

    return (
      locations[id] ||
      '—'
    );

  };

  if (loading) {

    return (
      <main className="screen-shell">

        <div className="screen-card">

          Loading staff application...

        </div>

      </main>
    );

  }

  if (
    error ||
    !application
  ) {

    return (
      <main className="screen-shell">

        <div className="screen-card error-card">

          <h1>
            Unable to open application
          </h1>

          <p>
            {error ||
              'Application not found.'}
          </p>

        </div>

      </main>
    );

  }

  return (
    <>

      <div className="print-actions">

        <button
          type="button"
          onClick={() =>
            window.print()
          }
          className="print-button"
        >
          Print / Save as PDF
        </button>

        <button
          type="button"
          onClick={() =>
            window.close()
          }
          className="close-button"
        >
          Close
        </button>

      </div>

      <main className="document-page">

        {/* HEADER */}

        <header className="document-header">

          <div className="brand-row">

            <img
              src={LOGO}
              alt="Bodhi Rural logo"
              className="company-logo"
            />

            <div className="brand-text">

              <h1>
                {COMPANY_NAME}
              </h1>

              <p>
                {TAGLINE}
              </p>

              <div className="document-subtitle">
                Official Staff Recruitment &amp;
                Employment System
              </div>

            </div>

          </div>

          <div className="header-rule" />

        </header>

        {/* TITLE */}

        <div className="document-title">

          <h2>
            STAFF EMPLOYMENT APPLICATION
          </h2>

          <p>
            Applicant Submission Copy
          </p>

        </div>

        {/* SUMMARY */}

        <div className="application-summary">

          <InfoItem
            label="APPLICATION NO."
            value={
              application.application_number
            }
          />

          <InfoItem
            label="APPLICATION DATE"
            value={
              formatDate(
                application.submitted_at ||
                  application.created_at
              )
            }
          />

          <InfoItem
            label="STATUS"
            value={
              application.status
            }
          />

          <InfoItem
            label="CURRENT STAGE"
            value={
              application.current_stage
            }
          />

        </div>

        {/* 1 */}

        <Section
          number="1"
          title="Applicant Information"
        >

          <div className="info-grid">

            <InfoItem
              label="FULL NAME"
              value={
                application.full_name
              }
            />

            <InfoItem
              label="FATHER / HUSBAND NAME"
              value={
                application.father_husband_name
              }
            />

            <InfoItem
              label="DATE OF BIRTH"
              value={
                formatDate(
                  application.date_of_birth
                )
              }
            />

            <InfoItem
              label="GENDER"
              value={
                application.gender
              }
            />

            <InfoItem
              label="BLOOD GROUP"
              value={
                application.blood_group
              }
            />

            <InfoItem
              label="MOBILE NUMBER"
              value={
                application.mobile
              }
            />

            <InfoItem
              label="EMAIL ADDRESS"
              value={
                application.email
              }
            />

            <InfoItem
              label="ALTERNATE MOBILE"
              value={
                application.alternate_mobile
              }
            />

            <div className="info-item full-width">

              <div className="info-label">
                RESIDENTIAL ADDRESS
              </div>

              <div className="info-value">
                {
                  valueOrDash(
                    application.address
                  )
                }
              </div>

            </div>

          </div>

        </Section>

        {/* 2 */}

        <Section
          number="2"
          title="Current Address / Location"
        >

          <div className="info-grid">

            <InfoItem
              label="STATE"
              value={
                locationName(
                  application.state_id
                )
              }
            />

            <InfoItem
              label="DISTRICT"
              value={
                locationName(
                  application.district_id
                )
              }
            />

            <InfoItem
              label="BLOCK"
              value={
                locationName(
                  application.block_id
                )
              }
            />

            <InfoItem
              label="PANCHAYAT"
              value={
                locationName(
                  application.panchayat_id
                )
              }
            />

            <InfoItem
              label="VILLAGE"
              value={
                locationName(
                  application.village_id
                )
              }
            />

          </div>

        </Section>

        {/* 3 */}

        <Section
          number="3"
          title="Educational Qualification"
        >

          <div className="info-grid">

            <InfoItem
              label="HIGHEST QUALIFICATION"
              value={
                application.highest_qualification
              }
            />

            <InfoItem
              label="COURSE / SPECIALIZATION"
              value={
                application.course
              }
            />

            <InfoItem
              label="INSTITUTION"
              value={
                application.institution
              }
            />

            <InfoItem
              label="PASSING YEAR"
              value={
                application.passing_year
              }
            />

          </div>

        </Section>

        {/* 4 */}

        <Section
          number="4"
          title="Previous Employment / Experience"
        >

          <div className="info-grid">

            <InfoItem
              label="PREVIOUS ORGANIZATION"
              value={
                application.previous_organization
              }
            />

            <InfoItem
              label="PREVIOUS DESIGNATION"
              value={
                application.previous_designation
              }
            />

            <InfoItem
              label="TOTAL EXPERIENCE"
              value={
                application.total_experience_years !==
                null &&
                application.total_experience_years !==
                undefined
                  ? `${application.total_experience_years} Years`
                  : '—'
              }
            />

          </div>

        </Section>

        {/* 5 */}

        <Section
          number="5"
          title="Proposed Employment"
        >

          <div className="info-grid">

            <InfoItem
              label="PROPOSED DEPARTMENT"
              value={
                application.proposed_department
              }
            />

            <InfoItem
              label="PROPOSED DESIGNATION"
              value={
                application.proposed_designation
              }
            />

            <InfoItem
              label="PROPOSED SYSTEM ROLE"
              value={
                role
                  ? `${role.name} (${role.code})`
                  : '—'
              }
            />

            <InfoItem
              label="PROPOSED STATE"
              value={
                locationName(
                  application.proposed_state_id
                )
              }
            />

            <InfoItem
              label="PROPOSED DISTRICT"
              value={
                locationName(
                  application.proposed_district_id
                )
              }
            />

            <InfoItem
              label="PROPOSED BLOCK"
              value={
                locationName(
                  application.proposed_block_id
                )
              }
            />

            <InfoItem
              label="PROPOSED PANCHAYAT"
              value={
                locationName(
                  application.proposed_panchayat_id
                )
              }
            />

          </div>

        </Section>

        {/* 6 */}

        <Section
          number="6"
          title="Applicant Declaration"
        >

          <div className="declaration">

            <p>
              I declare that the information
              provided by me in this staff
              employment application is true
              and complete to the best of my
              knowledge and belief.
            </p>

            <p>
              I understand that the information
              provided may be verified by Bodhi
              Rural Livelihood &amp; Agri Private
              Limited during the recruitment and
              approval process.
            </p>

            <p>
              I understand that submission of
              this application does not constitute
              appointment and does not itself
              generate a permanent Staff ID.
            </p>

          </div>

        </Section>

        {/* 7 */}

        <Section
          number="7"
          title="Digital Submission Verification"
        >

          <div className="info-grid">

            <InfoItem
              label="APPLICATION NUMBER"
              value={
                application.application_number
              }
            />

            <InfoItem
              label="SUBMITTED ON"
              value={
                formatDateTime(
                  application.submitted_at
                )
              }
            />

            <InfoItem
              label="EMAIL VERIFICATION"
              value="VERIFIED"
            />

            <InfoItem
              label="APPLICATION STATUS"
              value={
                application.status
              }
            />

          </div>

        </Section>

        {/* 8 */}

        <Section
          number="8"
          title="Internal Approval Record"
        >

          <div className="approval-grid">

            <div className="approval-box">

              <strong>
                HR Review
              </strong>

              <span>
                Decision / Date / Remarks
              </span>

            </div>

            <div className="approval-box">

              <strong>
                CEO Review
              </strong>

              <span>
                Decision / Date / Remarks
              </span>

            </div>

            <div className="approval-box">

              <strong>
                Chairman / MD Review
              </strong>

              <span>
                Decision / Date / Remarks
              </span>

            </div>

          </div>

        </Section>

        {/* STAFF ID */}

        <div className="staff-id-notice">

          <strong>
            Staff ID Generation
          </strong>

          <p>
            A permanent Staff ID in the
            BRLP000001 format will be generated
            only after completion of the applicable
            approval process and final approval by
            the authorized authority.
          </p>

        </div>

        {/* FOOTER */}

        <footer className="document-footer">

          <div className="footer-company">
            {COMPANY_NAME}
          </div>

          <div className="footer-tagline">
            {TAGLINE}
          </div>

          <div className="footer-line">
            <strong>CIN:</strong>{' '}
            {CIN}
          </div>

          <div className="footer-line">
            Registered under Ministry of Corporate
            Affairs, Govt. of India, New Delhi
          </div>

          <div className="footer-line">
            <strong>
              Registered Office:
            </strong>{' '}
            {REGISTERED_OFFICE}
          </div>

          <div className="footer-line">
            <strong>Web:</strong>{' '}
            {WEBSITE}

            <span className="footer-separator">
              |
            </span>

            <strong>Email:</strong>{' '}
            {EMAIL}
          </div>

          <div className="footer-generated">
            This document is an official digitally
            generated application copy.

            <span className="footer-separator">
              |
            </span>

            Application No:{' '}
            {application.application_number}
          </div>

        </footer>

      </main>

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #f1f5f9;
          color: #0f172a;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .screen-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
        }

        .screen-card {
          width: min(680px, 100%);
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow:
            0 10px 30px
            rgba(15, 23, 42, 0.08);
        }

        .screen-card h1 {
          margin: 0 0 10px;
          font-size: 24px;
        }

        .screen-card p {
          margin: 0;
          color: #475569;
        }

        .error-card {
          border: 1px solid #fecaca;
        }

        .print-actions {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          justify-content: center;
          gap: 12px;
          padding: 14px;
          background:
            rgba(255, 255, 255, 0.96);
          border-bottom:
            1px solid #cbd5e1;
        }

        .print-button,
        .close-button {
          border: 0;
          border-radius: 8px;
          padding: 10px 18px;
          font-weight: 700;
          cursor: pointer;
        }

        .print-button {
          background: #15803d;
          color: white;
        }

        .close-button {
          background: #e2e8f0;
          color: #0f172a;
        }

        .document-page {
          width: 210mm;
          min-height: 297mm;
          margin: 24px auto;
          padding:
            14mm
            14mm
            12mm;
          background: white;
          box-shadow:
            0 12px 40px
            rgba(15, 23, 42, 0.12);
        }

        .document-header {
          margin-bottom: 8mm;
        }

        .brand-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .company-logo {
          width: 78px;
          height: 78px;
          object-fit: contain;
          flex: 0 0 auto;
        }

        .brand-text h1 {
          margin: 0;
          font-size: 21px;
          line-height: 1.2;
          letter-spacing: 0.4px;
          color: #166534;
        }

        .brand-text p {
          margin: 5px 0 0;
          color: #b7791f;
          font-size: 11px;
          font-style: italic;
          font-weight: 700;
        }

        .document-subtitle {
          margin-top: 7px;
          font-size: 9px;
          color: #64748b;
          letter-spacing: 0.7px;
          text-transform: uppercase;
        }

        .header-rule {
          height: 3px;
          margin-top: 10px;
          background:
            linear-gradient(
              90deg,
              #15803d 0%,
              #15803d 70%,
              #d89b21 70%,
              #d89b21 100%
            );
        }

        .document-title {
          text-align: center;
          margin-bottom: 7mm;
        }

        .document-title h2 {
          margin: 0;
          font-size: 18px;
          color: #14532d;
          letter-spacing: 0.8px;
        }

        .document-title p {
          margin: 4px 0 0;
          font-size: 10px;
          color: #64748b;
        }

        .application-summary,
        .info-grid {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
          gap: 7px;
        }

        .application-summary {
          grid-template-columns:
            repeat(
              4,
              minmax(0, 1fr)
            );
          margin-bottom: 7mm;
        }

        .info-item {
          min-width: 0;
          border:
            1px solid #dbe4ea;
          border-radius: 5px;
          padding: 7px 8px;
          background: #ffffff;
        }

        .info-item.full-width {
          grid-column: 1 / -1;
        }

        .info-label {
          margin-bottom: 4px;
          font-size: 7.5px;
          line-height: 1.2;
          color: #64748b;
          font-weight: 800;
          letter-spacing: 0.45px;
        }

        .info-value {
          font-size: 9.5px;
          line-height: 1.35;
          color: #0f172a;
          overflow-wrap: anywhere;
        }

        .section {
          margin-bottom: 6mm;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          padding-bottom: 5px;
          border-bottom:
            1px solid #bbf7d0;
          color: #14532d;
          font-size: 11px;
          font-weight: 800;
        }

        .section-number {
          width: 21px;
          height: 21px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #15803d;
          color: white;
          font-size: 9px;
        }

        .declaration {
          border:
            1px solid #dbe4ea;
          border-left:
            4px solid #15803d;
          border-radius: 5px;
          padding: 10px 12px;
          font-size: 9.5px;
          line-height: 1.5;
          color: #334155;
        }

        .declaration p {
          margin:
            0 0 7px;
        }

        .declaration p:last-child {
          margin-bottom: 0;
        }

        .approval-grid {
          display: grid;
          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );
          gap: 8px;
        }

        .approval-box {
          min-height: 58px;
          border:
            1px solid #cbd5e1;
          border-radius: 5px;
          padding: 9px;
        }

        .approval-box strong {
          display: block;
          font-size: 9.5px;
          color: #14532d;
        }

        .approval-box span {
          display: block;
          margin-top: 13px;
          font-size: 7.5px;
          color: #64748b;
        }

        .staff-id-notice {
          margin-top: 7mm;
          padding: 9px 11px;
          border:
            1px solid #bbf7d0;
          border-radius: 5px;
          background: #f0fdf4;
        }

        .staff-id-notice strong {
          display: block;
          font-size: 9.5px;
          color: #14532d;
        }

        .staff-id-notice p {
          margin: 4px 0 0;
          font-size: 8.5px;
          line-height: 1.4;
          color: #166534;
        }

        .document-footer {
          margin-top: 9mm;
          padding-top: 6px;
          border-top:
            1.5px solid #15803d;
          text-align: center;
          color: #334155;
          font-size: 7.5px;
          line-height: 1.45;
        }

        .footer-company {
          color: #14532d;
          font-size: 9px;
          font-weight: 800;
        }

        .footer-tagline {
          margin-top: 1px;
          color: #a16207;
          font-size: 7.5px;
          font-style: italic;
          font-weight: 700;
        }

        .footer-line {
          margin-top: 1px;
        }

        .footer-generated {
          margin-top: 4px;
          color: #64748b;
          font-size: 6.8px;
        }

        .footer-separator {
          margin:
            0 5px;
          color: #94a3b8;
        }

        @page {
          size: A4;
          margin: 0;
        }

        @media print {

          html,
          body {
            background: white;
          }

          .print-actions {
            display: none !important;
          }

          .document-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding:
              14mm
              14mm
              12mm;
            box-shadow: none;
          }

          .section,
          .info-item,
          .approval-box,
          .staff-id-notice,
          .document-footer {
            break-inside: avoid;
            page-break-inside: avoid;
          }

        }

      `}</style>

    </>
  );
}
