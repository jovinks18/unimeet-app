import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const INTERESTS = [
  { icon: '⚽', label: 'Sports' },
  { icon: '🎨', label: 'Culture' },
  { icon: '🍴', label: 'Food' },
  { icon: '☕', label: 'Coffee' },
  { icon: '🎮', label: 'Gaming' },
  { icon: '📚', label: 'Study' },
  { icon: '🎵', label: 'Music' },
  { icon: '🌿', label: 'Nature' },
];

const GRAD_YEARS = ['2025', '2026', '2027', '2028'];

const OnboardingFlow = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  // Step 1 fields — pre-fill from existing profile if re-onboarding
  const [name, setName] = useState(profile?.full_name ?? '');
  const [major, setMajor] = useState(profile?.major ?? '');
  const [gradYear, setGradYear] = useState<string>(profile?.grad_year ?? '2026');

  // Step 2 fields
  const [interests, setInterests] = useState<string[]>(() => {
    // profile.interests is now a text[] from Postgres — already a JS array
    return Array.isArray(profile?.interests) ? profile.interests : [];
  });

  const [saving, setSaving] = useState(false);

  // ── Shared style tokens ────────────────────────────────────────────
  const glass: React.CSSProperties = {
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '28px',
    border: '1px solid rgba(255,255,255,0.07)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '9px', fontWeight: '900', color: '#475569',
    letterSpacing: '1.4px', display: 'block', marginBottom: '8px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    backgroundColor: 'rgba(5,11,24,0.6)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    padding: '14px 16px',
    color: 'white', fontSize: '15px', fontWeight: '600',
    outline: 'none', transition: 'border-color 0.2s',
  };

  // ── Helpers ────────────────────────────────────────────────────────
  const goNext = () => {
    setTransitioning(true);
    setTimeout(() => {
      setStep(s => s + 1);
      setTransitioning(false);
    }, 220);
  };

  const toggleInterest = (label: string) => {
    setInterests(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').upsert([{
        id: user?.id,
        full_name: name,
        major,
        grad_year: gradYear,
        interests,          // native JS array → Postgres text[]
        has_onboarded: true,
      }]);

      if (error) throw error;

      // Success — fade out then navigate
      setFadingOut(true);
      setTimeout(async () => {
        await refreshProfile();
        navigate('/home');
      }, 650);
    } catch (err: any) {
      alert(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const hasContent = !!(name || major);
  const step1Unlocked = name.trim() !== '' && major.trim() !== '';
  const step2Unlocked = interests.length >= 3;

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      backgroundColor: '#050B18', color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '32px 20px 56px',
      opacity: fadingOut ? 0 : 1,
      transition: fadingOut ? 'opacity 0.65s ease' : 'none',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* ── Step Indicators ─────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '40px' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              height: '6px', borderRadius: '3px',
              width: s === step ? '28px' : '8px',
              backgroundColor: s <= step ? '#FFD700' : 'rgba(255,255,255,0.1)',
              transition: 'all 0.35s ease',
            }} />
          ))}
        </div>

        {/* ── Animated Step Wrapper ───────────────────────────────── */}
        <div style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'translateY(-10px)' : 'translateY(0)',
          transition: 'opacity 0.22s ease, transform 0.22s ease',
        }}>

          {/* ═══════════════════════════════════════════════════════
              STEP 1 — The Identity
          ═══════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Header */}
              <div>
                <div style={{ fontSize: '34px', fontWeight: '900', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                  Let's build your
                </div>
                <div style={{ fontSize: '34px', fontWeight: '900', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                  <span style={{ color: '#FFD700' }}>ID</span>.
                </div>
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '8px', fontWeight: '500' }}>
                  Tell us who you are on campus.
                </div>
              </div>

              {/* Live Profile Card Preview */}
              <div style={{
                ...glass,
                border: hasContent ? '1px solid rgba(255,215,0,0.35)' : '1px solid rgba(255,255,255,0.07)',
                boxShadow: hasContent
                  ? '0 0 40px rgba(255,215,0,0.1), 0 8px 32px rgba(0,0,0,0.4)'
                  : '0 8px 32px rgba(0,0,0,0.3)',
                padding: '24px', textAlign: 'center',
                position: 'relative', overflow: 'hidden',
                transition: 'border-color 0.4s, box-shadow 0.4s',
              }}>
                {/* Gold radial glow */}
                <div style={{
                  position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)',
                  width: '200px', height: '100px',
                  background: 'radial-gradient(ellipse, rgba(255,215,0,0.1) 0%, transparent 70%)',
                  opacity: hasContent ? 1 : 0,
                  transition: 'opacity 0.5s', pointerEvents: 'none',
                }} />

                {/* Avatar initial */}
                <div style={{
                  width: '68px', height: '68px', borderRadius: '50%',
                  backgroundColor: '#1A283D',
                  border: hasContent ? '2px solid rgba(255,215,0,0.45)' : '2px solid rgba(255,255,255,0.1)',
                  margin: '0 auto 14px',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  fontSize: '26px', transition: 'border-color 0.4s',
                }}>
                  {name ? name.trim()[0]?.toUpperCase() : '👤'}
                </div>

                <div style={{ fontWeight: '900', fontSize: '18px', minHeight: '22px', marginBottom: '4px' }}>
                  {name.trim() || <span style={{ color: '#2D3F58' }}>Your Name</span>}
                </div>
                <div style={{
                  fontSize: '13px', fontWeight: '700', marginBottom: '4px', minHeight: '18px',
                  color: major.trim() ? '#FFD700' : '#2D3F58', transition: 'color 0.3s',
                }}>
                  {major.trim() || 'Major'}
                </div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#475569', letterSpacing: '1px' }}>
                  CLASS OF {gradYear}
                </div>

                {/* UNIMEET badge */}
                <div style={{
                  position: 'absolute', top: '14px', right: '14px',
                  backgroundColor: '#FFD700', color: '#050B18',
                  fontSize: '7px', fontWeight: '900', letterSpacing: '1px',
                  padding: '3px 6px', borderRadius: '5px',
                  opacity: hasContent ? 1 : 0.15, transition: 'opacity 0.4s',
                }}>UNIMEET</div>
              </div>

              {/* Form Fields */}
              <div style={{ ...glass, padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <span style={labelStyle}>YOUR NAME</span>
                  <input
                    style={inputStyle}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Alex Chen"
                    onFocus={e => (e.target.style.borderColor = 'rgba(255,215,0,0.5)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>
                <div>
                  <span style={labelStyle}>MAJOR</span>
                  <input
                    style={inputStyle}
                    value={major}
                    onChange={e => setMajor(e.target.value)}
                    placeholder="e.g. Computer Science"
                    onFocus={e => (e.target.style.borderColor = 'rgba(255,215,0,0.5)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>
                <div>
                  <span style={labelStyle}>GRADUATION YEAR</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {GRAD_YEARS.map(y => (
                      <div
                        key={y}
                        onClick={() => setGradYear(y)}
                        style={{
                          flex: 1, textAlign: 'center', padding: '10px 4px',
                          borderRadius: '12px', fontSize: '12px', fontWeight: '800', cursor: 'pointer',
                          backgroundColor: gradYear === y ? 'rgba(255,215,0,0.12)' : 'rgba(5,11,24,0.6)',
                          color: gradYear === y ? '#FFD700' : '#475569',
                          border: gradYear === y
                            ? '1px solid rgba(255,215,0,0.4)'
                            : '1px solid rgba(255,255,255,0.06)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {y}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                disabled={!step1Unlocked}
                onClick={goNext}
                style={{
                  width: '100%', padding: '17px', borderRadius: '20px',
                  border: 'none', fontWeight: '800', fontSize: '15px',
                  cursor: step1Unlocked ? 'pointer' : 'not-allowed',
                  backgroundColor: '#FFD700', color: '#050B18',
                  opacity: step1Unlocked ? 1 : 0.35,
                  boxShadow: step1Unlocked ? '0 4px 24px rgba(255,215,0,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 2 — The Interests
          ═══════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Header */}
              <div>
                <div style={{ fontSize: '34px', fontWeight: '900', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                  What are you
                </div>
                <div style={{ fontSize: '34px', fontWeight: '900', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                  <span style={{ color: '#FFD700' }}>into</span>?
                </div>
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '8px', fontWeight: '500' }}>
                  Pick 3+ to unlock your campus vibe.
                </div>
              </div>

              {/* Interest Pills */}
              <div style={{ ...glass, padding: '20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {INTERESTS.map(({ icon, label }) => {
                    const active = interests.includes(label);
                    return (
                      <div
                        key={label}
                        onClick={() => toggleInterest(label)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '7px',
                          padding: '11px 16px', borderRadius: '24px',
                          fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                          backgroundColor: active ? 'rgba(255,215,0,0.12)' : 'rgba(5,11,24,0.55)',
                          color: active ? '#FFD700' : '#64748b',
                          border: active
                            ? '1.5px solid rgba(255,215,0,0.45)'
                            : '1px solid rgba(255,255,255,0.07)',
                          boxShadow: active ? '0 0 16px rgba(255,215,0,0.12)' : 'none',
                          transform: active ? 'scale(1.04)' : 'scale(1)',
                          transition: 'all 0.18s ease',
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>{icon}</span>
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress indicator */}
                <div style={{
                  marginTop: '16px', paddingTop: '14px',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: '11px', fontWeight: '700', color: '#475569',
                }}>
                  <span>{interests.length} selected</span>
                  <span style={{ color: step2Unlocked ? '#FFD700' : '#475569', transition: 'color 0.2s' }}>
                    {step2Unlocked ? '✓ Unlocked' : `${3 - interests.length} more needed`}
                  </span>
                </div>
              </div>

              <button
                disabled={!step2Unlocked}
                onClick={goNext}
                style={{
                  width: '100%', padding: '17px', borderRadius: '20px',
                  border: 'none', fontWeight: '800', fontSize: '15px',
                  cursor: step2Unlocked ? 'pointer' : 'not-allowed',
                  backgroundColor: '#FFD700', color: '#050B18',
                  opacity: step2Unlocked ? 1 : 0.35,
                  boxShadow: step2Unlocked ? '0 4px 24px rgba(255,215,0,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP 3 — The Launch
          ═══════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Header */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '56px', marginBottom: '14px', lineHeight: 1 }}>🚀</div>
                <div style={{ fontSize: '34px', fontWeight: '900', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                  Ready to <span style={{ color: '#FFD700' }}>Meet</span>?
                </div>
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '8px', fontWeight: '500' }}>
                  Your campus social life starts now.
                </div>
              </div>

              {/* Summary Card */}
              <div style={{
                ...glass,
                padding: '24px',
                border: '1px solid rgba(255,215,0,0.2)',
                boxShadow: '0 0 40px rgba(255,215,0,0.08), 0 8px 32px rgba(0,0,0,0.4)',
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', marginBottom: '16px',
                }}>
                  <div>
                    <div style={{ fontWeight: '900', fontSize: '20px' }}>{name}</div>
                    <div style={{ color: '#FFD700', fontWeight: '700', fontSize: '13px', marginTop: '3px' }}>{major}</div>
                    <div style={{ color: '#475569', fontSize: '10px', fontWeight: '800', letterSpacing: '0.8px', marginTop: '3px' }}>
                      CLASS OF {gradYear}
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: '#FFD700', color: '#050B18',
                    fontSize: '8px', fontWeight: '900', padding: '4px 8px',
                    borderRadius: '6px', letterSpacing: '1px', flexShrink: 0,
                  }}>UNIMEET</div>
                </div>

                <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: '14px' }} />

                <div style={{ fontSize: '9px', fontWeight: '900', color: '#475569', letterSpacing: '1.4px', marginBottom: '10px' }}>
                  MY VIBES
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {interests.map(interest => {
                    const found = INTERESTS.find(i => i.label === interest);
                    return (
                      <div key={interest} style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 11px', borderRadius: '20px',
                        fontSize: '11px', fontWeight: '700',
                        backgroundColor: 'rgba(255,215,0,0.1)',
                        color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)',
                      }}>
                        <span>{found?.icon}</span>
                        <span>{interest}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Launch Button */}
              <button
                disabled={saving}
                onClick={handleComplete}
                style={{
                  width: '100%', padding: '20px', borderRadius: '20px',
                  border: 'none', fontWeight: '900', fontSize: '18px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  backgroundColor: '#FFD700', color: '#050B18',
                  boxShadow: '0 6px 32px rgba(255,215,0,0.4), 0 1px 0 rgba(255,255,255,0.2) inset',
                  letterSpacing: '-0.3px',
                  transition: 'transform 0.1s, box-shadow 0.2s',
                }}
              >
                {saving ? 'Launching...' : "Let's Go 🚀"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
