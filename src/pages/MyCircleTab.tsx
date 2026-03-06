import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ── Mock fallback (shown when no real friends exist yet) ──────────────
const MOCK_LIVE = [
  { id: 'm1', name: 'Alex', initial: 'A', color: '#3B82F6', activity: '☕', title: 'Coffee run', location: 'Campus Café', minsAgo: 12 },
  { id: 'm2', name: 'Sarah', initial: 'S', color: '#8B5CF6', activity: '🏋️', title: 'Gym sesh', location: 'RSF', minsAgo: 34 },
  { id: 'm3', name: 'Jordan', initial: 'J', color: '#10B981', activity: '📚', title: 'Study grind', location: 'Doe Library', minsAgo: 59 },
];

const MOCK_PLANS = [
  { id: 'mp1', name: 'Sarah', initial: 'S', color: '#8B5CF6', title: "Sarah's Plan", detail: 'Tennis @ RSF • Today, 4 PM' },
  { id: 'mp2', name: 'Alex', initial: 'A', color: '#3B82F6', title: "Alex's Plan", detail: 'Coffee catch-up • Tomorrow, 10 AM' },
  { id: 'mp3', name: 'Jordan', initial: 'J', color: '#10B981', title: "Jordan's Plan", detail: 'Study group • Wed, 2 PM' },
];

// ── Helpers ───────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
const colorFromId = (id: string) => AVATAR_COLORS[(id?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
const minsAgo = (lastSeen: string) => Math.max(0, Math.floor((Date.now() - new Date(lastSeen).getTime()) / 60000));

const emojiGlow = (icon: string) => {
  if (/☕|🍵|🧋/.test(icon)) return 'rgba(161, 100, 40, 0.5)';
  if (/🏋|⚽|🏃|🎾|🏊/.test(icon)) return 'rgba(255, 110, 50, 0.45)';
  if (/📚|💻|✏️/.test(icon)) return 'rgba(59, 130, 246, 0.45)';
  if (/🎮|🕹/.test(icon)) return 'rgba(139, 92, 246, 0.45)';
  if (/🎵|🎸|🎧/.test(icon)) return 'rgba(236, 72, 153, 0.45)';
  return 'rgba(255, 215, 0, 0.3)';
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: '900', color: '#475569',
  letterSpacing: '0.05em', textTransform: 'uppercase',
};

const SQUAD_COLORS = ['#3B82F6', '#8B5CF6', '#10B981'];
const SquadCluster = () => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    {SQUAD_COLORS.map((c, i) => (
      <div key={i} style={{
        width: '22px', height: '22px', borderRadius: '50%',
        backgroundColor: c, border: '2px solid rgba(15,23,42,0.9)',
        marginLeft: i === 0 ? 0 : '-7px', zIndex: 3 - i,
        position: 'relative', flexShrink: 0,
      }} />
    ))}
  </div>
);

const avatarPublicUrl = (avatarPath: string | null) =>
  avatarPath ? supabase.storage.from('avatars').getPublicUrl(avatarPath).data.publicUrl : null;

// ── Component ─────────────────────────────────────────────────────────
const MyCircleTab = ({ joinedActivities, liveFriends, friendsPlans }: any) => {
  const { user, theme } = useAuth();

  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [peekedProfile, setPeekedProfile] = useState<any | null>(null);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  const glass: React.CSSProperties = {
    backgroundColor: theme.cardBg,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '24px',
    border: `1px solid ${theme.cardBorder}`,
    boxShadow: theme.cardShadow,
  };

  // Fetch 10 most recently onboarded users (excluding self)
  useEffect(() => {
    if (!user?.id) return;
    const fetchArrivals = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, major, grad_year, interests')
        .eq('has_onboarded', true)
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      console.log('REAL USERS FOUND:', data?.length, data, 'Error:', error);
      if (data) setNewArrivals(data);
    };
    fetchArrivals();
  }, [user?.id]);

  const handleAddToCircle = async (targetId: string) => {
    const { error } = await supabase
      .from('friendships')
      .insert([{ user_id: user?.id, friend_id: targetId, status: 'pending' }]);
    // 23505 = unique violation (already requested) — treat as success
    if (!error || error.code === '23505') {
      setRequestedIds(prev => new Set(prev).add(targetId));
    }
    setPeekedProfile(null);
  };

  const liveList: any[] = liveFriends?.length > 0 ? liveFriends : MOCK_LIVE;
  const plansList: any[] = friendsPlans?.length > 0 ? friendsPlans : MOCK_PLANS;
  const usingMock = !liveFriends?.length && !friendsPlans?.length;

  return (
    <div className="page-fade" style={{ width: '100%', paddingBottom: '40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── NEW ARRIVALS ──────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={labelStyle}>New Arrivals ✨</span>
        </div>

        {newArrivals.length === 0 ? (
          <div style={{ ...glass, padding: '20px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
            No new members yet — check back soon.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
            {newArrivals.map(p => {
              const imgUrl = avatarPublicUrl(p.avatar_url);
              const initial = p.full_name?.[0]?.toUpperCase() ?? 'N';
              const color = colorFromId(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => setPeekedProfile(p)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0, cursor: 'pointer', width: '60px' }}
                >
                  {/* Avatar with golden ring */}
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    padding: '2.5px',
                    background: 'linear-gradient(135deg, #FFD700 0%, rgba(255,215,0,0.3) 100%)',
                    boxShadow: '0 0 12px rgba(255,215,0,0.25)',
                  }}>
                    <div style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      backgroundColor: color,
                      border: `2px solid ${theme.bg}`,
                      overflow: 'hidden',
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                    }}>
                      {imgUrl
                        ? <img src={imgUrl} alt={p.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '18px', fontWeight: '900', color: '#fff' }}>{initial}</span>
                      }
                    </div>
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: '700', color: theme.text,
                    maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textAlign: 'center',
                  }}>{p.full_name?.split(' ')[0] ?? 'New User'}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── LIVE BENTO GRID ───────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={labelStyle}>⚡ Live Now</span>
          <button style={{
            backgroundColor: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
            color: '#FFD700', borderRadius: '10px', padding: '5px 12px',
            fontSize: '11px', fontWeight: '800', cursor: 'pointer',
          }}>+ Share</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {liveList.map((friend: any, idx: number) => {
            const isReal = !!friend.full_name;
            const name = isReal ? friend.full_name : friend.name;
            const initial = name?.[0]?.toUpperCase() ?? '?';
            const color = isReal ? colorFromId(friend.id) : friend.color;
            const actIcon = friend.current_activity ?? friend.activity ?? '👋';
            const actTitle = friend.current_activity_title ?? friend.title ?? 'Hanging out';
            const location = friend.current_location ?? friend.location ?? '—';
            const ago = isReal && friend.last_seen ? `${minsAgo(friend.last_seen)}m` : `${friend.minsAgo}m`;
            const isWide = idx === 0;

            return (
              <div key={friend.id} style={{
                ...glass, padding: '18px',
                gridColumn: isWide ? 'span 2' : undefined,
                display: isWide ? 'flex' : 'block',
                alignItems: isWide ? 'center' : undefined,
                gap: isWide ? '18px' : undefined,
              }}>
                {isWide ? (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: color, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '900', fontSize: '14px', flexShrink: 0 }}>{initial}</div>
                        <div>
                          <div style={{ fontWeight: '900', fontSize: '14px' }}>{name}</div>
                          <div style={{ fontSize: '10px', color: '#FFD700', fontWeight: '700', marginTop: '1px' }}>{ago} ago</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '3px' }}>{actTitle}</div>
                      <div style={{ fontSize: '11px', color: '#475569' }}>📍 {location}</div>
                    </div>
                    <div style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ position: 'absolute', width: '60px', height: '60px', borderRadius: '50%', background: `radial-gradient(circle, ${emojiGlow(actIcon)} 0%, transparent 70%)` }} />
                      <span style={{ fontSize: '38px', position: 'relative', lineHeight: 1 }}>{actIcon}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: color, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '900', fontSize: '11px', flexShrink: 0 }}>{initial}</div>
                      <span style={{ fontWeight: '800', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    </div>
                    <div style={{ position: 'relative', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ position: 'absolute', width: '50px', height: '50px', borderRadius: '50%', background: `radial-gradient(circle, ${emojiGlow(actIcon)} 0%, transparent 70%)` }} />
                      <span style={{ fontSize: '30px', position: 'relative', lineHeight: 1 }}>{actIcon}</span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{actTitle}</div>
                    <div style={{ fontSize: '10px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {location}</div>
                    <div style={{ fontSize: '10px', color: '#FFD700', fontWeight: '700', marginTop: '8px' }}>{ago} ago</div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {usingMock && (
          <div style={{ fontSize: '10px', color: '#475569', marginTop: '10px', opacity: 0.6 }}>
            Add friends to see their live status here
          </div>
        )}
      </div>

      {/* ── SQUADS — Glass Folder ─────────────────────────────────── */}
      <div>
        <div style={{ marginBottom: '14px' }}><span style={labelStyle}>Squads</span></div>
        <div style={{ ...glass, padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: '20px', width: '50px', height: '3px', borderRadius: '0 0 4px 4px', backgroundColor: 'rgba(255,215,0,0.35)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '5px' }}>My Squads</div>
              <div style={{ fontSize: '11px', color: '#475569' }}>Group up with your people</div>
            </div>
            <SquadCluster />
          </div>
          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '16px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#475569', fontSize: '13px', fontWeight: '700' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#FFD700', fontSize: '18px' }}>+</div>
            <span>Create New Squad</span>
          </div>
        </div>
      </div>

      {/* ── FRIENDS' PLANS ────────────────────────────────────────── */}
      <div>
        <div style={{ marginBottom: '14px' }}><span style={labelStyle}>Friends' Plans</span></div>

        {joinedActivities?.map((post: any) => (
          <div key={post.id} style={{ ...glass, border: '1px solid rgba(255,215,0,0.18)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: colorFromId(post.user_id ?? ''), display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '900', fontSize: '16px', flexShrink: 0 }}>
              {post.profiles?.full_name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.profiles?.full_name}'s Plan</div>
              <div style={{ fontSize: '12px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.description} • {post.when_time}</div>
            </div>
            <div style={{ backgroundColor: 'rgba(255,215,0,0.1)', color: '#FFD700', fontSize: '10px', fontWeight: '900', padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(255,215,0,0.25)', flexShrink: 0, letterSpacing: '0.5px' }}>JOINED</div>
          </div>
        ))}

        {plansList.map((plan: any) => {
          const isReal = !!plan.profiles;
          const name = isReal ? plan.profiles?.full_name : plan.name;
          const initial = name?.[0]?.toUpperCase() ?? '?';
          const color = isReal ? colorFromId(plan.user_id ?? '') : plan.color;
          const title = isReal ? `${name}'s Plan` : plan.title;
          const detail = isReal ? `${plan.description} • ${plan.when_time}` : plan.detail;

          return (
            <div key={plan.id} style={{ ...glass, border: '1px solid rgba(255,215,0,0.15)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: color, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '900', fontSize: '16px', flexShrink: 0 }}>{initial}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '3px' }}>{title}</div>
                <div style={{ fontSize: '12px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detail}</div>
              </div>
              <button style={{ backgroundColor: '#FFD700', color: '#050B18', border: 'none', padding: '10px 18px', borderRadius: '14px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 16px rgba(255,215,0,0.3)' }}>Join →</button>
            </div>
          );
        })}
      </div>

      {/* ── PEEK MODAL ────────────────────────────────────────────── */}
      <AnimatePresence>
        {peekedProfile && (() => {
          const p = peekedProfile;
          const imgUrl = avatarPublicUrl(p.avatar_url);
          const initial = p.full_name?.[0]?.toUpperCase() ?? '?';
          const color = colorFromId(p.id);
          const vibes: string[] = Array.isArray(p.interests) ? p.interests.slice(0, 3) : [];
          const alreadyRequested = requestedIds.has(p.id);

          return (
            <>
              {/* Backdrop */}
              <motion.div
                key="peek-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPeekedProfile(null)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(5,11,24,0.72)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 50 }}
              />

              {/* Card */}
              <motion.div
                key="peek-card"
                initial={{ y: 48, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 48, opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                style={{
                  position: 'fixed',
                  left: '50%', top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 'min(340px, calc(100vw - 32px))',
                  zIndex: 51,
                  ...glass,
                  padding: '28px 24px',
                }}
              >
                {/* Avatar */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    padding: '3px',
                    background: 'linear-gradient(135deg, #FFD700 0%, rgba(255,215,0,0.3) 100%)',
                    boxShadow: '0 0 20px rgba(255,215,0,0.3)',
                    marginBottom: '12px',
                  }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: color, border: `2px solid ${theme.bg}`, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {imgUrl
                        ? <img src={imgUrl} alt={p.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '26px', fontWeight: '900', color: '#fff' }}>{initial}</span>
                      }
                    </div>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: theme.text, marginBottom: '4px' }}>{p.full_name}</div>
                </div>

                {/* Student ID badges */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '16px' }}>
                  {p.major && (
                    <div style={{ backgroundColor: theme.inactiveBtnBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '10px', padding: '5px 12px', fontSize: '11px', fontWeight: '700', color: theme.text }}>
                      📚 {p.major}
                    </div>
                  )}
                  {p.grad_year && (
                    <div style={{ backgroundColor: theme.inactiveBtnBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '10px', padding: '5px 12px', fontSize: '11px', fontWeight: '700', color: theme.text }}>
                      🎓 Class of {p.grad_year}
                    </div>
                  )}
                </div>

                {/* Vibes */}
                {vibes.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ ...labelStyle, marginBottom: '8px', textAlign: 'center' }}>Vibes</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {vibes.map(v => (
                        <div key={v} style={{ backgroundColor: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '10px', padding: '5px 12px', fontSize: '12px', fontWeight: '700', color: '#FFD700' }}>{v}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div style={{ height: '1px', background: `linear-gradient(to right, transparent, ${theme.cardBorder}, transparent)`, marginBottom: '20px' }} />

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setPeekedProfile(null)}
                    style={{ flex: 1, backgroundColor: theme.inactiveBtnBg, border: `1px solid ${theme.cardBorder}`, color: theme.subText, padding: '12px', borderRadius: '14px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => !alreadyRequested && handleAddToCircle(p.id)}
                    disabled={alreadyRequested}
                    style={{
                      flex: 2,
                      backgroundColor: alreadyRequested ? 'rgba(255,215,0,0.1)' : '#FFD700',
                      color: alreadyRequested ? '#FFD700' : '#050B18',
                      border: alreadyRequested ? '1px solid rgba(255,215,0,0.3)' : 'none',
                      padding: '12px', borderRadius: '14px',
                      fontWeight: '800', fontSize: '13px',
                      cursor: alreadyRequested ? 'default' : 'pointer',
                      boxShadow: alreadyRequested ? 'none' : '0 4px 16px rgba(255,215,0,0.3)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {alreadyRequested ? '✓ Requested' : '+ Add to Circle'}
                  </button>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

    </div>
  );
};

export default MyCircleTab;
