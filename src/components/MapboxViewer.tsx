import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { PreferredPlace } from '../types';
import { dataStore } from '../lib/supabase';
import { MapPin, Navigation, Coffee, BookOpen, Trees, Landmark } from 'lucide-react';

interface MapboxViewerProps {
  places: PreferredPlace[];
  userName: string;
  className?: string;
}

export const MapboxViewer: React.FC<MapboxViewerProps> = ({
  places,
  userName,
  className = 'h-64',
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(places[0]?.id || null);
  const [hasMapboxToken, setHasMapboxToken] = useState(false);

  useEffect(() => {
    const token = dataStore.getMapboxToken();
    if (!token || !token.startsWith('pk.') || !mapContainer.current || places.length === 0) {
      setHasMapboxToken(false);
      return;
    }

    setHasMapboxToken(true);

    try {
      mapboxgl.accessToken = token;
      const first = places[0];
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [first.longitude, first.latitude],
        zoom: 13,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      places.forEach((p, idx) => {
        const el = document.createElement('div');
        el.className = 'cursor-pointer';
        el.innerHTML = `
          <div style="background-color: #2E4A3D; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.25); border: 2px solid white;">
            ${idx + 1}
          </div>
        `;

        el.addEventListener('click', () => {
          setSelectedPlaceId(p.id);
        });

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 4px;">
            <strong style="color: #1F2421; font-size: 13px;">${p.label}</strong>
            ${p.address ? `<p style="font-size: 11px; color: #555; margin-top: 2px;">${p.address}</p>` : ''}
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([p.longitude, p.latitude])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });

      // Fit bounds if more than 1 place
      if (places.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        places.forEach((p) => bounds.extend([p.longitude, p.latitude]));
        map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
      }

      mapInstance.current = map;

      return () => {
        map.remove();
        mapInstance.current = null;
      };
    } catch (e) {
      console.warn('Mapbox view error:', e);
      setHasMapboxToken(false);
    }
  }, [places]);

  const getPlaceIcon = (type?: string) => {
    switch (type) {
      case 'library':
        return <BookOpen className="w-3.5 h-3.5 text-[#2E4A3D]" />;
      case 'park':
        return <Trees className="w-3.5 h-3.5 text-[#2E4A3D]" />;
      case 'cultural':
        return <Landmark className="w-3.5 h-3.5 text-[#2E4A3D]" />;
      default:
        return <Coffee className="w-3.5 h-3.5 text-[#2E4A3D]" />;
    }
  };

  if (!places || places.length === 0) {
    return (
      <div className="p-4 bg-[#F5F2EB] rounded-xl text-center text-xs text-[#717A74]">
        Aucun lieu favori épinglé pour le moment.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs text-[#525E56]">
        <span className="font-medium text-[#2E4A3D]">
          Lieux d'échange préférés de {userName} ({places.length})
        </span>
        <span className="text-[#848B85]">Oslo & environs</span>
      </div>

      <div className={`relative w-full ${className} rounded-xl overflow-hidden border border-[#E5E1D8] shadow-xs bg-[#EFECE6]`}>
        {hasMapboxToken ? (
          <div ref={mapContainer} className="w-full h-full" />
        ) : (
          /* Elegant clean fallback display */
          <div className="absolute inset-0 bg-gradient-to-b from-[#F7F5F0] to-[#EAE5DC] p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wide text-[#2E4A3D] uppercase">
                Carte des points de rencontre
              </span>
              <span className="text-[10px] text-[#717A74] bg-white/80 px-2 py-0.5 rounded border border-[#E0DACE]">
                Oslo, Norvège
              </span>
            </div>

            {/* Visual plot of places */}
            <div className="relative flex-1 my-2 rounded-lg border border-[#DCD5C8] bg-white/70 overflow-hidden flex items-center justify-center p-3">
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2">
                {places.map((place, idx) => {
                  const isSelected = selectedPlaceId === place.id;
                  return (
                    <div
                      key={place.id}
                      onClick={() => setSelectedPlaceId(place.id)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#2E4A3D] text-white border-[#2E4A3D] shadow-sm'
                          : 'bg-white text-[#1F2421] border-[#E5E1D8] hover:border-[#2E4A3D]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isSelected ? 'bg-white text-[#2E4A3D]' : 'bg-[#2E4A3D] text-white'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold truncate">{place.label}</span>
                      </div>
                      <p className={`text-[10px] truncate ${isSelected ? 'text-[#DDE5E0]' : 'text-[#717A74]'}`}>
                        {place.address || `${place.latitude.toFixed(3)}°N, ${place.longitude.toFixed(3)}°E`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#717A74]">
              <span className="flex items-center gap-1">
                <Navigation className="w-3 h-3 text-[#2E4A3D]" />
                Lieux propices aux tandems calmes
              </span>
              <span className="text-[10px]">Prêt pour le premier café</span>
            </div>
          </div>
        )}
      </div>

      {/* Place detail pill list with Google Maps action */}
      <div className="flex flex-wrap gap-2 pt-1">
        {places.map((p, idx) => (
          <div
            key={p.id}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-[#E5E1D8] text-xs text-[#2E4A3D] shadow-2xs hover:border-[#2E4A3D] transition-colors"
          >
            <span className="w-4 h-4 rounded-full bg-[#2E4A3D] text-white flex items-center justify-center text-[10px] font-bold">
              {idx + 1}
            </span>
            {getPlaceIcon(p.type)}
            <span className="font-medium text-[#1F2421]">{p.label}</span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-[11px] underline flex items-center gap-0.5 ml-1"
              title="Ouvrir dans Google Maps"
            >
              <span>Maps</span>
              <span className="text-[10px]">↗</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
