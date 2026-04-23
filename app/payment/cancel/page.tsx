import Link from 'next/link';

export default function PaymentCancel() {
  return (
    <main style={{ paddingTop: 120, textAlign: 'center', maxWidth: 600, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
      <div style={{ background: 'var(--surface)', padding: '3rem', borderRadius: 16, border: '1px solid var(--border)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <h1 style={{ marginBottom: '1rem' }}>Payment Cancelled</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Your payment was cancelled. No charges were made.
        </p>
        <Link href="/profile" className="btn btn-primary">
          Back to Profile
        </Link>
      </div>
    </main>
  );
}
