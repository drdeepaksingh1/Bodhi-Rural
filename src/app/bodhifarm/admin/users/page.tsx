"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../../lib/supabase/client";

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

const MANAGEMENT_ROLES = [
  "STATE_MANAGER",
  "DISTRICT_MANAGER",
  "BLOCK_MANAGER",
];

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

  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState("");

  const [isActive, setIsActive] = useState(true);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === roleId),
    [roles, roleId]
  );

  const states = useMemo(
    () =>
      locations
        .filter((l) => l.location_type === "STATE")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [locations]
  );

  const districts = useMemo(
    () =>
      locations
        .filter(
          (l) =>
            l.location_type === "DISTRICT" &&
            l.parent_id === selectedStateId
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [locations, selectedStateId]
  );

  const blocks = useMemo(
    () =>
      locations
        .filter(
          (l) =>
            l.location_type === "BLOCK" &&
            l.parent_id === selectedDistrictId
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [locations, selectedDistrictId]
  );

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
      setMessage(`Profiles: ${profileError.message}`);
    } else if (roleError) {
      setMessage(`Roles: ${roleError.message}`);
    } else if (locationError) {
      setMessage(`Locations: ${locationError.message}`);
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

    const userLocation = locations.find(
      (l) => l.id === profile.location_id
    );

    if (!userLocation) {
      setSelectedStateId("");
      setSelectedDistrictId("");
      setSelectedBlockId("");
      return;
    }

    if (userLocation.location_type === "STATE") {
      setSelectedStateId(userLocation.id);
      setSelectedDistrictId("");
      setSelectedBlockId("");
    }

    if (userLocation.location_type === "DISTRICT") {
      setSelectedStateId(userLocation.parent_id || "");
      setSelectedDistrictId(userLocation.id);
      setSelectedBlockId("");
    }

    if (userLocation.location_type === "BLOCK") {
      const district = locations.find(
        (l) => l.id === userLocation.parent_id
      );

      setSelectedStateId(district?.parent_id || "");
      setSelectedDistrictId(district?.id || "");
      setSelectedBlockId(userLocation.id);
    }
  }

  function handleRoleChange(value: string) {
    setRoleId(value);

    setLocationId("");
    setSelectedStateId("");
    setSelectedDistrictId("");
    setSelectedBlockId("");
  }

  function handleStateChange(value: string) {
    setSelectedStateId(value);
    setSelectedDistrictId("");
    setSelectedBlockId("");

    const role = selectedRole?.code;

    if (role === "STATE_MANAGER") {
      setLocationId(value);
    } else {
      setLocationId("");
    }
  }

  function handleDistrictChange(value: string) {
    setSelectedDistrictId(value);
    setSelectedBlockId("");

    if (selectedRole?.code === "DISTRICT_MANAGER") {
      setLocationId(value);
    } else {
      setLocationId("");
    }
  }

  function handleBlockChange(value: string) {
    setSelectedBlockId(value);

    if (selectedRole?.code === "BLOCK_MANAGER") {
      setLocationId(value);
    } else {
      setLocationId("");
    }
  }

  async function saveUser() {
    if (!selectedUser) return;

    if (
      selectedRole?.code === "STATE_MANAGER" &&
      !selectedStateId
    ) {
      setMessage("Please select a State.");
      return;
    }

    if (
      selectedRole?.code === "DISTRICT_MANAGER" &&
      !selectedDistrictId
    ) {
      setMessage("Please select a District.");
      return;
    }

    if (
      selectedRole?.code === "BLOCK_MANAGER" &&
      !selectedBlockId
    ) {
      setMessage("Please select a Block.");
      return;
    }

    setSaving(true);
    setMessage("");

    let finalLocationId: string | null = null;

    if (selectedRole?.code === "STATE_MANAGER") {
      finalLocationId = selectedStateId;
    }

    if (selectedRole?.code === "DISTRICT_MANAGER") {
      finalLocationId = selectedDistrictId;
    }

    if (selectedRole?.code === "BLOCK_MANAGER") {
      finalLocationId = selectedBlockId;
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
      setMessage(
        "User role and geographic assignment updated successfully."
      );

      await loadData();

      setSelectedUser({
        ...selectedUser,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        employee_code: employeeCode.trim() || null,
        role_id: roleId || null,
        location_id: finalLocationId,
        is_active: isActive,
      });
    }

    setSaving(false);
  }

  function roleName(id: string | null) {
    return (
      roles.find((r) => r.id === id)?.name ||
      "Not Assigned"
    );
  }

  function locationName(id: string | null) {
    return (
      locations.find((l) => l.id === id)?.name ||
      "Company-wide"
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">

        <div className="mb-6">
          <a
            href="/bodhifarm/dashboard"
            className="text-sm font-medium text-green-700"
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

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Users
            </p>
            <p className="mt-1 text-3xl font-bold">
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
            <p className="mt-1 text-3xl font-bold">
              {roles.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Locations
            </p>
            <p className="mt-1 text-3xl font-bold">
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

          <section className="rounded-xl bg-white shadow-sm lg:col-span-2">

            <div className="border-b p-5">
              <h2 className="text-lg font-semibold">
                Users
              </h2>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user..."
                className="mt-4 w-full rounded-lg border px-3 py-2 text-sm"
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
                    className={`w-full border-b p-4 text-left hover:bg-slate-50 ${
                      selectedUser?.id === profile.id
                        ? "bg-green-50"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between">

                      <div>
                        <p className="font-semibold">
                          {profile.full_name || "Unnamed User"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {profile.email || "No email"}
                        </p>

                        <p className="mt-2 text-xs font-medium text-green-700">
                          {roleName(profile.role_id)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {locationName(profile.location_id)}
                        </p>
                      </div>

                      <span
                        className={`h-fit rounded-full px-2 py-1 text-[10px] font-semibold ${
                          profile.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {profile.is_active
                          ? "ACTIVE"
                          : "INACTIVE"}
                      </span>

                    </div>
                  </button>
                ))
              )}

            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm lg:col-span-3">

            {!selectedUser ? (
              <div className="flex min-h-[500px] items-center justify-center text-center">
                <div>
                  <div className="text-5xl">👤</div>
                  <h2 className="mt-4 text-xl font-semibold">
                    Select a User
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Select a user to manage their role and geographic assignment.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 border-b pb-5">
                  <h2 className="text-xl font-bold">
                    Edit User
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    User ID: {selectedUser.id}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  <div>
                    <label className="text-sm font-medium">
                      Full Name
                    </label>

                    <input
                      value={fullName}
                      onChange={(e) =>
                        setFullName(e.target.value)
                      }
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Email
                    </label>

                    <input
                      value={selectedUser.email || ""}
                      disabled
                      className="mt-1 w-full rounded-lg border bg-slate-100 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Phone
                    </label>

                    <input
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value)
                      }
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Employee Code
                    </label>

                    <input
                      value={employeeCode}
                      onChange={(e) =>
                        setEmployeeCode(e.target.value)
                      }
                      placeholder="Example: BRL-001"
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Role
                    </label>

                    <select
                      value={roleId}
                      onChange={(e) =>
                        handleRoleChange(e.target.value)
                      }
                      className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
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

                </div>

                {selectedRole &&
                MANAGEMENT_ROLES.includes(
                  selectedRole.code
                ) ? (
                  <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">

                    <h3 className="font-semibold text-green-900">
                      Geographic Assignment
                    </h3>

                    <p className="mt-1 text-xs text-green-700">
                      Select the administrative area this manager controls.
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">

                      <div>
                        <label className="text-sm font-medium">
                          State
                        </label>

                        <select
                          value={selectedStateId}
                          onChange={(e) =>
                            handleStateChange(e.target.value)
                          }
                          className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
                        >
                          <option value="">
                            Select State
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

                      <div>
                        <label className="text-sm font-medium">
                          District
                        </label>

                        <select
                          value={selectedDistrictId}
                          onChange={(e) =>
                            handleDistrictChange(e.target.value)
                          }
                          disabled={!selectedStateId}
                          className="mt-1 w-full rounded-lg border bg-white px-3 py-2 disabled:bg-slate-100"
                        >
                          <option value="">
                            Select District
                          </option>

                          {districts.map((district) => (
                            <option
                              key={district.id}
                              value={district.id}
                            >
                              {district.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Block
                        </label>

                        <select
                          value={selectedBlockId}
                          onChange={(e) =>
                            handleBlockChange(e.target.value)
                          }
                          disabled={!selectedDistrictId}
                          className="mt-1 w-full rounded-lg border bg-white px-3 py-2 disabled:bg-slate-100"
                        >
                          <option value="">
                            Select Block
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

                    </div>

                    <div className="mt-4 rounded-lg bg-white p-3 text-sm">
                      <span className="font-semibold">
                        Assignment:
                      </span>{" "}

                      {selectedRole.code === "STATE_MANAGER" &&
                        (states.find(
                          (s) => s.id === selectedStateId
                        )?.name || "Not selected")}

                      {selectedRole.code === "DISTRICT_MANAGER" &&
                        (districts.find(
                          (d) => d.id === selectedDistrictId
                        )?.name || "Not selected")}

                      {selectedRole.code === "BLOCK_MANAGER" &&
                        (blocks.find(
                          (b) => b.id === selectedBlockId
                        )?.name || "Not selected")}
                    </div>

                  </div>
                ) : (
                  <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="font-semibold text-slate-800">
                      Geographic Assignment
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      This role has company-wide or functional access.
                      No geographic assignment is required here.
                    </p>
                  </div>
                )}

                <div className="mt-6 rounded-lg border bg-slate-50 p-4">

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
                      <span className="block text-sm font-semibold">
                        Active Account
                      </span>

                      <span className="block text-xs text-slate-500">
                        Inactive users should not be able to use the management system.
                      </span>
                    </span>
                  </label>

                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={saveUser}
                    disabled={saving}
                    className="rounded-lg bg-green-700 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
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
