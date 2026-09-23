"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

type Role = {
  id: string;
  code: string;
  name: string;
};

type Location = {
  id: string;
  parent_id: string | null;
  location_type: string;
  name: string;
  code: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  role_id: string | null;
  location_id: string | null;
  employee_code: string | null;
  avatar_url: string | null;
  is_active: boolean;
};

const supabase = createClient();

const roleLocationTypes: Record<string, string> = {
  STATE_MANAGER: "STATE",
  DISTRICT_MANAGER: "DISTRICT",
  BLOCK_MANAGER: "BLOCK",
};

export default function UserManagementPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [roleId, setRoleId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === roleId),
    [roles, roleId]
  );

  const filteredLocations = useMemo(() => {
    const requiredType = selectedRole
      ? roleLocationTypes[selectedRole.code]
      : undefined;

    if (!requiredType) return [];

    return locations
      .filter((l) => l.location_type === requiredType)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [locations, selectedRole]);

  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return profiles;

    return profiles.filter((p) =>
      [
        p.full_name,
        p.email,
        p.phone,
        p.employee_code,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(q)
        )
    );
  }, [profiles, search]);

  async function loadData() {
    setLoading(true);
    setMessage("");

    const [
      { data: profileData, error: profileError },
      { data: roleData, error: roleError },
      { data: locationData, error: locationError },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id,full_name,phone,email,role_id,location_id,employee_code,avatar_url,is_active"
        )
        .order("full_name"),

      supabase
        .from("roles")
        .select("id,code,name")
        .order("name"),

      supabase
        .from("locations")
        .select(
          "id,parent_id,location_type,name,code"
        )
        .eq("is_active", true)
        .order("name"),
    ]);

    if (profileError) {
      setMessage(profileError.message);
    } else if (roleError) {
      setMessage(roleError.message);
    } else if (locationError) {
      setMessage(locationError.message);
    } else {
      setProfiles(profileData || []);
      setRoles(roleData || []);
      setLocations(locationData || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function selectUser(profile: Profile) {
    setSelectedUser(profile);

    setFullName(profile.full_name || "");
    setPhone(profile.phone || "");
    setEmployeeCode(profile.employee_code || "");
    setRoleId(profile.role_id || "");
    setLocationId(profile.location_id || "");
    setIsActive(profile.is_active);
    setMessage("");
  }

  function handleRoleChange(value: string) {
    setRoleId(value);

    const role = roles.find((r) => r.id === value);

    if (
      !role ||
      !["STATE_MANAGER", "DISTRICT_MANAGER", "BLOCK_MANAGER"].includes(
        role.code
      )
    ) {
      setLocationId("");
    }
  }

  async function saveUser() {
    if (!selectedUser) return;

    setSaving(true);
    setMessage("");

    const role = roles.find((r) => r.id === roleId);

    let finalLocationId: string | null = locationId || null;

    if (
      role &&
      !["STATE_MANAGER", "DISTRICT_MANAGER", "BLOCK_MANAGER"].includes(
        role.code
      )
    ) {
      finalLocationId = null;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        employee_code: employeeCode.trim() || null,
        role_id: roleId || null,
        location_id: finalLocationId,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedUser.id);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("User profile updated successfully.");
      await loadData();

      const refreshed = profiles.find(
        (p) => p.id === selectedUser.id
      );

      if (refreshed) {
        setSelectedUser({
          ...refreshed,
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          employee_code: employeeCode.trim() || null,
          role_id: roleId || null,
          location_id: finalLocationId,
          is_active: isActive,
        });
      }
    }

    setSaving(false);
  }

  function roleName(id: string | null) {
    return roles.find((r) => r.id === id)?.name || "Not Assigned";
  }

  function locationName(id: string | null) {
    return locations.find((l) => l.id === id)?.name || "Company-wide";
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6">
          <a
            href="/bodhifarm/dashboard"
            className="text-sm font-medium text-green-700 hover:text-green-900"
          >
            ← Back to BodhiFarm Dashboard
          </a>

          <div className="mt-4">
            <h1 className="text-3xl font-bold text-slate-900">
              User & Role Management
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Manage Bodhi Rural users, roles and geographic assignments.
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Users
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {profiles.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Active Users
            </p>
            <p className="mt-1 text-3xl font-bold text-green-700">
              {profiles.filter((p) => p.is_active).length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Roles
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {roles.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Locations
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {locations.length.toLocaleString()}
            </p>
          </div>

        </div>

        {message && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

          {/* User list */}
          <section className="lg:col-span-2 rounded-xl bg-white shadow-sm">

            <div className="border-b p-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Users
              </h2>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, phone or employee code..."
                className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-600"
              />
            </div>

            <div className="max-h-[650px] overflow-y-auto">

              {loading ? (
                <div className="p-6 text-sm text-slate-500">
                  Loading users...
                </div>
              ) : filteredProfiles.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">
                  No users found.
                </div>
              ) : (
                filteredProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => selectUser(profile)}
                    className={`w-full border-b p-4 text-left transition hover:bg-slate-50 ${
                      selectedUser?.id === profile.id
                        ? "bg-green-50"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">

                      <div>
                        <p className="font-semibold text-slate-900">
                          {profile.full_name || "Unnamed User"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {profile.email || "No email"}
                        </p>

                        <p className="mt-2 text-xs font-medium text-green-700">
                          {roleName(profile.role_id)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                          profile.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {profile.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>

                    </div>
                  </button>
                ))
              )}

            </div>
          </section>

          {/* Edit user */}
          <section className="lg:col-span-3 rounded-xl bg-white p-6 shadow-sm">

            {!selectedUser ? (
              <div className="flex min-h-[500px] items-center justify-center text-center">
                <div>
                  <div className="text-5xl">👤</div>
                  <h2 className="mt-4 text-xl font-semibold text-slate-900">
                    Select a User
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    Select a user from the list to manage their role,
                    geographic assignment and account status.
                  </p>
                </div>
              </div>
            ) : (

              <>
                <div className="mb-6 border-b pb-5">
                  <h2 className="text-xl font-bold text-slate-900">
                    Edit User
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    User ID: {selectedUser.id}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Full Name
                    </label>

                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Email
                    </label>

                    <input
                      value={selectedUser.email || ""}
                      disabled
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Phone
                    </label>

                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Employee Code
                    </label>

                    <input
                      value={employeeCode}
                      onChange={(e) =>
                        setEmployeeCode(e.target.value)
                      }
                      placeholder="Example: BRL-001"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Role
                    </label>

                    <select
                      value={roleId}
                      onChange={(e) =>
                        handleRoleChange(e.target.value)
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                    >
                      <option value="">
                        Select Role
                      </option>

                      {roles.map((role) => (
                        <option
                          key={role.id}
                          value={role.id}
                        >
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Geographic Assignment
                    </label>

                    {selectedRole &&
                    roleLocationTypes[selectedRole.code] ? (
                      <select
                        value={locationId}
                        onChange={(e) =>
                          setLocationId(e.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                      >
                        <option value="">
                          Select {roleLocationTypes[selectedRole.code]}
                        </option>

                        {filteredLocations.map((location) => (
                          <option
                            key={location.id}
                            value={location.id}
                          >
                            {location.name}
                            {location.code
                              ? ` (${location.code})`
                              : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="mt-1 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500">
                        Company-wide / not applicable
                      </div>
                    )}
                  </div>

                </div>

                <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) =>
                        setIsActive(e.target.checked)
                      }
                      className="h-4 w-4"
                    />

                    <span>
                      <span className="block text-sm font-semibold text-slate-800">
                        Active Account
                      </span>

                      <span className="block text-xs text-slate-500">
                        Inactive users should not be able to use
                        the Bodhi management system.
                      </span>
                    </span>
                  </label>

                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={saveUser}
                    disabled={saving}
                    className="rounded-lg bg-green-700 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : "Save User & Role"}
                  </button>
                </div>

              </>
            )}

          </section>

        </div>

      </div>
    </main>
  );
}
