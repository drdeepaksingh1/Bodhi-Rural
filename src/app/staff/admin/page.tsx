'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

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

const fmtDate = (value: string | null) => {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const val = (value: unknown) =>
  value === null || value === undefined || value === ''
    ? '—'
    : String(value);

export default function StaffAdminPage() {
  const supabase = createClient();

  const [staff, setStaff] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [locations, setLocations] = useState<Record<string, Location>>({});

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  const selectedStaff =
    staff.find((item) => item.id === selectedId) || null;

  async function loadStaff() {
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw new Error(userError.message);
      if (!user) throw new Error('Please log in again.');

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

      setUserName(profile.data?.full_name || '');
      setUserRole(roleCode);

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
          'You are not authorized to access Staff Management.'
        );
      }

      const [staffResult, roleResult] = await Promise.all([
        supabase
          .from('staff')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('roles')
          .select('id, code, name')
          .order('name'),
      ]);

      if (staffResult.error) {
        throw new Error(staffResult.error.message);
      }

      if (roleResult.error) {
        throw new Error(roleResult.error.message);
      }

      const rows = (staffResult.data || []) as Staff[];

      setStaff(rows);
      setRoles((roleResult.data || []) as Role[]);

      const ids = Array.from(
        new Set(
          rows
            .flatMap((item) => [
              item.state_id,
              item.district_id,
              item.block_id,
              item.panchayat_id,
            ])
            .filter(Boolean)
        )
      ) as string[];

      if (ids.length > 0) {
        const locationResult = await supabase.rpc(
          'get_location_names',
          {
            p_ids: ids,
          }
        );

        if (locationResult.error) {
          throw new Error(locationResult.error.message);
        }

        const locationMap: Record<string, Location> = {};

        for (const item of (locationResult.data || []) as Location[]) {
          locationMap[item.id] = item;
        }

        setLocations(locationMap);
      } else {
        setLocations({});
      }

      if (!selectedId || !rows.some((item) => item.id === selectedId)) {
        setSelectedId(rows[0]?.id || '');
      }
    } catch (e: any) {
      setError(e?.message || 'Unable to load staff directory.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  const locationName = (id: string | null) => {
    if (!id) return '—';
    return locations[id]?.name || '—';
  };

  const roleName = (id: string | null) => {
    if (!id) return '—';

    return (
      roles.find((role) => role.id === id)?.name ||
      '—'
    );
  };

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();

    return staff.filter((item) => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        item.employment_status === statusFilter;

      if (!matchesStatus) return false;

      if (!query) return true;

      return [
        item.staff_id,
        item.employee_code,
        item.full_name,
        item.designation,
        item.department,
        item.email,
        item.phone,
        item.employment_status,
        roleName(item.role_id),
        locationName(item.state_id),
        locationName(item.district_id),
        locationName(item.block_id),
        locationName(item.panchayat_id),
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        );
    });
  }, [
    staff,
    search,
    statusFilter,
    roles,
    locations,
  ]);

  const statusCounts = useMemo(() => {
    return {
      total: staff.length,
      active: staff.filter(
        (item) => item.employment_status === 'ACTIVE'
      ).length,
      leave: staff.filter(
        (item) => item.employment_status === 'ON_LEAVE'
      ).length,
      inactive: staff.filter(
        (item) => item.employment_status === 'INACTIVE'
      ).length,
      resigned: staff.filter(
        (item) => item.employment_status === 'RESIGNED'
      ).length,
      terminated: staff.filter(
        (item) => item.employment_status === 'TERMINATED'
      ).length,
      retired: staff.filter(
        (item) => item.employment_status === 'RETIRED'
      ).length,
    };
  }, [staff]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-[1600px]">

        {/* HEADER */}
        <header className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-4">
              <img
                src="/branding/bodhi-rural-logo.png"
                alt="Bodhi Rural"
                className="h-16 w-auto object-contain"
              />

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Staff Management
                </h1>

                <p className="text-sm text-green-700">
                  Staff Directory · Bodhi Rural Livelihood & Agri Private Limited
                </p>

                {userName && (
                  <p className="mt-1 text-xs text-slate-500">
                    Signed in as {userName} · {userRole}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={loadStaff}
              disabled={loading}
              className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh Staff'}
            </button>

          </div>
        </header>

        {/* ERROR */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* SUMMARY */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">

          <StatCard
            title="Total Staff"
            value={statusCounts.total}
          />

          <StatCard
            title="Active"
            value={statusCounts.active}
          />

          <StatCard
            title="On Leave"
            value={statusCounts.leave}
          />

          <StatCard
            title="Inactive"
            value={statusCounts.inactive}
          />

          <StatCard
            title="Resigned"
            value={statusCounts.resigned}
          />

          <StatCard
            title="Terminated"
            value={statusCounts.terminated}
          />

          <StatCard
            title="Retired"
            value={statusCounts.retired}
          />

        </div>

        {/* MAIN */}
        <div className="grid gap-6 lg:grid-cols-[520px_1fr]">

          {/* STAFF LIST */}
          <aside className="rounded-2xl bg-white shadow-sm">

            <div className="border-b p-4 space-y-3">

              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  Staff Directory
                </h2>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                  {filteredStaff.length} Staff
                </span>
              </div>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Staff ID, name, designation, phone..."
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-green-600"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="ALL">All Employment Status</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="INACTIVE">Inactive</option>
                <option value="RESIGNED">Resigned</option>
                <option value="TERMINATED">Terminated</option>
                <option value="RETIRED">Retired</option>
              </select>

            </div>

            <div className="max-h-[calc(100vh-350px)] overflow-y-auto p-3">

              {loading ? (
                <p className="p-6 text-center text-sm text-slate-500">
                  Loading staff...
                </p>
              ) : filteredStaff.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-500">
                  No staff found.
                </p>
              ) : (
                <div className="space-y-2">

                  {filteredStaff.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        item.id === selectedId
                          ? 'border-green-600 bg-green-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>
                          <p className="font-bold text-green-700">
                            {val(item.staff_id)}
                          </p>

                          <p className="text-sm font-semibold text-slate-900">
                            {val(item.full_name)}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {val(item.designation)}
                          </p>
                        </div>

                        <StatusBadge
                          status={item.employment_status}
                        />

                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <span>
                          {val(item.department)}
                        </span>

                        <span className="text-right">
                          {roleName(item.role_id)}
                        </span>
                      </div>

                    </button>
                  ))}

                </div>
              )}

            </div>
          </aside>

          {/* STAFF PROFILE */}
          <section>

            {!selectedStaff ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm text-slate-500">
                Select a staff member to view the profile.
              </div>
            ) : (
              <div className="space-y-6">

                {/* PROFILE HEADER */}
                <div className="rounded-2xl bg-white p-6 shadow-sm">

                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                    <div className="flex items-center gap-5">

                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-3xl font-bold text-green-700">
                        {selectedStaff.full_name
                          ?.split(' ')
                          .map((x) => x[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                          Staff Profile
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900">
                          {selectedStaff.full_name}
                        </h2>

                        <p className="text-lg font-semibold text-slate-700">
                          {val(selectedStaff.designation)}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {val(selectedStaff.department)}
                        </p>
                      </div>

                    </div>

                    <div className="rounded-xl bg-slate-50 px-5 py-4 text-center">

                      <p className="text-xs text-slate-500">
                        Permanent Staff ID
                      </p>

                      <p className="text-xl font-bold text-green-700">
                        {val(selectedStaff.staff_id)}
                      </p>

                      <div className="mt-2">
                        <StatusBadge
                          status={selectedStaff.employment_status}
                        />
                      </div>

                    </div>

                  </div>

                </div>

                {/* PERSONAL */}
                <InfoSection title="Personal Information">

                  <Info
                    label="Full Name"
                    value={selectedStaff.full_name}
                  />

                  <Info
                    label="Blood Group"
                    value={selectedStaff.blood_group}
                  />

                  <Info
                    label="Phone"
                    value={selectedStaff.phone}
                  />

                  <Info
                    label="Email"
                    value={selectedStaff.email}
                  />

                  <Info
                    label="Address"
                    value={selectedStaff.address}
                  />

                </InfoSection>

                {/* EMPLOYMENT */}
                <InfoSection title="Employment Information">

                  <Info
                    label="Staff ID"
                    value={selectedStaff.staff_id}
                  />

                  <Info
                    label="Employee Code"
                    value={selectedStaff.employee_code}
                  />

                  <Info
                    label="Designation"
                    value={selectedStaff.designation}
                  />

                  <Info
                    label="Department"
                    value={selectedStaff.department}
                  />

                  <Info
                    label="System Role"
                    value={roleName(selectedStaff.role_id)}
                  />

                  <Info
                    label="Joining Date"
                    value={fmtDate(selectedStaff.joining_date)}
                  />

                  <Info
                    label="Employment Status"
                    value={selectedStaff.employment_status}
                  />

                </InfoSection>

                {/* POSTING */}
                <InfoSection title="Posting / Administrative Location">

                  <Info
                    label="State"
                    value={locationName(selectedStaff.state_id)}
                  />

                  <Info
                    label="District"
                    value={locationName(selectedStaff.district_id)}
                  />

                  <Info
                    label="Block"
                    value={locationName(selectedStaff.block_id)}
                  />

                  <Info
                    label="Panchayat"
                    value={locationName(selectedStaff.panchayat_id)}
                  />

                </InfoSection>

                {/* SYSTEM */}
                <InfoSection title="System Information">

                  <Info
                    label="User ID"
                    value={selectedStaff.user_id}
                  />

                  <Info
                    label="Staff Record ID"
                    value={selectedStaff.id}
                  />

                  <Info
                    label="Created"
                    value={fmtDate(selectedStaff.created_at)}
                  />

                </InfoSection>

              </div>
            )}

          </section>

        </div>

      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string | null;
}) {
  const normalized = status || 'UNKNOWN';

  const classes =
    normalized === 'ACTIVE'
      ? 'bg-green-100 text-green-800'
      : normalized === 'ON_LEAVE'
        ? 'bg-amber-100 text-amber-800'
        : normalized === 'RESIGNED'
          ? 'bg-slate-100 text-slate-700'
          : normalized === 'TERMINATED'
            ? 'bg-red-100 text-red-800'
            : normalized === 'RETIRED'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-slate-100 text-slate-700';

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${classes}`}
    >
      {normalized.replaceAll('_', ' ')}
    </span>
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
    <div className="rounded-2xl bg-white p-6 shadow-sm">

      <h3 className="mb-5 text-sm font-bold uppercase tracking-wide text-slate-700">
        {title}
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {children}
      </div>

    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">

      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {val(value)}
      </p>

    </div>
  );
}
