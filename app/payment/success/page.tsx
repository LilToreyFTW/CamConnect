'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

export default function PaymentSuccess() {
  const { refreshUser } = useAuth();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <main style={{ paddingTop: 120, textAlign: 'center', maxWidth: 600, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
      <div style={{ background: 'var(--surface)', padding: '3rem', borderRadius: 16, border: '1px solid var(--border)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--secondary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 style={{ marginBottom: '1rem' }}>Payment Successful!</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Thank you for your purchase. Your premium membership is now active.
        </p>
        <Link href="/profile" className="btn btn-primary">
          Go to Profile
        </Link>
      </div>
    </main>
  );
}
