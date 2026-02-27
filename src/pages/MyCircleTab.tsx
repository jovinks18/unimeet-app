import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// --- MOCK FALLBACK DATA (shown when no real friends exist yet) ---
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

// --- HELPERS ---
const AVATAR_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
const colorFromId = (id: string) => AVATAR_COLORS[(id?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
const minsAgo = (lastSeen: string) => Math.max(0, Math.floor((Date.now() - new Date(lastSeen).getTime()) / 60000));

const MyCircleTab = ({ theme, joinedActivities, liveFriends, friendsPlans }: any) => {
  const { user, profile } = useAuth();
  const [freeToHang, setFreeToHang] = useState(profile?.current_status === 'free');

  const handleToggle = async () => {
    const next = !freeToHang;
    setFreeToHang(next);
    await supabase
      .from('profiles')
      .update({ current_status: next ? 'free' : null, last_seen: new Date().toISOString() })
      .eq('id', user?.id);
  };

  // Use real data if available, otherwise show mock
  const liveList: any[] = liveFriends?.length > 0 ? liveFriends : MOCK_LIVE;
  const plansList: any[] = friendsPlans?.length > 0 ? friendsPlans : MOCK_PLANS;
  const usingMock = !liveFriends?.length && !friendsPlans?.length;

  const sectionLabel = (text: string) => (
    <span style={{ fontSize: '10px', fontWeight: '900', color: theme.subText, letterSpacing: '1.2px' }}>{text}</span>
  );

  return (
    <div className="page-fade" style={{ width: '100%', paddingBottom: '32px' }}>

      {/* STATUS TOGGLE */}
      <div style={{
        backgroundColor: theme.card, borderRadius: '24px', padding: '18px 20px',
        border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '14px', backgroundColor: freeToHang ? 'rgba(243,217,154,0.15)' : 'rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', transition: '0.25s' }}>
            ⚡
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '14px' }}>Free to hang out?</div>
            <div style={{ fontSize: '11px', color: theme.subText, marginTop: '2px' }}>
              {freeToHang ? 'Visible to your friends' : "Let friends know you're available"}
            </div>
          </div>
        </div>
        <div
          onClick={handleToggle}
          style={{ width: '48px', height: '26px', borderRadius: '13px', cursor: 'pointer', backgroundColor: freeToHang ? '#F3D99A' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background-color 0.25s ease', flexShrink: 0 }}
        >
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '3px', left: freeToHang ? '25px' : '3px', transition: 'left 0.25s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
        </div>
      </div>

      {/* LIVE SECTION */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          {sectionLabel('⚡ LIVE')}
          <button style={{ backgroundColor: 'rgba(243,217,154,0.1)', border: '1px solid rgba(243,217,154,0.2)', color: '#F3D99A', borderRadius: '10px', padding: '5px 12px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>
            + Share
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none' } as any}>
          {liveList.map((friend: any) => {
            // Normalise real Supabase profile shape vs mock shape
            const isReal = !!friend.full_name;
            const name = isReal ? friend.full_name : friend.name;
            const initial = name?.[0] ?? '?';
            const color = isReal ? colorFromId(friend.id) : friend.color;
            const activityIcon = friend.current_activity ?? friend.activity ?? '👋';
            const activityTitle = friend.current_activity_title ?? friend.title ?? 'Hanging out';
            const location = friend.current_location ?? friend.location ?? '—';
            const ago = isReal && friend.last_seen ? `${minsAgo(friend.last_seen)}m` : `${friend.minsAgo}m`;
            return (
              <div key={friend.id} style={{ backgroundColor: theme.card, borderRadius: '20px', padding: '16px', border: `1px solid ${theme.border}`, minWidth: '130px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: color, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '800', fontSize: '13px', flexShrink: 0 }}>{initial}</div>
                  <span style={{ fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                </div>
                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{activityIcon}</div>
                <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activityTitle}</div>
                <div style={{ fontSize: '11px', color: theme.subText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📍 {location}</div>
                <div style={{ fontSize: '10px', color: '#F3D99A', marginTop: '8px', fontWeight: '700' }}>{ago} ago</div>
              </div>
            );
          })}
        </div>
        {usingMock && (
          <div style={{ fontSize: '10px', color: theme.subText, marginTop: '8px', opacity: 0.6 }}>Add friends to see their live status here</div>
        )}
      </div>

      {/* SQUADS SECTION */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ marginBottom: '14px' }}>{sectionLabel('SQUADS')}</div>
        <div style={{ border: '1.5px dashed rgba(255,255,255,0.12)', borderRadius: '20px', padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', color: theme.subText, fontSize: '13px', fontWeight: '700' }}>
          <span style={{ fontSize: '18px' }}>+</span> New Squad
        </div>
      </div>

      {/* MY FRIENDS SECTION */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          {sectionLabel('MY FRIENDS')}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button style={{ background: 'none', border: 'none', color: theme.subText, fontSize: '16px', cursor: 'pointer', padding: 0 }}>🔍</button>
            <button style={{ backgroundColor: 'rgba(243,217,154,0.1)', border: '1px solid rgba(243,217,154,0.2)', color: '#F3D99A', borderRadius: '10px', padding: '5px 12px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>+ Add</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', flexShrink: 0, border: '1.5px dashed rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: theme.subText, fontSize: '22px' }}>+</div>
        </div>
      </div>

      {/* FRIENDS' PLANS SECTION */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ marginBottom: '14px' }}>{sectionLabel("FRIENDS' PLANS")}</div>

        {/* Real joined activities */}
        {joinedActivities?.map((post: any) => (
          <div key={post.id} style={{ backgroundColor: theme.card, borderRadius: '20px', padding: '16px 18px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: colorFromId(post.user_id ?? ''), display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '800', fontSize: '15px', flexShrink: 0 }}>
              {post.profiles?.full_name?.[0] ?? 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.profiles?.full_name}'s Plan</div>
              <div style={{ fontSize: '12px', color: theme.subText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.description} • {post.when_time}</div>
            </div>
            <div style={{ backgroundColor: 'rgba(243,217,154,0.12)', color: '#F3D99A', fontSize: '11px', fontWeight: '800', padding: '6px 14px', borderRadius: '12px', border: '1px solid rgba(243,217,154,0.2)', flexShrink: 0 }}>JOINED</div>
          </div>
        ))}

        {/* Real friends' plans from Supabase (or mock fallback) */}
        {plansList.map((plan: any) => {
          const isReal = !!plan.profiles;
          const name = isReal ? plan.profiles?.full_name : plan.name;
          const initial = name?.[0] ?? '?';
          const color = isReal ? colorFromId(plan.user_id ?? '') : plan.color;
          const title = isReal ? `${name}'s Plan` : plan.title;
          const detail = isReal ? `${plan.description} • ${plan.when_time}` : plan.detail;
          return (
            <div key={plan.id} style={{ backgroundColor: theme.card, borderRadius: '20px', padding: '16px 18px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: color, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '800', fontSize: '15px', flexShrink: 0 }}>{initial}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '3px' }}>{title}</div>
                <div style={{ fontSize: '12px', color: theme.subText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{detail}</div>
              </div>
              <button style={{ backgroundColor: '#F3D99A', color: '#051124', border: 'none', fontSize: '12px', fontWeight: '800', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', flexShrink: 0 }}>Join</button>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default MyCircleTab;
