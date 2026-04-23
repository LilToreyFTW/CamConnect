export default function Terms() {
  return (
    <main style={{ paddingTop: 100 }}>
      <section style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1>Terms of Service</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Terms and conditions for using CamConnect</p>
        </div>
      </section>

      <section style={{ padding: '60px 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 12, border: '1px solid var(--border)' }}>
            <h2 style={{ marginBottom: '1rem' }}>1. Acceptance of Terms</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>By accessing and using CamConnect, you agree to be bound by these Terms of Service.</p>

            <h2 style={{ marginBottom: '1rem' }}>2. User Responsibilities</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Users must be at least 18 years old to use CamConnect. You are responsible for maintaining the confidentiality of your account.</p>

            <h2 style={{ marginBottom: '1rem' }}>3. Prohibited Activities</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Users may not engage in illegal activities, harassment, or any behavior that violates the rights of others.</p>

            <h2 style={{ marginBottom: '1rem' }}>4. Privacy</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Your use of CamConnect is also governed by our Privacy Policy.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
