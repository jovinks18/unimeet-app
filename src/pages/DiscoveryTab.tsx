import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DateTimePopover from '../components/popovers/DateTimePopover';
import LocationPopover from '../components/popovers/LocationPopover';

const DiscoveryTab = ({ categories, handlePost }: any) => {
  const { theme } = useAuth();
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

  // --- FOCUS STATE (gold border glow) ---
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  // Gold glow intensifies as values increase (#FFD700)
  const durationGlow = duration > 1
    ? `0 0 ${Math.round(8 + Math.min(duration - 1, 5) * 3)}px rgba(255,215,0,${(0.12 + Math.min(duration - 1, 5) * 0.06).toFixed(2)})`
    : 'none';
  const guestGlow = guestCount > 2
    ? `0 0 ${Math.round(8 + Math.min(guestCount - 2, 6) * 3)}px rgba(255,215,0,${(0.12 + Math.min(guestCount - 2, 6) * 0.06).toFixed(2)})`
    : 'none';


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

  // --- STYLE UTILITIES ---

  const glass: React.CSSProperties = {
    backgroundColor: theme.cardBg,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '24px',
    border: `1px solid ${theme.cardBorder}`,
    boxShadow: theme.cardShadow,
  };

  const fieldGlass = (field: string, openOverride = false): React.CSSProperties => ({
    ...glass,
    border: `1px solid ${openOverride || focusedField === field
      ? 'rgba(255,215,0,0.5)'
      : theme.cardBorder}`,
    boxShadow: openOverride || focusedField === field
      ? '0 0 0 3px rgba(255,215,0,0.07)'
      : theme.cardShadow,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  });

  const labelStyle: React.CSSProperties = {
    fontSize: '9px', fontWeight: '900', color: '#475569',
    letterSpacing: '1.4px', display: 'block', marginBottom: '8px',
  };

  const stepperBtn: React.CSSProperties = {
    background: 'none', border: 'none', color: '#475569',
    fontSize: '20px', cursor: 'pointer', lineHeight: 1,
    padding: '0 4px', fontWeight: '300',
  };

  const modeTabStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: '8px',
    fontSize: '11px', fontWeight: '700', cursor: 'pointer',
    backgroundColor: active ? '#FFD700' : 'transparent',
    color: active ? '#050B18' : '#475569',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* ── CATEGORY CARD ─────────────────────────────────────── */}
      <div style={{ ...glass, padding: '20px' }}>
        <span style={labelStyle}>WHAT'S THE VIBE?</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
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
                style={{
                  textAlign: 'center', cursor: 'pointer',
                  backgroundColor: isActive ? 'rgba(255,215,0,0.09)' : theme.inactiveBtnBg,
                  borderRadius: '20px',
                  border: isActive ? '1.5px solid rgba(255,215,0,0.45)' : '1px solid rgba(255,255,255,0.06)',
                  padding: '12px 4px 10px',
                  boxShadow: isActive ? '0 0 20px rgba(255,215,0,0.14)' : 'none',
                  transform: isPressed ? 'scale(0.93)' : isHovered ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  fontSize: isActive ? '24px' : '20px',
                  marginBottom: '7px',
                  transition: 'font-size 0.15s ease',
                }}>
                  {cat.icon}
                </div>
                <div style={{
                  fontSize: '8px', fontWeight: '800',
                  color: isActive ? '#FFD700' : '#475569',
                  letterSpacing: '0.5px',
                  transition: 'color 0.2s ease',
                }}>
                  {cat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── WHEN + DURATION ROW ───────────────────────────────── */}
      {/* position+zIndex elevates the whole row above subsequent cards when the popover is open,
          defeating the backdrop-filter stacking-context isolation of later cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 108px', gap: '10px',
        position: 'relative', zIndex: showDatePicker ? 50 : undefined,
      }}>

        {/* When */}
        <div style={{
          ...fieldGlass('when', showDatePicker),
          padding: '16px', position: 'relative',
          overflow: 'visible',   // let the absolute popover escape the card boundary
        }}>
          <span style={labelStyle}>WHEN</span>
          {/* No overflow:hidden here — that blocks hit-testing and clips the popover on some browsers */}
          <div
            onClick={() => { setShowDatePicker(!showDatePicker); setShowLocPicker(false); }}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '16px', flexShrink: 0 }}>🕒</span>
            {/* flex:1 + minWidth:0 confines the span so text-overflow works without overflow on the parent */}
            <span style={{
              fontSize: '13px', fontWeight: when ? '600' : '400',
              color: when ? '#fff' : '#475569',
              flex: 1, minWidth: 0,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {when || 'Pick a time'}
            </span>
          </div>
          {showDatePicker && <DateTimePopover onDone={(val: string) => { setWhen(val); setShowDatePicker(false); }} />}
        </div>

        {/* Duration */}
        <div style={{ ...glass, padding: '16px 12px' }}>
          <span style={labelStyle}>DURATION</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => setDuration(d => Math.max(1, d - 1))} style={stepperBtn}>−</button>
            <span style={{
              fontSize: '15px', color: '#FFD700', fontWeight: '800',
              minWidth: '34px', textAlign: 'center', display: 'inline-block',
              transform: durationPop ? 'scale(1.3)' : 'scale(1)',
              boxShadow: durationGlow,
              transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease',
            }}>
              {duration}h
            </span>
            <button onClick={() => setDuration(d => d + 1)} style={stepperBtn}>+</button>
          </div>
        </div>

      </div>

      {/* ── WHERE + GUESTS ROW ────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 108px', gap: '10px',
        position: 'relative', zIndex: showLocPicker ? 50 : undefined,
      }}>

        {/* Where */}
        <div style={{
          ...fieldGlass('where', showLocPicker),
          padding: '16px', position: 'relative', minWidth: 0,
          overflow: 'visible',
        }}>
          <span style={labelStyle}>WHERE</span>
          <div
            onClick={() => { setShowLocPicker(!showLocPicker); setShowDatePicker(false); }}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '16px', flexShrink: 0 }}>📍</span>
            <span style={{
              fontSize: '13px', fontWeight: where ? '600' : '400',
              color: where ? '#fff' : '#475569',
              flex: 1, minWidth: 0,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {where || 'Pick a spot'}
            </span>
          </div>
          {showLocPicker && <LocationPopover onSelect={(val: string) => { setWhere(val); setShowLocPicker(false); }} />}
        </div>

        {/* Guests */}
        <div style={{ ...glass, padding: '16px 12px' }}>
          <span style={labelStyle}>GUESTS</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => setGuestCount(c => Math.max(1, c - 1))} style={stepperBtn}>−</button>
            <span style={{
              fontSize: '15px', color: '#FFD700', fontWeight: '800',
              minWidth: '34px', textAlign: 'center', display: 'inline-block',
              transform: guestPop ? 'scale(1.3)' : 'scale(1)',
              boxShadow: guestGlow,
              transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease',
            }}>
              {guestCount}
            </span>
            <button onClick={() => setGuestCount(c => c + 1)} style={stepperBtn}>+</button>
          </div>
        </div>

      </div>

      {/* ── DESCRIPTION CARD ─────────────────────────────────── */}
      {/* position+zIndex keeps this card's stacking context above the Repeat/Publish elements below */}
      <div style={{ ...fieldGlass('desc'), padding: '18px', position: 'relative', zIndex: 10 }}>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ ...labelStyle, marginBottom: 0 }}>DESCRIPTION</span>
          <div style={{
            display: 'flex', gap: '3px',
            backgroundColor: theme.inactiveBtnBg, borderRadius: '10px', padding: '3px',
            pointerEvents: 'auto', position: 'relative', zIndex: 1,
          }}>
            <button onClick={() => setAiMode(false)} style={{ ...modeTabStyle(!aiMode), border: 'none' }}>✏️ Write</button>
            <button onClick={() => setAiMode(true)} style={{ ...modeTabStyle(aiMode), border: 'none' }}>✨ AI</button>
          </div>
        </div>

        {aiMode ? (
          <>
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onFocus={() => setFocusedField('desc')}
              onBlur={() => setFocusedField(null)}
              placeholder="Describe your activity idea... e.g. 'casual coffee chat for finals week'"
              style={{
                width: '100%', boxSizing: 'border-box',
                backgroundColor: theme.inactiveBtnBg,
                border: `1px solid ${theme.cardBorder}`, borderRadius: '14px',
                padding: '14px', color: theme.text, minHeight: '72px',
                outline: 'none', fontSize: '14px', resize: 'none', marginBottom: '12px',
              }}
            />
            <button
              onClick={generateDescription}
              disabled={aiLoading || !aiPrompt.trim()}
              style={{
                width: '100%', padding: '12px', borderRadius: '14px', border: 'none',
                backgroundColor: aiLoading || !aiPrompt.trim() ? theme.inactiveBtnBg : '#FFD700',
                color: aiLoading || !aiPrompt.trim() ? '#475569' : '#050B18',
                fontWeight: '800', cursor: aiLoading ? 'not-allowed' : 'pointer', fontSize: '13px',
                opacity: !aiPrompt.trim() ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              {aiLoading ? '✨ Generating...' : '✨ Generate Description'}
            </button>
          </>
        ) : (
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            onFocus={() => setFocusedField('desc')}
            onBlur={() => setFocusedField(null)}
            placeholder="What's the plan?"
            style={{
              width: '100%', boxSizing: 'border-box',
              backgroundColor: 'transparent',
              border: 'none', outline: 'none',
              color: 'white', fontSize: '14px', resize: 'none', minHeight: '80px',
              lineHeight: '1.6',
            }}
          />
        )}
      </div>

      {/* ── REPEAT CARD ───────────────────────────────────────── */}
      <div style={{ ...glass, padding: '18px' }}>
        <span style={labelStyle}>REPEAT</span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['One-time', 'Daily', 'Weekly'].map((type) => (
            <div
              key={type}
              onClick={() => setRepeat(type)}
              style={{
                padding: '8px 18px', borderRadius: '20px',
                fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                backgroundColor: repeat === type ? 'rgba(255,215,0,0.1)' : theme.inactiveBtnBg,
                color: repeat === type ? '#FFD700' : '#64748b',
                border: repeat === type ? '1px solid rgba(255,215,0,0.3)' : `1px solid ${theme.cardBorder}`,
                transition: 'all 0.2s',
              }}
            >
              {type}
            </div>
          ))}
        </div>
      </div>

      {/* ── PUBLISH BUTTON ────────────────────────────────────── */}
      <button
        onClick={onPublish}
        style={{
          width: '100%', backgroundColor: '#FFD700', color: '#050B18',
          border: 'none', padding: '17px', borderRadius: '20px',
          fontWeight: '800', cursor: 'pointer', fontSize: '15px',
          letterSpacing: '0.2px',
          boxShadow: '0 4px 24px rgba(255,215,0,0.25), 0 1px 0 rgba(255,255,255,0.15) inset',
          transition: 'box-shadow 0.2s, transform 0.1s',
        }}
      >
        Publish Activity →
      </button>

    </div>
  );
};

export default DiscoveryTab;
