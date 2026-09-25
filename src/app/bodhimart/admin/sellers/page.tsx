'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../../lib/supabase/client';

type SellerApplication = {
  id: string;
  application_number: string | null;
  user_id: string | null;
  shop_name: string;
  owner_name: string;
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
  business_type: string | null;
  shop_photo_url: string | null;
  status: string;
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export default function SellerApplicationsPage() {
  const supabase = createClient();

  const [applications, setApplications] = useState<
    SellerApplication[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
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
      .order('created_at', {
        ascending: false,
      });

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

  async function approveSeller(
    application: SellerApplication
  ) {
    if (application.status !== 'SUBMITTED') {
      setError(
        `This application cannot be approved because its current status is ${application.status}.`
      );
      return;
    }

    setProcessing(true);
    setError('');
    setMessage('');

    try {
      const { data, error } =
        await supabase.rpc(
          'approve_marketplace_seller',
          {
            p_application_id:
              application.id,
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
          result?.seller_code ||
          'Generated'
        }`
      );

      setSelected(null);
      setRemarks('');

      await loadApplications();
    } catch (err: any) {
      setError(
        err?.message ||
          'Unable to approve seller.'
      );
    } finally {
      setProcessing(false);
    }
  }

  async function rejectSeller(
    application: SellerApplication
  ) {
    if (!remarks.trim()) {
      setError(
        'Please enter rejection remarks.'
      );
      return;
    }

    if (application.status !== 'SUBMITTED') {
      setError(
        `This application cannot be rejected because its current status is ${application.status}.`
      );
      return;
    }

    setProcessing(true);
    setError('');
    setMessage('');

    try {
      const { error } =
        await supabase.rpc(
          'reject_marketplace_seller',
          {
            p_application_id:
              application.id,
            p_rejection_reason:
              remarks.trim(),
          }
        );

      if (error) {
        throw error;
      }

      setMessage(
        'Seller application rejected successfully.'
      );

      setSelected(null);
      setRemarks('');

      await loadApplications();
    } catch (err: any) {
      setError(
        err?.message ||
          'Unable to reject seller application.'
      );
    } finally {
      setProcessing(false);
    }
  }

  const submitted =
    applications.filter(
      (item) =>
        item.status === 'SUBMITTED'
    ).length;

  const approved =
    applications.filter(
      (item) =>
        item.status === 'APPROVED'
    ).length;

  const rejected =
    applications.filter(
      (item) =>
        item.status === 'REJECTED'
    ).length;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f8f5',
        padding: '32px 20px 60px',
      }}
    >
      <div
        style={{
          maxWidth: 1250,
          margin: '0 auto',
        }}
      >
        {/* HEADER */}

        <section
          style={{
            background: '#145c2b',
            color: '#fff',
            borderRadius: 18,
            padding: 30,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 13,
              opacity: 0.85,
              marginBottom: 7,
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
              margin: '9px 0 0',
              opacity: 0.9,
              lineHeight: 1.6,
            }}
          >
            Review and manage shopkeeper
            onboarding applications.
          </p>
        </section>

        {/* SUCCESS */}

        {message && (
          <div
            style={{
              background: '#e8f5e9',
              color: '#145c2b',
              padding: 15,
              borderRadius: 10,
              marginBottom: 18,
              fontWeight: 600,
            }}
          >
            {message}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div
            style={{
              background: '#ffebee',
              color: '#b71c1c',
              padding: 15,
              borderRadius: 10,
              marginBottom: 18,
              fontWeight: 600,
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
              'repeat(auto-fit,minmax(190px,1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard
            title="Total Applications"
            value={applications.length}
          />

          <StatCard
            title="Pending Review"
            value={submitted}
          />

          <StatCard
            title="Approved"
            value={approved}
          />

          <StatCard
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
              justifyContent:
                'space-between',
              alignItems: 'center',
              gap: 15,
              flexWrap: 'wrap',
              marginBottom: 20,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: '#222',
                }}
              >
                Seller Applications
              </h2>

              <p
                style={{
                  margin: '6px 0 0',
                  color: '#666',
                }}
              >
                Review shopkeeper applications
                before seller activation.
              </p>
            </div>

            <button
              type="button"
              onClick={loadApplications}
              style={buttonStyle('#145c2b')}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
              }}
            >
              Loading applications...
            </div>
          ) : applications.length === 0 ? (
            <div
              style={{
                padding: 50,
                textAlign: 'center',
                color: '#666',
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  marginBottom: 10,
                }}
              >
                🏪
              </div>

              <strong>
                No seller applications found.
              </strong>

              <div
                style={{
                  marginTop: 7,
                  fontSize: 13,
                }}
              >
                New shopkeeper registrations
                will appear here.
              </div>
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
                  borderCollapse:
                    'collapse',
                  minWidth: 1000,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: '#f1f5f1',
                    }}
                  >
                    <th style={thStyle}>
                      Application
                    </th>
                    <th style={thStyle}>
                      Owner
                    </th>
                    <th style={thStyle}>
                      Shop
                    </th>
                    <th style={thStyle}>
                      Mobile
                    </th>
                    <th style={thStyle}>
                      Business
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
                      <tr
                        key={
                          application.id
                        }
                      >
                        <td style={tdStyle}>
                          <strong>
                            {application.application_number ||
                              '-'}
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          {application.owner_name ||
                            '-'}
                        </td>

                        <td style={tdStyle}>
                          {application.shop_name ||
                            '-'}
                        </td>

                        <td style={tdStyle}>
                          {application.mobile ||
                            '-'}
                        </td>

                        <td style={tdStyle}>
                          {application.business_type ||
                            '-'}
                        </td>

                        <td style={tdStyle}>
                          <StatusBadge
                            value={
                              application.status
                            }
                          />
                        </td>

                        <td style={tdStyle}>
                          {formatDate(
                            application.created_at
                          )}
                        </td>

                        <td style={tdStyle}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelected(
                                application
                              );
                              setRemarks('');
                              setError('');
                              setMessage('');
                            }}
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

      {/* MODAL */}

      {selected && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(0,0,0,0.55)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 900,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#fff',
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
                marginBottom: 24,
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
                    marginTop: 6,
                    color: '#666',
                  }}
                >
                  Application No:{' '}
                  <strong>
                    {selected.application_number ||
                      '-'}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setRemarks('');
                  setError('');
                }}
                style={buttonStyle(
                  '#666'
                )}
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
              <InfoCard
                label="Owner Name"
                value={
                  selected.owner_name
                }
              />

              <InfoCard
                label="Shop Name"
                value={
                  selected.shop_name
                }
              />

              <InfoCard
                label="Mobile"
                value={
                  selected.mobile
                }
              />

              <InfoCard
                label="Email"
                value={
                  selected.email
                }
              />

              <InfoCard
                label="Business Type"
                value={
                  selected.business_type
                }
              />

              <InfoCard
                label="PAN"
                value={
                  selected.pan_number
                }
              />

              <InfoCard
                label="GSTIN"
                value={
                  selected.gstin
                }
              />

              <InfoCard
                label="UPI ID"
                value={
                  selected.upi_id
                }
              />

              <InfoCard
                label="Status"
                value={
                  selected.status
                }
              />

              <InfoCard
                label="Submitted"
                value={formatDateTime(
                  selected.created_at
                )}
              />
            </div>

            {/* ADDRESS */}

            <div
              style={{
                marginTop: 18,
                background: '#f7f9f7',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: 7,
                }}
              >
                Business / Shop Address
              </div>

              <div
                style={{
                  color: '#555',
                  lineHeight: 1.6,
                }}
              >
                {selected.address ||
                  'Not provided'}
              </div>
            </div>

            {/* LOCATION */}

            <div
              style={{
                marginTop: 18,
                background: '#fafafa',
                border:
                  '1px solid #eee',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                Location Information
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit,minmax(200px,1fr))',
                  gap: 10,
                  fontSize: 13,
                }}
              >
                <LocationItem
                  label="State ID"
                  value={
                    selected.state_id
                  }
                />

                <LocationItem
                  label="District ID"
                  value={
                    selected.district_id
                  }
                />

                <LocationItem
                  label="Block ID"
                  value={
                    selected.block_id
                  }
                />

                <LocationItem
                  label="Panchayat ID"
                  value={
                    selected.panchayat_id
                  }
                />

                <LocationItem
                  label="Village ID"
                  value={
                    selected.village_id
                  }
                />
              </div>
            </div>

            {/* SHOP PHOTO */}

            {selected.shop_photo_url && (
              <div
                style={{
                  marginTop: 18,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Shop Photo
                </div>

                <img
                  src={
                    selected.shop_photo_url
                  }
                  alt="Shop"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 300,
                    borderRadius: 12,
                    objectFit: 'contain',
                  }}
                />
              </div>
            )}

            {/* REJECTION REASON */}

            {selected.rejection_reason && (
              <div
                style={{
                  marginTop: 18,
                  padding: 15,
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
                    marginTop: 6,
                  }}
                >
                  {
                    selected.rejection_reason
                  }
                </div>
              </div>
            )}

            {/* ACTION AREA */}

            {selected.status ===
              'SUBMITTED' && (
              <div
                style={{
                  marginTop: 25,
                  borderTop:
                    '1px solid #eee',
                  paddingTop: 22,
                }}
              >
                <label
                  style={{
                    display: 'block',
                    fontWeight: 700,
                    marginBottom: 7,
                  }}
                >
                  Remarks
                </label>

                <textarea
                  value={remarks}
                  onChange={(event) =>
                    setRemarks(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Enter remarks. Required when rejecting."
                  style={{
                    width: '100%',
                    boxSizing:
                      'border-box',
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
                    gap: 12,
                    flexWrap: 'wrap',
                    marginTop: 18,
                  }}
                >
                  {/* APPROVE */}

                  <button
                    type="button"
                    onClick={() =>
                      approveSeller(
                        selected
                      )
                    }
                    style={{
                      background:
                        '#145c2b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding:
                        '12px 22px',
                      cursor:
                        processing
                          ? 'wait'
                          : 'pointer',
                      fontWeight: 700,
                      fontSize: 14,
                      opacity: 1,
                    }}
                  >
                    {processing
                      ? 'Processing...'
                      : 'Approve Seller'}
                  </button>

                  {/* REJECT */}

                  <button
                    type="button"
                    onClick={() =>
                      rejectSeller(
                        selected
                      )
                    }
                    style={{
                      background:
                        '#b3261e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding:
                        '12px 22px',
                      cursor:
                        processing
                          ? 'wait'
                          : 'pointer',
                      fontWeight: 700,
                      fontSize: 14,
                      opacity: 1,
                    }}
                  >
                    {processing
                      ? 'Processing...'
                      : 'Reject'}
                  </button>
                </div>
              </div>
            )}

            {/* APPROVED */}

            {selected.status ===
              'APPROVED' && (
              <div
                style={{
                  marginTop: 25,
                  padding: 18,
                  background: '#e8f5e9',
                  color: '#145c2b',
                  borderRadius: 12,
                  fontWeight: 700,
                }}
              >
                ✓ Seller approved
                successfully.
              </div>
            )}

            {/* REJECTED */}

            {selected.status ===
              'REJECTED' && (
              <div
                style={{
                  marginTop: 25,
                  padding: 18,
                  background: '#ffebee',
                  color: '#b71c1c',
                  borderRadius: 12,
                  fontWeight: 700,
                }}
              >
                Seller application
                has been rejected.
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

function StatCard({
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

      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: '#145c2b',
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* =========================
   INFO CARD
========================= */

function InfoCard({
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
          color: '#777',
          fontSize: 12,
          marginBottom: 6,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight: 600,
          wordBreak:
            'break-word',
        }}
      >
        {value || '-'}
      </div>
    </div>
  );
}

/* =========================
   LOCATION
========================= */

function LocationItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <span
        style={{
          color: '#777',
        }}
      >
        {label}:{' '}
      </span>

      <span
        style={{
          fontWeight: 600,
          wordBreak:
            'break-all',
        }}
      >
        {value || '-'}
      </span>
    </div>
  );
}

/* =========================
   STATUS
========================= */

function StatusBadge({
  value,
}: {
  value: string;
}) {
  const status =
    value.toUpperCase();

  let background =
    '#eeeeee';

  let color =
    '#555555';

  if (status === 'SUBMITTED') {
    background =
      '#fff8e1';
    color =
      '#8a6500';
  }

  if (status === 'APPROVED') {
    background =
      '#e8f5e9';
    color =
      '#145c2b';
  }

  if (status === 'REJECTED') {
    background =
      '#ffebee';
    color =
      '#b71c1c';
  }

  return (
    <span
      style={{
        display:
          'inline-block',
        padding:
          '5px 10px',
        borderRadius: 999,
        background,
        color,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {status}
    </span>
  );
}

/* =========================
   DATE
========================= */

function formatDate(
  value: string
) {
  return new Date(
    value
  ).toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
}

function formatDateTime(
  value: string
) {
  return new Date(
    value
  ).toLocaleString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );
}

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

/* =========================
   TABLE
========================= */

const thStyle:
  React.CSSProperties = {
    padding:
      '12px 10px',
    fontSize: 12,
    color: '#555',
    borderBottom:
      '1px solid #ddd',
    textAlign: 'left',
    whiteSpace:
      'nowrap',
  };

const tdStyle:
  React.CSSProperties = {
    padding:
      '14px 10px',
    borderBottom:
      '1px solid #eee',
    fontSize: 13,
    verticalAlign:
      'top',
  };
