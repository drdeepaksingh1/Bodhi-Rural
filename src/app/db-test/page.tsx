'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DatabaseTest() {
  const [status, setStatus] = useState('Testing Supabase connection...');
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function testDatabase() {
      const supabase = createClient();

      const { count, error } = await supabase
        .from('product_categories')
        .select('*', {
          count: 'exact',
          head: true,
        });

      if (error) {
        setStatus(`Database connection failed: ${error.message}`);
        return;
      }

      setCount(count ?? 0);
      setStatus('Supabase connected successfully');
    }

    testDatabase();
  }, []);

  return (
    <main style={{ padding: 40, fontFamily: 'Arial, sans-serif' }}>
      <h1>Bodhi Rural Database Test</h1>

      <h2>{status}</h2>

      {count !== null && (
        <p>Product categories: {count}</p>
      )}
    </main>
  );
}
