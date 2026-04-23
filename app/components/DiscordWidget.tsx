'use client';

import { useEffect, useState } from 'react';

interface DiscordMember {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  avatar_url: string;
}

interface DiscordWidgetData {
  id: string;
  name: string;
  instant_invite: string;
  presence_count: number;
  members: DiscordMember[];
}

export default function DiscordWidget() {
  const [data, setData] = useState<DiscordWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('https://discord.com/api/guilds/1496826095511670924/widget.json')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load Discord widget');
        setLoading(false);
      });
  }, []);

  const statusColor: Record<string, string> = {
    online: '#22c55e',
    idle: '#fbbf24',
    dnd: '#ef4444',
    offline: '#6b7280',
  };

  if (loading) {
    return (
      <div
        style={{
          background: '#2a2a3e',
          borderRadius: 12,
          border: '1px solid var(--border)',
          padding: '1.5rem',
          minHeight: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        Loading Discord...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          background: '#2a2a3e',
          borderRadius: 12,
          border: '1px solid var(--border)',
          padding: '1.5rem',
        }}
      >
        <p style={{ color: 'var(--text-secondary)' }}>{error || 'Widget unavailable'}</p>
        <a
          href="https://discord.com/invite/9Vugg2cm"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ marginTop: '1rem', display: 'inline-block' }}
        >
          Join on Discord
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#2a2a3e',
        borderRadius: 12,
        border: '1px solid var(--border)',
        overflow: 'hidden',
        maxWidth: 350,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #5865F2 0%, #4752C4 100%)',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
        <div>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', lineHeight: 1.2 }}>{data.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
            {data.presence_count} Member{data.presence_count !== 1 ? 's' : ''} Online
          </div>
        </div>
      </div>

      {/* Members */}
      <div style={{ padding: '1rem', maxHeight: 280, overflowY: 'auto' }}>
        {data.members?.length > 0 ? (
          data.members.map((member) => (
            <div
              key={member.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.4rem 0',
              }}
            >
              <div style={{ position: 'relative' }}>
                <img
                  src={member.avatar_url}
                  alt={member.username}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: statusColor[member.status] || '#6b7280',
                    border: '2px solid #2a2a3e',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{member.username}</span>
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No members online</p>
        )}
      </div>

      {/* Join Button */}
      <div style={{ padding: '0 1rem 1rem' }}>
        <a
          href={data.instant_invite}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{
            width: '100%',
            textAlign: 'center',
            display: 'block',
            textDecoration: 'none',
            background: '#5865F2',
          }}
        >
          Join Server
        </a>
      </div>
    </div>
  );
}
