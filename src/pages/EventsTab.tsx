const EventsTab = () => {
  const events = [
    {
      title: "Berkeley Web3 Meetup",
      day: "24",
      month: "FEB",
      location: "Wozniak Lounge",
      time: "6:00 PM",
      category: "Tech",
      color: "#60A5FA"
    },
    {
      title: "Spring Concert Series",
      day: "02",
      month: "MAR",
      location: "Lower Sproul",
      time: "8:00 PM",
      category: "Music",
      color: "#F472B6"
    }
  ];

  return (
    <div>
      {/* SEARCH & FILTERS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        <div style={{ 
          flex: 1, backgroundColor: '#121E31', borderRadius: '15px', padding: '12px 15px', 
          border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', fontSize: '14px' 
        }}>
          🔍 Search events...
        </div>
        <div style={{ 
          backgroundColor: '#121E31', borderRadius: '15px', padding: '12px', 
          border: '1px solid rgba(255,255,255,0.1)' 
        }}>
          📅
        </div>
      </div>

      <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '1px', display: 'block', marginBottom: '15px' }}>UPCOMING EVENTS</span>

      {/* EVENT CARDS */}
      {events.map((event) => (
        <div key={event.title} style={{ 
          backgroundColor: '#121E31', borderRadius: '24px', padding: '20px', 
          display: 'flex', gap: '20px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.05)' 
        }}>
          {/* DATE BADGE */}
          <div style={{ 
            backgroundColor: '#1A283D', borderRadius: '16px', minWidth: '60px', height: '70px', 
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>{event.day}</span>
            <span style={{ fontSize: '10px', fontWeight: '900', color: '#F3D99A' }}>{event.month}</span>
          </div>

          {/* EVENT DETAILS */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h4 style={{ margin: '0 0 5px 0', fontSize: '17px', fontWeight: 'bold' }}>{event.title}</h4>
              <span style={{ 
                fontSize: '10px', fontWeight: 'bold', color: event.color, 
                backgroundColor: `${event.color}11`, padding: '2px 8px', borderRadius: '6px' 
              }}>{event.category}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
              📍 {event.location} • 🕒 {event.time}
            </div>
            <button style={{ 
              backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', 
              color: 'white', padding: '6px 15px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' 
            }}>
              Interested
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventsTab;