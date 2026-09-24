'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/client';

type Role = {
  id: string;
  code: string;
  name: string;
};

type Location = {
  id: string;
  name: string;
  location_type: string;
  code: string | null;
};

type Staff = {
  id: string;
  staff_id: string;
  user_id: string | null;
  full_name: string;
  employee_code: string | null;
  designation: string | null;
  department: string | null;
  role_id: string | null;
  phone: string | null;
  email: string | null;
  joining_date: string | null;
  employment_status: string | null;
  state_id: string | null;
  district_id: string | null;
  block_id: string | null;
  panchayat_id: string | null;
  address: string | null;
  blood_group: string | null;
  created_at: string;
};

const val = (value: unknown) =>
  value === null || value === undefined || value === ''
    ? '—'
    : String(value);

const fmtDate = (value: string | null) => {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export default function StaffProfilePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const id = String(params.id);

  const [staff, setStaff] = useState<Staff | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [locations, setLocations] =
    useState<Record<string, Location>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) loadStaff();
  }, [id]);

  async function loadStaff() {
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        throw new Error('Please log in again.');
      }

      const profile = await supabase
        .from('profiles')
        .select('full_name, role_id, roles:role_id(id, code, name)')
        .eq('id', user.id)
        .single();

      if (profile.error) {
        throw new Error(profile.error.message);
      }

      const profileRole = Array.isArray(profile.data?.roles)
        ? profile.data.roles[0]
        : profile.data?.roles;

      const roleCode = profileRole?.code || '';

      const allowedRoles = [
        'SUPER_ADMIN',
        'CEO',
        'CORPORATE_ADMIN',
        'STATE_MANAGER',
        'DISTRICT_MANAGER',
        'BLOCK_MANAGER',
        'CLUSTER_SUPERVISOR',
        'HR',
        'MIS',
      ];

      if (!allowedRoles.includes(roleCode)) {
        throw new Error(
          'You are not authorized to view staff profiles.'
        );
      }

      const [staffResult, roleResult] = await Promise.all([
        supabase
          .from('staff')
          .select('*')
          .eq('id', id)
          .single(),

        supabase
          .from('roles')
          .select('id, code, name')
          .order('name'),
      ]);

      if (staffResult.error) {
        throw new Error(
          staffResult.error.code === 'PGRST116'
            ? 'Staff record not found.'
            : staffResult.error.message
        );
      }

      if (roleResult.error) {
        throw new Error(roleResult.error.message);
      }

      const staffRecord = staffResult.data as Staff;

      setStaff(staffRecord);
      setRoles((roleResult.data || []) as Role[]);

      const locationIds = Array.from(
        new Set(
          [
            staffRecord.state_id,
            staffRecord.district_id,
            staffRecord.block_id,
            staffRecord.panchayat_id,
          ].filter(Boolean)
        )
      ) as string[];

      if (locationIds.length > 0) {
        const locationResult = await supabase.rpc(
          'get_location_names',
          {
            p_ids: locationIds,
          }
        );

        if (locationResult.error) {
          throw new Error(locationResult.error.message);
        }

        const map: Record<string, Location> = {};

        for (const item of (locationResult.data || []) as Location[]) {
          map[item.id] = item;
        }

        setLocations(map);
      }
    } catch (e: any) {
      setError(
        e?.message || 'Unable to load staff profile.'
      );
    } finally {
      setLoading(false);
    }
  }

  const roleName = (roleId: string | null) => {
    if (!roleId) return '—';

    return (
      roles.find((role) => role.id === roleId)?.name ||
      '—'
    );
  };

  const locationName = (locationId: string | null) => {
    if (!locationId) return '—';

    return locations[locationId]?.name || '—';
  };

  const initials = staff?.full_name
    ? staff.full_name
        .split(' ')
        .filter(Boolean)
        .map((word) => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'ST';

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Loading staff profile...
          </p>
        </div>
      </main>
    );
  }

  if (error || !staff) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl">

          <button
            onClick={() => router.push('/staff/admin')}
            className="mb-5 rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            ← Back to Staff Directory
          </button>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            {error || 'Staff record not found.'}
          </div>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">

      <div className="mx-auto max-w-6xl">

        {/* TOP NAVIGATION */}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

          <button
            onClick={() => router.push('/staff/admin')}
            className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            ← Staff Directory
          </button>

          <button
            onClick={loadStaff}
            className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Refresh Profile
          </button>

        </div>

        {/* COMPANY HEADER */}

        <header className="mb-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">

            <img
              src="/branding/bodhi-rural-logo.png"
              alt="Bodhi Rural Livelihood & Agri Private Limited"
              className="h-20 w-auto object-contain"
            />

            <div>
              <h1 className="text-xl font-bold text-slate-900">
                BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED
              </h1>

              <p className="mt-1 text-sm font-medium text-green-700">
                Empowering Rural India for a Sustainable Future
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Staff Management · Professional Staff Profile
              </p>
            </div>

          </div>

        </header>

        {/* PROFILE HEADER */}

        <section className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">

          <div className="bg-green-700 px-6 py-8 text-white">

            <div className="flex flex-col items-center gap-6 md:flex-row">

              {/* PHOTO PLACEHOLDER */}

              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-4 border-white/70 bg-white text-4xl font-bold text-green-700 shadow-lg">
                {initials}
              </div>

              <div className="text-center md:text-left">

                <p className="text-sm font-semibold uppercase tracking-widest text-green-100">
                  Permanent Staff
                </p>

                <h2 className="mt-1 text-3xl font-bold">
                  {staff.full_name}
                </h2>

                <p className="mt-1 text-lg font-medium text-green-50">
                  {val(staff.designation)}
                </p>

                <p className="mt-1 text-sm text-green-100">
                  {val(staff.department)}
                </p>

              </div>

              <div className="md:ml-auto">

                <div className="rounded-xl bg-white px-6 py-4 text-center shadow">

                  <p className="text-xs font-medium text-slate-500">
                    STAFF ID
                  </p>

                  <p className="mt-1 text-2xl font-bold text-green-700">
                    {staff.staff_id}
                  </p>

                </div>

              </div>

            </div>

          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">

            <QuickInfo
              label="Employment Status"
              value={staff.employment_status}
            />

            <QuickInfo
              label="System Role"
              value={roleName(staff.role_id)}
            />

            <QuickInfo
              label="Joining Date"
              value={fmtDate(staff.joining_date)}
            />

            <QuickInfo
              label="Blood Group"
              value={staff.blood_group}
            />

          </div>

        </section>

        {/* PERSONAL INFORMATION */}

        <InfoSection title="Personal Information">

          <Info
            label="Full Name"
            value={staff.full_name}
          />

          <Info
            label="Blood Group"
            value={staff.blood_group}
          />

          <Info
            label="Mobile"
            value={staff.phone}
          />

          <Info
            label="Email"
            value={staff.email}
          />

          <Info
            label="Address"
            value={staff.address}
            fullWidth
          />

        </InfoSection>

        {/* EMPLOYMENT INFORMATION */}

        <InfoSection title="Employment Information">

          <Info
            label="Permanent Staff ID"
            value={staff.staff_id}
          />

          <Info
            label="Employee Code"
            value={staff.employee_code}
          />

          <Info
            label="Designation"
            value={staff.designation}
          />

          <Info
            label="Department"
            value={staff.department}
          />

          <Info
            label="System Role"
            value={roleName(staff.role_id)}
          />

          <Info
            label="Joining Date"
            value={fmtDate(staff.joining_date)}
          />

          <Info
            label="Employment Status"
            value={staff.employment_status}
          />

        </InfoSection>

        {/* POSTING */}

        <InfoSection title="Current Posting">

          <Info
            label="State"
            value={locationName(staff.state_id)}
          />

          <Info
            label="District"
            value={locationName(staff.district_id)}
          />

          <Info
            label="Block"
            value={locationName(staff.block_id)}
          />

          <Info
            label="Panchayat"
            value={locationName(staff.panchayat_id)}
          />

        </InfoSection>

        {/* SYSTEM INFORMATION */}

        <InfoSection title="System Information">

          <Info
            label="User ID"
            value={staff.user_id}
          />

          <Info
            label="Staff Database ID"
            value={staff.id}
          />

          <Info
            label="Profile Created"
            value={fmtDate(staff.created_at)}
          />

        </InfoSection>

        {/* FUTURE MODULES */}

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">

          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
            Staff Management Modules
          </h3>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <ModuleCard
              title="Documents"
              description="KYC and employment documents"
            />

            <ModuleCard
              title="Employment History"
              description="Joining, promotion and transfer history"
            />

            <ModuleCard
              title="Leave"
              description="Leave applications and records"
            />

            <ModuleCard
              title="ID Card"
              description="Professional ID card and verification"
            />

          </div>

        </section>

        {/* FOOTER */}

        <footer className="mt-8 rounded-2xl bg-white p-5 text-center shadow-sm">

          <p className="text-sm font-semibold text-slate-700">
            BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Islampur, Nalanda, Bihar – 801303
          </p>

          <p className="mt-1 text-xs text-slate-500">
            ceo@brlps.co.in · www.brlps.co.in
          </p>

        </footer>

      </div>

    </main>
  );
}

function QuickInfo({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800">
        {val(value)}
      </p>
    </div>
  );
}

function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">

      <h3 className="mb-5 border-b pb-3 text-sm font-bold uppercase tracking-wide text-slate-700">
        {title}
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {children}
      </div>

    </section>
  );
}

function Info({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: unknown;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-100 bg-slate-50 p-4 ${
        fullWidth ? 'md:col-span-2' : ''
      }`}
    >
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {val(value)}
      </p>
    </div>
  );
}

function ModuleCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">

      <p className="font-semibold text-slate-800">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>

      <span className="mt-3 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
        Coming next
      </span>

    </div>
  );
}
