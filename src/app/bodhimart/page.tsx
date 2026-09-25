'use client';

import { useState } from 'react';
import Link from 'next/link';

const products = [
  {
    icon: '🐔',
    name: 'Layer Feed',
    price: '₹32/kg',
    category: 'Poultry',
    description: 'Feed solution for layer bird production.',
  },
  {
    icon: '🌾',
    name: 'Poultry Feed',
    price: '₹31/kg',
    category: 'Poultry',
    description: 'Feed for poultry production and farm operations.',
  },
  {
    icon: '🐣',
    name: 'Layer Chicks',
    price: '₹48/each',
    category: 'Birds',
    description: 'Layer chicks for farm-based poultry production.',
  },
  {
    icon: '🌱',
    name: 'Vegetable Seeds',
    price: '₹120/pack',
    category: 'Seeds',
    description: 'Seeds for vegetable and kitchen garden production.',
  },
  {
    icon: '🧪',
    name: 'Farm Bio-input',
    price: '₹350/unit',
    category: 'Farm Inputs',
    description: 'Bio-input products for agriculture and farm management.',
  },
  {
    icon: '💉',
    name: 'Veterinary Kit',
    price: '₹280/kit',
    category: 'Veterinary',
    description: 'Basic veterinary support kit for farm operations.',
  },
  {
    icon: '🪣',
    name: 'Farm Feeder',
    price: '₹650/each',
    category: 'Equipment',
    description: 'Farm feeder equipment for poultry operations.',
  },
  {
    icon: '🌽',
    name: 'Maize Feed',
    price: '₹28/kg',
    category: 'Feed',
    description: 'Maize-based feed material for livestock and poultry.',
  },
];

const categories = [
  'All',
  'Poultry',
  'Birds',
  'Seeds',
  'Farm Inputs',
  'Veterinary',
  'Equipment',
  'Feed',
];

export default function Mart() {
  const [count, setCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredProducts =
    activeCategory === 'All'
      ? products
      : products.filter(
          (product) => product.category === activeCategory
        );

  function addToCart() {
    setCount((current) => current + 1);
  }

  return (
    <main>
      {/* =====================================================
          HERO
      ===================================================== */}
      <section
        style={{
          background:
            'linear-gradient(135deg, #f3faf4 0%, #ffffff 55%, #edf7ef 100%)',
          padding: '45px 20px',
        }}
      >
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(0, 1fr) minmax(280px, 0.7fr)',
            gap: '30px',
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                color: '#145c2b',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              BODHI RURAL MARKETPLACE
            </div>

            <h1
              style={{
                margin: '0 0 14px',
                color: '#173522',
                fontSize: 'clamp(34px, 5vw, 52px)',
                lineHeight: 1.1,
              }}
            >
              BodhiMart
            </h1>

            <p
              className="muted"
              style={{
                maxWidth: '680px',
                fontSize: '17px',
                lineHeight: 1.65,
                marginBottom: '20px',
              }}
            >
              Farmer-focused ordering for agricultural, poultry and rural
              enterprise inputs.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <a
                href="#products"
                className="btn"
                style={{
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Browse Products
              </a>

              <Link
                href="/farmer-network"
                className="btn alt"
                style={{
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Farmer Network
              </Link>
            </div>
          </div>

          {/* CART PANEL */}
          <div
            style={{
              background: '#145c2b',
              borderRadius: '16px',
              padding: '26px',
              color: '#ffffff',
              boxShadow:
                '0 12px 30px rgba(20, 92, 43, 0.13)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: '#cfe8d5',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              YOUR CART
            </div>

            <div
              style={{
                fontSize: '42px',
                fontWeight: 800,
                lineHeight: 1,
                marginBottom: '8px',
              }}
            >
              {count}
            </div>

            <div
              style={{
                color: '#e9f4ec',
                fontSize: '14px',
                marginBottom: '18px',
              }}
            >
              Items added to cart
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.10)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                lineHeight: 1.5,
              }}
            >
              Select farm products below and add them to your cart.
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CATEGORY FILTER
      ===================================================== */}
      <section
        style={{
          padding: '30px 20px 15px',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            {categories.map((category) => {
              const active = activeCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  style={{
                    border: active
                      ? '1px solid #145c2b'
                      : '1px solid #dfe9e1',
                    background: active
                      ? '#145c2b'
                      : '#ffffff',
                    color: active
                      ? '#ffffff'
                      : '#405047',
                    borderRadius: '20px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          PRODUCTS
      ===================================================== */}
      <section
        id="products"
        style={{
          padding: '20px 20px 45px',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'end',
              gap: '15px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  color: '#145c2b',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: '5px',
                }}
              >
                PRODUCTS
              </div>

              <h2 style={{ margin: 0 }}>
                Farm & rural essentials
              </h2>
            </div>

            <div
              className="muted"
              style={{
                fontSize: '13px',
              }}
            >
              {filteredProducts.length} products
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
            }}
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.name}
                product={product}
                onAdd={addToCart}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                border: '1px solid #dfe9e1',
                borderRadius: '12px',
              }}
            >
              <h3>No products found</h3>
              <p className="muted">
                Try another category.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          MARKETPLACE INFORMATION
      ===================================================== */}
      <section
        style={{
          background: '#f7f9f7',
          padding: '40px 20px',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
            }}
          >
            <InfoCard
              icon="🌾"
              title="Farm Inputs"
              text="Agricultural inputs and products for rural producers."
            />

            <InfoCard
              icon="🐔"
              title="Poultry Solutions"
              text="Feed, birds and equipment for poultry operations."
            />

            <InfoCard
              icon="🤝"
              title="Farmer Focused"
              text="Designed around the needs of farmers and rural enterprises."
            />

            <InfoCard
              icon="📦"
              title="Value Chain"
              text="Connecting products and services with rural markets."
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          CTA
      ===================================================== */}
      <section
        style={{
          background: '#145c2b',
          padding: '42px 20px 48px',
        }}
      >
        <div
          className="container"
          style={{
            textAlign: 'center',
          }}
        >
          <div
            style={{
              color: '#cfe8d5',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '7px',
            }}
          >
            BODHI RURAL
          </div>

          <h2
            style={{
              color: '#ffffff',
              margin: '0 0 10px',
            }}
          >
            Connecting farmers with products and services
          </h2>

          <p
            style={{
              color: '#e9f4ec',
              maxWidth: '680px',
              margin: '0 auto 20px',
              lineHeight: 1.65,
              fontSize: '14px',
            }}
          >
            BodhiMart is part of the wider Bodhi Rural ecosystem connecting
            farmers, rural enterprises, agricultural inputs and markets.
          </p>

          <Link
            href="/farmer-network"
            style={{
              display: 'inline-block',
              background: '#ffffff',
              color: '#145c2b',
              padding: '11px 20px',
              borderRadius: '7px',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Explore Farmer Network
          </Link>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({
  product,
  onAdd,
}: {
  product: {
    icon: string;
    name: string;
    price: string;
    category: string;
    description: string;
  };
  onAdd: () => void;
}) {
  return (
    <div
      style={{
        border: '1px solid #dfe9e1',
        borderRadius: '12px',
        background: '#ffffff',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '250px',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '12px',
          background: '#f1f7f2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          marginBottom: '12px',
        }}
      >
        {product.icon}
      </div>

      <div
        style={{
          color: '#6b776f',
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '5px',
        }}
      >
        {product.category}
      </div>

      <h3
        style={{
          color: '#173522',
          margin: '0 0 6px',
          fontSize: '17px',
        }}
      >
        {product.name}
      </h3>

      <p
        className="muted"
        style={{
          fontSize: '12px',
          lineHeight: 1.5,
          margin: '0 0 12px',
          flex: 1,
        }}
      >
        {product.description}
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <div
          style={{
            color: '#145c2b',
            fontWeight: 800,
            fontSize: '17px',
          }}
        >
          {product.price}
        </div>

        <button
          type="button"
          className="btn"
          onClick={onAdd}
          style={{
            border: 'none',
            cursor: 'pointer',
            padding: '9px 12px',
            fontSize: '12px',
          }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   INFORMATION CARD
========================================================= */

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e1e9e3',
        borderRadius: '11px',
        padding: '18px',
      }}
    >
      <div
        style={{
          fontSize: '25px',
          marginBottom: '7px',
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          margin: '0 0 5px',
          fontSize: '16px',
        }}
      >
        {title}
      </h3>

      <p
        className="muted"
        style={{
          margin: 0,
          fontSize: '13px',
          lineHeight: 1.5,
        }}
      >
        {text}
      </p>
    </div>
  );
}
