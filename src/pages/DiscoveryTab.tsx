import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DateTimePopover from '../components/popovers/DateTimePopover';
import LocationPopover from '../components/popovers/LocationPopover';

const DiscoveryTab = ({ theme, categories, handlePost }: any) => {
  // --- FORM STATE ---
  const [selectedCategory, setSelectedCategory] = useState('SPORTS');
  const [duration, setDuration] = useState(1);
  const [when, setWhen] = useState('');
  const [where, setWhere] = useState('');
  const [description, setDescription] = useState('');
  const [repeat, setRepeat] = useState('One-time');
  const [guestCount, setGuestCount] = useState(2);

  // --- POPOVER STATE ---
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLocPicker, setShowLocPicker] = useState(false);

  // --- CATEGORY INTERACTION STATE ---
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [pressedCategory, setPressedCategory] = useState<string | null>(null);

  // --- AI DESCRIPTION STATE ---
  const [aiMode, setAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // --- STEPPER ANIMATION STATE ---
  const [durationPop, setDurationPop] = useState(false);
  const [guestPop, setGuestPop] = useState(false);

  useEffect(() => {
    setDurationPop(true);
    const t = setTimeout(() => setDurationPop(false), 250);
    return () => clearTimeout(t);
  }, [duration]);

  useEffect(() => {
    setGuestPop(true);
    const t = setTimeout(() => setGuestPop(false), 250);
    return () => clearTimeout(t);
  }, [guestCount]);

  // Gold glow on the span intensifies as values increase
  const durationGlow = duration > 1
    ? `0 0 ${Math.round(8 + Math.min(duration - 1, 5) * 3)}px rgba(243,217,154,${(0.1 + Math.min(duration - 1, 5) * 0.06).toFixed(2)})`
    : 'none';
  const guestGlow = guestCount > 2
    ? `0 0 ${Math.round(8 + Math.min(guestCount - 2, 6) * 3)}px rgba(243,217,154,${(0.1 + Math.min(guestCount - 2, 6) * 0.06).toFixed(2)})`
    : 'none';

  // --- GREETING ---
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : hour < 21 ? 'Evening' : 'Night';
  const subtext = hour < 12 ? "What's the move?" : hour < 17 ? 'Any plans brewing?' : hour < 21 ? "What's happening tonight?" : 'Still up? Plan something 👀';

  const generateDescription = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Write a fun, concise 2-sentence activity description for a university social app. Be casual and inviting. Return only the description text, no extra formatting.' },
            { role: 'user', content: aiPrompt }
          ],
          max_tokens: 100
        })
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) {
        setDescription(text);
        setAiMode(false);
        setAiPrompt('');
      }
    } catch {
      alert('Failed to generate description. Check your OpenAI API key.');
    } finally {
      setAiLoading(false);
    }
  };

  const onPublish = () => {
    if (!description || !when || !where) {
      alert("Please fill in the When, Where, and Description!");
      return;
    }
    handlePost({
      category: selectedCategory,
      duration,
      when_time: when,
      where_location: where,
      description,
      repeat_type: repeat,
      max_guests: guestCount,
    });
    setDescription('');
    setWhen('');
    setWhere('');
    setAiPrompt('');
  };

  // --- REUSABLE STYLES ---
  const sectionHeaderStyle = {
    fontSize: '10px', fontWeight: '900', color: theme.subText,
    letterSpacing: '1px', marginBottom: '12px', display: 'block'
  };

  const darkBoxStyle = {
    backgroundColor: '#0A1628', border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '16px', display: 'flex', alignItems: 'center',
    padding: '0 16px', height: '48px', cursor: 'pointer'
  };

  const modeTabStyle = (active: boolean) => ({
    padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
    backgroundColor: active ? theme.navActive : 'transparent',
    color: active ? '#051124' : theme.subText,
  });

  return (
    <div style={{ width: '100%' }}>

      <div style={{ backgroundColor: theme.card, borderRadius: '32px', padding: '24px', border: `1px solid ${theme.border}` }}>

        {/* DYNAMIC GREETING */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            {greeting}, {firstName}!
          </div>
          <div style={{ fontSize: '11px', color: theme.subText, marginTop: '3px' }}>{subtext}</div>
        </div>

        {/* CATEGORIES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {categories.map((cat: any) => {
            const isActive = selectedCategory === cat.label;
            const isHovered = hoveredCategory === cat.label;
            const isPressed = pressedCategory === cat.label;
            return (
              <div
                key={cat.label}
                onClick={() => setSelectedCategory(cat.label)}
                onMouseEnter={() => setHoveredCategory(cat.label)}
                onMouseLeave={() => { setHoveredCategory(null); setPressedCategory(null); }}
                onMouseDown={() => setPressedCategory(cat.label)}
                onMouseUp={() => setPressedCategory(null)}
                style={{ textAlign: 'center', cursor: 'pointer' }}
              >
                <div style={{
                  height: '54px',
                  backgroundColor: isActive ? 'rgba(243, 217, 154, 0.1)' : '#1A283D',
                  borderRadius: '16px',
                  border: isActive ? '2px solid #F3D99A' : '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  fontSize: isActive ? '24px' : '20px',
                  boxShadow: isActive ? '0 0 16px rgba(243, 217, 154, 0.25)' : 'none',
                  transform: isPressed ? 'scale(0.95)' : isHovered ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 0.15s ease, box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, font-size 0.15s ease',
                }}>{cat.icon}</div>
                <div style={{
                  fontSize: '9px', fontWeight: '700', marginTop: '6px',
                  color: isActive ? '#FFFFFF' : theme.subText,
                  transition: 'color 0.2s ease',
                }}>{cat.label}</div>
              </div>
            );
          })}
        </div>

        {/* 2×2 INPUT GRID: When/Duration + Where/Guests */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>

          {/* ROW 1: When? | ⏱️ Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <div onClick={() => { setShowDatePicker(!showDatePicker); setShowLocPicker(false); }} style={{ ...darkBoxStyle, overflow: 'hidden' }}>
                <span style={{ marginRight: '6px', flexShrink: 0 }}>🕒</span>
                <span style={{ fontSize: '12px', color: when ? 'white' : theme.subText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {when || 'When?'}
                </span>
              </div>
              {showDatePicker && <DateTimePopover onDone={(val: string) => { setWhen(val); setShowDatePicker(false); }} />}
            </div>
            <div style={{ ...darkBoxStyle, padding: '0 8px', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', flexShrink: 0 }}>⏱️</span>
              <button onClick={() => setDuration(d => Math.max(1, d - 1))} style={{ background: 'none', border: 'none', color: theme.subText, fontSize: '15px', cursor: 'pointer', lineHeight: 1 }}>−</button>
              <span style={{ fontSize: '12px', color: theme.navActive, fontWeight: '800', display: 'inline-block', minWidth: '28px', textAlign: 'center', borderRadius: '8px', padding: '2px 3px', transform: durationPop ? 'scale(1.25)' : 'scale(1)', boxShadow: durationGlow, transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease' }}>{duration}h</span>
              <button onClick={() => setDuration(d => d + 1)} style={{ background: 'none', border: 'none', color: theme.subText, fontSize: '15px', cursor: 'pointer', lineHeight: 1 }}>+</button>
            </div>
          </div>

          {/* ROW 2: Where? | 👥 Guests */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: '10px' }}>
            <div style={{ position: 'relative', minWidth: 0 }}>
              <div onClick={() => { setShowLocPicker(!showLocPicker); setShowDatePicker(false); }} style={{ ...darkBoxStyle, overflow: 'hidden' }}>
                <span style={{ marginRight: '6px', flexShrink: 0 }}>📍</span>
                <span style={{ fontSize: '12px', color: where ? 'white' : theme.subText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {where || 'Where?'}
                </span>
              </div>
              {showLocPicker && <LocationPopover onSelect={(val: string) => { setWhere(val); setShowLocPicker(false); }} />}
            </div>
            <div style={{ ...darkBoxStyle, padding: '0 8px', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', flexShrink: 0 }}>👥</span>
              <button onClick={() => setGuestCount(c => Math.max(1, c - 1))} style={{ background: 'none', border: 'none', color: theme.subText, fontSize: '15px', cursor: 'pointer', lineHeight: 1 }}>−</button>
              <span style={{ fontSize: '12px', color: theme.navActive, fontWeight: '800', display: 'inline-block', minWidth: '28px', textAlign: 'center', borderRadius: '8px', padding: '2px 3px', transform: guestPop ? 'scale(1.25)' : 'scale(1)', boxShadow: guestGlow, transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease' }}>{guestCount}</span>
              <button onClick={() => setGuestCount(c => c + 1)} style={{ background: 'none', border: 'none', color: theme.subText, fontSize: '15px', cursor: 'pointer', lineHeight: 1 }}>+</button>
            </div>
          </div>

        </div>

        {/* DESCRIPTION with AI toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ ...sectionHeaderStyle, marginBottom: 0 }}>DESCRIPTION</span>
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#0A1628', borderRadius: '10px', padding: '3px' }}>
            <div onClick={() => setAiMode(false)} style={modeTabStyle(!aiMode)}>✏️ Write</div>
            <div onClick={() => setAiMode(true)} style={modeTabStyle(aiMode)}>✨ AI</div>
          </div>
        </div>

        {aiMode ? (
          <div style={{ marginBottom: '20px' }}>
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Describe your activity idea... e.g. 'casual coffee chat to study for finals'"
              style={{ width: '100%', backgroundColor: '#0A1628', border: '1px solid rgba(243,217,154,0.2)', borderRadius: '16px', padding: '16px', color: 'white', minHeight: '70px', outline: 'none', fontSize: '14px', resize: 'none', marginBottom: '10px' }}
            />
            <button
              onClick={generateDescription}
              disabled={aiLoading || !aiPrompt.trim()}
              style={{ width: '100%', backgroundColor: aiLoading ? '#1A283D' : theme.navActive, color: aiLoading ? theme.subText : '#051124', border: 'none', padding: '12px', borderRadius: '14px', fontWeight: '800', cursor: aiLoading ? 'not-allowed' : 'pointer', fontSize: '13px' }}
            >
              {aiLoading ? '✨ Generating...' : '✨ Generate Description'}
            </button>
          </div>
        ) : (
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ width: '100%', backgroundColor: '#0A1628', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px', color: 'white', marginBottom: '20px', minHeight: '80px', outline: 'none', fontSize: '14px', resize: 'none' }}
            placeholder="What's the plan?"
          />
        )}

        {/* REPEAT */}
        <span style={sectionHeaderStyle}>REPEAT</span>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['One-time', 'Daily', 'Weekly'].map((type) => (
            <div
              key={type}
              onClick={() => setRepeat(type)}
              style={{
                padding: '8px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
                backgroundColor: repeat === type ? theme.navActive : '#1A283D',
                color: repeat === type ? '#051124' : theme.subText, cursor: 'pointer'
              }}>{type}</div>
          ))}
        </div>

        <button
          onClick={onPublish}
          style={{ width: '100%', backgroundColor: theme.navActive, color: '#051124', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}>
          Publish Activity
        </button>
      </div>
    </div>
  );
};

export default DiscoveryTab;
