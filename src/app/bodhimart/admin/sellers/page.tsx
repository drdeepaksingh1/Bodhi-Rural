'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../../lib/supabase/client';

type SellerApplication = {
  id: string;
  application_number: string | null;
  full_name: string | null;
  shop_name: string | null;
  mobile: string | null;
  email: string | null;
  address: string | null;
  state_id: string | null;
  district_id: string | null;
  block_id: string | null;
  panchayat_id: string | null;
  village_id: string | null;
  pan_number: string | null;
  gstin: string | null;
  upi_id: string | null;
  status: string;
  kyc_status: string | null;
  rejection_reason: string | null;
  created_at: string;
};

export default function SellerApplicationsPage() {
  const supabase = createClient();

  const [applications, setApplications] = useState<
    SellerApplication[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const [selected, setSelected] =
    useState<SellerApplication | null>(null);

  const [remarks, setRemarks] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadApplications() {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('marketplace_seller_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      setApplications([]);
    } else {
      setApplications(
        (data || []) as SellerApplication[]
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadApplications();
  }, []);

  async function updateApplication(
    application: SellerApplication,
    action: 'APPROVE' | 'REJECT'
  ) {
    if (action === 'REJECT' && !remarks.trim()) {
      setError('Please enter rejection remarks.');
      return;
    }

    setProcessing(application.id);
    setError('');
    setMessage('');

    try {
      if (action === 'APPROVE') {
        const { data, error } = await supabase.rpc(
          'approve_marketplace_seller',
          {
            p_application_id: application.id,
          }
        );

        if (error) {
          throw error;
        }

        const result = Array.isArray(data)
          ? data[0]
          : data;

        setMessage(
          `Seller approved successfully. Seller ID: ${
            result?.seller_code || 'Generated'
          }`
        );
      } else {
        const { error } = await supabase
          .from('marketplace_seller_applications')
          .update({
            status: 'REJECTED',
            rejection_reason: remarks.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', application.id);

        if (error) {
          throw error;
        }

        setMessage(
          'Seller application rejected successfully.'
        );
      }

      setSelected(null);
      setRemarks('');

      await loadApplications();
    } catch (err: any) {
      setError(
        err?.message ||
          'Unable to process seller application.'
      );
    } finally {
      setProcessing(null);
    }
  }

  const submitted = applications.filter(
    (a) => a.status === 'SUBMITTED'
  ).length;

  const approved = applications.filter(
    (a) => a.status === 'APPROVED'
  ).length;

  const rejected = applications.filter(
    (a) => a.status === 'REJECTED'
  ).length;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f8f5',
        padding: '32px 20px',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            background: '#145c2b',
            color: '#fff',
            borderRadius: 16,
            padding: '28px 30px',
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
            BodhiMart Seller Management
          </h1>

          <p
            style={{
              margin: '8px 0 0',
              opacity: 0.9,
            }}
          >
            Review and manage shopkeeper onboarding
            applications.
          </p>
        </div>

        {/* SUCCESS MESSAGE */}
        {message && (
          <div
            style={{
              background: '#e8f5e9',
              color: '#145c2b',
              padding: 14,
              borderRadius: 10,
              marginBottom: 18,
            }}
          >
            {message}
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div
            style={{
              background: '#ffebee',
              color: '#b71c1c',
              padding: 14,
              borderRadius: 10,
              marginBottom: 18,
            }}
          >
            {error}
          </div>
        )}

        {/* STATISTICS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(180px,1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <Stat
            title="Total Applications"
            value={applications.length}
          />

          <Stat
            title="Pending Review"
            value={submitted}
          />

          <Stat
            title="Approved"
            value={approved}
          />

          <Stat
            title="Rejected"
            value={rejected}
          />
        </div>

        {/* APPLICATIONS */}
        <section
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 20,
            boxShadow:
              '0 4px 18px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 18,
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>
                Seller Applications
              </h2>

              <p
                style={{
                  margin: '5px 0 0',
                  color: '#666',
                }}
              >
                Review shopkeeper applications before
                seller activation.
              </p>
            </div>

            <button
              onClick={loadApplications}
              style={buttonStyle('#145c2b')}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 30 }}>
              Loading applications...
            </div>
          ) : applications.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
                color: '#666',
              }}
            >
              No seller applications found.
            </div>
          ) : (
            <div
              style={{
                overflowX: 'auto',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: 850,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: '#f1f5f1',
                      textAlign: 'left',
                    }}
                  >
                    <th style={thStyle}>
                      Application
                    </th>

                    <th style={thStyle}>
                      Shopkeeper
                    </th>

                    <th style={thStyle}>
                      Shop
                    </th>

                    <th style={thStyle}>
                      Mobile
                    </th>

                    <th style={thStyle}>
                      KYC
                    </th>

                    <th style={thStyle}>
                      Status
                    </th>

                    <th style={thStyle}>
                      Date
                    </th>

                    <th style={thStyle}>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {applications.map(
                    (application) => (
                      <tr key={application.id}>
                        <td style={tdStyle}>
                          {application.application_number ||
                            '-'}
                        </td>

                        <td style={tdStyle}>
                          <strong>
                            {application.full_name ||
                              '-'}
                          </strong>

                          <div
                            style={{
                              fontSize: 12,
                              color: '#777',
                              marginTop: 3,
                            }}
                          >
                            {application.email || '-'}
                          </div>
                        </td>

                        <td style={tdStyle}>
                          {application.shop_name ||
                            '-'}
                        </td>

                        <td style={tdStyle}>
                          {application.mobile || '-'}
                        </td>

                        <td style={tdStyle}>
                          <StatusBadge
                            value={
                              application.kyc_status ||
                              'PENDING'
                            }
                          />
                        </td>

                        <td style={tdStyle}>
                          <StatusBadge
                            value={
                              application.status
                            }
                          />
                        </td>

                        <td style={tdStyle}>
                          {new Date(
                            application.created_at
                          ).toLocaleDateString(
                            'en-IN'
                          )}
                        </td>

                        <td style={tdStyle}>
                          <button
                            onClick={() =>
                              setSelected(
                                application
                              )
                            }
                            style={buttonStyle(
                              '#145c2b'
                            )}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* APPLICATION MODAL */}
      {selected && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#fff',
              width: '100%',
              maxWidth: 850,
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 18,
              padding: 28,
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                gap: 15,
                marginBottom: 22,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  Seller Application
                </h2>

                <div
                  style={{
                    color: '#666',
                    marginTop: 5,
                  }}
                >
                  {selected.application_number ||
                    '-'}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelected(null);
                  setRemarks('');
                  setError('');
                }}
                style={buttonStyle('#666')}
              >
                Close
              </button>
            </div>

            {/* INFORMATION */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit,minmax(230px,1fr))',
                gap: 14,
              }}
            >
              <Info
                label="Shopkeeper Name"
                value={selected.full_name}
              />

              <Info
                label="Shop / Business"
                value={selected.shop_name}
              />

              <Info
                label="Mobile"
                value={selected.mobile}
              />

              <Info
                label="Email"
                value={selected.email}
              />

              <Info
                label="PAN"
                value={selected.pan_number}
              />

              <Info
                label="GSTIN"
                value={selected.gstin}
              />

              <Info
                label="UPI ID"
                value={selected.upi_id}
              />

              <Info
                label="KYC Status"
                value={
                  selected.kyc_status ||
                  'PENDING'
                }
              />
            </div>

            {/* ADDRESS */}
            <div
              style={{
                marginTop: 18,
                padding: 16,
                background: '#f7f9f7',
                borderRadius: 12,
              }}
            >
              <strong>Address</strong>

              <div
                style={{
                  marginTop: 7,
                  color: '#555',
                }}
              >
                {selected.address ||
                  'Not provided'}
              </div>
            </div>

            {/* REJECTION REASON */}
            {selected.rejection_reason && (
              <div
                style={{
                  marginTop: 16,
                  padding: 14,
                  background: '#fff3f3',
                  color: '#a00',
                  borderRadius: 10,
                }}
              >
                <strong>
                  Rejection Reason
                </strong>

                <div
                  style={{
                    marginTop: 5,
                  }}
                >
                  {selected.rejection_reason}
                </div>
              </div>
            )}

            {/* APPROVAL / REJECTION */}
            {selected.status ===
              'SUBMITTED' && (
              <div
                style={{
                  marginTop: 24,
                  borderTop:
                    '1px solid #eee',
                  paddingTop: 20,
                }}
              >
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: 7,
                  }}
                >
                  Remarks
                </label>

                <textarea
                  value={remarks}
                  onChange={(e) =>
                    setRemarks(
                      e.target.value
                    )
                  }
                  placeholder="Enter remarks. Required for rejection."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 9,
                    border:
                      '1px solid #ccc',
                    resize: 'vertical',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    marginTop: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    disabled={
                      processing ===
                      selected.id
                    }
                    onClick={() =>
                      updateApplication(
                        selected,
                        'APPROVE'
                      )
                    }
                    style={buttonStyle(
                      '#145c2b'
                    )}
                  >
                    {processing ===
                    selected.id
                      ? 'Processing...'
                      : 'Approve Seller'}
                  </button>

                  <button
                    disabled={
                      processing ===
                      selected.id
                    }
                    onClick={() =>
                      updateApplication(
                        selected,
                        'REJECT'
                      )
                    }
                    style={buttonStyle(
                      '#b3261e'
                    )}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================
   STAT CARD
========================= */

function Stat({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: 20,
        boxShadow:
          '0 3px 14px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          color: '#666',
          fontSize: 13,
          marginBottom: 7,
        }}
      >
        {title}
      </div>

      <strong
        style={{
          fontSize: 28,
          color: '#145c2b',
        }}
      >
        {value}
      </strong>
    </div>
  );
}

/* =========================
   INFORMATION CARD
========================= */

function Info({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div
      style={{
        border:
          '1px solid #e5e9e5',
        borderRadius: 10,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#777',
          marginBottom: 5,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight: 600,
        }}
      >
        {value || '-'}
      </div>
    </div>
  );
}

/* =========================
   STATUS BADGE
========================= */

function StatusBadge({
  value,
}: {
  value: string;
}) {
  const normalized =
    value.toUpperCase();

  let background = '#eee';
  let color = '#555';

  if (normalized === 'APPROVED') {
    background = '#e8f5e9';
    color = '#145c2b';
  }

  if (
    normalized === 'SUBMITTED' ||
    normalized === 'PENDING'
  ) {
    background = '#fff8e1';
    color = '#8a6500';
  }

  if (normalized === 'REJECTED') {
    background = '#ffebee';
    color = '#b71c1c';
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '5px 9px',
        borderRadius: 999,
        background,
        color,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {normalized}
    </span>
  );
}

/* =========================
   TABLE STYLES
========================= */

const thStyle: React.CSSProperties = {
  padding: '12px 10px',
  fontSize: 12,
  color: '#555',
  borderBottom:
    '1px solid #ddd',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 10px',
  borderBottom:
    '1px solid #eee',
  fontSize: 13,
};

/* =========================
   BUTTON
========================= */

function buttonStyle(
  background: string
): React.CSSProperties {
  return {
    background,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '9px 14px',
    cursor: 'pointer',
    fontWeight: 600,
  };
}
