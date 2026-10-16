import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { PreferredPlace } from '../types';
import { dataStore } from '../lib/supabase';
import { MapPin, Plus, Trash2, Search, Compass, Info, Check } from 'lucide-react';

interface MapboxPickerProps {
  places: PreferredPlace[];
  onChange: (places: PreferredPlace[]) => void;
  maxPlaces?: number;
}

const PRESET_CITIES = [
  { name: 'Oslo', coords: [10.7522, 59.9139] as [number, number], zoom: 13 },
  { name: 'Paris', coords: [2.3522, 48.8566] as [number, number], zoom: 13 },
  { name: 'Bergen', coords: [5.3221, 60.3913] as [number, number], zoom: 13 },
  { name: 'Lyon', coords: [4.8357, 45.7640] as [number, number], zoom: 13 },
];

export const MapboxPicker: React.FC<MapboxPickerProps> = ({
  places,
  onChange,
  maxPlaces = 3,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [token, setToken] = useState<string>(dataStore.getMapboxToken());
  const [mapError, setMapError] = useState<string | null>(null);
  const [tempLabel, setTempLabel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeCenter, setActiveCenter] = useState<[number, number]>([10.7522, 59.9139]);

  // Attempt to initialize Mapbox if token is present
  useEffect(() => {
    const currentToken = dataStore.getMapboxToken();
    setToken(currentToken);

    if (!currentToken || !currentToken.startsWith('pk.')) {
      setMapError('token_missing');
      return;
    }

    if (!mapContainer.current) return;

    try {
      mapboxgl.accessToken = currentToken;
      const initialCenter = places.length > 0
        ? [places[0].longitude, places[0].latitude] as [number, number]
        : [10.7522, 59.9139] as [number, number];

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: initialCenter,
        zoom: 12.5,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

      map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        handleAddPlaceFromCoords(lng, lat);
      });

      mapInstance.current = map;
      setMapError(null);

      return () => {
        map.remove();
        mapInstance.current = null;
      };
    } catch (err: any) {
      console.warn('Mapbox init error:', err);
      setMapError(err?.message || 'Erreur chargement Mapbox');
    }
  }, [token]);

  // Update Mapbox markers when places change
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clean old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    places.forEach((p, idx) => {
      const el = document.createElement('div');
      el.className = 'flex flex-col items-center cursor-pointer group';
      el.innerHTML = `
        <div style="background-color: #2E4A3D; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); border: 2px solid white;">
          ${idx + 1}
        </div>
        <div style="background-color: white; color: #1F2421; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); margin-top: 4px; white-space: nowrap; border: 1px solid #E5E1D8;">
          ${p.label}
        </div>
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([p.longitude, p.latitude])
        .addTo(mapInstance.current!);

      markersRef.current.push(marker);
    });
  }, [places]);

  const handleAddPlaceFromCoords = (lng: number, lat: number, suggestedLabel?: string) => {
    if (places.length >= maxPlaces) {
      alert(`Vous avez déjà sélectionné vos ${maxPlaces} lieux préférés.`);
      return;
    }

    const defaultNames = [
      'Café convivial',
      'Bibliothèque / Espace calme',
      'Parc pour discuter',
    ];
    const newPlace: PreferredPlace = {
      id: 'place_' + Date.now(),
      label: suggestedLabel || tempLabel || defaultNames[places.length] || `Lieu ${places.length + 1}`,
      longitude: Number(lng.toFixed(5)),
      latitude: Number(lat.toFixed(5)),
      type: 'cafe',
    };

    onChange([...places, newPlace]);
    setTempLabel('');
  };

  const handleRemovePlace = (id: string) => {
    onChange(places.filter((p) => p.id !== id));
  };

  const handleUpdateLabel = (id: string, newLabel: string) => {
    onChange(
      places.map((p) => (p.id === id ? { ...p, label: newLabel } : p))
    );
  };

  const jumpToCity = (coords: [number, number], zoom: number) => {
    setActiveCenter(coords);
    if (mapInstance.current) {
      mapInstance.current.flyTo({ center: coords, zoom, essential: true });
    }
  };

  const handleSearchAddress = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Nominatim OpenStreetMap geocoder (free, no key required)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        const label = searchQuery.split(',')[0].trim();

        if (mapInstance.current) {
          mapInstance.current.flyTo({ center: [lon, lat], zoom: 14 });
        }
        setActiveCenter([lon, lat]);
        handleAddPlaceFromCoords(lon, lat, label);
        setSearchQuery('');
      } else {
        alert('Lieu non trouvé. Essayez avec le nom de la ville (ex: Oslo, Grünerløkka).');
      }
    } catch {
      alert('Erreur lors de la recherche du lieu.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-[#525E56]">
          <MapPin className="w-4 h-4 text-[#2E4A3D]" />
          <span>Épinglez de 1 à 3 lieux où vous aimez retrouver votre tandem ({places.length}/{maxPlaces})</span>
        </div>

        {/* Quick jump to Oslo / Paris */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[#848B85]">Centrer sur :</span>
          {PRESET_CITIES.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => jumpToCity(c.coords, c.zoom)}
              className="px-2 py-0.5 rounded border border-[#E5E1D8] bg-white text-[#2E4A3D] hover:bg-[#F2EFE9] transition-colors"
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar for fast placing */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#848B85]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchAddress(e);
              }
            }}
            placeholder="Rechercher un café, adresse ou parc (ex: Fuglen Oslo, Deichman...)"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5E1D8] rounded-lg focus:outline-none focus:border-[#2E4A3D]"
          />
        </div>
        <button
          type="button"
          onClick={handleSearchAddress}
          disabled={isSearching || !searchQuery.trim() || places.length >= maxPlaces}
          className="px-4 py-2 bg-[#2E4A3D] text-white text-xs font-medium rounded-lg hover:bg-[#23382E] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSearching ? 'Recherche...' : 'Ajouter'}
        </button>
      </div>

      {/* Mapbox container OR Visual Interactive Fallback */}
      <div className="relative w-full h-72 rounded-xl overflow-hidden border border-[#E5E1D8] shadow-inner bg-[#EFECE6]">
        {mapError ? (
          /* Graceful Fallback Interactive Map (when token not entered yet) */
          <div className="absolute inset-0 p-4 flex flex-col justify-between bg-gradient-to-b from-[#F5F2EB] to-[#EAE5DC]">
            <div className="flex items-start justify-between">
              <div className="bg-white/90 backdrop-blur-sm p-2.5 rounded-lg border border-[#E0DACE] text-xs text-[#2E4A3D] max-w-sm">
                <div className="flex items-center gap-1.5 font-medium mb-1">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Mode cartographique prêt</span>
                </div>
                <p className="text-[#555E57] text-[11px] leading-relaxed">
                  Cliquez sur la carte stylisée ci-dessous pour placer un point à Oslo ou ajoutez directement vos adresses favorites.
                </p>
              </div>

              <div className="text-[11px] text-[#717A74] bg-white/80 px-2 py-1 rounded border border-[#E0DACE]">
                Oslo, Norvège (59.91° N, 10.75° E)
              </div>
            </div>

            {/* Stylized Oslo Fjord interactive canvas grid */}
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                // Approximate Oslo coordinate spread
                const lng = 10.72 + x * 0.08;
                const lat = 59.93 - y * 0.04;
                handleAddPlaceFromCoords(lng, lat);
              }}
              className="relative w-full h-44 cursor-crosshair rounded-lg border border-[#DCD5C8] bg-[#F7F5F0] overflow-hidden"
            >
              {/* Simulated Oslo Topography & Water lines */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#D8E4E8]/60 border-t border-[#BED2D8] flex items-center justify-center text-[10px] text-[#4A7280] font-medium tracking-wide">
                Oslofjorden (Fjord d'Oslo)
              </div>
              <div className="absolute top-2 left-4 text-[10px] text-[#8C867B] font-medium">
                Sentrum / Grünerløkka / Majorstuen
              </div>

              {/* Pins rendered on this fallback view */}
              {places.map((p, i) => {
                const leftPercent = Math.min(Math.max(((p.longitude - 10.72) / 0.08) * 100, 10), 90);
                const topPercent = Math.min(Math.max(((59.93 - p.latitude) / 0.04) * 100, 10), 80);

                return (
                  <div
                    key={p.id}
                    style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#2E4A3D] text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-md">
                      {i + 1}
                    </div>
                    <span className="text-[10px] font-semibold bg-white/95 px-1.5 py-0.5 rounded shadow text-[#1F2421] border border-[#E5E1D8] mt-0.5 whitespace-nowrap">
                      {p.label}
                    </span>
                  </div>
                );
              })}

              <div className="absolute bottom-2 right-2 text-[10px] text-[#8F9992] bg-white/90 px-2 py-0.5 rounded">
                Cliquez pour déposer un lieu
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#78827B] pt-1">
              <span>Clé Mapbox : personnalisable dans Réglages</span>
              <span>{places.length}/3 lieux définis</span>
            </div>
          </div>
        ) : (
          /* Live Mapbox GL container */
          <div ref={mapContainer} className="w-full h-full" />
        )}
      </div>

      {/* Selected Places List with Custom Labels */}
      {places.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-[#2E4A3D] uppercase tracking-wider">
            Vos lieux enregistrés :
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {places.map((place, idx) => (
              <div
                key={place.id}
                className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-[#E5E1D8] shadow-xs text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-5 h-5 rounded-full bg-[#2E4A3D] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={place.label}
                    onChange={(e) => handleUpdateLabel(place.id, e.target.value)}
                    placeholder="Nom du lieu..."
                    className="w-full bg-transparent font-medium text-[#1F2421] focus:outline-none focus:underline truncate"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePlace(place.id)}
                  className="p-1 text-[#8C938E] hover:text-red-600 transition-colors ml-1"
                  title="Supprimer ce lieu"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Add Suggestions */}
      {places.length < maxPlaces && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
          <span className="text-[#848B85]">Suggestions Oslo :</span>
          <button
            type="button"
            onClick={() => handleAddPlaceFromCoords(10.7402, 59.9171, 'Café Fuglen')}
            className="px-2 py-1 rounded bg-[#EFECE6] text-[#2E4A3D] hover:bg-[#E5E1D8] transition-colors"
          >
            + Fuglen Sentrum
          </button>
          <button
            type="button"
            onClick={() => handleAddPlaceFromCoords(10.7533, 59.9084, 'Deichman Bjørvika')}
            className="px-2 py-1 rounded bg-[#EFECE6] text-[#2E4A3D] hover:bg-[#E5E1D8] transition-colors"
          >
            + Deichman Bjørvika
          </button>
          <button
            type="button"
            onClick={() => handleAddPlaceFromCoords(10.7574, 59.9235, 'Tim Wendelboe (Grünerløkka)')}
            className="px-2 py-1 rounded bg-[#EFECE6] text-[#2E4A3D] hover:bg-[#E5E1D8] transition-colors"
          >
            + Tim Wendelboe
          </button>
          <button
            type="button"
            onClick={() => handleAddPlaceFromCoords(10.7008, 59.9270, 'Parc Vigeland')}
            className="px-2 py-1 rounded bg-[#EFECE6] text-[#2E4A3D] hover:bg-[#E5E1D8] transition-colors"
          >
            + Vigelandsparken
          </button>
        </div>
      )}
    </div>
  );
};
