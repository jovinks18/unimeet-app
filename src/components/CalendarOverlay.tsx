import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const CATEGORY_ICONS: Record<string, string> = {
  SPORTS: '⚽', CULTURE: '🎨', FOOD: '🍴', COFFEE: '☕', MORE: '✨',
};

const CalendarOverlay = ({ isOpen, onClose, theme }: any) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetch = async () => {
      // Activities user created
      const { data: created } = await supabase
        .from('activities')
        .select('id, description, category, when_time, where_location')
        .eq('user_id', user.id);

      // Activities user joined
      const { data: joinedRows } = await supabase
        .from('activity_participants')
        .select('activities(id, description, category, when_time, where_location)')
        .eq('user_id', user.id);

      const joined = (joinedRows ?? []).map((r: any) => r.activities).filter(Boolean);

      // Merge and deduplicate by id, tag each with source
      const seen = new Set<string>();
      const merged: any[] = [];
      for (const a of [...(created ?? [])]) {
        if (!seen.has(a.id)) { seen.add(a.id); merged.push({ ...a, _source: 'created' }); }
      }
      for (const a of joined) {
        if (!seen.has(a.id)) { seen.add(a.id); merged.push({ ...a, _source: 'joined' }); }
      }

      setActivities(merged);
    };

    fetch();
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: theme.card, borderRadius: '28px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 24px 16px', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: '900', fontSize: '17px' }}>My Schedule</h3>
            <div style={{ fontSize: '11px', color: theme.subText, marginTop: '2px' }}>
              {activities.length} upcoming plan{activities.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.subText, fontSize: '24px', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activities.length === 0 ? (
            <div style={{ textAlign: 'center', color: theme.subText, fontSize: '13px', padding: '30px 0' }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>📅</div>
              No upcoming plans yet.
            </div>
          ) : (
            activities.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: '14px', alignItems: 'center', backgroundColor: '#0A1628', borderRadius: '16px', padding: '14px 16px', border: `1px solid ${theme.border}` }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(243,217,154,0.08)', border: '1px solid rgba(243,217,154,0.12)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', flexShrink: 0 }}>
                  {CATEGORY_ICONS[a.category] ?? '📌'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.description}
                  </div>
                  <div style={{ fontSize: '11px', color: theme.subText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    🕒 {a.when_time} · 📍 {a.where_location}
                  </div>
                </div>
                <div style={{ fontSize: '9px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', flexShrink: 0, backgroundColor: a._source === 'created' ? 'rgba(59,130,246,0.15)' : 'rgba(243,217,154,0.1)', color: a._source === 'created' ? '#60A5FA' : '#F3D99A', border: `1px solid ${a._source === 'created' ? 'rgba(59,130,246,0.2)' : 'rgba(243,217,154,0.2)'}` }}>
                  {a._source === 'created' ? 'HOST' : 'JOINED'}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default CalendarOverlay;
