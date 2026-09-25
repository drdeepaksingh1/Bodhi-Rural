'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../../../../lib/supabase/client';

type Seller = {
  id: string;
  seller_id: string;
  shop_name: string;
  owner_name: string;
  mobile: string | null;
  email: string | null;
  address: string | null;
  status: string;
};

type Product = {
  id: string;
  product_id: string;
  product_name: string;
  selling_price: number | null;
  stock_quantity: number | null;
  status: string;
};

type SellerOrder = {
  id: string;
  seller_order_number: string | null;
  status: string;
  total_amount: number | null;
  created_at: string;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

const supabase = createClient();

export default function SellerDashboardPage() {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setError('Please login to access the seller dashboard.');
        setLoading(false);
        return;
      }

      const { data: sellerData, error: sellerError } = await supabase
        .from('marketplace_sellers')
        .select(
          'id, seller_id, shop_name, owner_name, mobile, email, address, status'
        )
        .eq('user_id', user.id)
        .maybeSingle();

      if (sellerError) throw sellerError;

      if (!sellerData) {
        setError(
          'No seller account is linked to this login. Please contact BodhiMart administration.'
        );
        setLoading(false);
        return;
      }

      if (sellerData.status !== 'ACTIVE') {
        setError(
          `Your seller account is currently ${sellerData.status}. Please contact BodhiMart administration.`
        );
        setSeller(sellerData);
        setLoading(false);
        return;
      }

      setSeller(sellerData);

      const [
        productsResult,
        ordersResult,
        notificationsResult,
      ] = await Promise.all([
        supabase
          .from('marketplace_products')
          .select(
            'id, product_id, product_name, selling_price, stock_quantity, status'
          )
          .eq('seller_id', sellerData.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('marketplace_seller_orders')
          .select(
            'id, seller_order_number, status, total_amount, created_at'
          )
          .eq('seller_id', sellerData.id)
          .order('created_at', { ascending: false })
          .limit(100),

        supabase
          .from('marketplace_notifications')
          .select('id, title, message, is_read, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (productsResult.error) throw productsResult.error;
      if (ordersResult.error) throw ordersResult.error;
      if (notificationsResult.error) throw notificationsResult.error;

      setProducts(productsResult.data || []);
      setOrders(ordersResult.data || []);
      setNotifications(notificationsResult.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Unable to load seller dashboard.');
    } finally {
      setLoading(false);
    }
  }

  const summary = useMemo(() => {
    const newOrders = orders.filter(
      (order) =>
        order.status === 'NEW' ||
        order.status === 'ORDER_PLACED' ||
        order.status === 'PAYMENT_CONFIRMED'
    ).length;

    const processingOrders = orders.filter(
      (order) =>
        order.status === 'PROCESSING' ||
        order.status === 'SELLER_ACCEPTED' ||
        order.status === 'PACKING'
    ).length;

    const readyOrders = orders.filter(
      (order) =>
        order.status === 'READY_FOR_DISPATCH' ||
        order.status === 'READY'
    ).length;

    const deliveredOrders = orders.filter(
      (order) => order.status === 'DELIVERED'
    ).length;

    const totalSales = orders
      .filter((order) => order.status === 'DELIVERED')
      .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

    const unreadNotifications = notifications.filter(
      (notification) => !notification.is_read
    ).length;

    const lowStockProducts = products.filter(
      (product) =>
        Number(product.stock_quantity || 0) > 0 &&
        Number(product.stock_quantity || 0) <= 10
    ).length;

    const outOfStockProducts = products.filter(
      (product) => Number(product.stock_quantity || 0) <= 0
    ).length;

    return {
      newOrders,
      processingOrders,
      readyOrders,
      deliveredOrders,
      totalSales,
      unreadNotifications,
      lowStockProducts,
      outOfStockProducts,
    };
  }, [orders, products, notifications]);

  if (loading) {
    return (
      <main className="seller-page">
        <div className="seller-container">
          <div className="loading-card">Loading Seller Dashboard...</div>
        </div>

        <style jsx>{`
          .seller-page {
            min-height: 70vh;
            background: #f5f8f5;
            padding: 40px 20px;
          }

          .seller-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .loading-card {
            background: white;
            border-radius: 16px;
            padding: 60px 20px;
            text-align: center;
            color: #555;
            box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
          }
        `}</style>
      </main>
    );
  }

  if (error) {
    return (
      <main className="seller-page">
        <div className="seller-container">
          <div className="error-card">
            <div className="error-icon">!</div>
            <h2>Seller Dashboard</h2>
            <p>{error}</p>

            <div className="error-actions">
              <button onClick={loadDashboard}>Retry</button>
              <Link href="/bodhimart">Back to BodhiMart</Link>
            </div>
          </div>
        </div>

        <style jsx>{`
          .seller-page {
            min-height: 70vh;
            background: #f5f8f5;
            padding: 40px 20px;
          }

          .seller-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .error-card {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 18px;
            padding: 45px 30px;
            text-align: center;
            box-shadow: 0 4px 18px rgba(0, 0, 0, 0.07);
          }

          .error-icon {
            width: 48px;
            height: 48px;
            margin: 0 auto 15px;
            border-radius: 50%;
            background: #fff3cd;
            color: #856404;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            font-weight: 800;
          }

          .error-card h2 {
            margin: 0 0 10px;
            color: #145c2b;
          }

          .error-card p {
            color: #666;
            line-height: 1.6;
          }

          .error-actions {
            display: flex;
            justify-content: center;
            gap: 12px;
            margin-top: 25px;
            flex-wrap: wrap;
          }

          .error-actions button,
          .error-actions a {
            border: 0;
            border-radius: 9px;
            padding: 11px 18px;
            cursor: pointer;
            text-decoration: none;
            font-weight: 700;
          }

          .error-actions button {
            background: #145c2b;
            color: white;
          }

          .error-actions a {
            background: #edf4ef;
            color: #145c2b;
          }
        `}</style>
      </main>
    );
  }

  if (!seller) return null;

  return (
    <main className="seller-page">
      <div className="seller-container">
        {/* Dashboard Header */}
        <section className="dashboard-header">
          <div>
            <div className="eyebrow">BODHIMART SELLER CENTER</div>
            <h1>Seller Dashboard</h1>
            <p>
              Manage your shop, products, inventory and customer orders from
              one place.
            </p>
          </div>

          <div className="header-actions">
            <Link href="/bodhimart" className="secondary-btn">
              View BodhiMart
            </Link>

            <button onClick={loadDashboard} className="refresh-btn">
              ↻ Refresh
            </button>
          </div>
        </section>

        {/* Seller Identity */}
        <section className="seller-profile-card">
          <div className="shop-avatar">
            {seller.shop_name?.charAt(0)?.toUpperCase() || 'B'}
          </div>

          <div className="seller-info">
            <div className="shop-title-row">
              <h2>{seller.shop_name}</h2>
              <span className="active-badge">ACTIVE</span>
            </div>

            <p>Owner: {seller.owner_name}</p>

            <div className="seller-meta">
              <span>
                <strong>Seller ID:</strong> {seller.seller_id}
              </span>

              {seller.mobile && (
                <span>
                  <strong>Mobile:</strong> {seller.mobile}
                </span>
              )}

              {seller.email && (
                <span>
                  <strong>Email:</strong> {seller.email}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions">
          <Link href="/bodhimart/seller/products" className="quick-card">
            <span className="quick-icon">📦</span>
            <span>
              <strong>My Products</strong>
              <small>Manage products</small>
            </span>
          </Link>

          <Link href="/bodhimart/seller/products/add" className="quick-card">
            <span className="quick-icon">➕</span>
            <span>
              <strong>Add Product</strong>
              <small>Add a new product</small>
            </span>
          </Link>

          <Link href="/bodhimart/seller/inventory" className="quick-card">
            <span className="quick-icon">📊</span>
            <span>
              <strong>Inventory</strong>
              <small>Manage stock</small>
            </span>
          </Link>

          <Link href="/bodhimart/seller/orders" className="quick-card">
            <span className="quick-icon">🛍️</span>
            <span>
              <strong>Orders</strong>
              <small>Manage customer orders</small>
            </span>
          </Link>
        </section>

        {/* Summary */}
        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">📦</span>
            <div>
              <strong>{products.length}</strong>
              <span>Total Products</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">🆕</span>
            <div>
              <strong>{summary.newOrders}</strong>
              <span>New Orders</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">⚙️</span>
            <div>
              <strong>{summary.processingOrders}</strong>
              <span>Processing</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">🚚</span>
            <div>
              <strong>{summary.readyOrders}</strong>
              <span>Ready for Dispatch</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <div>
              <strong>{summary.deliveredOrders}</strong>
              <span>Delivered</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">💰</span>
            <div>
              <strong>
                ₹
                {summary.totalSales.toLocaleString('en-IN', {
                  maximumFractionDigits: 2,
                })}
              </strong>
              <span>Delivered Sales</span>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <section className="content-grid">
          {/* Orders */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Recent Orders</h2>
                <p>Your latest seller orders</p>
              </div>

              <Link href="/bodhimart/seller/orders">View All</Link>
            </div>

            {orders.length === 0 ? (
              <div className="empty-state">
                <div>🛍️</div>
                <h3>No orders yet</h3>
                <p>
                  New customer orders will appear here when customers
                  purchase your products.
                </p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.slice(0, 6).map((order) => (
                  <div className="order-row" key={order.id}>
                    <div>
                      <strong>
                        {order.seller_order_number || order.id.slice(0, 8)}
                      </strong>
                      <small>
                        {new Date(order.created_at).toLocaleDateString(
                          'en-IN'
                        )}
                      </small>
                    </div>

                    <span
                      className={`status ${
                        order.status.toLowerCase().replaceAll('_', '-')
                      }`}
                    >
                      {order.status.replaceAll('_', ' ')}
                    </span>

                    <strong>
                      ₹
                      {Number(order.total_amount || 0).toLocaleString(
                        'en-IN'
                      )}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inventory */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Inventory Alerts</h2>
                <p>Products requiring attention</p>
              </div>

              <Link href="/bodhimart/seller/inventory">Inventory</Link>
            </div>

            <div className="inventory-summary">
              <div className="inventory-box warning">
                <strong>{summary.lowStockProducts}</strong>
                <span>Low Stock</span>
              </div>

              <div className="inventory-box danger">
                <strong>{summary.outOfStockProducts}</strong>
                <span>Out of Stock</span>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="empty-small">
                <p>No products added yet.</p>
                <Link href="/bodhimart/seller/products/add">
                  Add your first product →
                </Link>
              </div>
            ) : (
              <div className="product-list">
                {products.slice(0, 5).map((product) => (
                  <div className="product-row" key={product.id}>
                    <div>
                      <strong>{product.product_name}</strong>
                      <small>{product.product_id}</small>
                    </div>

                    <span
                      className={
                        Number(product.stock_quantity || 0) <= 0
                          ? 'stock-danger'
                          : Number(product.stock_quantity || 0) <= 10
                          ? 'stock-warning'
                          : 'stock-good'
                      }
                    >
                      {Number(product.stock_quantity || 0)} stock
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Notifications */}
        <section className="panel notifications-panel">
          <div className="panel-header">
            <div>
              <h2>Notifications</h2>
              <p>
                {summary.unreadNotifications > 0
                  ? `${summary.unreadNotifications} unread notification${
                      summary.unreadNotifications > 1 ? 's' : ''
                    }`
                  : 'You are all caught up'}
              </p>
            </div>

            <Link href="/bodhimart/seller/notifications">
              View All
            </Link>
          </div>

          {notifications.length === 0 ? (
            <div className="empty-small">
              <p>No notifications available.</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  className={`notification ${
                    !notification.is_read ? 'unread' : ''
                  }`}
                  key={notification.id}
                >
                  <div className="notification-dot" />

                  <div>
                    <strong>{notification.title}</strong>
                    <p>{notification.message}</p>
                    <small>
                      {new Date(notification.created_at).toLocaleString(
                        'en-IN'
                      )}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Seller Menu */}
        <section className="seller-menu">
          <Link href="/bodhimart/seller/shop">🏪 My Shop</Link>
          <Link href="/bodhimart/seller/products">📦 Products</Link>
          <Link href="/bodhimart/seller/products/add">➕ Add Product</Link>
          <Link href="/bodhimart/seller/inventory">📊 Inventory</Link>
          <Link href="/bodhimart/seller/orders">🛍️ Orders</Link>
          <Link href="/bodhimart/seller/returns">↩️ Returns</Link>
          <Link href="/bodhimart/seller/sales">💰 Sales</Link>
          <Link href="/bodhimart/seller/notifications">🔔 Notifications</Link>
        </section>
      </div>

      <style jsx>{`
        .seller-page {
          min-height: 80vh;
          background: #f5f8f5;
          padding: 35px 20px 60px;
        }

        .seller-container {
          max-width: 1250px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 25px;
          margin-bottom: 24px;
        }

        .eyebrow {
          color: #145c2b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.5px;
          margin-bottom: 7px;
        }

        .dashboard-header h1 {
          margin: 0;
          font-size: 34px;
          color: #153b23;
        }

        .dashboard-header p {
          margin: 8px 0 0;
          color: #657066;
        }

        .header-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .secondary-btn,
        .refresh-btn {
          border: 0;
          text-decoration: none;
          padding: 11px 17px;
          border-radius: 9px;
          font-weight: 700;
          cursor: pointer;
        }

        .secondary-btn {
          background: white;
          color: #145c2b;
          border: 1px solid #d8e3da;
        }

        .refresh-btn {
          background: #145c2b;
          color: white;
        }

        .seller-profile-card {
          display: flex;
          align-items: center;
          gap: 18px;
          background: white;
          border-radius: 17px;
          padding: 22px;
          margin-bottom: 20px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05);
        }

        .shop-avatar {
          width: 65px;
          height: 65px;
          flex: 0 0 65px;
          border-radius: 16px;
          background: #145c2b;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 27px;
          font-weight: 800;
        }

        .seller-info {
          min-width: 0;
          flex: 1;
        }

        .shop-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .shop-title-row h2 {
          margin: 0;
          color: #173d24;
          font-size: 22px;
        }

        .active-badge {
          background: #e5f6ea;
          color: #137333;
          border-radius: 30px;
          padding: 5px 10px;
          font-size: 11px;
          font-weight: 800;
        }

        .seller-info p {
          margin: 6px 0 10px;
          color: #68736b;
        }

        .seller-meta {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
          color: #59645c;
          font-size: 13px;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }

        .quick-card {
          display: flex;
          align-items: center;
          gap: 13px;
          background: white;
          border-radius: 14px;
          padding: 17px;
          text-decoration: none;
          color: #173d24;
          border: 1px solid #e2e9e3;
          transition: 0.2s ease;
        }

        .quick-card:hover {
          transform: translateY(-2px);
          border-color: #b9d0bd;
        }

        .quick-icon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          background: #eef6ef;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .quick-card strong,
        .quick-card small {
          display: block;
        }

        .quick-card small {
          margin-top: 3px;
          color: #788178;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: white;
          border-radius: 14px;
          padding: 17px 13px;
          display: flex;
          gap: 10px;
          align-items: center;
          border: 1px solid #e4eae5;
        }

        .stat-icon {
          font-size: 20px;
        }

        .stat-card strong,
        .stat-card span {
          display: block;
        }

        .stat-card strong {
          font-size: 21px;
          color: #173d24;
        }

        .stat-card div span {
          color: #737b75;
          font-size: 12px;
          margin-top: 3px;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .panel {
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e9e3;
          overflow: hidden;
        }

        .panel-header {
          padding: 19px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          border-bottom: 1px solid #edf1ed;
        }

        .panel-header h2 {
          margin: 0;
          color: #173d24;
          font-size: 18px;
        }

        .panel-header p {
          margin: 4px 0 0;
          color: #7a827b;
          font-size: 12px;
        }

        .panel-header a {
          color: #145c2b;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
        }

        .empty-state {
          text-align: center;
          padding: 40px 25px;
          color: #6f786f;
        }

        .empty-state > div {
          font-size: 34px;
        }

        .empty-state h3 {
          color: #334438;
          margin: 10px 0 5px;
        }

        .empty-state p {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
        }

        .orders-list,
        .product-list {
          padding: 5px 20px 12px;
        }

        .order-row,
        .product-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          align-items: center;
          gap: 15px;
          padding: 14px 0;
          border-bottom: 1px solid #edf1ed;
        }

        .product-row {
          grid-template-columns: 1fr auto;
        }

        .order-row:last-child,
        .product-row:last-child {
          border-bottom: 0;
        }

        .order-row strong,
        .order-row small,
        .product-row strong,
        .product-row small {
          display: block;
        }

        .order-row strong,
        .product-row strong {
          color: #334238;
          font-size: 13px;
        }

        .order-row small,
        .product-row small {
          margin-top: 3px;
          color: #899189;
          font-size: 11px;
        }

        .status {
          padding: 5px 8px;
          border-radius: 20px;
          background: #eef2ef;
          color: #536057;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .inventory-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding: 17px 20px 5px;
        }

        .inventory-box {
          border-radius: 11px;
          padding: 14px;
        }

        .inventory-box strong,
        .inventory-box span {
          display: block;
        }

        .inventory-box strong {
          font-size: 25px;
        }

        .inventory-box span {
          margin-top: 2px;
          font-size: 12px;
        }

        .inventory-box.warning {
          background: #fff8e6;
          color: #8a6500;
        }

        .inventory-box.danger {
          background: #fff0f0;
          color: #a33131;
        }

        .stock-good {
          color: #16823a;
          font-weight: 800;
          font-size: 12px;
        }

        .stock-warning {
          color: #a06b00;
          font-weight: 800;
          font-size: 12px;
        }

        .stock-danger {
          color: #b32b2b;
          font-weight: 800;
          font-size: 12px;
        }

        .empty-small {
          padding: 24px 20px;
          color: #707970;
          font-size: 13px;
        }

        .empty-small p {
          margin: 0 0 8px;
        }

        .empty-small a {
          color: #145c2b;
          font-weight: 800;
          text-decoration: none;
        }

        .notifications-panel {
          margin-bottom: 18px;
        }

        .notification-list {
          padding: 4px 20px 10px;
        }

        .notification {
          display: flex;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #edf1ed;
        }

        .notification:last-child {
          border-bottom: 0;
        }

        .notification-dot {
          width: 8px;
          height: 8px;
          flex: 0 0 8px;
          margin-top: 6px;
          border-radius: 50%;
          background: transparent;
        }

        .notification.unread .notification-dot {
          background: #145c2b;
        }

        .notification strong {
          color: #334238;
          font-size: 13px;
        }

        .notification p {
          margin: 4px 0;
          color: #687269;
          font-size: 12px;
        }

        .notification small {
          color: #929992;
          font-size: 10px;
        }

        .seller-menu {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .seller-menu a {
          background: white;
          border: 1px solid #e1e8e2;
          border-radius: 11px;
          padding: 13px;
          text-decoration: none;
          color: #3c4a40;
          font-size: 13px;
          font-weight: 700;
          text-align: center;
        }

        .seller-menu a:hover {
          border-color: #b6ccb9;
          color: #145c2b;
        }

        @media (max-width: 1050px) {
          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .quick-actions {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 750px) {
          .dashboard-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .dashboard-header h1 {
            font-size: 28px;
          }

          .seller-profile-card {
            align-items: flex-start;
          }

          .content-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .seller-menu {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 520px) {
          .seller-page {
            padding: 25px 12px 45px;
          }

          .quick-actions {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }

          .seller-profile-card {
            padding: 16px;
          }

          .shop-avatar {
            width: 50px;
            height: 50px;
            flex-basis: 50px;
          }

          .seller-meta {
            flex-direction: column;
            gap: 5px;
          }

          .order-row {
            grid-template-columns: 1fr auto;
          }

          .order-row > strong:last-child {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </main>
  );
}
