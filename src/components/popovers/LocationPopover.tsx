import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

const LocationPopover = ({ onSelect }: { onSelect: (val: string) => void }) => {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serviceRef = useRef<any>(null);

  // Load Google Maps script once
  useEffect(() => {
    if (window.google?.maps?.places) {
      setScriptLoaded(true);
      return;
    }
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      existing.addEventListener('load', () => setScriptLoaded(true));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Initialise AutocompleteService after script loads
  useEffect(() => {
    if (scriptLoaded) {
      serviceRef.current = new window.google.maps.places.AutocompleteService();
    }
  }, [scriptLoaded]);

  // Debounced predictions fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || !serviceRef.current) {
      setPredictions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      serviceRef.current.getPlacePredictions(
        { input: query },
        (results: any[], status: string) => {
          if (status === 'OK' && results) setPredictions(results.slice(0, 5));
          else setPredictions([]);
        }
      );
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 1000, width: '280px',
      backgroundColor: '#0F172A', borderRadius: '20px', padding: '12px',
      border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 25px rgba(0,0,0,0.4)'
    }}>
      {/* Search input */}
      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1A283D', borderRadius: '12px', padding: '10px 14px', marginBottom: '8px', gap: '8px' }}>
        <span style={{ fontSize: '14px' }}>🔍</span>
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search location..."
          style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: '13px', width: '100%' }}
        />
      </div>

      {/* Free-text fallback */}
      {query.trim() && (
        <div
          onClick={() => onSelect(query)}
          style={{ padding: '10px 14px', cursor: 'pointer', color: '#94A3B8', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '4px' }}
        >
          📍 Use "{query}"
        </div>
      )}

      {/* Google predictions */}
      {predictions.map((p) => (
        <div
          key={p.place_id}
          onClick={() => onSelect(p.description)}
          style={{ padding: '10px 14px', cursor: 'pointer', color: '#E2E8F0', fontSize: '13px', borderRadius: '10px' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          📍 {p.description}
        </div>
      ))}

      {/* Empty state */}
      {!query.trim() && (
        <div style={{ padding: '10px 14px', color: '#475569', fontSize: '12px' }}>
          Start typing to search places...
        </div>
      )}
    </div>
  );
};

export default LocationPopover;
