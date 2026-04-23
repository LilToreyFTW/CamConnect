export default function FAQ() {
  return (
    <main style={{ paddingTop: 100 }}>
      <section style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1>Frequently Asked Questions</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Everything you need to know about CamConnect</p>
        </div>
      </section>

      <section style={{ padding: '60px 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>General Questions</h2>
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 12, border: '1px solid var(--border)', marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>What is CamConnect?</h3>
              <p style={{ color: 'var(--text-secondary)' }}>CamConnect is a modern live video chat platform that connects you with people from around the world through random video conversations.</p>
            </div>
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 12, border: '1px solid var(--border)' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Is CamConnect free?</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Yes! CamConnect is completely free to use. We offer premium features for enhanced matching, but the core experience is free.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
