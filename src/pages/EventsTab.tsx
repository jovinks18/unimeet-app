import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const CATEGORY_COLORS: Record<string, string> = {
  SPORTS:  '#34D399',
  CULTURE: '#A78BFA',
  FOOD:    '#FB923C',
  COFFEE:  '#F3D99A',
  MORE:    '#60A5FA',
};

const parseDateBadge = (whenTime: string): { day: string; month: string } => {
  if (!whenTime) return { day: '—', month: '—' };
  const parts = whenTime.split(' ');
  const month = (parts[0] ?? '').toUpperCase();
  const day = (parts[1] ?? '').replace(',', '').padStart(2, '0');
  return { day, month };
};

// Small circular avatar — image if available, initials otherwise
const AvatarBubble = ({ participant, size = 26 }: { participant: any; size?: number }) => {
  const avatarUrl = participant.profiles?.avatar_url
    ? supabase.storage.from('avatars').getPublicUrl(participant.profiles.avatar_url).data.publicUrl
    : null;
  const initial = participant.profiles?.full_name?.[0]?.toUpperCase() ?? '?';

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: '2px solid #121E31', overflow: 'hidden', flexShrink: 0,
      backgroundColor: '#1A283D',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.4), fontWeight: '700', color: '#F3D99A',
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt={initial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initial
      }
    </div>
  );
};

const EventsTab = () => {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null); // id of the activity currently being acted on

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          profiles:user_id(full_name, avatar_url),
          activity_participants(user_id, profiles:user_id(full_name, avatar_url))
        `)
        .order('created_at', { ascending: false });

      if (error) console.error('EventsTab fetch error:', error);
      setEvents(data ?? []);
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const handleJoin = async (eventId: string) => {
    if (!user || joining) return;
    setJoining(eventId);

    // Optimistic: show the user's avatar immediately
    setEvents(prev => prev.map(e => e.id !== eventId ? e : {
      ...e,
      activity_participants: [
        ...(e.activity_participants ?? []),
        { user_id: user.id, profiles: { full_name: profile?.full_name ?? null, avatar_url: profile?.avatar_url ?? null } },
      ],
    }));

    const { error } = await supabase
      .from('activity_participants')
      .insert({ activity_id: eventId, user_id: user.id });

    if (error) {
      // Revert on failure
      setEvents(prev => prev.map(e => e.id !== eventId ? e : {
        ...e,
        activity_participants: (e.activity_participants ?? []).filter((p: any) => p.user_id !== user.id),
      }));
      console.error('Join error:', error);
    }

    setJoining(null);
  };

  const handleLeave = async (eventId: string) => {
    if (!user || joining) return;
    setJoining(eventId);

    // Optimistic: remove the user's avatar immediately
    setEvents(prev => prev.map(e => e.id !== eventId ? e : {
      ...e,
      activity_participants: (e.activity_participants ?? []).filter((p: any) => p.user_id !== user.id),
    }));

    const { error } = await supabase
      .from('activity_participants')
      .delete()
      .eq('activity_id', eventId)
      .eq('user_id', user.id);

    if (error) {
      // Revert on failure
      setEvents(prev => prev.map(e => e.id !== eventId ? e : {
        ...e,
        activity_participants: [
          ...(e.activity_participants ?? []),
          { user_id: user.id, profiles: { full_name: profile?.full_name ?? null, avatar_url: profile?.avatar_url ?? null } },
        ],
      }));
      console.error('Leave error:', error);
    }

    setJoining(null);
  };

  return (
    <div>
      {/* SEARCH BAR */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        <div style={{
          flex: 1, backgroundColor: '#121E31', borderRadius: '15px', padding: '12px 15px',
          border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', fontSize: '14px',
        }}>
          🔍 Search events...
        </div>
        <div style={{
          backgroundColor: '#121E31', borderRadius: '15px', padding: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>📅</div>
      </div>

      <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '1px', display: 'block', marginBottom: '15px' }}>
        UPCOMING EVENTS
      </span>

      {loading && (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '48px 0', fontSize: '14px' }}>
          Loading events...
        </div>
      )}

      {!loading && events.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
          <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '6px' }}>No events found</div>
          <div style={{ color: '#64748b', fontSize: '13px' }}>Be the first to create a plan on the Discovery tab!</div>
        </div>
      )}

      {!loading && events.map((event) => {
        const { day, month } = parseDateBadge(event.when_time);
        const color = CATEGORY_COLORS[event.category] ?? '#60A5FA';
        const creator = event.profiles?.full_name ?? 'Someone';
        const participants: any[] = event.activity_participants ?? [];
        const isJoined = participants.some((p: any) => p.user_id === user?.id);
        const isActing = joining === event.id;
        const facepile = participants.slice(0, 5);
        const overflow = participants.length - 5;

        return (
          <div key={event.id} style={{
            backgroundColor: '#121E31', borderRadius: '24px', padding: '20px',
            display: 'flex', gap: '20px', marginBottom: '15px',
            border: `1px solid ${isJoined ? 'rgba(243,217,154,0.12)' : 'rgba(255,255,255,0.05)'}`,
            transition: 'border-color 0.3s',
          }}>

            {/* DATE BADGE */}
            <div style={{
              backgroundColor: '#1A283D', borderRadius: '16px', minWidth: '60px', height: '70px',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              border: '1px solid rgba(255,255,255,0.05)', flexShrink: 0,
            }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>{day}</span>
              <span style={{ fontSize: '10px', fontWeight: '900', color: '#F3D99A' }}>{month}</span>
            </div>

            {/* EVENT DETAILS */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Title + category */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {event.description}
                </h4>
                <span style={{
                  fontSize: '10px', fontWeight: '800', color, flexShrink: 0,
                  backgroundColor: `${color}18`, padding: '2px 8px', borderRadius: '6px',
                }}>
                  {event.category}
                </span>
              </div>

              {/* Meta line */}
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📍 {event.where_location}{event.when_time ? ` · 🕒 ${event.when_time}` : ''} · by {creator}
              </div>

              {/* Facepile + Join/Leave */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                {/* Facepile */}
                {participants.length === 0 ? (
                  <span style={{ fontSize: '11px', color: '#475569' }}>No one joined yet</span>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex' }}>
                      {facepile.map((p: any, i: number) => (
                        <div key={p.user_id} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: facepile.length - i }}>
                          <AvatarBubble participant={p} size={26} />
                        </div>
                      ))}
                      {overflow > 0 && (
                        <div style={{
                          marginLeft: -8, zIndex: 0,
                          width: 26, height: 26, borderRadius: '50%',
                          border: '2px solid #121E31', backgroundColor: '#1A283D',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '9px', fontWeight: '800', color: '#94A3B8',
                        }}>
                          +{overflow}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {participants.length} joined
                    </span>
                  </div>
                )}

                {/* Join / Leave button */}
                <button
                  onClick={() => isJoined ? handleLeave(event.id) : handleJoin(event.id)}
                  disabled={isActing}
                  style={{
                    padding: '5px 14px', borderRadius: '10px', flexShrink: 0,
                    fontSize: '11px', fontWeight: '700',
                    cursor: isActing ? 'default' : 'pointer',
                    border: isJoined ? '1px solid rgba(243,217,154,0.35)' : '1px solid rgba(255,255,255,0.12)',
                    backgroundColor: isJoined ? 'rgba(243,217,154,0.1)' : 'transparent',
                    color: isJoined ? '#F3D99A' : 'white',
                    opacity: isActing ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {isActing ? '···' : isJoined ? '✓ Joined' : 'Join'}
                </button>

              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EventsTab;
