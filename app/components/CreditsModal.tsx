'use client';

import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { purchaseCredits } from '@/app/lib/api';

interface CreditsModalProps {
  onClose: () => void;
}

export default function CreditsModal({ onClose }: CreditsModalProps) {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);

  const presets = [50, 100, 250, 500, 1000];

  const handlePurchase = async () => {
    setLoading(true);
    try {
      await purchaseCredits(amount);
      await refreshUser();
      onClose();
    } catch (err) {
      alert('Failed to purchase credits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '2rem',
          width: '100%',
          maxWidth: 420,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Buy Credits</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Current balance: <strong>{user?.credits || 0}</strong> credits
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              className="btn"
              style={{
                background: amount === p ? 'var(--gradient)' : 'var(--surface-light)',
                color: amount === p ? '#fff' : 'var(--text-primary)',
                border: `1px solid ${amount === p ? 'var(--primary-color)' : 'var(--border)'}`,
              }}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label>Custom Amount</label>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
          />
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={handlePurchase}
          disabled={loading || amount < 1}
        >
          {loading ? 'Processing...' : `Buy ${amount} Credits`}
        </button>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Secure checkout powered by Stripe
        </p>
      </div>
    </div>
  );
}
