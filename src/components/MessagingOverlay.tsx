import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const CATEGORY_ICONS: Record<string, string> = {
  SPORTS: '⚽', CULTURE: '🎨', FOOD: '🍴', COFFEE: '☕', MORE: '✨',
};

const MessagingOverlay = ({ isOpen, onClose, theme }: any) => {
  const { user, profile } = useAuth();

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Fetch inbox conversations ──────────────────────────────────────────────
  const fetchConversations = async () => {
    if (!user) return;

    const [{ data: created }, { data: joinedRows }] = await Promise.all([
      supabase.from('activities').select('id, description, category, when_time, where_location').eq('user_id', user.id),
      supabase.from('activity_participants').select('activities(id, description, category, when_time, where_location)').eq('user_id', user.id),
    ]);

    const joined = (joinedRows ?? []).map((r: any) => r.activities).filter(Boolean);
    const all = [...(created ?? []), ...joined];

    // Deduplicate by id
    const seen = new Set<string>();
    const unique = all.filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
    setConversations(unique);
  };

  // ── Fetch messages for active conversation ─────────────────────────────────
  const fetchMessages = async (activityId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, profiles:user_id(full_name)')
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  // ── Real-time subscription ─────────────────────────────────────────────────
  const subscribeToMessages = (activityId: string) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    channelRef.current = supabase
      .channel(`messages:${activityId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `activity_id=eq.${activityId}` },
        async (payload) => {
          // Fetch with profile join so we have the sender name
          const { data } = await supabase
            .from('messages')
            .select('*, profiles:user_id(full_name)')
            .eq('id', payload.new.id)
            .single();
          if (data) setMessages(prev => [...prev, data]);
        }
      )
      .subscribe();
  };

  // ── Send a message ─────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !activeConv || sending) return;
    setSending(true);
    setDraft('');
    await supabase.from('messages').insert({ activity_id: activeConv.id, user_id: user?.id, content: text });
    setSending(false);
    inputRef.current?.focus();
  };

  // ── Scroll to bottom whenever messages update ──────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── On open: load inbox ────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) { fetchConversations(); setActiveConv(null); setMessages([]); }
    else {
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    }
  }, [isOpen]);

  // ── On conversation select: load + subscribe ───────────────────────────────
  useEffect(() => {
    if (!activeConv) return;
    fetchMessages(activeConv.id);
    subscribeToMessages(activeConv.id);
    return () => { if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; } };
  }, [activeConv]);

  if (!isOpen) return null;

  const icon = activeConv ? (CATEGORY_ICONS[activeConv.category] ?? '💬') : null;
  const myId = user?.id;

  // ── STYLES ──────────────────────────────────────────────────────────────────
  const panel: React.CSSProperties = {
    width: '88%', maxWidth: '360px', backgroundColor: theme.card,
    height: '100%', display: 'flex', flexDirection: 'column',
    borderLeft: `1px solid ${theme.border}`,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={panel}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '18px 20px', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
          {activeConv && (
            <button onClick={() => { setActiveConv(null); setMessages([]); }}
              style={{ background: 'none', border: 'none', color: theme.subText, fontSize: '20px', cursor: 'pointer', padding: 0, lineHeight: 1 }}>←</button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {activeConv ? (
              <>
                <div style={{ fontWeight: '800', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{icon}</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeConv.description}</span>
                </div>
                <div style={{ fontSize: '11px', color: theme.subText, marginTop: '1px' }}>📍 {activeConv.where_location}</div>
              </>
            ) : (
              <h2 style={{ margin: 0, fontWeight: '900', fontSize: '18px' }}>Messages</h2>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.subText, fontSize: '26px', cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>

        {/* ── INBOX ── */}
        {!activeConv && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: '900', color: theme.subText, letterSpacing: '1.2px', marginBottom: '14px' }}>
              ACTIVE CONVERSATIONS
            </div>

            {conversations.length === 0 ? (
              <div style={{ textAlign: 'center', color: theme.subText, fontSize: '13px', paddingTop: '40px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
                Join or create a plan to start chatting
              </div>
            ) : (
              conversations.map(conv => (
                <div key={conv.id} onClick={() => setActiveConv(conv)}
                  style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '14px 16px', backgroundColor: '#0A1628', borderRadius: '16px', marginBottom: '10px', cursor: 'pointer', border: `1px solid ${theme.border}` }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '14px', backgroundColor: 'rgba(243,217,154,0.08)', border: '1px solid rgba(243,217,154,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', flexShrink: 0 }}>
                    {CATEGORY_ICONS[conv.category] ?? '💬'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.description}
                    </div>
                    <div style={{ fontSize: '11px', color: theme.subText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      🕒 {conv.when_time} · 📍 {conv.where_location}
                    </div>
                  </div>
                  <span style={{ color: theme.subText, fontSize: '16px', flexShrink: 0 }}>›</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── CHAT ── */}
        {activeConv && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: theme.subText, fontSize: '12px', marginTop: '40px' }}>
                  No messages yet. Say hello! 👋
                </div>
              )}
              {messages.map(msg => {
                const isMe = msg.user_id === myId;
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    {!isMe && (
                      <span style={{ fontSize: '10px', color: theme.subText, marginBottom: '3px', paddingLeft: '4px' }}>
                        {msg.profiles?.full_name ?? 'Someone'}
                      </span>
                    )}
                    <div style={{
                      maxWidth: '78%', padding: '10px 14px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      backgroundColor: isMe ? 'rgba(243,217,154,0.15)' : '#0A1628',
                      border: isMe ? '1px solid rgba(243,217,154,0.25)' : `1px solid ${theme.border}`,
                      color: isMe ? '#F3D99A' : '#E2E8F0',
                      fontSize: '13px', lineHeight: '1.5', wordBreak: 'break-word',
                    }}>
                      {msg.content}
                    </div>
                    <span style={{ fontSize: '9px', color: theme.subText, marginTop: '3px', paddingLeft: '4px', paddingRight: '4px' }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* ── INPUT ── */}
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${theme.border}`, display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
              <input
                ref={inputRef}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Message..."
                style={{ flex: 1, backgroundColor: '#0A1628', border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '10px 14px', color: 'white', fontSize: '13px', outline: 'none' }}
              />
              <button
                onClick={sendMessage}
                disabled={!draft.trim() || sending}
                style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: draft.trim() ? '#F3D99A' : 'rgba(243,217,154,0.1)', border: 'none', cursor: draft.trim() ? 'pointer' : 'default', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, transition: 'background-color 0.2s' }}
              >
                ↑
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default MessagingOverlay;
