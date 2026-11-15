'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';

type Product = {
  id: string;
  product_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  brand: string | null;
  unit: string | null;
  mrp: number;
  selling_price: number;
  delivery_available: boolean;
};

type Inventory = {
  product_id: string;
  available_quantity: number;
};

type Category = {
  id: string;
  name: string;
};

export default function Mart() {
  const supabase = useMemo(() => createClient(), []);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadCatalogue() {
      setLoading(true);
      setError('');

      const [productResult, inventoryResult, categoryResult] = await Promise.all([
        supabase
          .from('marketplace_public_products')
          .select('id, product_id, category_id, name, description, brand, unit, mrp, selling_price, delivery_available')
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: false }),
        supabase
          .from('marketplace_public_inventory')
          .select('product_id, available_quantity'),
        supabase
          .from('marketplace_categories')
          .select('id, name')
          .order('name', { ascending: true }),
      ]);

      if (!active) return;

      if (productResult.error || inventoryResult.error || categoryResult.error) {
        setError(
          productResult.error?.message ||
          inventoryResult.error?.message ||
          categoryResult.error?.message ||
          'Unable to load the live catalogue.'
        );
        setProducts([]);
        setInventory([]);
        setCategories([]);
      } else {
        setProducts((productResult.data || []) as Product[]);
        setInventory((inventoryResult.data || []) as Inventory[]);
        setCategories((categoryResult.data || []) as Category[]);
      }
      setLoading(false);
    }

    void loadCatalogue();
    return () => { active = false; };
  }, [supabase]);

  const inventoryByProduct = useMemo(() => {
    const result: Record<string, number> = {};
    inventory.forEach((item) => {
      result[item.product_id] = Math.max(0, Number(item.available_quantity || 0));
    });
    return result;
  }, [inventory]);

  const categoryNames = useMemo(() => {
    const result: Record<string, string> = {};
    categories.forEach((item) => { result[item.id] = item.name; });
    return result;
  }, [categories]);

  const visibleProducts = useMemo(() => {
    if (activeCategory === 'All') return products;
    return products.filter((product) => product.category_id === activeCategory);
  }, [activeCategory, products]);

  function money(value: number) {
    return '₹' + Number(value || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <main>
      <section style={{ background: 'linear-gradient(135deg, #f3faf4 0%, #ffffff 55%, #edf7ef 100%)', padding: '45px 20px' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '30px', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#145c2b', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
              BODHI RURAL MARKETPLACE
            </div>
            <h1 style={{ margin: '0 0 14px', color: '#173522', fontSize: 'clamp(34px, 5vw, 52px)', lineHeight: 1.1 }}>
              BodhiMart
            </h1>
            <p className="muted" style={{ maxWidth: '680px', fontSize: '17px', lineHeight: 1.65, marginBottom: '20px' }}>
              Farmer-focused ordering for agricultural, poultry and rural enterprise inputs.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <Link href="/bodhimart/products" className="btn" style={{ textDecoration: 'none', display: 'inline-block' }}>Browse Live Catalogue</Link>
              <Link href="/farmer-network" className="btn alt" style={{ textDecoration: 'none', display: 'inline-block' }}>Farmer Network</Link>
            </div>
          </div>

          <div style={{ background: '#145c2b', borderRadius: '16px', padding: '26px', color: '#ffffff', boxShadow: '0 12px 30px rgba(20, 92, 43, 0.13)' }}>
            <div style={{ fontSize: '11px', color: '#cfe8d5', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>SHOP BODHIMART</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 800, lineHeight: 1.08, margin: '0 0 12px' }}>Farm & Rural Essentials</h2>
            <p style={{ color: '#e9f4ec', fontSize: '14px', marginBottom: '18px' }}>
              Browse approved products with prices and available stock from the live catalogue.
            </p>
            <div style={{ background: 'rgba(255,255,255,0.10)', borderRadius: '8px', padding: '12px', fontSize: '12px', lineHeight: 1.5 }}>
              Your customer cart is linked to your signed-in account.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px' }}>
              <Link href="/bodhimart/products" className="btn" style={{ background: '#ffffff', color: '#145c2b', textDecoration: 'none' }}>Shop Products</Link>
              <Link href="/bodhimart/cart" className="btn alt" style={{ textDecoration: 'none' }}>View Cart</Link>
              <Link href="/bodhimart/my-orders" className="btn alt" style={{ textDecoration: 'none' }}>My Orders</Link>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '30px 20px 15px' }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <button type="button" onClick={() => setActiveCategory('All')} aria-pressed={activeCategory === 'All'} style={categoryButton(activeCategory === 'All')}>All</button>
            {categories.map((category) => (
              <button key={category.id} type="button" onClick={() => setActiveCategory(category.id)} aria-pressed={activeCategory === category.id} style={categoryButton(activeCategory === category.id)}>
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="products" style={{ padding: '20px 20px 45px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#145c2b', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '5px' }}>LIVE CATALOGUE</div>
              <h2 style={{ margin: 0 }}>Farm & rural essentials</h2>
            </div>
            <div className="muted" style={{ fontSize: '13px' }}>
              {loading ? 'Loading products…' : error ? 'Catalogue unavailable' : `${visibleProducts.length} products`}
            </div>
          </div>

          {error && (
            <div role="alert" style={{ border: '1px solid #f1c5c5', background: '#fff5f5', color: '#8b2424', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              The live catalogue could not be loaded. Please open the full catalogue or try again later.
            </div>
          )}

          {loading ? (
            <p className="muted" aria-live="polite">Loading approved BodhiMart products…</p>
          ) : !error && visibleProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px solid #dfe9e1', borderRadius: '12px' }}>
              <h3>{products.length === 0 ? 'No approved products available yet' : 'No products in this category'}</h3>
              <p className="muted">Please check the full catalogue for current listings.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {visibleProducts.map((product) => {
                const stock = inventoryByProduct[product.id];
                const hasStockRecord = Object.prototype.hasOwnProperty.call(inventoryByProduct, product.id);
                const inStock = hasStockRecord && stock > 0;
                return (
                  <article key={product.id} style={{ border: '1px solid #dfe9e1', borderRadius: '12px', background: '#ffffff', padding: '18px', display: 'flex', flexDirection: 'column', minHeight: '245px' }}>
                    <div aria-hidden="true" style={{ height: '86px', borderRadius: '9px', background: '#f1f7f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6a806e', fontSize: '12px', letterSpacing: '1px', marginBottom: '14px' }}>
                      BODHI MART
                    </div>
                    <div style={{ color: '#6b776f', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>
                      {product.category_id ? categoryNames[product.category_id] || 'Product' : 'Product'}
                    </div>
                    <h3 style={{ color: '#173522', margin: '0 0 6px', fontSize: '17px' }}>{product.name}</h3>
                    {product.brand && <p className="muted" style={{ fontSize: '12px', margin: '0 0 5px' }}>Brand: {product.brand}</p>}
                    <p className="muted" style={{ fontSize: '12px', lineHeight: 1.5, margin: '0 0 12px', flex: 1 }}>{product.description || 'Approved BodhiMart product.'}</p>
                    <div style={{ color: '#145c2b', fontWeight: 800, fontSize: '17px' }}>
                      {money(product.selling_price)}{product.unit ? ` / ${product.unit}` : ''}
                    </div>
                    <p style={{ fontSize: '12px', margin: '8px 0 12px', color: !hasStockRecord ? '#6b7280' : inStock ? '#18723a' : '#b42318' }}>
                      {!hasStockRecord ? 'Availability not reported' : inStock ? `${stock} available` : 'Out of stock'}
                    </p>
                    <Link href="/bodhimart/products" className="btn" style={{ textDecoration: 'none', textAlign: 'center', padding: '9px 12px', fontSize: '12px' }}>View in Catalogue</Link>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section style={{ background: '#f7f9f7', padding: '40px 20px' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <InfoCard icon="🌾" title="Farm Inputs" text="Agricultural inputs and products for rural producers." />
          <InfoCard icon="🐔" title="Poultry Solutions" text="Feed, birds and equipment for poultry operations." />
          <InfoCard icon="🤝" title="Farmer Focused" text="Designed around the needs of farmers and rural enterprises." />
          <InfoCard icon="📦" title="Value Chain" text="Connecting products and services with rural markets." />
        </div>
      </section>

      <section style={{ background: '#145c2b', padding: '42px 20px 48px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ color: '#cfe8d5', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '7px' }}>BODHI RURAL</div>
          <h2 style={{ color: '#ffffff', margin: '0 0 10px' }}>Connecting farmers with products and services</h2>
          <p style={{ color: '#e9f4ec', maxWidth: '680px', margin: '0 auto 20px', lineHeight: 1.65, fontSize: '14px' }}>
            BodhiMart is part of the wider Bodhi Rural ecosystem connecting farmers, rural enterprises, agricultural inputs and markets.
          </p>
          <Link href="/farmer-network" style={{ display: 'inline-block', background: '#ffffff', color: '#145c2b', padding: '11px 20px', borderRadius: '7px', textDecoration: 'none', fontWeight: 700 }}>Explore Farmer Network</Link>
        </div>
      </section>
    </main>
  );
}

function categoryButton(active: boolean): React.CSSProperties {
  return {
    border: active ? '1px solid #145c2b' : '1px solid #dfe9e1',
    background: active ? '#145c2b' : '#ffffff',
    color: active ? '#ffffff' : '#405047',
    borderRadius: '20px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  };
}

function InfoCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e1e9e3', borderRadius: '11px', padding: '18px' }}>
      <div style={{ fontSize: '25px', marginBottom: '7px' }}>{icon}</div>
      <h3 style={{ margin: '0 0 5px', fontSize: '16px' }}>{title}</h3>
      <p className="muted" style={{ margin: 0, fontSize: '13px', lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}
