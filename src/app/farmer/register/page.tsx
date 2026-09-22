'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

type Location = {
  id: string;
  name: string;
  code: string;
};

export default function FarmerRegisterPage() {
  const supabase = createClient();

  const [states, setStates] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [blocks, setBlocks] = useState<Location[]>([]);
  const [panchayats, setPanchayats] = useState<Location[]>([]);
  const [villages, setVillages] = useState<Location[]>([]);

  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [blockId, setBlockId] = useState('');
  const [panchayatId, setPanchayatId] = useState('');
  const [villageId, setVillageId] = useState('');
  const [villageCode, setVillageCode] = useState('');

  const [fullName, setFullName] = useState('');
  const [fatherHusbandName, setFatherHusbandName] = useState('');
  const [mobile, setMobile] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');

  const [farmName, setFarmName] = useState('');
  const [farmType, setFarmType] = useState('');
  const [landArea, setLandArea] = useState('');
  const [shedAvailable, setShedAvailable] = useState(false);
  const [shedCapacity, setShedCapacity] = useState('');

  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const [farmerPhoto, setFarmerPhoto] = useState<File | null>(null);
  const [aadhaarDocument, setAadhaarDocument] = useState<File | null>(null);
  const [bankPassbook, setBankPassbook] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // ---------------------------------------------------------
  // Load States
  // ---------------------------------------------------------

  useEffect(() => {
    async function loadStates() {
      const { data, error } = await supabase.rpc('get_states');

      if (error) {
        setError(error.message);
        return;
      }

      setStates(data || []);
    }

    loadStates();
  }, []);

  // ---------------------------------------------------------
  // State → District
  // ---------------------------------------------------------

  async function handleStateChange(value: string) {
    setStateId(value);

    setDistrictId('');
    setBlockId('');
    setPanchayatId('');
    setVillageId('');
    setVillageCode('');

    setDistricts([]);
    setBlocks([]);
    setPanchayats([]);
    setVillages([]);

    if (!value) return;

    const { data, error } = await supabase.rpc('get_districts', {
      p_state_id: value,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setDistricts(data || []);
  }

  // ---------------------------------------------------------
  // District → Block
  // ---------------------------------------------------------

  async function handleDistrictChange(value: string) {
    setDistrictId(value);

    setBlockId('');
    setPanchayatId('');
    setVillageId('');
    setVillageCode('');

    setBlocks([]);
    setPanchayats([]);
    setVillages([]);

    if (!value) return;

    const { data, error } = await supabase.rpc('get_blocks', {
      p_district_id: value,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setBlocks(data || []);
  }

  // ---------------------------------------------------------
  // Block → Panchayat
  // ---------------------------------------------------------

  async function handleBlockChange(value: string) {
    setBlockId(value);

    setPanchayatId('');
    setVillageId('');
    setVillageCode('');

    setPanchayats([]);
    setVillages([]);

    if (!value) return;

    const { data, error } = await supabase.rpc('get_panchayats', {
      p_block_id: value,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setPanchayats(data || []);
  }

  // ---------------------------------------------------------
  // Panchayat → Village
  // ---------------------------------------------------------

  async function handlePanchayatChange(value: string) {
    setPanchayatId(value);

    setVillageId('');
    setVillageCode('');
    setVillages([]);

    if (!value) return;

    const { data, error } = await supabase.rpc('get_villages', {
      p_panchayat_id: value,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setVillages(data || []);
  }

  // ---------------------------------------------------------
  // Village
  // ---------------------------------------------------------

  function handleVillageChange(value: string) {
    setVillageId(value);

    const village = villages.find((item) => item.id === value);

    setVillageCode(village?.code || '');
  }

  // ---------------------------------------------------------
  // File handlers
  // ---------------------------------------------------------

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    setFarmerPhoto(event.target.files?.[0] || null);
  }

  function handleAadhaarChange(event: ChangeEvent<HTMLInputElement>) {
    setAadhaarDocument(event.target.files?.[0] || null);
  }

  function handlePassbookChange(event: ChangeEvent<HTMLInputElement>) {
    setBankPassbook(event.target.files?.[0] || null);
  }

  // ---------------------------------------------------------
  // Upload helper
  // ---------------------------------------------------------

  async function uploadFile(
    bucket: string,
    file: File,
    userId: string
  ) {
    const extension = file.name.split('.').pop() || 'file';

    const path =
      `${userId}/` +
      `${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`${bucket}: ${error.message}`);
    }

    return path;
  }

  // ---------------------------------------------------------
  // Submit application
  // ---------------------------------------------------------

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          'Please login before submitting a farmer application.'
        );
      }

      if (!stateId || !districtId || !blockId || !panchayatId || !villageId) {
        throw new Error(
          'Please complete State, District, Block, Panchayat and Village.'
        );
      }

      if (!fullName || !mobile) {
        throw new Error(
          'Full Name and Mobile Number are required.'
        );
      }

      if (!aadhaarNumber || aadhaarNumber.length !== 12) {
        throw new Error(
          'Please enter a valid 12-digit Aadhaar number.'
        );
      }

      if (!bankAccountNumber || !ifscCode) {
        throw new Error(
          'Bank Account Number and IFSC are required.'
        );
      }

      if (!farmerPhoto) {
        throw new Error('Farmer photo is required.');
      }

      if (!aadhaarDocument) {
        throw new Error('Aadhaar document is required.');
      }

      if (!bankPassbook) {
        throw new Error('Bank passbook is required.');
      }

      // Upload documents
      const farmerPhotoUrl = await uploadFile(
        'farmer-photos',
        farmerPhoto,
        user.id
      );

      const aadhaarDocumentUrl = await uploadFile(
        'farmer-aadhaar',
        aadhaarDocument,
        user.id
      );

      const bankPassbookUrl = await uploadFile(
        'farmer-bank-documents',
        bankPassbook,
        user.id
      );

      // Insert application
      const { error: applicationError } = await supabase
        .from('farmer_applications')
        .insert({
          user_id: user.id,

          full_name: fullName,
          father_husband_name: fatherHusbandName,
          mobile,
          alternate_mobile: alternateMobile,
          date_of_birth: dateOfBirth || null,
          gender: gender || null,

          state_id: stateId,
          district_id: districtId,
          block_id: blockId,
          panchayat_id: panchayatId,
          village_id: villageId,

          farm_name: farmName || null,
          farm_type: farmType || null,
          land_area: landArea
            ? Number(landArea)
            : null,

          shed_available: shedAvailable,
          shed_capacity: shedCapacity
            ? Number(shedCapacity)
            : null,

          aadhaar_number: aadhaarNumber,
          aadhaar_document_url: aadhaarDocumentUrl,

          bank_account_name: bankAccountName,
          bank_name: bankName,
          bank_branch: bankBranch,
          bank_account_number: bankAccountNumber,
          ifsc_code: ifscCode,
          bank_passbook_url: bankPassbookUrl,

          farmer_photo_url: farmerPhotoUrl,

          status: 'PENDING',
        });

      if (applicationError) {
        throw new Error(applicationError.message);
      }

      setMessage(
        'Farmer application submitted successfully. Your application is now pending verification.'
      );

      // Reset
      setFullName('');
      setFatherHusbandName('');
      setMobile('');
      setAlternateMobile('');
      setDateOfBirth('');
      setGender('');

      setFarmName('');
      setFarmType('');
      setLandArea('');
      setShedAvailable(false);
      setShedCapacity('');

      setAadhaarNumber('');
      setBankAccountName('');
      setBankName('');
      setBankBranch('');
      setBankAccountNumber('');
      setIfscCode('');

      setFarmerPhoto(null);
      setAadhaarDocument(null);
      setBankPassbook(null);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to submit application.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f6f8f7',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          background: '#fff',
          padding: 32,
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        }}
      >
        <h1>Bodhi Rural Farmer Registration</h1>

        <p style={{ color: '#666' }}>
          Register as a Bodhi Rural farmer.
        </p>

        {message && (
          <div
            style={{
              padding: 14,
              background: '#e9f8ef',
              color: '#146c43',
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: 14,
              background: '#fdecec',
              color: '#b00020',
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <h2>1. Personal Details</h2>

          <input
            placeholder="Full Name *"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <input
            placeholder="Father / Husband Name"
            value={fatherHusbandName}
            onChange={(e) =>
              setFatherHusbandName(e.target.value)
            }
          />

          <input
            placeholder="Mobile Number *"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
          />

          <input
            placeholder="Alternate Mobile"
            value={alternateMobile}
            onChange={(e) =>
              setAlternateMobile(e.target.value)
            }
          />

          <label>Date of Birth</label>

          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />

          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>

          <h2>2. Location</h2>

          <select
            value={stateId}
            onChange={(e) =>
              handleStateChange(e.target.value)
            }
            required
          >
            <option value="">Select State *</option>

            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>

          <select
            value={districtId}
            onChange={(e) =>
              handleDistrictChange(e.target.value)
            }
            disabled={!stateId}
            required
          >
            <option value="">Select District *</option>

            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>

          <select
            value={blockId}
            onChange={(e) =>
              handleBlockChange(e.target.value)
            }
            disabled={!districtId}
            required
          >
            <option value="">Select Block *</option>

            {blocks.map((block) => (
              <option key={block.id} value={block.id}>
                {block.name}
              </option>
            ))}
          </select>

          <select
            value={panchayatId}
            onChange={(e) =>
              handlePanchayatChange(e.target.value)
            }
            disabled={!blockId}
            required
          >
            <option value="">Select Panchayat *</option>

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
              handleVillageChange(e.target.value)
            }
            disabled={!panchayatId}
            required
          >
            <option value="">Select Village *</option>

            {villages.map((village) => (
              <option key={village.id} value={village.id}>
                {village.name}
              </option>
            ))}
          </select>

          {villageCode && (
            <div
              style={{
                padding: 12,
                background: '#f2f6f4',
                borderRadius: 8,
                marginTop: 10,
              }}
            >
              <strong>Village Code:</strong>{' '}
              {villageCode}
            </div>
          )}

          <h2>3. Farm Details</h2>

          <input
            placeholder="Farm Name"
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
          />

          <select
            value={farmType}
            onChange={(e) => setFarmType(e.target.value)}
          >
            <option value="">Select Farm Type</option>
            <option value="POULTRY">Poultry</option>
            <option value="DAIRY">Dairy</option>
            <option value="GOAT">Goat</option>
            <option value="AGRICULTURE">Agriculture</option>
            <option value="MIXED">Mixed Farming</option>
            <option value="OTHER">Other</option>
          </select>

          <input
            type="number"
            step="0.01"
            placeholder="Land Area (Acres)"
            value={landArea}
            onChange={(e) => setLandArea(e.target.value)}
          />

          <label>
            <input
              type="checkbox"
              checked={shedAvailable}
              onChange={(e) =>
                setShedAvailable(e.target.checked)
              }
            />
            Shed Available
          </label>

          {shedAvailable && (
            <input
              type="number"
              placeholder="Shed Capacity"
              value={shedCapacity}
              onChange={(e) =>
                setShedCapacity(e.target.value)
              }
            />
          )}

          <h2>4. KYC</h2>

          <input
            placeholder="12-digit Aadhaar Number *"
            maxLength={12}
            value={aadhaarNumber}
            onChange={(e) =>
              setAadhaarNumber(
                e.target.value.replace(/\D/g, '')
              )
            }
            required
          />

          <label>Aadhaar Document *</label>

          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleAadhaarChange}
            required
          />

          <h2>5. Bank Details</h2>

          <input
            placeholder="Account Holder Name"
            value={bankAccountName}
            onChange={(e) =>
              setBankAccountName(e.target.value)
            }
          />

          <input
            placeholder="Bank Name"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />

          <input
            placeholder="Branch"
            value={bankBranch}
            onChange={(e) =>
              setBankBranch(e.target.value)
            }
          />

          <input
            placeholder="Bank Account Number *"
            value={bankAccountNumber}
            onChange={(e) =>
              setBankAccountNumber(e.target.value)
            }
            required
          />

          <input
            placeholder="IFSC Code *"
            value={ifscCode}
            onChange={(e) =>
              setIfscCode(e.target.value.toUpperCase())
            }
            required
          />

          <label>Bank Passbook *</label>

          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handlePassbookChange}
            required
          />

          <h2>6. Farmer Photo</h2>

          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 30,
              padding: '14px 24px',
              border: 0,
              borderRadius: 8,
              background: '#14532d',
              color: '#fff',
              fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading
              ? 'Submitting Application...'
              : 'Submit Farmer Application'}
          </button>

        </form>
      </div>
    </main>
  );
}
