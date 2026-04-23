export default function Privacy() {
  return (
    <main style={{ paddingTop: 100 }}>
      <section style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1>Privacy Policy</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>How we protect your privacy and handle your data</p>
        </div>
      </section>

      <section style={{ padding: '60px 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 12, border: '1px solid var(--border)' }}>
            <h2 style={{ marginBottom: '1rem' }}>1. Information We Collect</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>We collect information you provide directly, such as your username, email, and profile information.</p>

            <h2 style={{ marginBottom: '1rem' }}>2. How We Use Your Information</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>We use your information to provide, maintain, and improve our services, and to communicate with you.</p>

            <h2 style={{ marginBottom: '1rem' }}>3. Data Security</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>We implement reasonable security measures to protect your personal information.</p>

            <h2 style={{ marginBottom: '1rem' }}>4. Your Rights</h2>
            <p style={{ color: 'var(--text-secondary)' }}>You have the right to access, update, or delete your personal information.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
