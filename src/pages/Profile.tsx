import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const VIBE_OPTIONS = [
  { icon: '⚽', label: 'Sports' },
  { icon: '🎨', label: 'Culture' },
  { icon: '🍴', label: 'Food' },
  { icon: '☕', label: 'Coffee' },
  { icon: '🎮', label: 'Gaming' },
  { icon: '📚', label: 'Study' },
  { icon: '🎵', label: 'Music' },
  { icon: '🌿', label: 'Nature' },
];

const Profile = () => {
  const navigate = useNavigate();
  const { profile, signOut, user, refreshProfile, isDarkMode, toggleTheme, theme } = useAuth();

  const [uploading, setUploading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [stats, setStats] = useState({ activities: 0, connections: 0, rank: '✨' });
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch real stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      const [{ count: actCount }, { count: connCount }] = await Promise.all([
        supabase
          .from('activity_participants')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('friendships')
          .select('*', { count: 'exact', head: true })
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status', 'accepted'),
      ]);
      const activities = actCount ?? 0;
      const rank = activities >= 10 ? '🥇' : activities >= 5 ? '🥈' : activities >= 2 ? '🥉' : '✨';
      setStats({ activities, connections: connCount ?? 0, rank });
    };
    fetchStats();
  }, [user]);

  // Init vibes from profile — interests is a text[] from Postgres
  useEffect(() => {
    if (Array.isArray(profile?.interests)) {
      setSelectedVibes(profile.interests);
    }
  }, [profile]);

  const toggleVibe = async (label: string) => {
    const next = selectedVibes.includes(label)
      ? selectedVibes.filter(v => v !== label)
      : [...selectedVibes, label];
    setSelectedVibes(next);
    // Fire-and-forget — silently fails if the interests column doesn't exist yet
    await supabase.from('profiles').update({ interests: next }).eq('id', user?.id);
  };

  const handleUpload = async (event: any) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const filePath = `${user?.id}/avatar-${Date.now()}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: filePath }).eq('id', user?.id);
      if (updateError) throw updateError;
      await refreshProfile();
    } catch {
      alert('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const avatarUrl = profile?.avatar_url
    ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl
    : null;

  // Theme-aware glass card
  const glass: React.CSSProperties = {
    backgroundColor: theme.cardBg,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: `1px solid ${theme.cardBorder}`,
    boxShadow: theme.cardShadow,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '9px', fontWeight: '900', color: theme.subText,
    letterSpacing: '1.4px', display: 'block',
  };

  // Toggle pill (reused for Dark Mode + Notifications)
  const TogglePill = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <div
      onClick={onToggle}
      style={{
        width: '48px', height: '26px', flexShrink: 0,
        backgroundColor: on ? '#FFD700' : theme.inactiveBtnBg,
        borderRadius: '13px', position: 'relative', cursor: 'pointer',
        transition: 'background-color 0.25s',
        border: `1px solid ${theme.cardBorder}`,
      }}
    >
      <div style={{
        width: '20px', height: '20px',
        backgroundColor: on ? '#050B18' : isDarkMode ? '#fff' : '#64748B',
        borderRadius: '50%', position: 'absolute', top: '2px',
        left: on ? '24px' : '3px',
        transition: 'left 0.25s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </div>
  );

  return (
    <div
      className="page-fade"
      style={{
        backgroundColor: theme.bg,
        minHeight: '100vh', width: '100%',
        color: theme.text, padding: '20px 16px 48px',
        display: 'flex', justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* BACK */}
        <button
          onClick={() => navigate('/home')}
          style={{
            background: 'none', border: 'none', color: '#64748b',
            fontSize: '22px', cursor: 'pointer',
            width: 'fit-content', padding: '0 0 4px',
          }}
        >←</button>

        {/* ── PROFILE CARD (Student ID) ────────────────────── */}
        <div style={{
          ...glass,
          borderRadius: '32px',
          border: '1px solid rgba(255,215,0,0.22)',
          padding: '32px 24px 28px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Soft gold radial glow behind avatar */}
          <div style={{
            position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)',
            width: '220px', height: '160px',
            background: 'radial-gradient(ellipse, rgba(255,215,0,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* AVATAR */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '96px', height: '96px', borderRadius: '50%',
              margin: '0 auto 18px',
              border: '2px solid rgba(255,215,0,0.45)',
              padding: '3px', cursor: 'pointer',
              position: 'relative', display: 'inline-block',
            }}
          >
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              backgroundColor: '#1A283D', overflow: 'hidden',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '34px' }}>{uploading ? '⏳' : '👤'}</span>
              }
            </div>
            {/* Gold + badge */}
            <div style={{
              position: 'absolute', bottom: '1px', right: '1px',
              backgroundColor: '#FFD700', width: '22px', height: '22px',
              borderRadius: '50%', border: `2px solid ${theme.bg}`,
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              color: '#050B18', fontSize: '12px', fontWeight: '900',
            }}>+</div>
          </div>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleUpload} accept="image/*" />

          <h2 style={{ margin: '0 0 7px', fontSize: '26px', fontWeight: '900', letterSpacing: '-0.4px' }}>
            {profile?.full_name || 'User'}
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
            📍 Global · Student
          </p>
        </div>

        {/* ── STATS ROW ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[
            { label: 'Activities', value: stats.activities },
            { label: 'Connections', value: stats.connections },
            { label: 'Rank', value: stats.rank },
          ].map(({ label, value }) => (
            <div key={label} style={{
              ...glass, borderRadius: '20px',
              padding: '18px 8px', textAlign: 'center',
            }}>
              <div style={{
                fontSize: typeof value === 'string' ? '22px' : '20px',
                fontWeight: '900', color: '#FFD700',
                lineHeight: 1, marginBottom: '6px',
              }}>
                {value}
              </div>
              <div style={{ fontSize: '9px', fontWeight: '800', color: '#475569', letterSpacing: '0.8px' }}>
                {label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        {/* ── MY VIBES ─────────────────────────────────────── */}
        <div style={{ ...glass, borderRadius: '24px', padding: '20px' }}>
          <span style={{ ...labelStyle, marginBottom: '14px' }}>MY VIBES</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {VIBE_OPTIONS.map(({ icon, label }) => {
              const active = selectedVibes.includes(label);
              return (
                <div
                  key={label}
                  onClick={() => toggleVibe(label)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '7px 13px', borderRadius: '20px',
                    fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                    backgroundColor: active ? 'rgba(255,215,0,0.1)' : theme.inactiveBtnBg,
                    color: active ? '#FFD700' : theme.subText,
                    border: active ? '1px solid rgba(255,215,0,0.35)' : `1px solid ${theme.cardBorder}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SYSTEM SETTINGS ──────────────────────────────── */}
        <div style={{ ...glass, borderRadius: '24px', overflow: 'hidden' }}>
          <span style={{ ...labelStyle, padding: '16px 20px 8px', display: 'block' }}>SYSTEM</span>

          {/* Dark Mode */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '18px' }}>{isDarkMode ? '🌙' : '☀️'}</span>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>Dark Mode</div>
                <div style={{ fontSize: '11px', color: '#475569' }}>App-wide theme</div>
              </div>
            </div>
            <TogglePill on={isDarkMode} onToggle={toggleTheme} />
          </div>

          <div style={{ height: '1px', backgroundColor: theme.divider, margin: '0 20px' }} />

          {/* Notifications */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '18px' }}>🔔</span>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>Notifications</div>
                <div style={{ fontSize: '11px', color: '#475569' }}>Plans & updates</div>
              </div>
            </div>
            <TogglePill on={notificationsEnabled} onToggle={() => setNotificationsEnabled(n => !n)} />
          </div>
        </div>

        {/* ── LOGOUT ───────────────────────────────────────── */}
        <button
          onClick={() => signOut()}
          style={{
            width: '100%',
            backgroundColor: 'rgba(239,68,68,0.07)',
            color: '#EF4444',
            border: '1px solid rgba(239,68,68,0.2)',
            padding: '16px', borderRadius: '20px',
            fontWeight: '800', fontSize: '14px', cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            transition: '0.2s',
          }}
        >
          Logout Account
        </button>

      </div>
    </div>
  );
};

export default Profile;
