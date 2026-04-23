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
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Send us a message</h2>
            <form>
              <div className="form-group">
                <label>Name</label>
                <input type="text" placeholder="Your name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="your@email.com" />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea rows={5} placeholder="How can we help?"></textarea>
              </div>
              <button type="submit" className="btn btn-primary">Send Message</button>
            </form>
          </div>

          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Contact Information</h2>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Email</h3>
              <p style={{ color: 'var(--text-secondary)' }}>support@camconnect.com</p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Discord Community</h3>
              <DiscordWidget />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
