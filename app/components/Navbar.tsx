'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import AuthModal from './AuthModal';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/feed', label: 'Feed' },
  { href: '/messages', label: 'Messages' },
  { href: '/profile', label: 'Profile' },
  { href: '/chat', label: 'Start Chat' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const openLogin = () => {
    setAuthMode('login');
    setShowAuth(true);
  };

  const openRegister = () => {
    setAuthMode('register');
    setShowAuth(true);
  };

  return (
    <>
      <header className="site-header">
        <nav className="navbar">
          <div className="nav-container">
            <Link href="/" className="logo" aria-label="CamConnect home">
              <img
                src="/logos/top-left-logo-for-website/CamConnect.png"
                alt="CamConnect"
                width={150}
                height={40}
                style={{ height: 40, width: 'auto' }}
              />
            </Link>

            <ul className="nav-menu">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={pathname === link.href ? 'nav-link active' : 'nav-link'}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="nav-buttons">
              {isAuthenticated ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {user?.username}
                    {user?.isPremium && (
                      <span style={{ color: '#fbbf24', marginLeft: 6 }}>Premium</span>
                    )}
                  </span>
                  <button className="btn btn-small btn-outline" onClick={logout}>
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <button className="btn btn-outline" onClick={openLogin}>
                    Login
                  </button>
                  <button className="btn btn-primary" onClick={openRegister}>
                    Sign Up
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              className="nav-toggle"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>

          <div className={mobileOpen ? 'mobile-nav open' : 'mobile-nav'}>
            <div className="mobile-nav-links">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={pathname === link.href ? 'nav-link active' : 'nav-link'}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mobile-nav-actions">
              {isAuthenticated ? (
                <>
                  <p className="mobile-user-label">
                    Signed in as <strong>{user?.username}</strong>
                  </p>
                  <button className="btn btn-outline" onClick={logout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-outline" onClick={openLogin}>
                    Login
                  </button>
                  <button className="btn btn-primary" onClick={openRegister}>
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {showAuth && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuth(false)}
          onSwitchMode={() => setAuthMode((mode) => (mode === 'login' ? 'register' : 'login'))}
        />
      )}
    </>
  );
}
