'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

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
  const [threshold, setThreshold] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href =
          '/login?redirect=/bodhimart/seller/inventory';
        return;
      }

      const { data: sellerData, error: sellerError } =
        await supabase
          .from('marketplace_sellers')
          .select(
            'id, seller_id, shop_name, status'
          )
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

      const {
        data: productData,
        error: productError,
      } = await supabase
        .from('marketplace_products')
        .select(
          `
            id,
            product_id,
            sku,
            name,
            unit,
            status
          `
        )
        .eq('seller_id', sellerData.id)
        .order('name', { ascending: true });

      if (productError) throw productError;

      const products = (productData || []) as Product[];

      if (products.length === 0) {
        setRows([]);
        return;
      }

      const productIds = products.map(
        (product) => product.id
      );

      const {
        data: inventoryData,
        error: inventoryError,
      } = await supabase
        .from('marketplace_inventory')
        .select(
          `
            id,
            product_id,
            stock_quantity,
            reserved_quantity,
            low_stock_threshold,
            updated_at
          `
        )
        .in('product_id', productIds);

      if (inventoryError) throw inventoryError;

      const inventories =
        (inventoryData || []) as Inventory[];

      const inventoryMap = new Map<
        string,
        Inventory
      >();

      inventories.forEach((inventory) => {
        inventoryMap.set(
          inventory.product_id,
          inventory
        );
      });

      const combined: InventoryRow[] = [];

      products.forEach((product) => {
        const inventory =
          inventoryMap.get(product.id);

        if (inventory) {
          combined.push({
            product,
            inventory,
          });
        }
      });

      setRows(combined);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          'Unable to load inventory.'
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredRows = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return rows.filter((row) => {
      const available =
        Number(
          row.inventory.stock_quantity
        ) -
        Number(
          row.inventory.reserved_quantity
        );

      const thresholdValue =
        Number(
          row.inventory.low_stock_threshold
        );

      const isLow =
        available > 0 &&
        available <= thresholdValue;

      const isOut =
        available <= 0;

      const matchesSearch =
        !keyword ||
        row.product.name
          .toLowerCase()
          .includes(keyword) ||
        row.product.product_id
          .toLowerCase()
          .includes(keyword) ||
        (row.product.sku || '')
          .toLowerCase()
          .includes(keyword);

      let matchesFilter = true;

      if (stockFilter === 'AVAILABLE') {
        matchesFilter = available > 0;
      }

      if (stockFilter === 'LOW') {
        matchesFilter = isLow;
      }

      if (stockFilter === 'OUT') {
        matchesFilter = isOut;
      }

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [rows, search, stockFilter]);

  const summary = useMemo(() => {
    let totalStock = 0;
    let reservedStock = 0;
    let availableStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    rows.forEach((row) => {
      const stock =
        Number(
          row.inventory.stock_quantity
        );

      const reserved =
        Number(
          row.inventory.reserved_quantity
        );

      const available =
        stock - reserved;

      totalStock += stock;
      reservedStock += reserved;
      availableStock += available;

      if (available <= 0) {
        outOfStock++;
      } else if (
        available <=
        Number(
          row.inventory.low_stock_threshold
        )
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
    setThreshold(
      String(
        row.inventory.low_stock_threshold
      )
    );
    setError('');
    setMessage('');
  }

  function closeAdjustment() {
    setSelectedRow(null);
    setAdjustQuantity('');
    setThreshold('');
  }

  async function saveInventory() {
    if (!selectedRow) return;

    const quantity = Number(adjustQuantity);
    const newThreshold = Number(threshold);

    if (
      Number.isNaN(quantity) ||
      quantity < 0
    ) {
      setError(
        'Please enter a valid quantity.'
      );
      return;
    }

    if (
      Number.isNaN(newThreshold) ||
      newThreshold < 0
    ) {
      setError(
        'Please enter a valid low-stock threshold.'
      );
      return;
    }

    const currentStock =
      Number(
        selectedRow.inventory.stock_quantity
      );

    const reserved =
      Number(
        selectedRow.inventory.reserved_quantity
      );

    let newStock = currentStock;

    if (adjustMode === 'ADD') {
      newStock =
        currentStock + quantity;
    }

    if (adjustMode === 'REDUCE') {
      newStock =
        currentStock - quantity;

      if (newStock < reserved) {
        setError(
          'Stock cannot be reduced below the reserved quantity.'
        );
        return;
      }
    }

    if (adjustMode === 'SET') {
      newStock = quantity;

      if (newStock < reserved) {
        setError(
          'Stock cannot be set below the reserved quantity.'
        );
        return;
      }
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const {
        error: updateError,
      } = await supabase
        .from('marketplace_inventory')
        .update({
          stock_quantity: newStock,
          low_stock_threshold:
            newThreshold,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          selectedRow.inventory.id
        )
        .eq(
          'product_id',
          selectedRow.product.id
        );

      if (updateError) {
        throw updateError;
      }

      const productName =
        selectedRow.product.name;

      closeAdjustment();

      setMessage(
        `Inventory updated successfully for ${productName}.`
      );

      await loadInventory();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          'Unable to update inventory.'
      );
    } finally {
      setSaving(false);
    }
  }

  function getAvailable(row: InventoryRow) {
    return (
      Number(
        row.inventory.stock_quantity
      ) -
      Number(
        row.inventory.reserved_quantity
      )
    );
  }

  function getStockStatus(row: InventoryRow) {
    const available =
      getAvailable(row);

    const thresholdValue =
      Number(
        row.inventory.low_stock_threshold
      );

    if (available <= 0) {
      return 'OUT OF STOCK';
    }

    if (
      available <= thresholdValue
    ) {
      return 'LOW STOCK';
    }

    return 'AVAILABLE';
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString(
      'en-IN',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      }
    );
  }

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
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            background: '#145c2b',
            color: '#fff',
            borderRadius: 18,
            padding: '24px 28px',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 13,
                  opacity: 0.8,
                  marginBottom: 6,
                }}
              >
                BODHI MART SELLER PORTAL
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 30,
                }}
              >
                Inventory Management
              </h1>

              {seller && (
                <p
                  style={{
                    margin: '8px 0 0',
                    opacity: 0.9,
                  }}
                >
                  {seller.shop_name} •{' '}
                  {seller.seller_id}
                </p>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <Link
                href="/bodhimart/seller/products"
                style={headerButton}
              >
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

        {/* MESSAGES */}
        {error && (
          <div
            style={{
              background: '#fef2f2',
              color: '#991b1b',
              border:
                '1px solid #fecaca',
              borderRadius: 12,
              padding: 15,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              background: '#ecfdf5',
              color: '#166534',
              border:
                '1px solid #bbf7d0',
              borderRadius: 12,
              padding: 15,
              marginBottom: 20,
            }}
          >
            {message}
          </div>
        )}

        {/* SUMMARY */}
        <div
          className="summary-grid"
        >
          <SummaryCard
            title="Products"
            value={summary.products}
          />

          <SummaryCard
            title="Total Stock"
            value={summary.totalStock}
          />

          <SummaryCard
            title="Reserved"
            value={summary.reservedStock}
          />

          <SummaryCard
            title="Available"
            value={summary.availableStock}
          />

          <SummaryCard
            title="Low Stock"
            value={summary.lowStock}
            warning
          />

          <SummaryCard
            title="Out of Stock"
            value={summary.outOfStock}
            danger
          />
        </div>

        {/* FILTERS */}
        <div
          style={{
            background: '#fff',
            border:
              '1px solid #e5e7eb',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div className="filter-grid">
            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search product, ID or SKU..."
              style={inputStyle}
            />

            <select
              value={stockFilter}
              onChange={(e) =>
                setStockFilter(
                  e.target.value
                )
              }
              style={inputStyle}
            >
              <option value="ALL">
                All Stock
              </option>

              <option value="AVAILABLE">
                Available
              </option>

              <option value="LOW">
                Low Stock
              </option>

              <option value="OUT">
                Out of Stock
              </option>
            </select>

            <button
              onClick={loadInventory}
              style={refreshButton}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* INVENTORY TABLE */}
        <div
          style={{
            background: '#fff',
            border:
              '1px solid #e5e7eb',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding:
                '18px 20px',
              borderBottom:
                '1px solid #e5e7eb',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 20,
              }}
            >
              Product Inventory
            </h2>

            <p
              style={{
                margin:
                  '4px 0 0',
                color: '#6b7280',
                fontSize: 14,
              }}
            >
              {filteredRows.length}{' '}
              inventory record
              {filteredRows.length !==
              1
                ? 's'
                : ''}{' '}
              displayed
            </p>
          </div>

          {loading ? (
            <div
              style={{
                padding: 50,
                textAlign: 'center',
                color: '#6b7280',
              }}
            >
              Loading inventory...
            </div>
          ) : filteredRows.length ===
            0 ? (
            <div
              style={{
                padding: 60,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 42,
                  marginBottom: 12,
                }}
              >
                📦
              </div>

              <h3
                style={{
                  margin:
                    '0 0 8px',
                }}
              >
                No inventory records
              </h3>

              <p
                style={{
                  color: '#6b7280',
                  margin: 0,
                }}
              >
                Your products do not
                have inventory records
                yet.
              </p>
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
                  minWidth: 1050,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background:
                        '#f8faf8',
                      textAlign:
                        'left',
                    }}
                  >
                    <th style={thStyle}>
                      Product
                    </th>

                    <th style={thStyle}>
                      SKU
                    </th>

                    <th style={thStyle}>
                      Total Stock
                    </th>

                    <th style={thStyle}>
                      Reserved
                    </th>

                    <th style={thStyle}>
                      Available
                    </th>

                    <th style={thStyle}>
                      Threshold
                    </th>

                    <th style={thStyle}>
                      Status
                    </th>

                    <th style={thStyle}>
                      Updated
                    </th>

                    <th style={thStyle}>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map(
                    (row) => {
                      const available =
                        getAvailable(
                          row
                        );

                      const status =
                        getStockStatus(
                          row
                        );

                      return (
                        <tr
                          key={
                            row.inventory
                              .id
                          }
                        >
                          <td style={tdStyle}>
                            <div
                              style={{
                                fontWeight:
                                  700,
                              }}
                            >
                              {
                                row
                                  .product
                                  .name
                              }
                            </div>

                            <div
                              style={{
                                color:
                                  '#6b7280',
                                fontSize:
                                  12,
                                marginTop:
                                  3,
                              }}
                            >
                              {
                                row
                                  .product
                                  .product_id
                              }

                              {row.product
                                .unit &&
                                ` • ${row.product.unit}`}
                            </div>
                          </td>

                          <td style={tdStyle}>
                            {row.product
                              .sku ||
                              '—'}
                          </td>

                          <td style={tdStyle}>
                            <strong>
                              {
                                row
                                  .inventory
                                  .stock_quantity
                              }
                            </strong>
                          </td>

                          <td style={tdStyle}>
                            {
                              row
                                .inventory
                                .reserved_quantity
                            }
                          </td>

                          <td style={tdStyle}>
                            <strong
                              style={{
                                color:
                                  available <=
                                  0
                                    ? '#dc2626'
                                    : '#145c2b',
                              }}
                            >
                              {available}
                            </strong>
                          </td>

                          <td style={tdStyle}>
                            {
                              row
                                .inventory
                                .low_stock_threshold
                            }
                          </td>

                          <td style={tdStyle}>
                            <StockBadge
                              status={
                                status
                              }
                            />
                          </td>

                          <td style={tdStyle}>
                            <span
                              style={{
                                fontSize:
                                  12,
                                color:
                                  '#6b7280',
                              }}
                            >
                              {formatDate(
                                row
                                  .inventory
                                  .updated_at
                              )}
                            </span>
                          </td>

                          <td style={tdStyle}>
                            <button
                              onClick={() =>
                                openAdjustment(
                                  row
                                )
                              }
                              style={
                                adjustButton
                              }
                            >
                              Manage Stock
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* NAVIGATION */}
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            gap: 12,
            flexWrap: 'wrap',
            marginTop: 20,
          }}
        >
          <Link
            href="/bodhimart/seller/dashboard"
            style={bottomLink}
          >
            ← Back to Seller Dashboard
          </Link>

          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/bodhimart/seller/products"
              style={bottomLink}
            >
              My Products
            </Link>

            <Link
              href="/bodhimart/seller/orders"
              style={bottomLink}
            >
              Orders
            </Link>

            <Link
              href="/bodhimart/seller/sales"
              style={bottomLink}
            >
              Sales
            </Link>
          </div>
        </div>
      </div>

      {/* STOCK MODAL */}
      {selectedRow && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#fff',
              width: '100%',
              maxWidth: 520,
              borderRadius: 18,
              padding: 26,
              boxShadow:
                '0 20px 50px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                marginBottom: 18,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 22,
                  }}
                >
                  Manage Stock
                </h2>

                <p
                  style={{
                    margin:
                      '5px 0 0',
                    color:
                      '#6b7280',
                    fontSize: 13,
                  }}
                >
                  {
                    selectedRow
                      .product
                      .name
                  }
                </p>
              </div>

              <button
                onClick={
                  closeAdjustment
                }
                style={{
                  border: 0,
                  background:
                    '#f3f4f6',
                  width: 34,
                  height: 34,
                  borderRadius:
                    '50%',
                  cursor:
                    'pointer',
                  fontSize: 18,
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                background:
                  '#f8faf8',
                borderRadius: 12,
                padding: 15,
                marginBottom: 18,
              }}
            >
              <div
                className="modal-summary"
              >
                <Info
                  label="Current"
                  value={String(
                    selectedRow
                      .inventory
                      .stock_quantity
                  )}
                />

                <Info
                  label="Reserved"
                  value={String(
                    selectedRow
                      .inventory
                      .reserved_quantity
                  )}
                />

                <Info
                  label="Available"
                  value={String(
                    getAvailable(
                      selectedRow
                    )
                  )}
                />
              </div>
            </div>

            <label
              style={labelStyle}
            >
              Stock Action
            </label>

            <select
              value={adjustMode}
              onChange={(e) =>
                setAdjustMode(
                  e.target
                    .value as
                    | 'ADD'
                    | 'REDUCE'
                    | 'SET'
                )
              }
              style={{
                ...inputStyle,
                marginBottom: 16,
              }}
            >
              <option value="ADD">
                Add Stock
              </option>

              <option value="REDUCE">
                Reduce Stock
              </option>

              <option value="SET">
                Set Stock Quantity
              </option>
            </select>

            <label
              style={labelStyle}
            >
              {adjustMode === 'ADD'
                ? 'Quantity to Add'
                : adjustMode ===
                  'REDUCE'
                ? 'Quantity to Reduce'
                : 'New Stock Quantity'}
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={adjustQuantity}
              onChange={(e) =>
                setAdjustQuantity(
                  e.target.value
                )
              }
              placeholder="Enter quantity"
              style={{
                ...inputStyle,
                marginBottom: 16,
              }}
            />

            <label
              style={labelStyle}
            >
              Low Stock Threshold
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={threshold}
              onChange={(e) =>
                setThreshold(
                  e.target.value
                )
              }
              style={{
                ...inputStyle,
                marginBottom: 20,
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'flex-end',
                gap: 10,
              }}
            >
              <button
                onClick={
                  closeAdjustment
                }
                disabled={saving}
                style={
                  cancelButton
                }
              >
                Cancel
              </button>

              <button
                onClick={
                  saveInventory
                }
                disabled={saving}
                style={{
                  border: 0,
                  background:
                    saving
                      ? '#9ca3af'
                      : '#145c2b',
                  color: '#fff',
                  padding:
                    '11px 20px',
                  borderRadius: 9,
                  fontWeight: 700,
                  cursor:
                    saving
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {saving
                  ? 'Saving...'
                  : 'Save Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .summary-grid {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .filter-grid {
          display: grid;
          grid-template-columns:
            minmax(220px, 1fr) 180px 100px;
          gap: 12px;
        }

        .modal-summary {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 10px;
        }

        @media (max-width: 700px) {
          .filter-grid {
            grid-template-columns: 1fr;
          }

          .modal-summary {
            grid-template-columns: 1fr;
          }
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
    <div
      style={{
        background: '#fff',
        border:
          '1px solid #e5e7eb',
        borderRadius: 14,
        padding: 20,
      }}
    >
      <div
        style={{
          color: '#6b7280',
          fontSize: 13,
          marginBottom: 7,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 27,
          fontWeight: 800,
          color: danger
            ? '#dc2626'
            : warning
            ? '#d97706'
            : '#145c2b',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StockBadge({
  status,
}: {
  status: string;
}) {
  const styles =
    status === 'AVAILABLE'
      ? {
          background: '#dcfce7',
          color: '#166534',
        }
      : status === 'LOW STOCK'
      ? {
          background: '#fef3c7',
          color: '#92400e',
        }
      : {
          background: '#fee2e2',
          color: '#991b1b',
        };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '5px 9px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        ...styles,
      }}
    >
      {status}
    </span>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: '#6b7280',
          marginBottom: 4,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight: 700,
          color: '#111827',
        }}
      >
        {value}
      </div>
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
