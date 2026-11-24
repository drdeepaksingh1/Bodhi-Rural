'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace('/login');
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        padding: '10px 18px',
        border: '1px solid #ddd',
        borderRadius: 8,
        background: '#fff',
        color: '#b00020',
        fontWeight: 600,
        cursor: loading ? 'wait' : 'pointer',
      }}
    >
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  );
}
