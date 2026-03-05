import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MessagingOverlay from '../components/MessagingOverlay';
import CalendarOverlay from '../components/CalendarOverlay';
import MapView from '../components/MapView';
import DiscoveryTab from './DiscoveryTab';
import MyCircleTab from './MyCircleTab';
import EventsTab from './EventsTab';

const CATEGORIES = [
  { icon: '⚽', label: 'SPORTS' },
  { icon: '🎨', label: 'CULTURE' },
  { icon: '🍴', label: 'FOOD' },
  { icon: '☕', label: 'COFFEE' },
  { icon: '...', label: 'MORE' },
];

// direction: 1 = slide right (map), -1 = slide left (creator)
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};
const slideTransition = { type: 'spring' as const, stiffness: 320, damping: 32 };

const Home = () => {
  const { user, profile, theme } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('Discovery');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [feedMode, setFeedMode] = useState<'global' | 'following'>('global');
  const [focusedPostId, setFocusedPostId] = useState<string | null>(null);
  const [isMsgOpen, setIsMsgOpen] = useState(false);
  const [isCalOpen, setIsCalOpen] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [joinedActivities, setJoinedActivities] = useState<any[]>([]);
  const [liveFriends, setLiveFriends] = useState<any[]>([]);
  const [friendsPlans, setFriendsPlans] = useState<any[]>([]);

  // Tracks slide direction so AnimatePresence knows which way to animate
  const directionRef = useRef(1);
  const switchViewMode = (mode: 'list' | 'map') => {
    directionRef.current = mode === 'map' ? 1 : -1;
    setViewMode(mode);
    if (mode === 'list') setFocusedPostId(null);
  };

  const hour = new Date().getHours();
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : hour < 21 ? 'Evening' : 'Night';
  const greetingEmoji = hour < 12 ? '☀️' : hour < 17 ? '🌤️' : hour < 21 ? '🌆' : '🌙';
  const subtext = hour < 12 ? "What's the move?" : hour < 17 ? 'Any plans brewing?' : hour < 21 ? "What's happening tonight?" : 'Still up? Plan something 👀';

  const displayedPosts = feedMode === 'global' ? posts : friendsPlans;

  const fetchPosts = async () => {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('activities')
      .select('*, profiles:user_id(*)')
      .gte('created_at', fortyEightHoursAgo)
      .order('created_at', { ascending: false });
    console.log('Raw posts from DB:', data, 'Error:', error);
    if (data) setPosts(data);
  };

  const fetchJoinedActivities = async () => {
    if (!user) return;
    const { data } = await supabase.from('activity_participants').select('activities(*, profiles:user_id(*))').eq('user_id', user.id);
    if (data) setJoinedActivities(data.map((item: any) => item.activities));
  };

  const fetchCircleData = async () => {
    if (!user) return;
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted');

    const friendIds: string[] = (friendships || []).map((f: any) =>
      f.user_id === user.id ? f.friend_id : f.user_id
    );

    if (friendIds.length === 0) { setLiveFriends([]); setFriendsPlans([]); return; }

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: live } = await supabase.from('profiles').select('*').in('id', friendIds).gte('last_seen', twoHoursAgo);
    if (live) setLiveFriends(live);

    const { data: plans } = await supabase.from('activities').select('*, profiles:user_id(*)').in('user_id', friendIds).order('created_at', { ascending: false });
    if (plans) setFriendsPlans(plans);
  };

  useEffect(() => {
    fetchPosts();
    fetchJoinedActivities();
    fetchCircleData();
    if (user) supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id);
  }, [user]);

  const handlePost = async (activityData: any) => {
    const { error } = await supabase.from('activities').insert([{ ...activityData, user_id: user?.id }]);
    if (!error) { fetchPosts(); alert("Plan Published!"); }
  };

  const handleJoin = async (activityId: string) => {
    const { error } = await supabase.from('activity_participants').insert([{ activity_id: activityId, user_id: user?.id }]);
    if (!error) { fetchJoinedActivities(); alert("You're in!"); }
    else if (error.code === '23505') alert("Already joined!");
  };

  return (
    <div className="page-fade" style={{ backgroundColor: theme.bg, minHeight: '100vh', width: '100%', display: 'flex', justifyContent: 'center', color: theme.text }}>
      <div style={{ width: '100%', maxWidth: '440px', padding: '0 16px' }}>

        {/* HEADER */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>UniMeet</h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div onClick={() => setIsMsgOpen(true)} style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: theme.inactiveBtnBg, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${theme.navBorder}`, cursor: 'pointer' }}>💬</div>
            <div onClick={() => setIsCalOpen(true)} style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: theme.inactiveBtnBg, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${theme.navBorder}`, cursor: 'pointer' }}>📅</div>
            <div onClick={() => navigate('/profile')} style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#3B82F6', border: '2px solid rgba(243,217,154,0.4)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
              {profile?.avatar_url
                ? <img src={supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>{profile?.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'}</span>
              }
            </div>
          </div>
        </header>

        {/* NAVIGATION */}
        <nav style={{ display: 'flex', gap: '24px', borderBottom: `1px solid ${theme.navBorder}`, marginBottom: '12px' }}>
          {['Discovery', 'My Circle', 'Events'].map(tab => (
            <div key={tab} onClick={() => setActiveTab(tab)} style={{ paddingBottom: '10px', cursor: 'pointer', color: activeTab === tab ? theme.text : theme.subText, fontWeight: '700', fontSize: '14px', position: 'relative' }}>
              {tab}
              {activeTab === tab && <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '2px', backgroundColor: theme.navActive }} />}
            </div>
          ))}
        </nav>

        {/* TAB CONTENT */}
        {activeTab === 'Discovery' && (
          <div>
            {/* Greeting + View Switcher */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
                  {greeting}, {firstName}! {greetingEmoji}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '5px', fontWeight: '500' }}>
                  {subtext}
                </div>
              </div>

              <div style={{
                display: 'flex', flexShrink: 0,
                backgroundColor: theme.cardBg,
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                borderRadius: '12px', padding: '3px',
                border: `1px solid ${theme.cardBorder}`,
                boxShadow: theme.cardShadow,
                marginTop: '3px',
              }}>
                <div onClick={() => switchViewMode('list')} style={{ padding: '5px 10px', borderRadius: '9px', fontSize: '14px', cursor: 'pointer', backgroundColor: viewMode !== 'map' ? 'rgba(255,215,0,0.12)' : 'transparent', opacity: viewMode !== 'map' ? 1 : 0.4, transition: 'all 0.2s' }}>🏠</div>
                <div onClick={() => switchViewMode('map')}  style={{ padding: '5px 10px', borderRadius: '9px', fontSize: '14px', cursor: 'pointer', backgroundColor: viewMode === 'map'  ? 'rgba(255,215,0,0.12)' : 'transparent', opacity: viewMode === 'map'  ? 1 : 0.4, transition: 'all 0.2s' }}>🗺️</div>
              </div>
            </div>

            {/* Animated panels */}
            <div style={{ overflow: 'hidden' }}>
              <AnimatePresence mode="wait" custom={directionRef.current} initial={false}>

                {viewMode === 'list' ? (
                  /* ── CREATOR VIEW ── */
                  <motion.div
                    key="creator"
                    custom={directionRef.current}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={slideTransition}
                    style={{ paddingBottom: '32px' }}
                  >
                    <DiscoveryTab categories={CATEGORIES} handlePost={handlePost} />
                  </motion.div>
                ) : (
                  /* ── MAP + FEED VIEW ── */
                  <motion.div
                    key="feed"
                    custom={directionRef.current}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={slideTransition}
                    style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 175px)' }}
                  >
                    {/* ① Feed toggle — pinned at top */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '1.5px', color: '#475569' }}>FEED</span>
                      <div style={{
                        display: 'flex',
                        backgroundColor: theme.cardBg,
                        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                        borderRadius: '12px', padding: '3px',
                        border: `1px solid ${theme.cardBorder}`,
                        boxShadow: theme.cardShadow,
                      }}>
                        {(['global', 'following'] as const).map(mode => (
                          <div
                            key={mode}
                            onClick={() => setFeedMode(mode)}
                            style={{
                              padding: '5px 14px', borderRadius: '9px', fontSize: '12px', fontWeight: '700',
                              cursor: 'pointer', transition: 'all 0.2s',
                              backgroundColor: feedMode === mode ? 'rgba(255,215,0,0.12)' : 'transparent',
                              color: feedMode === mode ? theme.navActive : theme.subText,
                            }}
                          >
                            {mode === 'global' ? '🌐 Global' : '👥 Following'}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ② Feed — scrollable, flex: 1, with bottom fade overlay */}
                    <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: '8px' }}>
                        {displayedPosts.length === 0 && feedMode === 'following' ? (
                          <div style={{ textAlign: 'center', padding: '48px 0' }}>
                            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
                            <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '6px', color: theme.text }}>No friends' plans yet</div>
                            <div style={{ color: '#475569', fontSize: '13px' }}>Add friends in My Circle to see their plans here.</div>
                          </div>
                        ) : displayedPosts.map((post) => {
                          const isFocused = focusedPostId === post.id;
                          return (
                            <div
                              key={post.id}
                              onClick={() => setFocusedPostId(post.id)}
                              style={{
                                backgroundColor: theme.cardBg, borderRadius: '24px', padding: '20px', marginBottom: '12px',
                                border: `1px solid ${isFocused ? 'rgba(255,215,0,0.45)' : theme.cardBorder}`,
                                boxShadow: isFocused ? '0 0 0 2px rgba(255,215,0,0.12)' : theme.cardShadow,
                                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                                cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#3B82F6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', color: '#fff' }}>{post.profiles?.full_name?.[0]}</div>
                                  <span style={{ fontWeight: '800', fontSize: '14px', color: theme.text }}>{post.profiles?.full_name}</span>
                                </div>
                                <div style={{ backgroundColor: 'rgba(243, 217, 154, 0.1)', padding: '4px 10px', borderRadius: '8px', color: theme.navActive, fontSize: '10px', fontWeight: '800' }}>{post.category}</div>
                              </div>
                              <p style={{ fontSize: '14px', color: theme.text, marginBottom: '12px', lineHeight: '1.5', opacity: 0.9 }}>{post.description}</p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '12px', color: theme.subText }}>🕒 {post.when_time} • 📍 {post.where_location}</div>
                                <button
                                  onClick={e => { e.stopPropagation(); handleJoin(post.id); }}
                                  style={{ backgroundColor: '#FFD700', color: '#050B18', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,215,0,0.25)' }}
                                >Join Plan</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Bottom fade — fades feed into the map below */}
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: '48px',
                        background: `linear-gradient(to bottom, transparent, ${theme.bg})`,
                        pointerEvents: 'none',
                      }} />
                    </div>

                    {/* ③ Hairline glass divider */}
                    <div style={{
                      height: '1px', flexShrink: 0, margin: '8px 0',
                      background: `linear-gradient(to right, transparent, ${theme.cardBorder}, transparent)`,
                    }} />

                    {/* ④ Map — pinned at bottom */}
                    <div style={{ height: '32vh', borderRadius: '24px', overflow: 'hidden', flexShrink: 0 }}>
                      <MapView
                        posts={displayedPosts}
                        theme={theme}
                        onJoin={handleJoin}
                        onCreateEvent={() => switchViewMode('list')}
                        focusedPostId={focusedPostId}
                      />
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        )}

        {activeTab === 'My Circle' && <MyCircleTab joinedActivities={joinedActivities} liveFriends={liveFriends} friendsPlans={friendsPlans} />}
        {activeTab === 'Events' && <EventsTab />}

        <MessagingOverlay isOpen={isMsgOpen} onClose={() => setIsMsgOpen(false)} theme={theme} />
        <CalendarOverlay isOpen={isCalOpen} onClose={() => setIsCalOpen(false)} theme={theme} />
      </div>
    </div>
  );
};

export default Home;
