import { useEffect, useRef, useState, useMemo } from 'react';

declare global {
  interface Window {
    google: any;
    __joinActivity: (id: string) => void;
  }
}

const CATEGORY_ICONS: Record<string, string> = {
  SPORTS: '⚽', CULTURE: '🎨', FOOD: '🍴', COFFEE: '☕', MORE: '✨',
};

// Small golden glowing dot — replaces the default red pin
const GOLDEN_DOT = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36">
    <defs>
      <filter id="g" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="4" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <circle cx="18" cy="18" r="13" fill="#FFD700" opacity="0.18" filter="url(#g)"/>
    <circle cx="18" cy="18" r="6" fill="#FFD700"/>
    <circle cx="18" cy="18" r="2.8" fill="#fff" opacity="0.8"/>
  </svg>`
)}`;

// Deep navy map theme matching #050B18 background
const MAP_DARK_STYLES = [
  { elementType: 'geometry',                                        stylers: [{ color: '#050B18' }] },
  { elementType: 'labels.text.fill',                               stylers: [{ color: '#64748b' }] },
  { elementType: 'labels.text.stroke',                             stylers: [{ color: '#050B18' }] },
  { featureType: 'water',       elementType: 'geometry',           stylers: [{ color: '#03080F' }] },
  { featureType: 'road',        elementType: 'geometry',           stylers: [{ color: '#0A1628' }] },
  { featureType: 'road',        elementType: 'geometry.stroke',    stylers: [{ color: '#0F1E33' }] },
  { featureType: 'road.highway',elementType: 'geometry',           stylers: [{ color: '#0D1F36' }] },
  { featureType: 'poi',         elementType: 'geometry',           stylers: [{ color: '#071524' }] },
  { featureType: 'poi.park',    elementType: 'geometry',           stylers: [{ color: '#061A0F' }] },
  { featureType: 'transit',     elementType: 'geometry',           stylers: [{ color: '#0A1628' }] },
  { featureType: 'landscape',   elementType: 'geometry',           stylers: [{ color: '#060E1C' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1E2D45' }] },
];

const MapView = ({
  posts,
  theme,
  onJoin,
  onCreateEvent,
}: {
  posts: any[];
  theme: any;
  onJoin: (id: string) => void;
  onCreateEvent?: () => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [locating, setLocating] = useState(false);
  const [search, setSearch] = useState('');

  const filteredPosts = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.toLowerCase();
    return posts.filter(p =>
      p.description?.toLowerCase().includes(q) ||
      p.where_location?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  }, [posts, search]);

  const ensureScript = (): Promise<void> =>
    new Promise((resolve) => {
      if (window.google?.maps) { resolve(); return; }
      const existing = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existing) { existing.addEventListener('load', () => resolve()); return; }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
      script.async = true;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });

  useEffect(() => {
    window.__joinActivity = (id: string) => {
      onJoin(id);
      infoWindowRef.current?.close();
    };
    return () => { delete (window as any).__joinActivity; };
  }, [onJoin]);

  useEffect(() => {
    if (filteredPosts.length === 0) return;
    let cancelled = false;

    const init = async () => {
      await ensureScript();
      if (cancelled || !containerRef.current) return;

      const map = new window.google.maps.Map(containerRef.current, {
        zoom: 15,
        center: { lat: 37.8719, lng: -122.2585 },
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
        styles: MAP_DARK_STYLES,
      });

      mapRef.current = map;
      infoWindowRef.current = new window.google.maps.InfoWindow({ maxWidth: 240 });
      const geocoder = new window.google.maps.Geocoder();
      const bounds = new window.google.maps.LatLngBounds();
      let placed = 0;

      for (const post of filteredPosts) {
        if (!post.where_location) continue;
        geocoder.geocode({ address: post.where_location }, (results: any[], status: string) => {
          if (cancelled || status !== 'OK' || !results?.[0]) return;

          const position = results[0].geometry.location;
          bounds.extend(position);

          const icon = CATEGORY_ICONS[post.category] ?? '📍';
          const marker = new window.google.maps.Marker({
            position,
            map,
            title: post.description,
            icon: {
              url: GOLDEN_DOT,
              scaledSize: new window.google.maps.Size(36, 36),
              anchor: new window.google.maps.Point(18, 18),
            },
          });

          markersRef.current.push(marker);
          placed++;
          if (placed === 1 || placed <= filteredPosts.length) map.fitBounds(bounds);

          marker.addListener('click', () => {
            infoWindowRef.current.setContent(`
              <div class="map-info-window">
                <div class="miw-icon">${icon}</div>
                <div class="miw-title">${post.profiles?.full_name ?? 'Someone'}'s Plan</div>
                <div class="miw-desc">${post.description ?? ''}</div>
                <div class="miw-meta">📍 ${post.where_location}${post.when_time ? ' • 🕒 ' + post.when_time : ''}</div>
                <button class="miw-join" onclick="window.__joinActivity('${post.id}')">Join Plan</button>
              </div>
            `);
            infoWindowRef.current.open({ map, anchor: marker });
          });
        });
      }
    };

    init();

    return () => {
      cancelled = true;
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
      infoWindowRef.current?.close();
    };
  }, [filteredPosts]);

  const locateMe = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        mapRef.current.setZoom(15);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  };

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (posts.length === 0) {
    return (
      <div style={{ marginTop: '16px' }}>
        {/* Search bar */}
        <input
          type="text"
          placeholder="🔍 Search events on the map..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="map-search-input"
          style={{
            width: '100%', backgroundColor: 'rgba(15,23,42,0.75)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,215,0,0.3)', borderRadius: '16px',
            padding: '13px 18px', color: 'white', fontSize: '14px',
            outline: 'none', boxSizing: 'border-box', marginBottom: '12px',
          }}
        />

        {/* Empty bento card */}
        <div style={{
          backgroundColor: 'rgba(15,23,42,0.92)', borderRadius: '32px',
          padding: '56px 24px', border: '1px solid rgba(255,215,0,0.1)',
          backdropFilter: 'blur(16px)', textAlign: 'center',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', gap: '20px',
        }}>
          <div style={{ fontSize: '52px' }}>🗺️</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '8px', lineHeight: 1.3 }}>
              The map is quiet today...
            </div>
            <div style={{ fontSize: '13px', color: '#475569' }}>
              No plans nearby yet. Be the first to set something up!
            </div>
          </div>
          {onCreateEvent && (
            <button
              onClick={onCreateEvent}
              style={{
                backgroundColor: '#FFD700', color: '#050B18', border: 'none',
                padding: '14px 32px', borderRadius: '16px',
                fontWeight: '800', fontSize: '14px', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(255,215,0,0.3)',
              }}
            >
              + Start an Event
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Map view ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', marginTop: '16px' }}>

      {/* Glassmorphic search bar — floats above the map */}
      <div style={{ position: 'absolute', top: '12px', left: '12px', right: '60px', zIndex: 10 }}>
        <input
          type="text"
          placeholder="🔍 Search the map..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="map-search-input"
          style={{
            width: '100%', backgroundColor: 'rgba(5,11,24,0.78)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,215,0,0.35)', borderRadius: '14px',
            padding: '11px 16px', color: 'white', fontSize: '13px',
            outline: 'none', boxSizing: 'border-box',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}
        />
      </div>

      {/* Map container */}
      <div
        ref={containerRef}
        style={{
          width: '100%', height: '480px', borderRadius: '24px',
          overflow: 'hidden', border: `1px solid ${theme.border}`,
        }}
      />

      {/* Floating: Start an Event (bottom-left) */}
      {onCreateEvent && (
        <button
          onClick={onCreateEvent}
          style={{
            position: 'absolute', bottom: '16px', left: '16px',
            height: '44px', padding: '0 18px',
            borderRadius: '14px', backgroundColor: '#FFD700',
            border: 'none', color: '#050B18',
            fontSize: '12px', fontWeight: '800', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '5px',
            boxShadow: '0 4px 16px rgba(255,215,0,0.3)',
            transition: 'all 0.2s',
          }}
        >
          + Start an Event
        </button>
      )}

      {/* Locate me (bottom-right) */}
      <button
        onClick={locateMe}
        disabled={locating}
        style={{
          position: 'absolute', bottom: '16px', right: '16px',
          width: '44px', height: '44px', borderRadius: '14px',
          backgroundColor: locating ? 'rgba(255,215,0,0.15)' : 'rgba(5,11,24,0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,215,0,0.3)',
          color: locating ? 'rgba(255,215,0,0.4)' : '#FFD700',
          fontSize: '20px', cursor: locating ? 'default' : 'pointer',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          transition: 'all 0.2s',
        }}
        title="Locate me"
      >
        🎯
      </button>
    </div>
  );
};

export default MapView;
