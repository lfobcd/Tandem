import React, { useState } from 'react';
import { PreferredPlace } from '../types';
import {
  MapPin,
  Trash2,
  Search,
  ExternalLink,
  Navigation,
  Sparkles,
  Coffee,
  BookOpen,
  Trees,
  Landmark,
  Layers,
  Plus,
  Check,
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
    descFr: 'Ambiance vintage scandinave et café d\'exception, calme et réputé.',
    descNo: 'Kjent vintagekafé med rolig atmosfære for samtale.',
  },
  {
    name: 'Deichman Bjørvika (Bibliothèque)',
    category: 'library',
    coords: [10.7533, 59.9084],
    address: 'Anne-Cath, Vestlys plass 1, 0150 Oslo',
    descFr: 'La grande bibliothèque moderne près de l\'Opéra, coins calmes & café.',
    descNo: 'Oslos hovedbibliotek med fantastisk utsikt og rolige soner.',
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
    descFr: 'Espace culturel convivial multi-étages très apprécié pour échanger.',
    descNo: 'Fleretasjers møteplass med kafeer og uformell stemning.',
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
    descFr: 'Près de Majorstuen et Frogner, ambiance chaleureuse et lumineuse.',
    descNo: 'Koselig kafé nær Frognerparken.',
  },
  {
    name: 'Sentralen Kafé (Sentrum)',
    category: 'cultural',
    coords: [10.7431, 59.9118],
    address: 'Øvre Slottsgate 3, 0157 Oslo',
    descFr: 'Ancien bâtiment de banque réaménagé, grands canapés et tables de travail.',
    descNo: 'Flott kafé og kulturarena i Oslo sentrum med god plass.',
  },
  {
    name: 'Stockfleths Prinsens gate',
    category: 'cafe',
    coords: [10.7456, 59.9112],
    address: 'Prinsens gate 6, 0152 Oslo',
    descFr: 'Café historique près de la gare centrale (Jernbanetorget).',
    descNo: 'Klassisk kaffebar i sentrum like ved Jernbanetorget.',
  },
];

export const MapboxPicker: React.FC<MapboxPickerProps> = ({
  places,
  onChange,
  maxPlaces = 3,
}) => {
  const { locale } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<
    { label: string; address: string; lat: number; lon: number; type: 'cafe' | 'library' | 'park' | 'cultural' }[]
  >([]);
  const [mapType, setMapType] = useState<'m' | 'k'>('m');
  const [activePreviewQuery, setActivePreviewQuery] = useState<string>(
    places[0]?.label ? `${places[0].label}, ${places[0].address || 'Oslo'}` : 'Oslo, Norway'
  );

  const [showManualGoogleMaps, setShowManualGoogleMaps] = useState(false);
  const [googleMapsUrlInput, setGoogleMapsUrlInput] = useState('');
  const [googleImportFeedback, setGoogleImportFeedback] = useState<string | null>(null);

  // Helper to add place
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
          ? `Du kan velge maksimalt ${maxPlaces} favorittsteder.`
          : `Vous pouvez enregistrer un maximum de ${maxPlaces} lieux préférés.`
      );
      return;
    }

    const defaultNames = [
      locale === 'no' ? 'Kafé for samtale' : 'Café convivial',
      locale === 'no' ? 'Rolig bibliotek' : 'Bibliothèque calme',
      locale === 'no' ? 'Møtepark' : 'Parc de rencontre',
    ];

    const finalLabel = label || defaultNames[places.length] || `Lieu ${places.length + 1}`;
    const newPlace: PreferredPlace = {
      id: 'place_' + Date.now(),
      label: finalLabel,
      longitude: Number(lng.toFixed(5)),
      latitude: Number(lat.toFixed(5)),
      type,
      address: address || `${finalLabel}, Oslo`,
    };

    const updated = [...places, newPlace];
    onChange(updated);
    setActivePreviewQuery(address ? `${finalLabel}, ${address}` : `${finalLabel}, Oslo, Norway`);
    setSearchResults([]);
    setSearchQuery('');
    setHasSearched(false);
  };

  // Direct addition of whatever the user typed (e.g. "credo restaurant")
  const handleAddPlaceDirectly = async (rawName: string) => {
    const trimmed = rawName.trim();
    if (!trimmed) return;

    if (places.length >= maxPlaces) {
      alert(
        locale === 'no'
          ? `Du kan velge maksimalt ${maxPlaces} favorittsteder.`
          : `Vous pouvez enregistrer un maximum de ${maxPlaces} lieux préférés.`
      );
      return;
    }

    // Default coordinates in Oslo
    let lat = 59.9139;
    let lon = 10.7522;
    let detectedAddress = `${trimmed}, Oslo`;
    let cat: 'cafe' | 'library' | 'park' | 'cultural' = 'cafe';

    const lower = trimmed.toLowerCase();
    if (lower.includes('bibliotek') || lower.includes('deichman') || lower.includes('library')) {
      cat = 'library';
    } else if (lower.includes('park') || lower.includes('hage') || lower.includes('garden')) {
      cat = 'park';
    } else if (lower.includes('museum') || lower.includes('musée') || lower.includes('kultur') || lower.includes('teater')) {
      cat = 'cultural';
    }

    // Check if matching result already in searchResults
    const matched = searchResults.find(
      (r) => r.label.toLowerCase().includes(lower) || lower.includes(r.label.toLowerCase())
    );

    if (matched) {
      lat = matched.lat;
      lon = matched.lon;
      detectedAddress = matched.address;
      cat = matched.type;
    } else {
      // Try quick geocode lookup for Norway
      try {
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          trimmed.includes('oslo') || trimmed.includes('norway') ? trimmed : `${trimmed}, Norway`
        )}&limit=1&addressdetails=1`;
        const res = await fetch(geocodeUrl);
        const data = await res.json();
        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lon = parseFloat(data[0].lon);
          const parts = data[0].display_name.split(',');
          detectedAddress = parts.slice(0, 3).join(',').trim();
        }
      } catch {
        // Fallback to default Oslo coords
      }
    }

    handleAddPlace(lon, lat, trimmed, cat, detectedAddress);
  };

  const handleRemovePlace = (id: string) => {
    const updated = places.filter((p) => p.id !== id);
    onChange(updated);
    if (updated.length > 0) {
      setActivePreviewQuery(`${updated[0].label}, ${updated[0].address || 'Oslo'}`);
    } else {
      setActivePreviewQuery('Oslo, Norway');
    }
  };

  const handleUpdateLabel = (id: string, newLabel: string) => {
    onChange(places.map((p) => (p.id === id ? { ...p, label: newLabel } : p)));
  };

  // Perform search across curated spots and OpenStreetMap Nominatim for Oslo
  const handlePerformSearch = async (queryText: string) => {
    const q = queryText.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    // Update active map preview immediately so Google Maps centers on it!
    setActivePreviewQuery(`${queryText}, Oslo, Norway`);

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

    // 2. Fetch external Nominatim geocoder (flexible query with countrycode NO)
    try {
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q
      )}&countrycodes=no&limit=6&addressdetails=1`;

      const res = await fetch(searchUrl);
      const data = await res.json();

      const externalResults = (data || []).map((item: any) => {
        const placeName = item.display_name.split(',')[0].trim();
        const addressPart = item.display_name.split(',').slice(0, 3).join(',').trim();
        let cat: 'cafe' | 'library' | 'park' | 'cultural' = 'cafe';
        if (item.type === 'library' || (item.class === 'amenity' && item.type === 'library')) {
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

      setSearchResults(combined.slice(0, 6));
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
      handleAddPlace(lng, lat, 'Lieu Google Maps', 'cafe', `Oslo (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`);
      setGoogleMapsUrlInput('');
      setGoogleImportFeedback(
        locale === 'no'
          ? 'Sted lagt til fra Google Maps koordinater !'
          : 'Lieu ajouté depuis les coordonnées Google Maps !'
      );
      return;
    }

    // Pattern 2: Google Maps @lat,lng in URL (e.g. google.com/maps/place/.../@59.9171,10.7402,17z/...)
    const urlCoordMatch = input.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (urlCoordMatch) {
      const lat = parseFloat(urlCoordMatch[1]);
      const lng = parseFloat(urlCoordMatch[2]);

      let label = 'Lieu Google Maps';
      const placeNameMatch = input.match(/\/place\/([^/@]+)/);
      if (placeNameMatch && placeNameMatch[1]) {
        label = decodeURIComponent(placeNameMatch[1].replace(/\+/g, ' '));
      }

      handleAddPlace(lng, lat, label, 'cafe', `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
      setGoogleMapsUrlInput('');
      setGoogleImportFeedback(
        locale === 'no'
          ? `Sted "${label}" lagt til fra Google Maps !`
          : `Lieu "${label}" importé depuis Google Maps !`
      );
      return;
    }

    // Pattern 3: User typed a name or query (e.g. "credo restaurant")
    handleAddPlaceDirectly(input);
    setGoogleMapsUrlInput('');
    setGoogleImportFeedback(
      locale === 'no'
        ? `Lagt til : "${input}"`
        : `Lieu ajouté : "${input}"`
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

  const currentEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    activePreviewQuery
  )}&t=${mapType}&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="space-y-4">
      {/* Top Header & Google Maps status */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs text-[#525E56]">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
            <span>Google Maps</span>
          </span>
          <span className="font-medium text-[#1F2421]">
            {locale === 'no'
              ? `Velg 1 til ${maxPlaces} favorittsteder for tandemmøter (${places.length}/${maxPlaces})`
              : `Choisissez de 1 à ${maxPlaces} lieux de rencontre préférés (${places.length}/${maxPlaces})`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Satellite vs Plan button */}
          <button
            type="button"
            onClick={() => setMapType(mapType === 'm' ? 'k' : 'm')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
              mapType === 'k'
                ? 'bg-[#2E4A3D] text-white border-[#2E4A3D]'
                : 'bg-white text-[#525E56] border-[#E5E1D8] hover:bg-[#FAF8F5]'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>{mapType === 'k' ? (locale === 'no' ? 'Satellitt' : 'Satellite') : (locale === 'no' ? 'Plan' : 'Plan')}</span>
          </button>

          {/* External Google Maps Oslo link */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              searchQuery ? `${searchQuery} Oslo` : 'cafes restaurants bibliotheques Oslo Norvege'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-medium transition-all shadow-2xs"
            title="Ouvrir Google Maps dans un nouvel onglet"
          >
            <span>{locale === 'no' ? 'Google Maps Oslo' : 'Google Maps Oslo'}</span>
            <ExternalLink className="w-3 h-3 text-rose-600" />
          </a>
        </div>
      </div>

      {/* Search Bar & Direct Action Buttons */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#848B85]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActivePreviewQuery(`${e.target.value}, Oslo, Norway`);
                handlePerformSearch(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    handleAddPlaceDirectly(searchQuery);
                  }
                }
              }}
              placeholder={
                locale === 'no'
                  ? 'Skriv inn kafé, restaurant, bibliotek eller adresse (f.eks. Credo restaurant, Fuglen...)'
                  : 'Tapez un café, restaurant, bibliothèque ou adresse (ex: Credo restaurant, Fuglen, Deichman...)'
              }
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D] shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Direct Add Button - ALWAYS allows adding what was typed */}
            <button
              type="button"
              onClick={() => handleAddPlaceDirectly(searchQuery)}
              disabled={!searchQuery.trim() || places.length >= maxPlaces}
              className="px-4 py-2.5 bg-[#2E4A3D] text-white text-xs font-semibold rounded-xl hover:bg-[#23382E] transition-all disabled:opacity-40 cursor-pointer shadow-xs flex items-center gap-1.5"
              title="Ajouter directement ce lieu à votre profil"
            >
              <Plus className="w-4 h-4" />
              <span>{locale === 'no' ? 'Legg til sted' : 'Ajouter ce lieu'}</span>
            </button>

            <button
              type="button"
              onClick={() => handlePerformSearch(searchQuery)}
              disabled={isSearching || !searchQuery.trim()}
              className="px-3 py-2.5 bg-[#FAF8F5] text-[#2E4A3D] border border-[#E5E1D8] text-xs font-medium rounded-xl hover:bg-[#EAE5DC] transition-colors disabled:opacity-40 cursor-pointer"
            >
              {isSearching ? (locale === 'no' ? 'Søker...' : 'Recherche...') : locale === 'no' ? 'Søk' : 'Rechercher'}
            </button>

            <button
              type="button"
              onClick={() => setShowManualGoogleMaps(!showManualGoogleMaps)}
              className={`px-3 py-2.5 text-xs font-medium rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                showManualGoogleMaps
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
              }`}
              title="Coller un lien ou coordonnées Google Maps"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lien Google Maps</span>
            </button>
          </div>
        </div>

        {/* PROMINENT DIRECT ADD ACTION BANNER: Triggers as soon as user types (solves the Credo restaurant case instantly!) */}
        {searchQuery.trim().length >= 2 && (
          <div className="p-3 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border-2 border-emerald-400 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#2E4A3D] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                +
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <strong className="text-xs text-[#1F2421] truncate block">
                    {locale === 'no' ? `Legg til « ${searchQuery} »` : `Ajouter « ${searchQuery} »`}
                  </strong>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                    Google Maps
                  </span>
                </div>
                <span className="text-[11px] text-[#525E56] truncate block">
                  {locale === 'no'
                    ? 'Klikk for å lagre dette stedet direkte på din profil'
                    : 'Cliquez pour enregistrer ce lieu immédiatement sur votre profil'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleAddPlaceDirectly(searchQuery)}
              disabled={places.length >= maxPlaces}
              className="px-4 py-2 bg-[#2E4A3D] text-white text-xs font-semibold rounded-xl hover:bg-[#23382E] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{locale === 'no' ? 'Legg til nå (1 klikk)' : 'Ajouter maintenant (1 clic)'}</span>
            </button>
          </div>
        )}

        {/* Collapsible Google Maps Link / GPS input */}
        {showManualGoogleMaps && (
          <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-rose-950 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span>
                  {locale === 'no'
                    ? 'Legg til direkte fra Google Maps'
                    : 'Ajouter directement depuis Google Maps'}
                </span>
              </span>
              <a
                href="https://www.google.com/maps/search/cafes+restaurants+Oslo/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-rose-700 hover:underline flex items-center gap-1"
              >
                <span>Ouvrir Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-[11px] text-rose-800 leading-relaxed">
              {locale === 'no'
                ? 'Lim inn en Google Maps-lenke, et stedsnavn eller GPS-koordinater (f.eks. "Credo restaurant" eller "59.9171, 10.7402") :'
                : 'Collez un lien Google Maps, un nom d\'établissement ou des coordonnées GPS (ex: "Credo restaurant" ou "59.9171, 10.7402") :'}
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={googleMapsUrlInput}
                onChange={(e) => setGoogleMapsUrlInput(e.target.value)}
                placeholder="Ex: Credo restaurant, https://maps.google.com/?q=... ou 59.9171, 10.7402"
                className="flex-1 px-3 py-2 text-xs bg-white border border-rose-300 rounded-xl focus:outline-none focus:border-rose-600"
              />
              <button
                type="button"
                onClick={handleParseGoogleMapsInput}
                className="px-4 py-2 bg-rose-700 text-white font-medium rounded-xl hover:bg-rose-800 transition-colors cursor-pointer"
              >
                {locale === 'no' ? 'Legg til' : 'Ajouter'}
              </button>
            </div>

            {googleImportFeedback && (
              <p className="text-[11px] font-medium text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                {googleImportFeedback}
              </p>
            )}
          </div>
        )}

        {/* Live Search Suggestions Dropdown List */}
        {hasSearched && searchResults.length > 0 && (
          <div className="p-2 bg-white rounded-2xl border border-[#2E4A3D]/30 shadow-lg space-y-1 z-20">
            <div className="px-3 py-1 text-[11px] font-semibold text-[#2E4A3D] uppercase tracking-wider flex items-center justify-between">
              <span>{locale === 'no' ? 'Forslag funnet i Oslo :' : 'Lieux trouvés à Oslo :'}</span>
              <span className="text-[10px] text-[#717A74] font-normal">
                {searchResults.length} {locale === 'no' ? 'treff' : 'résultats'}
              </span>
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
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${result.label}, ${result.address}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-rose-600 hover:text-rose-800 transition-colors"
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

        {/* If searched and 0 results found, show clear guidance with direct 1-click addition */}
        {hasSearched && searchResults.length === 0 && searchQuery.trim().length > 0 && !isSearching && (
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8] flex items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-[#1F2421] block">
                {locale === 'no'
                  ? `« ${searchQuery} » er funnet på Google Maps ovenfor !`
                  : `« ${searchQuery} » est bien repéré sur la carte Google Maps !`}
              </span>
              <p className="text-[11px] text-[#717A74]">
                {locale === 'no'
                  ? 'Klikk på knappen til høyre for å lagre dette som ditt favorittsted.'
                  : 'Cliquez sur « Ajouter ce lieu » pour l\'enregistrer directement dans votre profil.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAddPlaceDirectly(searchQuery)}
              disabled={places.length >= maxPlaces}
              className="px-4 py-2 bg-[#2E4A3D] text-white text-xs font-semibold rounded-xl hover:bg-[#23382E] transition-all cursor-pointer shadow-xs shrink-0"
            >
              + {locale === 'no' ? 'Legg til nå' : 'Ajouter maintenant'}
            </button>
          </div>
        )}
      </div>

      {/* Real Interactive Google Maps Window */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-[#717A74] px-1">
          <span className="flex items-center gap-1.5 text-[#2E4A3D] font-medium">
            <MapPin className="w-3.5 h-3.5 text-rose-600" />
            <span>Aperçu interactif Google Maps : {activePreviewQuery}</span>
          </span>
          <span>Zoom et navigation interactifs</span>
        </div>

        <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-[#E5E1D8] shadow-sm bg-[#EFECE6]">
          <iframe
            key={`${activePreviewQuery}-${mapType}`}
            title="Google Maps Interactive Picker"
            src={currentEmbedUrl}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>

      {/* Selected Places List with Google Maps Links & quick previews */}
      {places.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#2E4A3D] uppercase tracking-wider block">
              {locale === 'no'
                ? `Dine valgte møtesteder (${places.length}/${maxPlaces}) :`
                : `Vos lieux enregistrés pour les tandems (${places.length}/${maxPlaces}) :`}
            </span>
            <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
              ✓ {locale === 'no' ? 'Synlig på din profil' : 'Visible sur votre profil'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {places.map((place, idx) => {
              const placeQuery = place.address
                ? place.address.toLowerCase().includes(place.label.toLowerCase())
                  ? place.address
                  : `${place.label}, ${place.address}`
                : `${place.label}, Oslo`;
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery)}`;
              const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(placeQuery)}`;

              return (
                <div
                  key={place.id}
                  onClick={() => setActivePreviewQuery(placeQuery)}
                  className="flex flex-col justify-between p-3 bg-white rounded-xl border border-[#E5E1D8] shadow-xs text-xs space-y-2 hover:border-[#2E4A3D] transition-colors cursor-pointer"
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePlace(place.id);
                      }}
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

                  <div className="pt-2 border-t border-[#F5F2EB] flex items-center justify-between text-[11px]">
                    <span className="text-[#2E4A3D] font-medium text-[10px]">
                      {locale === 'no' ? 'Klikk for kartvisning' : 'Cliquez pour centrer'}
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                        title="Itinéraire"
                      >
                        <Navigation className="w-2.5 h-2.5" />
                        <span>{locale === 'no' ? 'Rute' : 'Itinéraire'}</span>
                      </a>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-rose-600 hover:text-rose-800 flex items-center gap-0.5 font-medium"
                      >
                        <span>Maps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
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
                  ? 'Anbefalte steder i Oslo (1 klikk for å legge til) :'
                  : 'Lieux recommandés à Oslo (1 clic pour ajouter) :'}
              </span>
            </span>
            <span className="text-[11px] text-[#717A74]">
              {locale === 'no' ? 'Ideelt for rolige samtaler' : 'Idéal pour discuter au calme'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {CURATED_OSLO_SPOTS.slice(0, 4).map((spot) => (
              <div
                key={spot.name}
                onClick={() => setActivePreviewQuery(`${spot.name}, ${spot.address}`)}
                className="p-2.5 bg-white rounded-xl border border-[#E5E1D8] hover:border-[#2E4A3D] text-left transition-all cursor-pointer group shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-md bg-[#FAF8F5] flex items-center justify-center shrink-0">
                      {getCategoryIcon(spot.category)}
                    </div>
                    <strong className="text-xs text-[#1F2421] group-hover:text-[#2E4A3D] truncate block">
                      {spot.name}
                    </strong>
                  </div>
                  <p className="text-[10px] text-[#717A74] line-clamp-1">{spot.address}</p>
                </div>

                <div className="mt-2 pt-1.5 border-t border-[#F5F2EB] flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddPlace(
                        spot.coords[0],
                        spot.coords[1],
                        spot.name,
                        spot.category,
                        spot.address
                      );
                    }}
                    className="text-[#2E4A3D] font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{locale === 'no' ? 'Legg til' : 'Ajouter'}</span>
                  </button>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${spot.name}, ${spot.address}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-rose-600 hover:underline flex items-center gap-0.5 text-[10px]"
                    title="Voir sur Google Maps"
                  >
                    <span>Maps</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
