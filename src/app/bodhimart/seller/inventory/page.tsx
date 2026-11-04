'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../../lib/supabase/client';

type Product = {
  id: string;
  product_id: string;
  sku: string | null;
  name: string;
  unit: string | null;
  status: string;
};

type Inventory = {
  id: string;
  product_id: string;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  updated_at: string;
};

type Seller = {
  id: string;
  seller_id: string;
  shop_name: string;
  status: string;
};

type InventoryRow = {
  inventory: Inventory;
  product: Product;
};

export default function SellerInventoryPage() {
  const supabase = createClient();

  const [seller, setSeller] = useState<Seller | null>(null);
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL');

  const [selectedRow, setSelectedRow] =
    useState<InventoryRow | null>(null);

  const [adjustMode, setAdjustMode] =
    useState<'ADD' | 'REDUCE' | 'SET'>('ADD');

  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadInventory() {
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        window.location.href =
          '/login?redirect=/bodhimart/seller/inventory';
        return;
      }

      const { data: sellerData, error: sellerError } =
        await supabase
          .from('marketplace_sellers')
          .select('id, seller_id, shop_name, status')
          .eq('user_id', user.id)
          .maybeSingle();

      if (sellerError) throw sellerError;

      if (!sellerData) {
        throw new Error('Seller profile not found.');
      }

      if (sellerData.status !== 'ACTIVE') {
        throw new Error(
          `Your seller account is currently ${sellerData.status}.`
        );
      }

      setSeller(sellerData);

      const { data: productData, error: productError } =
        await supabase
          .from('marketplace_products')
          .select('id, product_id, sku, name, unit, status')
          .eq('seller_id', sellerData.id)
          .order('name', { ascending: true });

      if (productError) throw productError;

      const products = (productData || []) as Product[];

      if (products.length === 0) {
        setRows([]);
        return;
      }

      const productIds = products.map((product) => product.id);

      const { data: inventoryData, error: inventoryError } =
        await supabase
          .from('marketplace_inventory')
          .select(
            'id, product_id, stock_quantity, reserved_quantity, low_stock_threshold, updated_at'
          )
          .in('product_id', productIds);

      if (inventoryError) throw inventoryError;

      const inventoryMap = new Map<string, Inventory>();

      ((inventoryData || []) as Inventory[]).forEach((inventory) => {
        inventoryMap.set(inventory.product_id, inventory);
      });

      const combined: InventoryRow[] = [];

      products.forEach((product) => {
        const inventory = inventoryMap.get(product.id);

        if (inventory) {
          combined.push({ product, inventory });
        }
      });

      setRows(combined);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load inventory.'
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return rows.filter((row) => {
      const available =
        Number(row.inventory.stock_quantity) -
        Number(row.inventory.reserved_quantity);

      const threshold = Number(row.inventory.low_stock_threshold);

      const isLow = available > 0 && available <= threshold;
      const isOut = available <= 0;

      const matchesSearch =
        !keyword ||
        row.product.name.toLowerCase().includes(keyword) ||
        row.product.product_id.toLowerCase().includes(keyword) ||
        (row.product.sku || '').toLowerCase().includes(keyword);

      let matchesFilter = true;

      if (stockFilter === 'AVAILABLE') matchesFilter = available > 0;
      if (stockFilter === 'LOW') matchesFilter = isLow;
      if (stockFilter === 'OUT') matchesFilter = isOut;

      return matchesSearch && matchesFilter;
    });
  }, [rows, search, stockFilter]);

  const summary = useMemo(() => {
    let totalStock = 0;
    let reservedStock = 0;
    let availableStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    rows.forEach((row) => {
      const stock = Number(row.inventory.stock_quantity);
      const reserved = Number(row.inventory.reserved_quantity);
      const available = stock - reserved;

      totalStock += stock;
      reservedStock += reserved;
      availableStock += available;

      if (available <= 0) {
        outOfStock++;
      } else if (
        available <= Number(row.inventory.low_stock_threshold)
      ) {
        lowStock++;
      }
    });

    return {
      products: rows.length,
      totalStock,
      reservedStock,
      availableStock,
      lowStock,
      outOfStock,
    };
  }, [rows]);

  function openAdjustment(row: InventoryRow) {
    setSelectedRow(row);
    setAdjustMode('ADD');
    setAdjustQuantity('');
    setAdjustmentReason('');
    setRemarks('');
    setError('');
    setMessage('');
  }

  function closeAdjustment() {
    if (saving) return;

    setSelectedRow(null);
    setAdjustQuantity('');
    setAdjustmentReason('');
    setRemarks('');
  }

  async function saveInventory() {
    if (!selectedRow || saving) return;

    const quantity = Number(adjustQuantity);

    if (
      adjustQuantity.trim() === '' ||
      !Number.isFinite(quantity) ||
      quantity < 0 ||
      !Number.isInteger(quantity)
    ) {
      setError('Please enter a valid whole-number quantity.');
      return;
    }

    const reason = adjustmentReason.trim();

    if (!reason) {
      setError('Adjustment reason is mandatory.');
      return;
    }

    if (reason.length > 250) {
      setError('Adjustment reason cannot exceed 250 characters.');
      return;
    }

    if (remarks.trim().length > 1000) {
      setError('Remarks cannot exceed 1000 characters.');
      return;
    }

    const currentStock = Number(
      selectedRow.inventory.stock_quantity
    );

    const reserved = Number(
      selectedRow.inventory.reserved_quantity
    );

    let newStock = currentStock;

    if (adjustMode === 'ADD') {
      newStock = currentStock + quantity;
    } else if (adjustMode === 'REDUCE') {
      newStock = currentStock - quantity;
    } else {
      newStock = quantity;
    }

    if (newStock < 0) {
      setError('Stock cannot become negative.');
      return;
    }

    if (newStock < reserved) {
      setError(
        'Stock cannot be reduced below the reserved quantity.'
      );
      return;
    }

    if (newStock === currentStock) {
      setError('The new stock quantity is the same as current stock.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'bodhi_adjust_seller_listing_stock',
        {
          p_marketplace_product_id: selectedRow.product.id,
          p_new_quantity: newStock,
          p_adjustment_reason: reason,
          p_remarks: remarks.trim() || null,
          p_evidence_url: null,
        }
      );

      if (rpcError) throw rpcError;

      if (!data || data.length === 0) {
        throw new Error(
          'Stock adjustment was not confirmed by the server.'
        );
      }

      const result = data[0];

      const productName = selectedRow.product.name;

      setSelectedRow(null);
      setAdjustQuantity('');
      setAdjustmentReason('');
      setRemarks('');

      setMessage(
        `Stock adjusted successfully for ${productName}. Adjustment: ${result.adjustment_id}`
      );

      await loadInventory();
    } catch (err: unknown) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update inventory.'
      );
    } finally {
      setSaving(false);
    }
  }

  function getAvailable(row: InventoryRow) {
    return (
      Number(row.inventory.stock_quantity) -
      Number(row.inventory.reserved_quantity)
    );
  }

  function getStockStatus(row: InventoryRow) {
    const available = getAvailable(row);
    const threshold = Number(row.inventory.low_stock_threshold);

    if (available <= 0) return 'OUT OF STOCK';
    if (available <= threshold) return 'LOW STOCK';

    return 'AVAILABLE';
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f8f5',
        padding: '32px 20px 60px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            background: '#145c2b',
            color: '#fff',
            borderRadius: 18,
            padding: '24px 28px',
            marginBottom: 24,
          }}
        >
          <div className="header-flex">
            <div>
              <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>
                BODHI MART SELLER PORTAL
              </div>

              <h1 style={{ margin: 0, fontSize: 30 }}>
                Inventory Management
              </h1>

              {seller && (
                <p style={{ margin: '8px 0 0', opacity: 0.9 }}>
                  {seller.shop_name} • {seller.seller_id}
                </p>
              )}
            </div>

            <div className="header-links">
              <Link href="/bodhimart/seller/products" style={headerButton}>
                My Products
              </Link>

              <Link
                href="/bodhimart/seller/dashboard"
                style={{
                  ...headerButton,
                  background: '#fff',
                  color: '#145c2b',
                }}
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {error && <div className="alert error-alert">{error}</div>}
        {message && <div className="alert success-alert">{message}</div>}

        <div className="summary-grid">
          <SummaryCard title="Products" value={summary.products} />
          <SummaryCard title="Total Stock" value={summary.totalStock} />
          <SummaryCard title="Reserved" value={summary.reservedStock} />
          <SummaryCard title="Available" value={summary.availableStock} />
          <SummaryCard title="Low Stock" value={summary.lowStock} warning />
          <SummaryCard title="Out of Stock" value={summary.outOfStock} danger />
        </div>

        <div className="panel filters-panel">
          <div className="filter-grid">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, ID or SKU..."
              style={inputStyle}
            />

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="ALL">All Stock</option>
              <option value="AVAILABLE">Available</option>
              <option value="LOW">Low Stock</option>
              <option value="OUT">Out of Stock</option>
            </select>

            <button
              onClick={loadInventory}
              disabled={loading}
              style={refreshButton}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="panel inventory-panel">
          <div className="panel-heading">
            <h2 style={{ margin: 0, fontSize: 20 }}>Product Inventory</h2>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
              {filteredRows.length} inventory record
              {filteredRows.length !== 1 ? 's' : ''} displayed
            </p>
          </div>

          {loading ? (
            <div className="empty-state">Loading inventory...</div>
          ) : filteredRows.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 42, marginBottom: 12 }}>📦</div>
              <h3>No inventory records</h3>
              <p>Your products do not have inventory records yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1050 }}>
                <thead>
                  <tr style={{ background: '#f8faf8', textAlign: 'left' }}>
                    {[
                      'Product',
                      'SKU',
                      'Total Stock',
                      'Reserved',
                      'Available',
                      'Threshold',
                      'Status',
                      'Updated',
                      'Action',
                    ].map((heading) => (
                      <th key={heading} style={thStyle}>{heading}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row) => {
                    const available = getAvailable(row);
                    const status = getStockStatus(row);

                    return (
                      <tr key={row.inventory.id}>
                        <td style={tdStyle}>
                          <strong>{row.product.name}</strong>
                          <div className="subtext">
                            {row.product.product_id}
                            {row.product.unit && ` • ${row.product.unit}`}
                          </div>
                        </td>

                        <td style={tdStyle}>{row.product.sku || '—'}</td>
                        <td style={tdStyle}><strong>{row.inventory.stock_quantity}</strong></td>
                        <td style={tdStyle}>{row.inventory.reserved_quantity}</td>

                        <td style={tdStyle}>
                          <strong style={{ color: available <= 0 ? '#dc2626' : '#145c2b' }}>
                            {available}
                          </strong>
                        </td>

                        <td style={tdStyle}>{row.inventory.low_stock_threshold}</td>
                        <td style={tdStyle}><StockBadge status={status} /></td>

                        <td style={tdStyle}>
                          <span className="subtext">
                            {formatDate(row.inventory.updated_at)}
                          </span>
                        </td>

                        <td style={tdStyle}>
                          <button onClick={() => openAdjustment(row)} style={adjustButton}>
                            Manage Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bottom-navigation">
          <Link href="/bodhimart/seller/dashboard" style={bottomLink}>
            ← Back to Seller Dashboard
          </Link>

          <div className="bottom-links">
            <Link href="/bodhimart/seller/products" style={bottomLink}>My Products</Link>
            <Link href="/bodhimart/seller/orders" style={bottomLink}>Orders</Link>
            <Link href="/bodhimart/seller/sales" style={bottomLink}>Sales</Link>
          </div>
        </div>
      </div>

      {selectedRow && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-heading">
              <div>
                <h2 style={{ margin: 0, fontSize: 22 }}>Manage Stock</h2>
                <p className="subtext">{selectedRow.product.name}</p>
              </div>

              <button onClick={closeAdjustment} disabled={saving} className="close-button">
                ×
              </button>
            </div>

            <div className="modal-summary">
              <Info label="Current Stock" value={String(selectedRow.inventory.stock_quantity)} />
              <Info label="Reserved" value={String(selectedRow.inventory.reserved_quantity)} />
              <Info label="Available" value={String(getAvailable(selectedRow))} />
            </div>

            <label style={labelStyle}>Stock Action</label>
            <select
              value={adjustMode}
              onChange={(e) => setAdjustMode(e.target.value as 'ADD' | 'REDUCE' | 'SET')}
              style={{ ...inputStyle, marginBottom: 16 }}
              disabled={saving}
            >
              <option value="ADD">Add Stock</option>
              <option value="REDUCE">Reduce Stock</option>
              <option value="SET">Set Stock Quantity</option>
            </select>

            <label style={labelStyle}>
              {adjustMode === 'ADD'
                ? 'Quantity to Add'
                : adjustMode === 'REDUCE'
                ? 'Quantity to Reduce'
                : 'New Stock Quantity'}
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={adjustQuantity}
              onChange={(e) => setAdjustQuantity(e.target.value)}
              placeholder="Enter whole-number quantity"
              style={{ ...inputStyle, marginBottom: 16 }}
              disabled={saving}
            />

            <label style={labelStyle}>Low Stock Threshold (read-only)</label>
            <input
              type="number"
              value={selectedRow.inventory.low_stock_threshold}
              style={{ ...inputStyle, marginBottom: 16, background: '#f3f4f6' }}
              disabled
            />

            <label style={labelStyle}>Adjustment Reason *</label>
            <select
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              style={{ ...inputStyle, marginBottom: 16 }}
              disabled={saving}
            >
              <option value="">Select reason</option>
              <option value="Physical stock verification">Physical stock verification</option>
              <option value="New stock received">New stock received</option>
              <option value="Damaged or expired stock">Damaged or expired stock</option>
              <option value="Stock entry correction">Stock entry correction</option>
              <option value="Other">Other</option>
            </select>

            <label style={labelStyle}>Remarks (optional)</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter additional details..."
              maxLength={1000}
              rows={3}
              style={{ ...inputStyle, marginBottom: 20, resize: 'vertical' }}
              disabled={saving}
            />

            <div className="modal-actions">
              <button onClick={closeAdjustment} disabled={saving} style={cancelButton}>
                Cancel
              </button>

              <button
                onClick={saveInventory}
                disabled={saving}
                style={{
                  ...saveButton,
                  background: saving ? '#9ca3af' : '#145c2b',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : 'Save Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .header-flex, .header-links, .bottom-navigation, .bottom-links,
        .modal-heading, .modal-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .panel {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          margin-bottom: 20px;
        }

        .filters-panel { padding: 20px; }

        .filter-grid {
          display: grid;
          grid-template-columns: minmax(220px, 1fr) 180px 100px;
          gap: 12px;
        }

        .panel-heading {
          padding: 18px 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .empty-state {
          padding: 50px;
          text-align: center;
          color: #6b7280;
        }

        .empty-state h3 { color: #111827; }
        .subtext { color: #6b7280; font-size: 12px; margin-top: 4px; }

        .bottom-navigation { margin-top: 20px; }

        .alert {
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .error-alert {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .success-alert {
          background: #ecfdf5;
          color: #166534;
          border: 1px solid #bbf7d0;
          overflow-wrap: anywhere;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
          overflow-y: auto;
        }

        .modal {
          background: #fff;
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 18px;
          padding: 26px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
        }

        .modal-heading { margin-bottom: 18px; }

        .close-button {
          border: 0;
          background: #f3f4f6;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
        }

        .modal-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          background: #f8faf8;
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 18px;
        }

        @media (max-width: 700px) {
          .filter-grid, .modal-summary { grid-template-columns: 1fr; }
          .modal { padding: 20px; }
        }
      `}</style>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  warning,
  danger,
}: {
  title: string;
  value: number;
  warning?: boolean;
  danger?: boolean;
}) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 14,
      padding: 20,
    }}>
      <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 7 }}>
        {title}
      </div>
      <div style={{
        fontSize: 27,
        fontWeight: 800,
        color: danger ? '#dc2626' : warning ? '#d97706' : '#145c2b',
      }}>
        {value.toLocaleString('en-IN')}
      </div>
    </div>
  );
}

function StockBadge({ status }: { status: string }) {
  const styles =
    status === 'AVAILABLE'
      ? { background: '#dcfce7', color: '#166534' }
      : status === 'LOW STOCK'
      ? { background: '#fef3c7', color: '#92400e' }
      : { background: '#fee2e2', color: '#991b1b' };

  return (
    <span style={{
      display: 'inline-block',
      padding: '5px 9px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      ...styles,
    }}>
      {status}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontWeight: 700, color: '#111827' }}>{value}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #d1d5db',
  borderRadius: 9,
  padding: '11px 12px',
  fontSize: 14,
  background: '#fff',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 7,
  fontSize: 13,
  fontWeight: 700,
  color: '#374151',
};

const thStyle: React.CSSProperties = {
  padding: '13px 14px',
  fontSize: 12,
  color: '#4b5563',
  borderBottom: '1px solid #e5e7eb',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: 14,
  borderBottom: '1px solid #f0f2f0',
  fontSize: 13,
  verticalAlign: 'middle',
};

const headerButton: React.CSSProperties = {
  background: 'rgba(255,255,255,0.14)',
  color: '#fff',
  padding: '10px 16px',
  borderRadius: 10,
  textDecoration: 'none',
  fontWeight: 600,
};

const refreshButton: React.CSSProperties = {
  border: '1px solid #d1d5db',
  background: '#fff',
  padding: '10px 14px',
  borderRadius: 9,
  cursor: 'pointer',
  fontWeight: 600,
};

const adjustButton: React.CSSProperties = {
  border: 0,
  background: '#eef6ef',
  color: '#145c2b',
  padding: '8px 12px',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 12,
};

const bottomLink: React.CSSProperties = {
  color: '#145c2b',
  textDecoration: 'none',
  fontWeight: 600,
};

const cancelButton: React.CSSProperties = {
  border: '1px solid #d1d5db',
  background: '#fff',
  color: '#374151',
  padding: '11px 18px',
  borderRadius: 9,
  fontWeight: 600,
  cursor: 'pointer',
};

const saveButton: React.CSSProperties = {
  border: 0,
  color: '#fff',
  padding: '11px 20px',
  borderRadius: 9,
  fontWeight: 700,
};
