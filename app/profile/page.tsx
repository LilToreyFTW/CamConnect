'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import RouteGuard from '@/app/components/RouteGuard';
import CreditsModal from '@/app/components/CreditsModal';
import { createCheckoutSession, deletePhoto, getProfile, updateProfile, uploadPhoto } from '@/app/lib/api';

export default function ProfilePage() {
  return (
    <RouteGuard>
      <ProfileContent />
    </RouteGuard>
  );
}

function ProfileContent() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [showCredits, setShowCredits] = useState(false);
  const [form, setForm] = useState({ bio: '', age: '', gender: '' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      setForm({
        bio: data.bio || '',
        age: data.age ? String(data.age) : '',
        gender: data.gender || '',
      });
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const updates: Record<string, any> = {};
      if (form.bio) updates.bio = form.bio;
      if (form.age) updates.age = parseInt(form.age, 10);
      if (form.gender) updates.gender = form.gender;

      await updateProfile(updates);
      await refreshUser();
      await loadProfile();
      setEditing(false);
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPhoto = async () => {
    if (!photoUrl.trim()) return;

    try {
      await uploadPhoto(photoUrl, profile.photos?.length === 0);
      setPhotoUrl('');
      await loadProfile();
      await refreshUser();
    } catch (err) {
      alert('Failed to add photo');
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('Delete this photo?')) return;

    try {
      await deletePhoto(photoId);
      await loadProfile();
      await refreshUser();
    } catch (err) {
      alert('Failed to delete photo');
    }
  };

  const handleBuyPremium = async () => {
    if (profile?.isPremium) return;

    try {
      const { url } = await createCheckoutSession();
      if (url) window.location.href = url;
    } catch (err) {
      alert('Failed to start checkout');
    }
  };

  if (loading) {
    return (
      <main style={{ paddingTop: 100, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>
      </main>
    );
  }

  return (
    <main style={{ paddingTop: 100, maxWidth: 900, margin: '0 auto', paddingLeft: 20, paddingRight: 20, paddingBottom: 60 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '2rem', border: '1px solid var(--border)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <img
            src={profile?.photos?.find((photo: any) => photo.isProfile)?.url || profile?.photos?.[0]?.url || '/logos/top-left-logo-for-website/CamConnect.png'}
            alt=""
            style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-color)' }}
          />

          <div style={{ flex: 1 }}>
            <h1 style={{ marginBottom: '0.25rem' }}>{profile?.username || 'User'}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              {profile?.bio || 'No bio yet'}
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <span><strong style={{ color: 'var(--text-primary)' }}>{profile?.followers || 0}</strong> followers</span>
              <span><strong style={{ color: 'var(--text-primary)' }}>{profile?.following || 0}</strong> following</span>
              <span><strong style={{ color: 'var(--text-primary)' }}>{profile?.credits || 0}</strong> credits</span>
              {profile?.isPremium && (
                <span style={{ color: '#fbbf24' }}>Premium</span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn btn-primary btn-small" onClick={() => setEditing((open) => !open)}>
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
            <button className="btn btn-outline btn-small" onClick={handleBuyPremium} disabled={profile?.isPremium}>
              {profile?.isPremium ? 'Premium Active' : 'Buy Premium'}
            </button>
            <button className="btn btn-outline btn-small" onClick={() => setShowCredits(true)}>
              Buy Credits
            </button>
          </div>
        </div>

        {showCredits && <CreditsModal onClose={() => setShowCredits(false)} />}

        {editing && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <div className="form-group">
              <label>Bio</label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                maxLength={500}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  min={18}
                />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="couple">Couple</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '1.5rem', border: '1px solid var(--border)', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Photos</h3>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Photo URL..."
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            style={{ flex: 1, padding: '0.5rem 0.75rem', background: 'var(--surface-light)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
          />
          <button className="btn btn-small btn-primary" onClick={handleAddPhoto}>Add Photo</button>
        </div>

        {profile?.photos?.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
            {profile.photos.map((photo: any) => (
              <div key={photo.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden' }}>
                <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  x
                </button>
                {photo.isProfile && (
                  <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'var(--primary-color)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>
                    Profile
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No photos yet. Add one above.</p>
        )}
      </div>
    </main>
  );
}
