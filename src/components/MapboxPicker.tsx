import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { PreferredPlace } from '../types';
import { dataStore } from '../lib/supabase';
import {
  MapPin,
  Plus,
  Trash2,
  Search,
  Compass,
  ExternalLink,
  Navigation,
  Sparkles,
  Coffee,
  BookOpen,
  Trees,
  Landmark,
  Check,
  Globe,
} from 'lucide-react';
import { useTranslation } from '../lib/i18n';

interface MapboxPickerProps {
  places: PreferredPlace[];
  onChange: (places: PreferredPlace[]) => void;
  maxPlaces?: number;
}

// Curated verified spots in Oslo ideal for language tandems
const CURATED_OSLO_SPOTS: {
  name: string;
  category: 'cafe' | 'library' | 'park' | 'cultural';
  coords: [number, number]; // [lng, lat]
  address: string;
  descFr: string;
  descNo: string;
}[] = [
  {
    name: 'Café Fuglen (Sentrum)',
    category: 'cafe',
    coords: [10.7402, 59.9171],
    address: 'Universitetsgata 2, 0164 Oslo',
    descFr: 'Ambiance vintage scandinave et café de spécialité réputé.',
    descNo: 'Kjent vintagekafé med rolig atmosfære for samtale.',
  },
  {
    name: 'Deichman Bjørvika (Bibliothèque)',
    category: 'library',
    coords: [10.7533, 59.9084],
    address: 'Anne-Cath, Vestlys plass 1, 0150 Oslo',
    descFr: 'La grande bibliothèque moderne près de l\'Opéra, coins calmes & café.',
    descNo: 'Oslos hovedbibliotek med fantastisk utsikt og stille soner.',
  },
  {
    name: 'Tim Wendelboe (Grünerløkka)',
    category: 'cafe',
    coords: [10.7574, 59.9235],
    address: 'Grüners gate 1, 0552 Oslo',
    descFr: 'Micro-torréfaction d\'exception au cœur de Grünerløkka.',
    descNo: 'Kaffe i verdensklasse i hjertet av Grünerløkka.',
  },
  {
    name: 'Kaffebrenneriet Birkelunden',
    category: 'cafe',
    coords: [10.7601, 59.9254],
    address: 'Thorvald Meyers gate 18, 0555 Oslo',
    descFr: 'Grand café lumineux donnant sur le parc Birkelunden.',
    descNo: 'Hyggelig møtested like ved Birkelunden park.',
  },
  {
    name: 'Litteraturhuset (Maison de la Littérature)',
    category: 'cultural',
    coords: [10.7301, 59.9189],
    address: 'Wergelandsveien 29, 0167 Oslo',
    descFr: 'Café littéraire Oslo, tables spacieuses idéales pour tandems.',
    descNo: 'Kafé Oslo med god plass og litterær atmosfære.',
  },
  {
    name: 'Kulturhuset Oslo (Youngstorget)',
    category: 'cultural',
    coords: [10.7495, 59.9148],
    address: 'Youngs gate 6, 0181 Oslo',
    descFr: 'Espace culturel convivial multi-étages très fréquenté par les expatriés.',
    descNo: 'Fleretasjers møteplass med kafeer og spill.',
  },
  {
    name: 'Parc Vigeland (Vigelandsparken)',
    category: 'park',
    coords: [10.7008, 59.9270],
    address: 'Nobels gate 32, 0268 Oslo',
    descFr: 'Balade conversationnelle en extérieur parmi les célèbres sculptures.',
    descNo: 'Flott for en spasertur og samtale i friluft.',
  },
  {
    name: 'Kaffebrenneriet Frogner plass',
    category: 'cafe',
    coords: [10.7071, 59.9213],
    address: 'Frognerveien 62, 0266 Oslo',
    descFr: 'Près de Majorstuen et Frogner, ambiance chaleureuse.',
    descNo: 'Koselig kafé nær Frognerparken.',
  },
];

const PRESET_CITIES = [
  { name: 'Oslo Sentrum', coords: [10.7522, 59.9139] as [number, number], zoom: 13 },
  { name: 'Grünerløkka', coords: [10.7580, 59.9240] as [number, number], zoom: 14 },
  { name: 'Majorstuen', coords: [10.7150, 59.9290] as [number, number], zoom: 14 },
  { name: 'Bjørvika', coords: [10.7550, 59.9070] as [number, number], zoom: 14 },
];

export const MapboxPicker: React.FC<MapboxPickerProps> = ({
  places,
  onChange,
  maxPlaces = 3,
}) => {
  const { locale } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [token, setToken] = useState<string>(dataStore.getMapboxToken());
  const [mapError, setMapError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<
    { label: string; address: string; lat: number; lon: number; type: 'cafe' | 'library' | 'park' | 'cultural' }[]
  >([]);
  const [showGoogleMapsImport, setShowGoogleMapsImport] = useState(false);
  const [googleMapsUrlInput, setGoogleMapsUrlInput] = useState('');
  const [googleImportFeedback, setGoogleImportFeedback] = useState<string | null>(null);

  // Initialize Mapbox if token is configured
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
      const initialCenter =
        places.length > 0
          ? ([places[0].longitude, places[0].latitude] as [number, number])
          : ([10.7522, 59.9139] as [number, number]);

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: initialCenter,
        zoom: 12.5,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

      map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        handleAddPlace(Number(lng.toFixed(5)), Number(lat.toFixed(5)), undefined, 'cafe');
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

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    places.forEach((p, idx) => {
      const el = document.createElement('div');
      el.className = 'flex flex-col items-center cursor-pointer group';
      el.innerHTML = `
        <div style="background-color: #2E4A3D; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; box-shadow: 0 4px 10px rgba(0,0,0,0.25); border: 2px solid white;">
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

  const handleAddPlace = (
    lng: number,
    lat: number,
    label?: string,
    type: 'cafe' | 'library' | 'park' | 'cultural' = 'cafe',
    address?: string
  ) => {
    if (places.length >= maxPlaces) {
      alert(
        locale === 'no'
          ? `Du har allerede valgt ${maxPlaces} favorittsteder.`
          : `Vous avez déjà sélectionné vos ${maxPlaces} lieux préférés.`
      );
      return;
    }

    const defaultNames = [
      locale === 'no' ? 'Kafé for prat' : 'Café convivial',
      locale === 'no' ? 'Rolig bibliotek' : 'Bibliothèque / Espace calme',
      locale === 'no' ? 'Møtepark' : 'Parc pour discuter',
    ];

    const newPlace: PreferredPlace = {
      id: 'place_' + Date.now(),
      label: label || defaultNames[places.length] || `Lieu ${places.length + 1}`,
      longitude: Number(lng.toFixed(5)),
      latitude: Number(lat.toFixed(5)),
      type,
      address,
    };

    onChange([...places, newPlace]);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleRemovePlace = (id: string) => {
    onChange(places.filter((p) => p.id !== id));
  };

  const handleUpdateLabel = (id: string, newLabel: string) => {
    onChange(places.map((p) => (p.id === id ? { ...p, label: newLabel } : p)));
  };

  const jumpToArea = (coords: [number, number], zoom: number) => {
    if (mapInstance.current) {
      mapInstance.current.flyTo({ center: coords, zoom, essential: true });
    }
  };

  // Perform search across curated spots and OpenStreetMap Nominatim
  const handlePerformSearch = async (queryText: string) => {
    const q = queryText.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    // 1. Filter curated Oslo spots immediately
    const matchedCurated = CURATED_OSLO_SPOTS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.descFr.toLowerCase().includes(q) ||
        s.descNo.toLowerCase().includes(q)
    ).map((s) => ({
      label: s.name,
      address: s.address,
      lat: s.coords[1],
      lon: s.coords[0],
      type: s.category,
    }));

    // 2. Fetch external Nominatim geocoder (biased to Norway / Oslo)
    try {
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q.includes('oslo') || q.includes('norway') || q.includes('norvège') ? q : `${q}, Oslo, Norway`
      )}&limit=4&addressdetails=1`;

      const res = await fetch(searchUrl);
      const data = await res.json();

      const externalResults = (data || []).map((item: any) => {
        const placeName = item.display_name.split(',')[0].trim();
        const addressPart = item.display_name.split(',').slice(0, 3).join(',').trim();
        let cat: 'cafe' | 'library' | 'park' | 'cultural' = 'cafe';
        if (item.type === 'library' || item.class === 'amenity' && item.type === 'library') {
          cat = 'library';
        } else if (item.type === 'park' || item.type === 'garden') {
          cat = 'park';
        } else if (item.type === 'arts_centre' || item.type === 'theatre' || item.type === 'museum') {
          cat = 'cultural';
        }

        return {
          label: placeName,
          address: addressPart,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: cat,
        };
      });

      // Deduplicate results
      const combined = [...matchedCurated];
      externalResults.forEach((ext: any) => {
        if (!combined.some((c) => Math.abs(c.lat - ext.lat) < 0.001 && Math.abs(c.lon - ext.lon) < 0.001)) {
          combined.push(ext);
        }
      });

      setSearchResults(combined.slice(0, 5));
    } catch {
      setSearchResults(matchedCurated);
    } finally {
      setIsSearching(false);
    }
  };

  // Parse Google Maps links or raw coordinates
  const handleParseGoogleMapsInput = () => {
    setGoogleImportFeedback(null);
    const input = googleMapsUrlInput.trim();
    if (!input) return;

    // Pattern 1: Raw coordinates like "59.9171, 10.7402"
    const coordMatch = input.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      handleAddPlace(lng, lat, 'Lieu Google Maps', 'cafe', `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
      setGoogleMapsUrlInput('');
      setGoogleImportFeedback(
        locale === 'no'
          ? 'Lieu lagt til fra Google Maps koordinater!'
          : 'Lieu ajouté depuis les coordonnées Google Maps !'
      );
      return;
    }

    // Pattern 2: Google Maps @lat,lng in URL (e.g. google.com/maps/place/.../@59.9171,10.7402,17z/...)
    const urlCoordMatch = input.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (urlCoordMatch) {
      const lat = parseFloat(urlCoordMatch[1]);
      const lng = parseFloat(urlCoordMatch[2]);

      // Extract place name from URL if possible
      let label = 'Lieu Google Maps';
      const placeNameMatch = input.match(/\/place\/([^/@]+)/);
      if (placeNameMatch && placeNameMatch[1]) {
        label = decodeURIComponent(placeNameMatch[1].replace(/\+/g, ' '));
      }

      handleAddPlace(lng, lat, label, 'cafe', `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
      setGoogleMapsUrlInput('');
      setGoogleImportFeedback(
        locale === 'no'
          ? `Lieu "${label}" importert fra Google Maps !`
          : `Lieu "${label}" importé depuis Google Maps !`
      );
      return;
    }

    // Pattern 3: User pasted a name or query (e.g. "Fuglen Oslo")
    handlePerformSearch(input);
    setGoogleImportFeedback(
      locale === 'no'
        ? 'Søker etter stedet i Oslo...'
        : 'Recherche du lieu dans Oslo...'
    );
  };

  const getCategoryIcon = (type?: string) => {
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

  return (
    <div className="space-y-4">
      {/* Top Header & Google Maps Coordination button */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 text-xs text-[#525E56]">
          <MapPin className="w-4 h-4 text-[#2E4A3D]" />
          <span>
            {locale === 'no'
              ? `Velg 1 til ${maxPlaces} favorittsteder for tandemmøter (${places.length}/${maxPlaces})`
              : `Épinglez de 1 à ${maxPlaces} lieux préférés pour vos tandems (${places.length}/${maxPlaces})`}
          </span>
        </div>

        {/* Google Maps External Discovery link */}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            searchQuery ? `${searchQuery} Oslo` : 'cafes bibliotheques Oslo Norvege'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-medium transition-all shadow-2xs"
          title="Ouvrir Google Maps dans un nouvel onglet"
        >
          <Globe className="w-3.5 h-3.5 text-blue-600" />
          <span>{locale === 'no' ? 'Søk på Google Maps' : 'Chercher sur Google Maps'}</span>
          <ExternalLink className="w-3 h-3 text-blue-500" />
        </a>
      </div>

      {/* Search Bar & Google Maps Coordination input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#848B85]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handlePerformSearch(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handlePerformSearch(searchQuery);
                }
              }}
              placeholder={
                locale === 'no'
                  ? 'Søk etter kafé, bibliotek, park eller adresse (f.eks. Fuglen, Deichman...)'
                  : 'Rechercher un café, bibliothèque, parc ou adresse (ex: Fuglen, Deichman...)'
              }
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D] shadow-2xs"
            />
          </div>

          <button
            type="button"
            onClick={() => handlePerformSearch(searchQuery)}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2.5 bg-[#2E4A3D] text-white text-xs font-medium rounded-xl hover:bg-[#23382E] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isSearching ? (locale === 'no' ? 'Søker...' : 'Recherche...') : locale === 'no' ? 'Søk' : 'Rechercher'}
          </button>

          <button
            type="button"
            onClick={() => setShowGoogleMapsImport(!showGoogleMapsImport)}
            className={`px-3 py-2.5 text-xs font-medium rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              showGoogleMapsImport
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
            }`}
            title="Importer depuis Google Maps"
          >
            <span>Google Maps</span>
          </button>
        </div>

        {/* Collapsible Google Maps Import Panel */}
        {showGoogleMapsImport && (
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-blue-950 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>
                  {locale === 'no'
                    ? 'Koordinering med Google Maps'
                    : 'Coordination avec Google Maps'}
                </span>
              </span>
              <a
                href="https://www.google.com/maps/search/cafes+Oslo/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-700 hover:underline flex items-center gap-1"
              >
                <span>Ouvrir Google Maps Oslo</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-[11px] text-blue-800 leading-relaxed">
              {locale === 'no'
                ? 'Kopier en lenke, et sted eller GPS-koordinater fra Google Maps (f.eks. "59.9171, 10.7402" eller en Google Maps URL) og lim inn her :'
                : 'Copiez un lien, un nom d\'établissement ou des coordonnées GPS depuis Google Maps (ex: "59.9171, 10.7402" ou un lien maps.google.com) et collez-les ici :'}
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={googleMapsUrlInput}
                onChange={(e) => setGoogleMapsUrlInput(e.target.value)}
                placeholder="https://maps.google.com/?q=... ou 59.9171, 10.7402"
                className="flex-1 px-3 py-2 text-xs bg-white border border-blue-300 rounded-xl focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={handleParseGoogleMapsInput}
                className="px-4 py-2 bg-blue-700 text-white font-medium rounded-xl hover:bg-blue-800 transition-colors cursor-pointer"
              >
                {locale === 'no' ? 'Legg til sted' : 'Ajouter ce lieu'}
              </button>
            </div>

            {googleImportFeedback && (
              <p className="text-[11px] font-medium text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                {googleImportFeedback}
              </p>
            )}
          </div>
        )}

        {/* Live Search Results Dropdown List */}
        {searchResults.length > 0 && (
          <div className="p-2 bg-white rounded-2xl border border-[#2E4A3D]/30 shadow-lg space-y-1 z-20">
            <div className="px-3 py-1 text-[11px] font-semibold text-[#2E4A3D] uppercase tracking-wider">
              {locale === 'no' ? 'Forslag til steder i Oslo :' : 'Lieux trouvés pour votre tandem :'}
            </div>
            {searchResults.map((result, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF8F5] transition-colors border border-transparent hover:border-[#E5E1D8]"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-[#EAE5DC] flex items-center justify-center shrink-0">
                    {getCategoryIcon(result.type)}
                  </div>
                  <div className="min-w-0">
                    <strong className="text-xs text-[#1F2421] block truncate">{result.label}</strong>
                    <span className="text-[11px] text-[#717A74] block truncate">{result.address}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${result.lat},${result.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-blue-600 hover:text-blue-800 transition-colors"
                    title="Voir sur Google Maps"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      handleAddPlace(result.lon, result.lat, result.label, result.type, result.address)
                    }
                    disabled={places.length >= maxPlaces}
                    className="px-3 py-1.5 bg-[#2E4A3D] text-white text-xs font-medium rounded-lg hover:bg-[#23382E] transition-all cursor-pointer disabled:opacity-50"
                  >
                    + {locale === 'no' ? 'Velg' : 'Sélectionner'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Map Container */}
      <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-[#E5E1D8] shadow-inner bg-[#EFECE6]">
        {mapError ? (
          /* Graceful Fallback Interactive Map of Oslo */
          <div className="absolute inset-0 p-4 flex flex-col justify-between bg-gradient-to-b from-[#F5F2EB] to-[#EAE5DC]">
            <div className="flex items-start justify-between">
              <div className="bg-white/95 backdrop-blur-sm p-2.5 rounded-xl border border-[#E0DACE] text-xs text-[#2E4A3D] max-w-sm shadow-xs">
                <div className="flex items-center gap-1.5 font-medium mb-1">
                  <Compass className="w-3.5 h-3.5 text-[#2E4A3D]" />
                  <span>
                    {locale === 'no' ? 'Kart over Oslo klar' : 'Carte interactive d\'Oslo prête'}
                  </span>
                </div>
                <p className="text-[#555E57] text-[11px] leading-relaxed">
                  {locale === 'no'
                    ? 'Klikk på kartet for å sette en markør, eller velg blant de anbefalte kafeene og bibliotekene.'
                    : 'Cliquez sur la carte stylisée pour déposer un point de rencontre ou choisissez dans les suggestions ci-dessous.'}
                </p>
              </div>

              <div className="text-[11px] text-[#717A74] bg-white/90 px-2.5 py-1 rounded-lg border border-[#E0DACE]">
                Oslo (59.91° N, 10.75° E)
              </div>
            </div>

            {/* Stylized Oslo Canvas */}
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                const lng = 10.70 + x * 0.10;
                const lat = 59.935 - y * 0.045;
                handleAddPlace(Number(lng.toFixed(5)), Number(lat.toFixed(5)));
              }}
              className="relative w-full h-44 cursor-crosshair rounded-xl border border-[#DCD5C8] bg-[#F7F5F0] overflow-hidden shadow-inner"
            >
              {/* Fjord */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#D8E4E8]/70 border-t border-[#BED2D8] flex items-center justify-center text-[10px] text-[#4A7280] font-medium tracking-wide">
                Oslofjorden · Bjørvika & Aker Brygge
              </div>
              <div className="absolute top-2 left-4 text-[10px] text-[#8C867B] font-medium">
                Sentrum · Grünerløkka · Majorstuen · Frogner
              </div>

              {/* Pins */}
              {places.map((p, i) => {
                const leftPercent = Math.min(Math.max(((p.longitude - 10.70) / 0.10) * 100, 8), 92);
                const topPercent = Math.min(Math.max(((59.935 - p.latitude) / 0.045) * 100, 8), 85);

                return (
                  <div
                    key={p.id}
                    style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all z-10"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#2E4A3D] text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-md">
                      {i + 1}
                    </div>
                    <span className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded shadow text-[#1F2421] border border-[#E5E1D8] mt-0.5 whitespace-nowrap">
                      {p.label}
                    </span>
                  </div>
                );
              })}

              <div className="absolute bottom-2 right-2 text-[10px] text-[#8F9992] bg-white/95 px-2 py-0.5 rounded border border-[#E5E1D8]">
                {locale === 'no' ? 'Klikk for å sette et sted' : 'Cliquez pour placer un lieu'}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#78827B] pt-1">
              <span>{places.length}/{maxPlaces} {locale === 'no' ? 'steder valgt' : 'lieux choisis'}</span>
              <span>Oslo Sentrum & Bydeler</span>
            </div>
          </div>
        ) : (
          <div ref={mapContainer} className="w-full h-full" />
        )}
      </div>

      {/* Selected Places List with Google Maps Links */}
      {places.length > 0 && (
        <div className="space-y-2.5">
          <span className="text-xs font-medium text-[#2E4A3D] uppercase tracking-wider block">
            {locale === 'no' ? 'Dine valgte møtesteder :' : 'Vos lieux enregistrés pour les tandems :'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {places.map((place, idx) => (
              <div
                key={place.id}
                className="flex flex-col justify-between p-3 bg-white rounded-xl border border-[#E5E1D8] shadow-xs text-xs space-y-2 hover:border-[#2E4A3D] transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
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
                    className="p-1 text-[#8C938E] hover:text-red-600 transition-colors"
                    title="Supprimer ce lieu"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {place.address && (
                  <p className="text-[11px] text-[#717A74] truncate pl-7">
                    {place.address}
                  </p>
                )}

                <div className="pt-1.5 border-t border-[#F5F2EB] flex items-center justify-between text-[11px]">
                  <span className="text-[#8C938E]">
                    {place.latitude.toFixed(3)}°N, {place.longitude.toFixed(3)}°E
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Curated Recommendations for Oslo */}
      {places.length < maxPlaces && (
        <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E5E1D8] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1F2421] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2E4A3D]" />
              <span>
                {locale === 'no'
                  ? 'Anbefalte steder i Oslo (1-klikk) :'
                  : 'Lieux phares recommandés à Oslo (1 clic) :'}
              </span>
            </span>
            <span className="text-[11px] text-[#717A74]">
              {locale === 'no' ? 'Perfekt for språktandem' : 'Idéal pour discuter au calme'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {CURATED_OSLO_SPOTS.slice(0, 4).map((spot) => (
              <button
                key={spot.name}
                type="button"
                onClick={() =>
                  handleAddPlace(
                    spot.coords[0],
                    spot.coords[1],
                    spot.name,
                    spot.category,
                    spot.address
                  )
                }
                className="p-2.5 bg-white rounded-xl border border-[#E5E1D8] hover:border-[#2E4A3D] text-left transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-md bg-[#FAF8F5] flex items-center justify-center shrink-0">
                    {getCategoryIcon(spot.category)}
                  </div>
                  <strong className="text-xs text-[#1F2421] group-hover:text-[#2E4A3D] truncate block">
                    {spot.name}
                  </strong>
                </div>
                <p className="text-[10px] text-[#717A74] line-clamp-1">{spot.address}</p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#2E4A3D] font-medium">
                  <span>+ {locale === 'no' ? 'Legg til' : 'Ajouter'}</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${spot.coords[1]},${spot.coords[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:underline flex items-center gap-0.5"
                    title="Voir sur Google Maps"
                  >
                    <span>Maps</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
