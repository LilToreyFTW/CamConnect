'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AuthModal from '@/app/components/AuthModal';
import DiscordWidget from '@/app/components/DiscordWidget';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);

  const handleStartChat = () => {
    if (isAuthenticated) {
      router.push('/chat');
    } else {
      setShowAuth(true);
    }
  };

  return (
    <main>
      <section className="hero">
        <div className="hero-banner">
          <img src="/banners/page_banner.png" alt="CamConnect Banner" />
        </div>
        <div className="hero-content">
          <h1>Meet New People Through Live Video</h1>
          <p>Random video chat with people from around the world. Safe, fun, and completely free.</p>
          <button className="btn btn-large btn-primary" onClick={handleStartChat}>
            Start Chatting
          </button>
        </div>
        <div className="hero-visual">
          <div className="video-preview">
            <div className="preview-placeholder">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              <p>Click to enable camera</p>
            </div>
          </div>
        </div>
      </section>

      <section className="features" style={{ padding: '80px 20px' }}>
        <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>Why Choose CamConnect?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <FeatureCard
              icon={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />}
              title="Safe & Secure"
              text="Your privacy is our priority. We use encryption and moderation to keep conversations safe."
            />
            <FeatureCard
              icon={
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </>
              }
              title="Global Community"
              text="Connect with people from over 180 countries. Experience different cultures and perspectives."
            />
            <FeatureCard
              icon={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />}
              title="Instant Connection"
              text="No waiting, no delays. Click start and you're instantly connected with someone new."
            />
            <FeatureCard
              icon={
                <>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </>
              }
              title="Anonymous Option"
              text="Chat anonymously or create an account for additional features. The choice is yours."
            />
          </div>
        </div>
      </section>

      <section className="how-it-works" style={{ padding: '80px 20px', background: 'var(--surface)' }}>
        <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>How It Works</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
            <Step number="1" title="Allow Camera Access" text="Grant permission to use your camera and microphone when prompted." />
            <Step number="2" title="Click Start" text="Press the start button to begin searching for a conversation partner." />
            <Step number="3" title="Start Chatting" text="Once connected, start your video conversation. Click next to meet someone new." />
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ marginBottom: '1rem' }}>Join Our Community</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Connect with other CamConnect users on Discord. Get support, share experiences, and meet new people.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <DiscordWidget />
          </div>
        </div>
      </section>

      <section className="cta" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2>Ready to Meet Someone New?</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem' }}>
            Join thousands of people chatting right now. It's free and takes seconds to start.
          </p>
          <button className="btn btn-large btn-primary" onClick={handleStartChat}>
            Start Chatting Now
          </button>
        </div>
      </section>

      {showAuth && (
        <AuthModal
          mode="login"
          onClose={() => setShowAuth(false)}
          onSwitchMode={() => {}}
        />
      )}
    </main>
  );
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div style={{ background: 'var(--surface-light)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border)' }}>
      <div style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {icon}
        </svg>
      </div>
      <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{text}</p>
    </div>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 280 }}>
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'var(--gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          margin: '0 auto 1rem',
        }}
      >
        {number}
      </div>
      <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{text}</p>
    </div>
  );
}
