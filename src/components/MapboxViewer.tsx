import React, { useState } from 'react';
import { PreferredPlace } from '../types';
import {
  MapPin,
  Navigation,
  Coffee,
  BookOpen,
  Trees,
  Landmark,
  ExternalLink,
  Layers,
  Compass,
} from 'lucide-react';
import { useTranslation } from '../lib/i18n';

interface MapboxViewerProps {
  places: PreferredPlace[];
  userName: string;
  className?: string;
}

export const MapboxViewer: React.FC<MapboxViewerProps> = ({
  places,
  userName,
  className = 'h-72',
}) => {
  const { locale } = useTranslation();
  const [selectedPlaceIndex, setSelectedPlaceIndex] = useState<number>(0);
  const [mapType, setMapType] = useState<'m' | 'k'>('m'); // 'm' = road map, 'k' = satellite

  const currentPlace = places[selectedPlaceIndex] || places[0];

  // Build query for Google Maps embed and links
  const getGoogleMapsQuery = (place?: PreferredPlace): string => {
    if (!place) return 'Oslo, Norway';
    if (place.address && place.address.trim()) {
      return `${place.label}, ${place.address}`;
    }
    if (place.label && !place.label.toLowerCase().includes('oslo')) {
      return `${place.label}, Oslo, Norway`;
    }
    return `${place.latitude},${place.longitude}`;
  };

  const currentQuery = getGoogleMapsQuery(currentPlace);
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    currentQuery
  )}&t=${mapType}&z=15&ie=UTF8&iwloc=&output=embed`;

  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    currentQuery
  )}`;

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    currentQuery
  )}`;

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
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#525E56]">
          <span className="font-medium text-[#2E4A3D] flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-rose-600" />
            <span>Google Maps · Oslo</span>
          </span>
          <span className="text-[11px] text-[#848B85]">
            {locale === 'no' ? 'Møtesteder i Oslo' : 'Lieux de rencontre à Oslo'}
          </span>
        </div>

        {/* Embedded Google Map centered on central Oslo */}
        <div className={`relative w-full ${className} rounded-2xl overflow-hidden border border-[#E5E1D8] shadow-xs bg-[#EFECE6]`}>
          <iframe
            title="Google Maps Oslo"
            src="https://maps.google.com/maps?q=Oslo,+Norway&t=m&z=13&ie=UTF8&iwloc=&output=embed"
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <p className="text-center text-xs text-[#717A74] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E5E1D8]">
          {locale === 'no'
            ? `${userName} har ikke lagt til faste favorittsteder ennå. Foreslå gjerne et sted i Oslo under samtalen !`
            : `${userName} n'a pas encore renseigné de lieux favoris. N'hésitez pas à lui proposer un café dans le centre !`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Top Header Bar with Google Maps badge and satellite toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
            <span>Google Maps</span>
          </span>
          <span className="font-medium text-[#1F2421]">
            {locale === 'no'
              ? `${userName}s favorittsteder (${places.length})`
              : `Lieux favoris de ${userName} (${places.length})`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Satellite vs Road Map switcher */}
          <button
            type="button"
            onClick={() => setMapType(mapType === 'm' ? 'k' : 'm')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
              mapType === 'k'
                ? 'bg-[#2E4A3D] text-white border-[#2E4A3D]'
                : 'bg-white text-[#525E56] border-[#E5E1D8] hover:bg-[#FAF8F5]'
            }`}
            title={locale === 'no' ? 'Bytt til satellittvisning' : 'Basculer vue satellite'}
          >
            <Layers className="w-3 h-3" />
            <span>{mapType === 'k' ? (locale === 'no' ? 'Satellitt' : 'Satellite') : (locale === 'no' ? 'Plan' : 'Plan')}</span>
          </button>

          {/* Quick link to directions */}
          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[11px] font-medium transition-all"
            title="Calculer l'itinéraire vers ce lieu"
          >
            <Navigation className="w-3 h-3 text-blue-600" />
            <span>{locale === 'no' ? 'Rute' : 'Itinéraire'}</span>
          </a>

          {/* Quick link to Google Maps */}
          <a
            href={googleMapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-[#2E4A3D] hover:bg-[#FAF8F5] border border-[#E5E1D8] text-[11px] font-medium transition-all"
            title="Ouvrir dans Google Maps"
          >
            <span>{locale === 'no' ? 'Åpne' : 'Ouvrir'}</span>
            <ExternalLink className="w-3 h-3 text-[#2E4A3D]" />
          </a>
        </div>
      </div>

      {/* Place Selection Tabs if multiple places */}
      {places.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {places.map((place, idx) => {
            const isSelected = idx === selectedPlaceIndex;
            return (
              <button
                key={place.id || idx}
                type="button"
                onClick={() => setSelectedPlaceIndex(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[#2E4A3D] text-white border-[#2E4A3D] shadow-xs'
                    : 'bg-white text-[#1F2421] border-[#E5E1D8] hover:border-[#2E4A3D]'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isSelected ? 'bg-white text-[#2E4A3D]' : 'bg-[#2E4A3D] text-white'
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="truncate max-w-[160px]">{place.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Interactive Google Maps Iframe */}
      <div className={`relative w-full ${className} rounded-2xl overflow-hidden border border-[#E5E1D8] shadow-sm bg-[#EFECE6]`}>
        <iframe
          key={`${currentQuery}-${mapType}`}
          title={`Google Maps - ${currentPlace?.label || 'Oslo'}`}
          src={embedUrl}
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />

        {/* Overlay Place Floating Info Tag */}
        {currentPlace && (
          <div className="absolute top-2.5 left-2.5 max-w-[80%] bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-[#E0DACE] shadow-md pointer-events-auto">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-4 h-4 rounded-full bg-[#2E4A3D] text-white flex items-center justify-center text-[10px] font-bold">
                {selectedPlaceIndex + 1}
              </span>
              <strong className="text-xs font-semibold text-[#1F2421] truncate">
                {currentPlace.label}
              </strong>
            </div>
            {currentPlace.address && (
              <p className="text-[11px] text-[#555E57] truncate pl-5">
                {currentPlace.address}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Detailed Place Cards with direct Google Maps Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {places.map((p, idx) => {
          const isSelected = idx === selectedPlaceIndex;
          const placeQuery = getGoogleMapsQuery(p);
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery)}`;
          const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(placeQuery)}`;

          return (
            <div
              key={p.id || idx}
              onClick={() => setSelectedPlaceIndex(idx)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#F2F6F3] border-[#2E4A3D] ring-1 ring-[#2E4A3D]/40'
                  : 'bg-white border-[#E5E1D8] hover:border-[#2E4A3D]'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-4 h-4 rounded-full bg-[#2E4A3D] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {idx + 1}
                  </span>
                  {getPlaceIcon(p.type)}
                  <span className="font-semibold text-xs text-[#1F2421] truncate">
                    {p.label}
                  </span>
                </div>
                {p.address && (
                  <p className="text-[11px] text-[#717A74] truncate pl-5 mb-1.5">
                    {p.address}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-[#F0ECE1] flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlaceIndex(idx);
                  }}
                  className={`font-medium ${
                    isSelected ? 'text-[#2E4A3D]' : 'text-[#717A74] hover:text-[#1F2421]'
                  }`}
                >
                  {isSelected ? (locale === 'no' ? 'Aktiv på kart' : 'Affiché sur carte') : (locale === 'no' ? 'Vis på kart' : 'Voir sur carte')}
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                    title="Itinéraire"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>{locale === 'no' ? 'Rute' : 'Itinéraire'}</span>
                  </a>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-rose-600 hover:text-rose-800 flex items-center gap-0.5 font-medium"
                    title="Ouvrir dans Google Maps"
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
  );
};
