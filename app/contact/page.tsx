import DiscordWidget from '@/app/components/DiscordWidget';

export default function Contact() {
  return (
    <main style={{ paddingTop: 100 }}>
      <section style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1>Contact Us</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Get in touch with the CamConnect team</p>
        </div>
      </section>

      <section style={{ padding: '60px 20px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.75rem', height: '100%' }}>
              <h2 style={{ marginBottom: '1rem' }}>Support that actually gets you unstuck</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Reach out for account help, billing questions, moderation issues, or general feedback about the product.
              </p>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <a
                  href="mailto:support@camconnect.com?subject=CamConnect%20Support"
                  className="btn btn-primary"
                  style={{ textAlign: 'center' }}
                >
                  Email Support
                </a>
                <a
                  href="mailto:billing@camconnect.com?subject=CamConnect%20Billing"
                  className="btn btn-outline"
                  style={{ textAlign: 'center' }}
                >
                  Billing Questions
                </a>
              </div>
              <div style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                <p style={{ marginBottom: '0.5rem' }}>Typical topics we can help with:</p>
                <p>Login trouble, premium checkout issues, reporting abusive users, and feature requests.</p>
              </div>
            </div>
          </div>

          <div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.75rem', marginBottom: '1.5rem' }}>
              <h2 style={{ marginBottom: '1rem' }}>Contact Information</h2>
              <div style={{ display: 'grid', gap: '1rem', color: 'var(--text-secondary)' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>Email</h3>
                  <a href="mailto:support@camconnect.com">support@camconnect.com</a>
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>Response Window</h3>
                  <p>Usually within 1 to 2 business days.</p>
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>Before You Reach Out</h3>
                  <p>Include the email tied to your account and a short description of what happened.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 style={{ marginBottom: '0.75rem' }}>Discord Community</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Join the community for updates, help from other members, and a faster feedback loop.
              </p>
              <DiscordWidget />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
