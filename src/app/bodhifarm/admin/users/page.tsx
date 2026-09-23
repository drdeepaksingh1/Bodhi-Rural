'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../../lib/supabase/client';

type Role = {
  id: string;
  code: string;
  name: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role_id: string | null;
  location_id: string | null;
  employee_code: string | null;
  is_active: boolean;
};

type Location = {
  id: string;
  parent_id: string | null;
  location_type: string;
  name: string;
  code: string | null;
  is_active: boolean;
};

const GEOGRAPHIC_ROLES = [
  'STATE_MANAGER',
  'DISTRICT_MANAGER',
  'BLOCK_MANAGER',
];

const CORPORATE_ROLES = [
  'SUPER_ADMIN',
  'CEO',
  'CORPORATE_ADMIN',
  'FINANCE',
  'HR',
  'MIS',
  'PROCUREMENT',
  'VETERINARY',
  'WAREHOUSE',
  'FARMER',
  'FARMER_LEADER',
  'CLUSTER_SUPERVISOR',
];

export default function UserRoleManagementPage() {
  const supabase = createClient();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [states, setStates] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [blocks, setBlocks] = useState<Location[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  const selectedUser = profiles.find(
    (profile) => profile.id === selectedUserId
  );

  const selectedRole = roles.find(
    (role) => role.id === selectedRoleId
  );

  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return profiles;

    return profiles.filter((profile) =>
      [
        profile.full_name,
        profile.email,
        profile.phone,
        profile.employee_code,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(q)
        )
    );
  }, [profiles, search]);

  const managementLocationCount =
    states.length + districts.length + blocks.length;

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    setError('');

    try {
      const [
        { data: profileData, error: profileError },
        { data: roleData, error: roleError },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'id, full_name, email, phone, role_id, location_id, employee_code, is_active'
          )
          .order('full_name', { ascending: true }),

        supabase
          .from('roles')
          .select('id, code, name')
          .order('name', { ascending: true }),
      ]);

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (roleError) {
        throw new Error(roleError.message);
      }

      setProfiles(profileData || []);
      setRoles(roleData || []);

      await loadStates();
    } catch (err: any) {
      setError(err?.message || 'Failed to load user management data.');
    } finally {
      setLoading(false);
    }
  }

  async function loadStates() {
    setLoadingStates(true);

    try {
      const { data, error } = await supabase.rpc('get_states');

      if (error) {
        throw new Error(error.message);
      }

      setStates((data || []) as Location[]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load states.');
    } finally {
      setLoadingStates(false);
    }
  }

  async function loadDistricts(stateId: string) {
    setLoadingDistricts(true);

    try {
      const { data, error } = await supabase.rpc(
        'get_districts',
        {
          p_state_id: stateId,
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      setDistricts((data || []) as Location[]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load districts.');
    } finally {
      setLoadingDistricts(false);
    }
  }

  async function loadBlocks(districtId: string) {
    setLoadingBlocks(true);

    try {
      const { data, error } = await supabase.rpc(
        'get_blocks',
        {
          p_district_id: districtId,
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      setBlocks((data || []) as Location[]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load blocks.');
    } finally {
      setLoadingBlocks(false);
    }
  }

  async function findLocationHierarchy(locationId: string) {
    if (!locationId) return;

    try {
      const { data: location, error } = await supabase
        .from('locations')
        .select(
          'id, parent_id, location_type, name, code, is_active'
        )
        .eq('id', locationId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!location) return;

      const loc = location as Location;

      if (loc.location_type === 'STATE') {
        setSelectedStateId(loc.id);
        setSelectedDistrictId('');
        setSelectedBlockId('');
        setDistricts([]);
        setBlocks([]);
        await loadDistricts(loc.id);
        return;
      }

      if (loc.location_type === 'DISTRICT') {
        setSelectedDistrictId(loc.id);
        setSelectedBlockId('');
        setBlocks([]);

        if (loc.parent_id) {
          setSelectedStateId(loc.parent_id);
          await loadDistricts(loc.parent_id);
        }

        await loadBlocks(loc.id);
        return;
      }

      if (loc.location_type === 'BLOCK') {
        setSelectedBlockId(loc.id);

        if (loc.parent_id) {
          setSelectedDistrictId(loc.parent_id);

          const { data: district, error: districtError } =
            await supabase
              .from('locations')
              .select(
                'id, parent_id, location_type, name, code, is_active'
              )
              .eq('id', loc.parent_id)
              .single();

          if (districtError) {
            throw new Error(districtError.message);
          }

          if (district) {
            const districtLocation = district as Location;

            if (districtLocation.parent_id) {
              setSelectedStateId(
                districtLocation.parent_id
              );

              await loadDistricts(
                districtLocation.parent_id
              );
            }

            await loadBlocks(loc.parent_id);
          }
        }

        return;
      }
    } catch (err: any) {
      setError(
        err?.message ||
          'Failed to load geographic assignment.'
      );
    }
  }

  async function selectUser(profile: Profile) {
    setSelectedUserId(profile.id);
    setError('');
    setSuccess('');

    setSelectedRoleId(profile.role_id || '');
    setIsActive(profile.is_active);

    setSelectedStateId('');
    setSelectedDistrictId('');
    setSelectedBlockId('');

    setDistricts([]);
    setBlocks([]);

    if (profile.location_id) {
      await findLocationHierarchy(profile.location_id);
    }
  }

  async function handleStateChange(stateId: string) {
    setSelectedStateId(stateId);
    setSelectedDistrictId('');
    setSelectedBlockId('');

    setDistricts([]);
    setBlocks([]);

    setError('');
    setSuccess('');

    if (stateId) {
      await loadDistricts(stateId);
    }
  }

  async function handleDistrictChange(districtId: string) {
    setSelectedDistrictId(districtId);
    setSelectedBlockId('');

    setBlocks([]);

    setError('');
    setSuccess('');

    if (districtId) {
      await loadBlocks(districtId);
    }
  }

  function handleBlockChange(blockId: string) {
    setSelectedBlockId(blockId);
    setError('');
    setSuccess('');
  }

  function getLocationForRole() {
    if (!selectedRole) {
      return null;
    }

    if (selectedRole.code === 'STATE_MANAGER') {
      return selectedStateId || null;
    }

    if (selectedRole.code === 'DISTRICT_MANAGER') {
      return selectedDistrictId || null;
    }

    if (selectedRole.code === 'BLOCK_MANAGER') {
      return selectedBlockId || null;
    }

    return null;
  }

  function geographicAssignmentRequired() {
    return selectedRole
      ? GEOGRAPHIC_ROLES.includes(selectedRole.code)
      : false;
  }

  async function saveUser() {
    if (!selectedUser) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (!selectedRoleId) {
        throw new Error('Please select a role.');
      }

      if (geographicAssignmentRequired()) {
        if (
          selectedRole?.code === 'STATE_MANAGER' &&
          !selectedStateId
        ) {
          throw new Error(
            'Please select a State for the State Manager.'
          );
        }

        if (
          selectedRole?.code === 'DISTRICT_MANAGER' &&
          !selectedDistrictId
        ) {
          throw new Error(
            'Please select a District for the District Manager.'
          );
        }

        if (
          selectedRole?.code === 'BLOCK_MANAGER' &&
          !selectedBlockId
        ) {
          throw new Error(
            'Please select a Block for the Block Manager.'
          );
        }
      }

      const locationId = getLocationForRole();

      const { error } = await supabase
        .from('profiles')
        .update({
          role_id: selectedRoleId,
          location_id: locationId,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedUser.id);

      if (error) {
        throw new Error(error.message);
      }

      setProfiles((current) =>
        current.map((profile) =>
          profile.id === selectedUser.id
            ? {
                ...profile,
                role_id: selectedRoleId,
                location_id: locationId,
                is_active: isActive,
              }
            : profile
        )
      );

      setSuccess(
        `User "${selectedUser.full_name || selectedUser.email}" updated successfully.`
      );
    } catch (err: any) {
      setError(
        err?.message || 'Failed to update user.'
      );
    } finally {
      setSaving(false);
    }
  }

  function getRoleName(roleId: string | null) {
    if (!roleId) return 'No role';

    return (
      roles.find((role) => role.id === roleId)?.name ||
      'Unknown role'
    );
  }

  function getRoleCode(roleId: string | null) {
    if (!roleId) return '';

    return (
      roles.find((role) => role.id === roleId)?.code || ''
    );
  }

  function getAssignmentLabel(profile: Profile) {
    if (!profile.location_id) {
      return 'Company-wide';
    }

    const roleCode = getRoleCode(profile.role_id);

    if (roleCode === 'STATE_MANAGER') {
      return (
        states.find(
          (state) => state.id === profile.location_id
        )?.name || 'Assigned State'
      );
    }

    if (roleCode === 'DISTRICT_MANAGER') {
      return (
        districts.find(
          (district) => district.id === profile.location_id
        )?.name || 'Assigned District'
      );
    }

    if (roleCode === 'BLOCK_MANAGER') {
      return (
        blocks.find(
          (block) => block.id === profile.location_id
        )?.name || 'Assigned Block'
      );
    }

    return 'Assigned location';
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl bg-white p-8 shadow-sm">
            Loading User & Role Management...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-6">
          <a
            href="/bodhifarm/dashboard"
            className="text-sm font-medium text-green-700 hover:text-green-800"
          >
            ← Back to BodhiFarm Dashboard
          </a>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            User & Role Management
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Manage users, roles and geographic assignments.
          </p>
        </div>

        {/* MESSAGES */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {success}
          </div>
        )}

        {/* KPI CARDS */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Users
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {profiles.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Active Users
            </p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {
                profiles.filter(
                  (profile) => profile.is_active
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Roles
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {roles.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Management Locations
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {managementLocationCount}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              States + Districts + Blocks
            </p>
          </div>

        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* USER LIST */}
          <section className="rounded-xl bg-white shadow-sm lg:col-span-1">

            <div className="border-b border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900">
                Users
              </h2>

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search user..."
                className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
            </div>

            <div className="max-h-[650px] overflow-y-auto">

              {filteredProfiles.length === 0 && (
                <div className="p-6 text-center text-sm text-slate-500">
                  No users found.
                </div>
              )}

              {filteredProfiles.map((profile) => {
                const isSelected =
                  selectedUserId === profile.id;

                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() =>
                      selectUser(profile)
                    }
                    className={`w-full border-b border-slate-100 p-5 text-left transition ${
                      isSelected
                        ? 'bg-green-50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">

                      <div>
                        <p className="font-semibold text-slate-900">
                          {profile.full_name ||
                            'Unnamed User'}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {profile.email || 'No email'}
                        </p>

                        <p className="mt-2 text-xs font-medium text-green-700">
                          {getRoleName(profile.role_id)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {getAssignmentLabel(profile)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                          profile.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {profile.is_active
                          ? 'ACTIVE'
                          : 'INACTIVE'}
                      </span>

                    </div>
                  </button>
                );
              })}

            </div>
          </section>

          {/* EDIT PANEL */}
          <section className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">

            {!selectedUser ? (
              <div className="flex min-h-[500px] items-center justify-center text-center">
                <div>
                  <div className="text-5xl">👤</div>

                  <h2 className="mt-4 text-xl font-semibold text-slate-900">
                    Select a User
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Select a user to manage their role
                    and geographic assignment.
                  </p>
                </div>
              </div>
            ) : (

              <div>

                {/* USER HEADER */}
                <div className="border-b border-slate-200 pb-5">

                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {selectedUser.full_name ||
                          'Unnamed User'}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {selectedUser.email}
                      </p>

                      {selectedUser.phone && (
                        <p className="mt-1 text-sm text-slate-500">
                          {selectedUser.phone}
                        </p>
                      )}
                    </div>

                    <div className="rounded-lg bg-slate-50 px-4 py-3 text-right">
                      <p className="text-xs text-slate-500">
                        User ID
                      </p>

                      <p className="mt-1 max-w-[260px] break-all text-xs font-mono text-slate-700">
                        {selectedUser.id}
                      </p>
                    </div>

                  </div>

                </div>

                {/* ROLE */}
                <div className="mt-6">

                  <label className="block text-sm font-semibold text-slate-800">
                    Role
                  </label>

                  <select
                    value={selectedRoleId}
                    onChange={(e) => {
                      setSelectedRoleId(e.target.value);
                      setSelectedStateId('');
                      setSelectedDistrictId('');
                      setSelectedBlockId('');
                      setDistricts([]);
                      setBlocks([]);
                      setError('');
                      setSuccess('');
                    }}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                  >
                    <option value="">
                      Select role
                    </option>

                    {roles.map((role) => (
                      <option
                        key={role.id}
                        value={role.id}
                      >
                        {role.name} ({role.code})
                      </option>
                    ))}
                  </select>

                </div>

                {/* GEOGRAPHIC ASSIGNMENT */}
                {selectedRole &&
                  GEOGRAPHIC_ROLES.includes(
                    selectedRole.code
                  ) && (

                    <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">

                      <div className="mb-4">
                        <h3 className="font-semibold text-green-900">
                          Geographic Assignment
                        </h3>

                        <p className="mt-1 text-xs text-green-700">
                          Select the geographic area this
                          manager is responsible for.
                        </p>
                      </div>

                      {/* STATE */}
                      <div>
                        <label className="block text-sm font-medium text-slate-800">
                          State
                        </label>

                        <select
                          value={selectedStateId}
                          onChange={(e) =>
                            handleStateChange(
                              e.target.value
                            )
                          }
                          disabled={loadingStates}
                          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                        >
                          <option value="">
                            {loadingStates
                              ? 'Loading states...'
                              : 'Select State'}
                          </option>

                          {states.map((state) => (
                            <option
                              key={state.id}
                              value={state.id}
                            >
                              {state.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* DISTRICT */}
                      {(selectedRole.code ===
                        'DISTRICT_MANAGER' ||
                        selectedRole.code ===
                          'BLOCK_MANAGER') && (
                        <div className="mt-4">

                          <label className="block text-sm font-medium text-slate-800">
                            District
                          </label>

                          <select
                            value={
                              selectedDistrictId
                            }
                            onChange={(e) =>
                              handleDistrictChange(
                                e.target.value
                              )
                            }
                            disabled={
                              !selectedStateId ||
                              loadingDistricts
                            }
                            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 disabled:bg-slate-100"
                          >
                            <option value="">
                              {loadingDistricts
                                ? 'Loading districts...'
                                : !selectedStateId
                                ? 'Select State first'
                                : 'Select District'}
                            </option>

                            {districts.map(
                              (district) => (
                                <option
                                  key={district.id}
                                  value={district.id}
                                >
                                  {district.name}
                                </option>
                              )
                            )}
                          </select>

                        </div>
                      )}

                      {/* BLOCK */}
                      {selectedRole.code ===
                        'BLOCK_MANAGER' && (
                        <div className="mt-4">

                          <label className="block text-sm font-medium text-slate-800">
                            Block
                          </label>

                          <select
                            value={
                              selectedBlockId
                            }
                            onChange={(e) =>
                              handleBlockChange(
                                e.target.value
                              )
                            }
                            disabled={
                              !selectedDistrictId ||
                              loadingBlocks
                            }
                            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 disabled:bg-slate-100"
                          >
                            <option value="">
                              {loadingBlocks
                                ? 'Loading blocks...'
                                : !selectedDistrictId
                                ? 'Select District first'
                                : 'Select Block'}
                            </option>

                            {blocks.map((block) => (
                              <option
                                key={block.id}
                                value={block.id}
                              >
                                {block.name}
                              </option>
                            ))}
                          </select>

                        </div>
                      )}

                      {/* ASSIGNMENT SUMMARY */}
                      <div className="mt-5 rounded-lg bg-white p-4">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Assignment
                        </p>

                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {selectedStateId
                            ? states.find(
                                (state) =>
                                  state.id ===
                                  selectedStateId
                              )?.name
                            : 'No State selected'}

                          {selectedDistrictId &&
                            ` → ${
                              districts.find(
                                (district) =>
                                  district.id ===
                                  selectedDistrictId
                              )?.name || ''
                            }`}

                          {selectedBlockId &&
                            ` → ${
                              blocks.find(
                                (block) =>
                                  block.id ===
                                  selectedBlockId
                              )?.name || ''
                            }`}
                        </p>

                      </div>

                    </div>
                  )}

                {/* CORPORATE / NON-GEOGRAPHIC MESSAGE */}
                {selectedRole &&
                  !GEOGRAPHIC_ROLES.includes(
                    selectedRole.code
                  ) && (
                    <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">

                      <h3 className="font-semibold text-blue-900">
                        Company / Functional Role
                      </h3>

                      <p className="mt-1 text-sm text-blue-700">
                        This role does not require a
                        State, District or Block
                        assignment.
                      </p>

                    </div>
                  )}

                {/* ACTIVE STATUS */}
                <div className="mt-6 rounded-xl border border-slate-200 p-5">

                  <label className="flex cursor-pointer items-center gap-3">

                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) =>
                        setIsActive(
                          e.target.checked
                        )
                      }
                      className="h-5 w-5 rounded border-slate-300 text-green-700 focus:ring-green-600"
                    />

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        User Active
                      </p>

                      <p className="text-xs text-slate-500">
                        Allow this user to access
                        the Bodhi management system.
                      </p>
                    </div>

                  </label>

                </div>

                {/* SAVE */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserId(null);
                      setError('');
                      setSuccess('');
                    }}
                    className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={saveUser}
                    disabled={saving}
                    className="rounded-lg bg-green-700 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? 'Saving...'
                      : 'Save Changes'}
                  </button>

                </div>

              </div>
            )}

          </section>

        </div>

      </div>
    </main>
  );
}
