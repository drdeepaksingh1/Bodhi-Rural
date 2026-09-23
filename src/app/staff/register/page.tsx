'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

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
  is_active: boolean;
};

export default function StaffRegistrationPage() {
  const supabase = createClient();

  const [step, setStep] = useState<'otp' | 'profile' | 'submitted'>(
    'otp'
  );

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [userId, setUserId] = useState('');

  const [roles, setRoles] = useState<Role[]>([]);
  const [states, setStates] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [blocks, setBlocks] = useState<Location[]>([]);
  const [panchayats, setPanchayats] = useState<Location[]>([]);
  const [villages, setVillages] = useState<Location[]>([]);

  const [fullName, setFullName] = useState('');
  const [fatherHusbandName, setFatherHusbandName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [address, setAddress] = useState('');

  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [blockId, setBlockId] = useState('');
  const [panchayatId, setPanchayatId] = useState('');
  const [villageId, setVillageId] = useState('');

  const [highestQualification, setHighestQualification] =
    useState('');
  const [course, setCourse] = useState('');
  const [institution, setInstitution] = useState('');
  const [passingYear, setPassingYear] = useState('');

  const [previousOrganization, setPreviousOrganization] =
    useState('');
  const [previousDesignation, setPreviousDesignation] =
    useState('');
  const [experienceYears, setExperienceYears] = useState('');

  const [proposedDepartment, setProposedDepartment] =
    useState('');
  const [proposedDesignation, setProposedDesignation] =
    useState('');
  const [proposedRoleId, setProposedRoleId] = useState('');

  const [proposedStateId, setProposedStateId] = useState('');
  const [proposedDistrictId, setProposedDistrictId] = useState('');
  const [proposedBlockId, setProposedBlockId] = useState('');
  const [proposedPanchayatId, setProposedPanchayatId] =
    useState('');

  useEffect(() => {
    loadRoles();
    loadStates();
  }, []);

  async function loadRoles() {
    const { data, error } = await supabase
      .from('roles')
      .select('id, code, name')
      .order('name');

    if (error) {
      setError(error.message);
      return;
    }

    const allowed = (data || []).filter(
      (role: Role) =>
        ![
          'SUPER_ADMIN',
          'CEO',
          'CORPORATE_ADMIN',
          'FARMER',
        ].includes(role.code)
    );

    setRoles(allowed);
  }

  async function loadStates() {
    const { data, error } = await supabase.rpc('get_states');

    if (error) {
      setError(error.message);
      return;
    }

    setStates((data || []) as Location[]);
  }

  async function loadDistricts(parentStateId: string) {
    const { data, error } = await supabase.rpc(
      'get_districts',
      {
        p_state_id: parentStateId,
      }
    );

    if (error) {
      setError(error.message);
      return;
    }

    setDistricts((data || []) as Location[]);
  }

  async function loadBlocks(parentDistrictId: string) {
    const { data, error } = await supabase.rpc(
      'get_blocks',
      {
        p_district_id: parentDistrictId,
      }
    );

    if (error) {
      setError(error.message);
      return;
    }

    setBlocks((data || []) as Location[]);
  }

  async function loadPanchayats(parentBlockId: string) {
    const { data, error } = await supabase
      .from('locations')
      .select(
        'id, parent_id, location_type, name, code, is_active'
      )
      .eq('parent_id', parentBlockId)
      .eq('location_type', 'PANCHAYAT')
      .eq('is_active', true)
      .order('name');

    if (error) {
      setError(error.message);
      return;
    }

    setPanchayats((data || []) as Location[]);
  }

  async function loadVillages(parentPanchayatId: string) {
    const { data, error } = await supabase
      .from('locations')
      .select(
        'id, parent_id, location_type, name, code, is_active'
      )
      .eq('parent_id', parentPanchayatId)
      .eq('location_type', 'VILLAGE')
      .eq('is_active', true)
      .order('name');

    if (error) {
      setError(error.message);
      return;
    }

    setVillages((data || []) as Location[]);
  }

  async function sendOtp() {
    setError('');
    setMessage('');

    if (!mobile.trim()) {
      setError('Please enter your mobile number.');
      return;
    }

    setSendingOtp(true);

    try {
      const phone = mobile.startsWith('+')
        ? mobile
        : `+91${mobile.replace(/\D/g, '')}`;

      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });

      if (error) {
        throw new Error(error.message);
      }

      setMessage(
        'OTP sent successfully. Please check your mobile.'
      );
    } catch (err: any) {
      setError(err?.message || 'Unable to send OTP.');
    } finally {
      setSendingOtp(false);
    }
  }

  async function verifyOtp() {
    setError('');
    setMessage('');

    if (!otp.trim()) {
      setError('Please enter the OTP.');
      return;
    }

    setVerifyingOtp(true);

    try {
      const phone = mobile.startsWith('+')
        ? mobile
        : `+91${mobile.replace(/\D/g, '')}`;

      const { data, error } =
        await supabase.auth.verifyOtp({
          phone,
          token: otp.trim(),
          type: 'sms',
        });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error(
          'OTP verified but no authenticated user was returned.'
        );
      }

      setUserId(data.user.id);
      setStep('profile');
      setMessage(
        'Mobile number verified successfully.'
      );
    } catch (err: any) {
      setError(err?.message || 'Invalid OTP.');
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleStateChange(value: string) {
    setStateId(value);

    setDistrictId('');
    setBlockId('');
    setPanchayatId('');
    setVillageId('');

    setDistricts([]);
    setBlocks([]);
    setPanchayats([]);
    setVillages([]);

    if (value) {
      await loadDistricts(value);
    }
  }

  async function handleDistrictChange(value: string) {
    setDistrictId(value);

    setBlockId('');
    setPanchayatId('');
    setVillageId('');

    setBlocks([]);
    setPanchayats([]);
    setVillages([]);

    if (value) {
      await loadBlocks(value);
    }
  }

  async function handleBlockChange(value: string) {
    setBlockId(value);

    setPanchayatId('');
    setVillageId('');

    setPanchayats([]);
    setVillages([]);

    if (value) {
      await loadPanchayats(value);
    }
  }

  async function handlePanchayatChange(value: string) {
    setPanchayatId(value);
    setVillageId('');
    setVillages([]);

    if (value) {
      await loadVillages(value);
    }
  }

  async function handleProposedStateChange(value: string) {
    setProposedStateId(value);
    setProposedDistrictId('');
    setProposedBlockId('');
    setProposedPanchayatId('');

    if (value) {
      const { data, error } = await supabase.rpc(
        'get_districts',
        {
          p_state_id: value,
        }
      );

      if (!error) {
        setDistricts((data || []) as Location[]);
      }
    }
  }

  async function handleProposedDistrictChange(
    value: string
  ) {
    setProposedDistrictId(value);
    setProposedBlockId('');
    setProposedPanchayatId('');

    if (value) {
      const { data, error } = await supabase.rpc(
        'get_blocks',
        {
          p_district_id: value,
        }
      );

      if (!error) {
        setBlocks((data || []) as Location[]);
      }
    }
  }

  async function handleSubmit() {
    setError('');
    setMessage('');

    if (!userId) {
      setError('Please verify your mobile number first.');
      return;
    }

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!stateId || !districtId || !blockId) {
      setError(
        'Please complete your State, District and Block.'
      );
      return;
    }

    if (!proposedDesignation.trim()) {
      setError('Proposed designation is required.');
      return;
    }

    if (!proposedRoleId) {
      setError('Please select the proposed role.');
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('staff_applications')
        .insert({
          user_id: userId,

          mobile: mobile,

          otp_verified_at: new Date().toISOString(),

          full_name: fullName,
          father_husband_name: fatherHusbandName || null,
          date_of_birth: dateOfBirth || null,
          gender: gender || null,

          email: email || null,
          alternate_mobile:
            alternateMobile || null,

          address: address || null,

          state_id: stateId,
          district_id: districtId,
          block_id: blockId,
          panchayat_id: panchayatId || null,
          village_id: villageId || null,

          highest_qualification:
            highestQualification || null,
          course: course || null,
          institution: institution || null,
          passing_year: passingYear
            ? Number(passingYear)
            : null,

          previous_organization:
            previousOrganization || null,
          previous_designation:
            previousDesignation || null,
          total_experience_years:
            experienceYears
              ? Number(experienceYears)
              : null,

          proposed_department:
            proposedDepartment || null,
          proposed_designation:
            proposedDesignation,
          proposed_role_id:
            proposedRoleId,

          proposed_state_id:
            proposedStateId || null,
          proposed_district_id:
            proposedDistrictId || null,
          proposed_block_id:
            proposedBlockId || null,
          proposed_panchayat_id:
            proposedPanchayatId || null,

          status: 'SUBMITTED',
          current_stage: 'HR',
          submitted_at: new Date().toISOString(),
        })
        .select('id, application_number')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setMessage(
        `Application submitted successfully. Application Number: ${data.application_number}`
      );

      setStep('submitted');
    } catch (err: any) {
      setError(
        err?.message ||
          'Unable to submit staff application.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">

      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex items-center gap-4">

            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-green-50 text-3xl font-bold text-green-700">
              B
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Bodhi Staff Registration
              </h1>

              <p className="mt-1 text-sm text-green-700">
                Empowering Rural India for a Sustainable Future
              </p>
            </div>

          </div>

        </div>

        {/* PROGRESS */}

        <div className="mb-6 grid grid-cols-3 gap-2">

          <div
            className={`rounded-lg p-3 text-center text-xs font-semibold ${
              step === 'otp'
                ? 'bg-green-700 text-white'
                : 'bg-green-100 text-green-800'
            }`}
          >
            1. OTP Verification
          </div>

          <div
            className={`rounded-lg p-3 text-center text-xs font-semibold ${
              step === 'profile'
                ? 'bg-green-700 text-white'
                : 'bg-green-100 text-green-800'
            }`}
          >
            2. Staff Application
          </div>

          <div
            className={`rounded-lg p-3 text-center text-xs font-semibold ${
              step === 'submitted'
                ? 'bg-green-700 text-white'
                : 'bg-green-100 text-green-800'
            }`}
          >
            3. HR Review
          </div>

        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {message}
          </div>
        )}

        {/* OTP */}

        {step === 'otp' && (
          <section className="rounded-2xl bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Mobile Verification
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Verify your mobile number before starting
              your staff application.
            </p>

            <div className="mt-6">

              <label className="text-sm font-medium text-slate-700">
                Mobile Number
              </label>

              <input
                value={mobile}
                onChange={(e) =>
                  setMobile(e.target.value)
                }
                placeholder="9876543210"
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
              />

            </div>

            <button
              type="button"
              onClick={sendOtp}
              disabled={sendingOtp}
              className="mt-4 w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
            >
              {sendingOtp
                ? 'Sending OTP...'
                : 'Send OTP'}
            </button>

            <div className="mt-6 border-t pt-6">

              <label className="text-sm font-medium text-slate-700">
                OTP
              </label>

              <input
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value)
                }
                placeholder="Enter OTP"
                inputMode="numeric"
                maxLength={6}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
              />

              <button
                type="button"
                onClick={verifyOtp}
                disabled={verifyingOtp}
                className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {verifyingOtp
                  ? 'Verifying...'
                  : 'Verify OTP'}
              </button>

            </div>

          </section>
        )}

        {/* APPLICATION */}

        {step === 'profile' && (
          <section className="space-y-6">

            {/* PERSONAL */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                Personal Information
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">

                <input
                  placeholder="Full Name *"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  className="input"
                />

                <input
                  placeholder="Father / Husband Name"
                  value={fatherHusbandName}
                  onChange={(e) =>
                    setFatherHusbandName(
                      e.target.value
                    )
                  }
                  className="input"
                />

                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) =>
                    setDateOfBirth(e.target.value)
                  }
                  className="input"
                />

                <select
                  value={gender}
                  onChange={(e) =>
                    setGender(e.target.value)
                  }
                  className="input"
                >
                  <option value="">
                    Select Gender
                  </option>
                  <option value="MALE">
                    Male
                  </option>
                  <option value="FEMALE">
                    Female
                  </option>
                  <option value="OTHER">
                    Other
                  </option>
                </select>

                <input
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="input"
                />

                <input
                  placeholder="Alternate Mobile"
                  value={alternateMobile}
                  onChange={(e) =>
                    setAlternateMobile(
                      e.target.value
                    )
                  }
                  className="input"
                />

              </div>

              <textarea
                placeholder="Full Address"
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                className="input mt-4 min-h-[100px]"
              />

            </div>

            {/* LOCATION */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                Current Address / Location
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">

                <select
                  value={stateId}
                  onChange={(e) =>
                    handleStateChange(e.target.value)
                  }
                  className="input"
                >
                  <option value="">
                    Select State *
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

                <select
                  value={districtId}
                  onChange={(e) =>
                    handleDistrictChange(
                      e.target.value
                    )
                  }
                  disabled={!stateId}
                  className="input"
                >
                  <option value="">
                    Select District *
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

                <select
                  value={blockId}
                  onChange={(e) =>
                    handleBlockChange(
                      e.target.value
                    )
                  }
                  disabled={!districtId}
                  className="input"
                >
                  <option value="">
                    Select Block *
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

                <select
                  value={panchayatId}
                  onChange={(e) =>
                    handlePanchayatChange(
                      e.target.value
                    )
                  }
                  disabled={!blockId}
                  className="input"
                >
                  <option value="">
                    Select Panchayat
                  </option>

                  {panchayats.map((panchayat) => (
                    <option
                      key={panchayat.id}
                      value={panchayat.id}
                    >
                      {panchayat.name}
                    </option>
                  ))}
                </select>

                <select
                  value={villageId}
                  onChange={(e) =>
                    setVillageId(e.target.value)
                  }
                  disabled={!panchayatId}
                  className="input"
                >
                  <option value="">
                    Select Village
                  </option>

                  {villages.map((village) => (
                    <option
                      key={village.id}
                      value={village.id}
                    >
                      {village.name}
                    </option>
                  ))}
                </select>

              </div>

            </div>

            {/* EDUCATION */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                Education
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">

                <input
                  placeholder="Highest Qualification"
                  value={highestQualification}
                  onChange={(e) =>
                    setHighestQualification(
                      e.target.value
                    )
                  }
                  className="input"
                />

                <input
                  placeholder="Course / Specialization"
                  value={course}
                  onChange={(e) =>
                    setCourse(e.target.value)
                  }
                  className="input"
                />

                <input
                  placeholder="Institution"
                  value={institution}
                  onChange={(e) =>
                    setInstitution(
                      e.target.value
                    )
                  }
                  className="input"
                />

                <input
                  placeholder="Passing Year"
                  value={passingYear}
                  onChange={(e) =>
                    setPassingYear(
                      e.target.value
                    )
                  }
                  className="input"
                />

              </div>

            </div>

            {/* EXPERIENCE */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                Experience
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">

                <input
                  placeholder="Previous Organization"
                  value={previousOrganization}
                  onChange={(e) =>
                    setPreviousOrganization(
                      e.target.value
                    )
                  }
                  className="input"
                />

                <input
                  placeholder="Previous Designation"
                  value={previousDesignation}
                  onChange={(e) =>
                    setPreviousDesignation(
                      e.target.value
                    )
                  }
                  className="input"
                />

                <input
                  placeholder="Total Experience (Years)"
                  value={experienceYears}
                  onChange={(e) =>
                    setExperienceYears(
                      e.target.value
                    )
                  }
                  className="input"
                />

              </div>

            </div>

            {/* PROPOSED EMPLOYMENT */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                Proposed Employment
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Final designation, role and posting are
                subject to company approval.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">

                <input
                  placeholder="Proposed Department"
                  value={proposedDepartment}
                  onChange={(e) =>
                    setProposedDepartment(
                      e.target.value
                    )
                  }
                  className="input"
                />

                <input
                  placeholder="Proposed Designation *"
                  value={proposedDesignation}
                  onChange={(e) =>
                    setProposedDesignation(
                      e.target.value
                    )
                  }
                  className="input"
                />

                <select
                  value={proposedRoleId}
                  onChange={(e) =>
                    setProposedRoleId(
                      e.target.value
                    )
                  }
                  className="input"
                >
                  <option value="">
                    Select Proposed Role *
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

            {/* SUBMIT */}

            <div className="rounded-2xl border border-green-200 bg-green-50 p-6">

              <h3 className="font-bold text-green-900">
                Application Approval
              </h3>

              <p className="mt-2 text-sm text-green-800">
                After submission, your application will
                be reviewed according to Bodhi's approval
                process. A permanent Staff ID such as
                BRLP000002 will only be generated after
                final approval.
              </p>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-5 w-full rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
              >
                {submitting
                  ? 'Submitting Application...'
                  : 'Submit Staff Application'}
              </button>

            </div>

          </section>
        )}

        {/* SUBMITTED */}

        {step === 'submitted' && (
          <section className="rounded-2xl bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
              ✓
            </div>

            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              Application Submitted
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600">
              Your staff application has been submitted
              successfully and is now awaiting HR review.
            </p>

            <div className="mt-6 rounded-xl bg-green-50 p-5">
              <p className="text-sm font-semibold text-green-800">
                Your application number is shown in the
                confirmation message above.
              </p>

              <p className="mt-2 text-xs text-green-700">
                Do not share your OTP or login credentials
                with anyone.
              </p>
            </div>

          </section>
        )}

      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(203 213 225);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          outline: none;
          background: white;
        }

        .input:focus {
          border-color: rgb(21 128 61);
          box-shadow: 0 0 0 1px rgb(21 128 61);
        }

        .input:disabled {
          background: rgb(241 245 249);
          cursor: not-allowed;
        }
      `}</style>

    </main>
  );
}
