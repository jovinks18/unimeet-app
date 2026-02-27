import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google: any;
    __joinActivity: (id: string) => void;
  }
}

const CATEGORY_ICONS: Record<string, string> = {
  SPORTS: '⚽', CULTURE: '🎨', FOOD: '🍴', COFFEE: '☕', MORE: '✨',
};

const makeMarkerSvg = (emoji: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44">
      <circle cx="22" cy="22" r="20" fill="#121E31" stroke="#F3D99A" stroke-width="2"/>
      <text x="22" y="29" text-anchor="middle" font-size="16">${emoji}</text>
    </svg>`
  )}`;

const MapView = ({ posts, theme, onJoin }: { posts: any[]; theme: any; onJoin: (id: string) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [locating, setLocating] = useState(false);

  // Ensure the Maps script is loaded (reuses existing script if LocationPopover already loaded it)
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

  // Global handler for InfoWindow join buttons (Maps InfoWindow only supports HTML strings)
  useEffect(() => {
    window.__joinActivity = (id: string) => {
      onJoin(id);
      infoWindowRef.current?.close();
    };
    return () => { delete (window as any).__joinActivity; };
  }, [onJoin]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      await ensureScript();
      if (cancelled || !containerRef.current) return;

      // Dark-themed map matching the app
      const map = new window.google.maps.Map(containerRef.current, {
        zoom: 15,
        center: { lat: 37.8719, lng: -122.2585 }, // UC Berkeley default — overridden by fitBounds
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
        styles: [
          { elementType: 'geometry',            stylers: [{ color: '#0d1b2e' }] },
          { elementType: 'labels.text.fill',    stylers: [{ color: '#8ec3b9' }] },
          { elementType: 'labels.text.stroke',  stylers: [{ color: '#1a3646' }] },
          { featureType: 'water',   elementType: 'geometry',            stylers: [{ color: '#0e1626' }] },
          { featureType: 'road',    elementType: 'geometry',            stylers: [{ color: '#1a283d' }] },
          { featureType: 'road',    elementType: 'geometry.stroke',     stylers: [{ color: '#255763' }] },
          { featureType: 'poi',     elementType: 'geometry',            stylers: [{ color: '#152235' }] },
          { featureType: 'poi.park',elementType: 'geometry',            stylers: [{ color: '#0d2318' }] },
          { featureType: 'transit', elementType: 'geometry',            stylers: [{ color: '#1a283d' }] },
          { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
        ],
      });

      mapRef.current = map;
      infoWindowRef.current = new window.google.maps.InfoWindow({ maxWidth: 240 });
      const geocoder = new window.google.maps.Geocoder();
      const bounds = new window.google.maps.LatLngBounds();
      let placed = 0;

      for (const post of posts) {
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
              url: makeMarkerSvg(icon),
              scaledSize: new window.google.maps.Size(44, 44),
              anchor: new window.google.maps.Point(22, 22),
            },
          });

          markersRef.current.push(marker);
          placed++;
          if (placed === 1 || placed <= posts.length) map.fitBounds(bounds);

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
  }, [posts]);

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

  return (
    <div style={{ position: 'relative', marginTop: '16px' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%', height: '480px', borderRadius: '24px',
          overflow: 'hidden', border: `1px solid ${theme.border}`,
        }}
      />
      <button
        onClick={locateMe}
        disabled={locating}
        style={{
          position: 'absolute', bottom: '16px', right: '16px',
          width: '44px', height: '44px', borderRadius: '14px',
          backgroundColor: locating ? 'rgba(243,217,154,0.15)' : '#121E31',
          border: '1px solid rgba(243,217,154,0.3)',
          color: locating ? 'rgba(243,217,154,0.4)' : '#F3D99A',
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
