'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '../../../../lib/supabase/client';

export default function SellerRegistrationPage() {
  const supabase = createClient();

  const [form, setForm] = useState({
    owner_name: '',
    shop_name: '',
    mobile: '',
    email: '',
    address: '',
    pan_number: '',
    gstin: '',
    upi_id: '',
    business_type: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function submitApplication(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSubmitting(true);
    setSuccess('');
    setError('');

    try {
      if (
        !form.owner_name.trim() ||
        !form.shop_name.trim() ||
        !form.mobile.trim()
      ) {
        throw new Error(
          'Please fill Owner Name, Shop Name and Mobile Number.'
        );
      }

      const { data: userData } =
        await supabase.auth.getUser();

      const userId = userData.user?.id || null;

      const { data, error } = await supabase
        .from('marketplace_seller_applications')
        .insert({
          user_id: userId,
          owner_name: form.owner_name.trim(),
          shop_name: form.shop_name.trim(),
          mobile: form.mobile.trim(),
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          pan_number:
            form.pan_number.trim() || null,
          gstin:
            form.gstin.trim() || null,
          upi_id:
            form.upi_id.trim() || null,
          business_type:
            form.business_type.trim() || null,
          status: 'SUBMITTED',
        })
        .select('id, application_number')
        .single();

      if (error) {
        throw error;
      }

      setSuccess(
        `Seller application submitted successfully${
          data?.application_number
            ? ` — Application No. ${data.application_number}`
            : ''
        }.`
      );

      setForm({
        owner_name: '',
        shop_name: '',
        mobile: '',
        email: '',
        address: '',
        pan_number: '',
        gstin: '',
        upi_id: '',
        business_type: '',
      });
    } catch (err: any) {
      setError(
        err?.message ||
          'Unable to submit seller application.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f8f5',
        padding: '35px 20px 60px',
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            background: '#145c2b',
            color: '#fff',
            borderRadius: 18,
            padding: '30px',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 13,
              opacity: 0.85,
              marginBottom: 6,
            }}
          >
            BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 30,
            }}
          >
            Become a BodhiMart Seller
          </h1>

          <p
            style={{
              margin: '10px 0 0',
              opacity: 0.9,
              lineHeight: 1.6,
            }}
          >
            Register your shop or business to sell
            products through BodhiMart.
          </p>
        </div>

        {/* SUCCESS */}
        {success && (
          <div
            style={{
              background: '#e8f5e9',
              color: '#145c2b',
              padding: 16,
              borderRadius: 10,
              marginBottom: 20,
              fontWeight: 600,
            }}
          >
            {success}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div
            style={{
              background: '#ffebee',
              color: '#b71c1c',
              padding: 16,
              borderRadius: 10,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={submitApplication}
          style={{
            background: '#fff',
            borderRadius: 18,
            padding: 28,
            boxShadow:
              '0 4px 18px rgba(0,0,0,0.06)',
          }}
        >
          {/* OWNER INFORMATION */}
          <h2
            style={{
              marginTop: 0,
              color: '#145c2b',
            }}
          >
            Shopkeeper Information
          </h2>

          <div style={gridStyle}>
            <Field
              label="Shopkeeper / Owner Name *"
              value={form.owner_name}
              onChange={(value) =>
                updateField('owner_name', value)
              }
              required
            />

            <Field
              label="Shop / Business Name *"
              value={form.shop_name}
              onChange={(value) =>
                updateField('shop_name', value)
              }
              required
            />

            <Field
              label="Mobile Number *"
              value={form.mobile}
              onChange={(value) =>
                updateField('mobile', value)
              }
              required
              type="tel"
            />

            <Field
              label="Email"
              value={form.email}
              onChange={(value) =>
                updateField('email', value)
              }
              type="email"
            />
          </div>

          {/* BUSINESS */}
          <h2
            style={{
              color: '#145c2b',
              marginTop: 30,
            }}
          >
            Business Details
          </h2>

          <div style={gridStyle}>
            <Field
              label="Business Type"
              value={form.business_type}
              onChange={(value) =>
                updateField(
                  'business_type',
                  value
                )
              }
              placeholder="Retail / Wholesale / Manufacturer / Farmer Producer"
            />

            <Field
              label="PAN Number"
              value={form.pan_number}
              onChange={(value) =>
                updateField(
                  'pan_number',
                  value
                )
              }
            />

            <Field
              label="GSTIN"
              value={form.gstin}
              onChange={(value) =>
                updateField('gstin', value)
              }
            />

            <Field
              label="UPI ID"
              value={form.upi_id}
              onChange={(value) =>
                updateField('upi_id', value)
              }
            />
          </div>

          {/* ADDRESS */}
          <div style={{ marginTop: 18 }}>
            <label style={labelStyle}>
              Business / Shop Address
            </label>

            <textarea
              value={form.address}
              onChange={(event) =>
                updateField(
                  'address',
                  event.target.value
                )
              }
              rows={4}
              placeholder="Enter complete shop/business address"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: 12,
                borderRadius: 9,
                border: '1px solid #ccc',
                resize: 'vertical',
              }}
            />
          </div>

          {/* WORKFLOW NOTICE */}
          <div
            style={{
              marginTop: 24,
              padding: 15,
              background: '#f7f9f7',
              borderRadius: 10,
              color: '#555',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            After submission, the application will be
            reviewed by BodhiMart administration. KYC
            verification and seller approval will be
            completed before seller activation.
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 24,
              background: '#145c2b',
              color: '#fff',
              border: 'none',
              borderRadius: 9,
              padding: '13px 24px',
              fontWeight: 700,
              fontSize: 15,
              cursor: submitting
                ? 'not-allowed'
                : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting
              ? 'Submitting...'
              : 'Submit Seller Application'}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: 12,
          borderRadius: 9,
          border: '1px solid #ccc',
        }}
      />
    </div>
  );
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit,minmax(240px,1fr))',
  gap: 18,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 600,
  fontSize: 13,
  marginBottom: 7,
  color: '#333',
};
