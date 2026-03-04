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

const AvatarBubble = ({ participant, size = 28, borderColor }: { participant: any; size?: number; borderColor: string }) => {
  const avatarUrl = participant.profiles?.avatar_url
    ? supabase.storage.from('avatars').getPublicUrl(participant.profiles.avatar_url).data.publicUrl
    : null;
  const initial = participant.profiles?.full_name?.[0]?.toUpperCase() ?? '?';

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${borderColor}`,
      overflow: 'hidden', flexShrink: 0,
      backgroundColor: '#1A283D',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.38), fontWeight: '700', color: '#F3D99A',
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt={initial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initial
      }
    </div>
  );
};

const SkeletonCard = ({ cardBg }: { cardBg: string }) => (
  <div style={{
    backgroundColor: cardBg, borderRadius: '32px', padding: '20px',
    border: '1px solid rgba(255,255,255,0.05)',
    backdropFilter: 'blur(16px)',
    display: 'flex', flexDirection: 'column', gap: '14px',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div className="bento-skeleton" style={{ width: '52px', height: '52px', borderRadius: '16px' }} />
      <div className="bento-skeleton" style={{ width: '68px', height: '22px', borderRadius: '20px' }} />
    </div>
    <div>
      <div className="bento-skeleton" style={{ height: '18px', borderRadius: '8px', marginBottom: '8px', width: '75%' }} />
      <div className="bento-skeleton" style={{ height: '13px', borderRadius: '8px', marginBottom: '4px' }} />
      <div className="bento-skeleton" style={{ height: '13px', borderRadius: '8px', width: '55%' }} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
      <div style={{ display: 'flex' }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="bento-skeleton" style={{
            width: '28px', height: '28px', borderRadius: '50%',
            marginLeft: i > 0 ? -8 : 0,
          }} />
        ))}
      </div>
      <div className="bento-skeleton" style={{ width: '74px', height: '34px', borderRadius: '12px' }} />
    </div>
  </div>
);

const EventsTab = () => {
  const { user, profile, theme } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

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

    // Optimistic update
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

    // Optimistic update
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
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <div style={{
          flex: 1, backgroundColor: theme.cardBg, borderRadius: '16px', padding: '12px 16px',
          border: `1px solid ${theme.cardBorder}`, color: theme.subText, fontSize: '14px',
          backdropFilter: 'blur(16px)', boxShadow: theme.cardShadow,
        }}>
          🔍 Search events...
        </div>
        <div style={{
          backgroundColor: theme.cardBg, borderRadius: '16px', padding: '12px 14px',
          border: `1px solid ${theme.cardBorder}`, backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', boxShadow: theme.cardShadow,
        }}>📅</div>
      </div>

      <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '1.5px', display: 'block', marginBottom: '16px', color: '#475569' }}>
        UPCOMING EVENTS
      </span>

      {/* SKELETON LOADING */}
      {loading && (
        <div className="bento-grid">
          <SkeletonCard cardBg={theme.cardBg} />
          <SkeletonCard cardBg={theme.cardBg} />
          <SkeletonCard cardBg={theme.cardBg} />
          <SkeletonCard cardBg={theme.cardBg} />
        </div>
      )}

      {!loading && events.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
          <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '6px' }}>No events yet</div>
          <div style={{ color: '#475569', fontSize: '13px' }}>Be the first to create a plan on the Discovery tab!</div>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="bento-grid">
          {events.map((event) => {
            const { day, month } = parseDateBadge(event.when_time);
            const color = CATEGORY_COLORS[event.category] ?? '#60A5FA';
            const creator = event.profiles?.full_name ?? 'Someone';
            const participants: any[] = event.activity_participants ?? [];
            const isJoined = participants.some((p: any) => p.user_id === user?.id);
            const isActing = joining === event.id;
            const facepile = participants.slice(0, 4);
            const overflow = participants.length - 4;

            return (
              <div key={event.id} style={{
                backgroundColor: theme.cardBg,
                borderRadius: '32px',
                padding: '20px',
                border: `1px solid ${isJoined ? 'rgba(255,215,0,0.22)' : theme.cardBorder}`,
                backdropFilter: 'blur(16px)',
                boxShadow: theme.cardShadow,
                transition: 'border-color 0.3s',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}>

                {/* TOP ROW: date badge + category */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    backgroundColor: theme.inactiveBtnBg, borderRadius: '14px',
                    width: '52px', height: '52px',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center',
                    border: `1px solid ${theme.cardBorder}`, flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: theme.text, lineHeight: 1 }}>{day}</span>
                    <span style={{ fontSize: '9px', fontWeight: '900', color: '#FFD700', letterSpacing: '0.5px', marginTop: '2px' }}>{month}</span>
                  </div>

                  <span style={{
                    fontSize: '10px', fontWeight: '800', color,
                    backgroundColor: `${color}1A`,
                    padding: '4px 10px', borderRadius: '20px',
                    border: `1px solid ${color}30`,
                  }}>
                    {event.category}
                  </span>
                </div>

                {/* TITLE + META */}
                <div>
                  <h4 className="line-clamp-2" style={{
                    margin: '0 0 6px 0', fontSize: '15px', fontWeight: '800',
                    color: theme.text, lineHeight: '1.35',
                  }}>
                    {event.description}
                  </h4>
                  <p className="line-clamp-2" style={{
                    margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.5',
                  }}>
                    📍 {event.where_location}{event.when_time ? ` · 🕒 ${event.when_time}` : ''} · by {creator}
                  </p>
                </div>

                {/* BOTTOM: Facepile + Join/Leave */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                  {/* Facepile */}
                  {participants.length === 0 ? (
                    <span style={{ fontSize: '11px', color: theme.subText }}>No one joined yet</span>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <div style={{ display: 'flex' }}>
                        {facepile.map((p: any, i: number) => (
                          <div key={p.user_id} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: facepile.length - i }}>
                            <AvatarBubble participant={p} size={28} borderColor={theme.avatarBorder} />
                          </div>
                        ))}
                        {overflow > 0 && (
                          <div style={{
                            marginLeft: -10, zIndex: 0,
                            width: 28, height: 28, borderRadius: '50%',
                            border: `2px solid ${theme.avatarBorder}`,
                            backgroundColor: '#1A283D',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '9px', fontWeight: '800', color: '#94A3B8',
                          }}>
                            +{overflow}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: '#475569' }}>
                        {participants.length} joined
                      </span>
                    </div>
                  )}

                  {/* Join / Leave button */}
                  <button
                    onClick={() => isJoined ? handleLeave(event.id) : handleJoin(event.id)}
                    disabled={isActing}
                    style={{
                      padding: '8px 14px', borderRadius: '12px', flexShrink: 0,
                      fontSize: '12px', fontWeight: '800',
                      cursor: isActing ? 'default' : 'pointer',
                      border: 'none',
                      backgroundColor: isJoined ? 'rgba(255,215,0,0.12)' : '#FFD700',
                      color: isJoined ? '#FFD700' : '#050B18',
                      outline: isJoined ? '1px solid rgba(255,215,0,0.3)' : 'none',
                      opacity: isActing ? 0.55 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {isActing ? '···' : isJoined ? '✓ Joined' : 'Join →'}
                  </button>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsTab;
