'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import AuthModal from './AuthModal';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

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
      <nav className="navbar">
        <div className="nav-container">
          <Link href="/" className="logo">
            <img
              src="/logos/top-left-logo-for-website/CamConnect.png"
              alt="CamConnect"
              width={150}
              height={40}
              style={{ height: 40, width: 'auto' }}
            />
          </Link>
          <ul className="nav-menu">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/feed">Feed</Link></li>
            <li><Link href="/messages">Messages</Link></li>
            <li><Link href="/profile">Profile</Link></li>
            <li><Link href="/chat">Start Chat</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
          <div className="nav-buttons">
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {user?.username}
                  {user?.isPremium && (
                    <span style={{ color: '#fbbf24', marginLeft: 4 }}>★</span>
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
        </div>
      </nav>
      {showAuth && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuth(false)}
          onSwitchMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        />
      )}
    </>
  );
}
