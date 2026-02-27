import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MessagingOverlay from '../components/MessagingOverlay';
import CalendarOverlay from '../components/CalendarOverlay';
import MapView from '../components/MapView';
import DiscoveryTab from './DiscoveryTab';
import MyCircleTab from './MyCircleTab';
import EventsTab from './EventsTab';

const Home = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('Discovery');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isMsgOpen, setIsMsgOpen] = useState(false);
  const [isCalOpen, setIsCalOpen] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [joinedActivities, setJoinedActivities] = useState<any[]>([]);
  const [liveFriends, setLiveFriends] = useState<any[]>([]);
  const [friendsPlans, setFriendsPlans] = useState<any[]>([]);

  const theme = {
    bg: '#051124', card: '#121E31', text: '#FFFFFF', subText: '#64748b',
    border: 'rgba(255,255,255,0.05)', navActive: '#F3D99A'
  };

  const fetchPosts = async () => {
    const { data } = await supabase.from('activities').select('*, profiles:user_id(*)').order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  const fetchJoinedActivities = async () => {
    if (!user) return;
    const { data } = await supabase.from('activity_participants').select('activities(*, profiles:user_id(*))').eq('user_id', user.id);
    if (data) setJoinedActivities(data.map((item: any) => item.activities));
  };

  const fetchCircleData = async () => {
    if (!user) return;

    // Resolve accepted friend IDs (bidirectional)
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted');

    const friendIds: string[] = (friendships || []).map((f: any) =>
      f.user_id === user.id ? f.friend_id : f.user_id
    );

    if (friendIds.length === 0) {
      setLiveFriends([]);
      setFriendsPlans([]);
      return;
    }

    // Live: friends seen in the last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: live } = await supabase
      .from('profiles')
      .select('*')
      .in('id', friendIds)
      .gte('last_seen', twoHoursAgo);
    if (live) setLiveFriends(live);

    // Friends' plans: activities created by friends
    const { data: plans } = await supabase
      .from('activities')
      .select('*, profiles:user_id(*)')
      .in('user_id', friendIds)
      .order('created_at', { ascending: false });
    if (plans) setFriendsPlans(plans);
  };

  useEffect(() => {
    fetchPosts();
    fetchJoinedActivities();
    fetchCircleData();
    // Update own last_seen so friends can see us as live
    if (user) {
      supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id);
    }
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
    <div style={{ backgroundColor: theme.bg, minHeight: '100vh', width: '100%', display: 'flex', justifyContent: 'center', color: theme.text }}>
      <div style={{ width: '100%', maxWidth: '440px', padding: '0 16px' }}>
        
        {/* HEADER */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>UniMeet</h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div onClick={() => setIsMsgOpen(true)} style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${theme.border}`, cursor: 'pointer' }}>💬</div>
            <div onClick={() => setIsCalOpen(true)} style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${theme.border}`, cursor: 'pointer' }}>📅</div>
            <div onClick={() => navigate('/profile')} style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#3B82F6', border: '2px solid white', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
              {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        {/* NAVIGATION */}
        <nav style={{ display: 'flex', gap: '24px', borderBottom: `1px solid ${theme.border}`, marginBottom: '12px' }}>
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
            {/* List / Map toggle — flush right */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
              <div style={{ display: 'flex', backgroundColor: theme.card, borderRadius: '8px', padding: '2px', border: `1px solid ${theme.border}` }}>
                <div onClick={() => setViewMode('list')} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', backgroundColor: viewMode !== 'map' ? 'rgba(243,217,154,0.1)' : 'transparent', opacity: viewMode !== 'map' ? 1 : 0.4, transition: 'all 0.2s' }}>🏠</div>
                <div onClick={() => setViewMode('map')}  style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', backgroundColor: viewMode === 'map' ? 'rgba(243,217,154,0.1)' : 'transparent', opacity: viewMode === 'map' ? 1 : 0.4, transition: 'all 0.2s' }}>🗺️</div>
              </div>
            </div>

            {/* LIST: Create Plan form + Activity Feed */}
            {viewMode === 'list' && (
              <div className="page-fade">
                <DiscoveryTab
                  theme={theme}
                  categories={[
                    { icon: '⚽', label: 'SPORTS' },
                    { icon: '🎨', label: 'CULTURE' },
                    { icon: '🍴', label: 'FOOD' },
                    { icon: '☕', label: 'COFFEE' },
                    { icon: '...', label: 'MORE' }
                  ]}
                  handlePost={handlePost}
                />
                <div style={{ marginTop: '24px' }}>
                  {posts.map((post) => (
                    <div key={post.id} style={{ backgroundColor: theme.card, borderRadius: '24px', padding: '20px', marginBottom: '16px', border: `1px solid ${theme.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#3B82F6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>{post.profiles?.full_name?.[0]}</div>
                          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{post.profiles?.full_name}</span>
                        </div>
                        <div style={{ backgroundColor: 'rgba(243, 217, 154, 0.1)', padding: '4px 10px', borderRadius: '8px', color: theme.navActive, fontSize: '10px', fontWeight: '800' }}>{post.category}</div>
                      </div>
                      <p style={{ fontSize: '14px', color: '#E2E8F0', marginBottom: '16px', lineHeight: '1.5' }}>{post.description}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', color: theme.subText }}>🕒 {post.when_time} • 📍 {post.where_location}</div>
                        <button onClick={() => handleJoin(post.id)} style={{ backgroundColor: theme.navActive, color: '#051124', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}>Join Plan</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MAP: full-screen map replacing the deck */}
            {viewMode === 'map' && (
              <div className="page-fade">
                <MapView posts={posts} theme={theme} onJoin={handleJoin} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'My Circle' && <MyCircleTab theme={theme} joinedActivities={joinedActivities} liveFriends={liveFriends} friendsPlans={friendsPlans} />}
        {activeTab === 'Events' && <EventsTab />}

        <MessagingOverlay isOpen={isMsgOpen} onClose={() => setIsMsgOpen(false)} theme={theme} />
        <CalendarOverlay isOpen={isCalOpen} onClose={() => setIsCalOpen(false)} theme={theme} />
      </div>
    </div>
  );
};

export default Home;