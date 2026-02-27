import { useState } from 'react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const TIMES = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM'];

const DateTimePopover = ({ onDone }: { onDone: (val: string) => void }) => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [selectedTime, setSelectedTime] = useState('6:00 PM');

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(1);
  };

  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 1000, width: '320px',
      backgroundColor: '#0F172A', borderRadius: '24px', padding: '20px',
      border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
    }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span onClick={prevMonth} style={{ cursor: 'pointer', padding: '4px 10px', fontSize: '18px' }}>‹</span>
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{MONTHS[month]} {year}</span>
        <span onClick={nextMonth} style={{ cursor: 'pointer', padding: '4px 10px', fontSize: '18px' }}>›</span>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '11px', marginBottom: '8px' }}>
        {DAYS.map(d => <span key={d} style={{ color: '#64748b' }}>{d}</span>)}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '13px', marginBottom: '16px' }}>
        {Array.from({ length: firstDayOfWeek }).map((_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
          <div
            key={day}
            onClick={() => setSelectedDay(day)}
            style={{
              padding: '7px 0', borderRadius: '50%', cursor: 'pointer',
              backgroundColor: selectedDay === day ? '#F3D99A' : 'transparent',
              color: selectedDay === day ? '#0F172A' : 'white'
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Time picker */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {TIMES.map(t => (
          <div
            key={t}
            onClick={() => setSelectedTime(t)}
            style={{
              padding: '5px 10px', borderRadius: '10px', fontSize: '11px', cursor: 'pointer', fontWeight: '600',
              backgroundColor: selectedTime === t ? '#F3D99A' : 'rgba(255,255,255,0.07)',
              color: selectedTime === t ? '#0F172A' : '#CBD5E1'
            }}
          >
            {t}
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          const [hm, ap] = selectedTime.split(' ');
          const compact = `${hm.split(':')[0]}${ap.toLowerCase()}`;
          onDone(`${MONTHS[month].slice(0, 3)} ${selectedDay}, ${compact}`);
        }}
        style={{ width: '100%', backgroundColor: '#F3D99A', color: '#0F172A', border: 'none', padding: '14px', borderRadius: '16px', fontWeight: '800', cursor: 'pointer' }}
      >
        Done
      </button>
    </div>
  );
};

export default DateTimePopover;
