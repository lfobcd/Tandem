import React, { useState, useMemo } from 'react';
import { PageView, UserProfile, SUPPORTED_LANGUAGES, AvailableLanguage } from '../types';
import { dataStore } from '../lib/supabase';
import { useTranslation } from '../lib/i18n';
import { MapboxViewer } from '../components/MapboxViewer';
import { PaymentModal } from '../components/PaymentModal';
import {
  Search,
  MapPin,
  MessageSquare,
  Coffee,
  X,
  Globe,
  Sparkles,
  Building,
  Compass,
  Check,
} from 'lucide-react';

interface DiscoveryPageProps {
  currentUser: UserProfile | null;
  onNavigate: (page: PageView) => void;
  onNavigateAuth?: (mode: 'login' | 'signup') => void;
  onStartChat: (partnerId: string) => void;
}

export const DiscoveryPage: React.FC<DiscoveryPageProps> = ({
  currentUser,
  onNavigate,
  onNavigateAuth,
  onStartChat,
}) => {
  const { t, locale } = useTranslation();
  const [profiles] = useState<UserProfile[]>(() => dataStore.getProfiles());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');
  const [selectedNativeLang, setSelectedNativeLang] = useState<string>('all');
  const [selectedTargetLang, setSelectedTargetLang] = useState<string>('all');
  const [onlyCompatible, setOnlyCompatible] = useState<boolean>(true);
  const [showMultiLangBanner, setShowMultiLangBanner] = useState<boolean>(true);

  // Selected Profile for detailed drawer modal
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);

  // Payment modal state
  const [paymentTargetProfile, setPaymentTargetProfile] = useState<UserProfile | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Parser helper to extract neighborhood and city
  const parseQuartier = (str?: string): { neighborhood: string; city: string } => {
    if (!str || !str.trim()) return { neighborhood: 'Oslo', city: 'Oslo' };
    const parts = str.split(',').map((s) => s.trim());
    if (parts.length >= 2) {
      return { neighborhood: parts[0], city: parts[parts.length - 1] };
    }
    const knownCities = ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Tromsø', 'Drammen', 'Bærum', 'Kristiansand'];
    const matchedCity = knownCities.find((c) => str.toLowerCase().includes(c.toLowerCase()));
    if (matchedCity) {
      return {
        neighborhood: str.replace(new RegExp(matchedCity, 'i'), '').replace(/[,/]/g, '').trim() || matchedCity,
        city: matchedCity,
      };
    }
    return { neighborhood: parts[0], city: 'Oslo' };
  };

  // User's own parsed city & neighborhood for "Nær meg / Autour de moi"
  const userLocation = useMemo(() => {
    if (!currentUser?.quartier) return null;
    return parseQuartier(currentUser.quartier);
  }, [currentUser]);

  // Cities extracted with count of profiles
  const cityStats = useMemo(() => {
    const counts = new Map<string, number>();
    profiles.forEach((p) => {
      if (currentUser && p.id === currentUser.id) return;
      const { city } = parseQuartier(p.quartier);
      counts.set(city, (counts.get(city) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => {
        if (a.city.toLowerCase() === 'oslo') return -1;
        if (b.city.toLowerCase() === 'oslo') return 1;
        return b.count - a.count;
      });
  }, [profiles, currentUser]);

  // Neighborhoods grouped by city
  const neighborhoodsByCity = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    profiles.forEach((p) => {
      if (currentUser && p.id === currentUser.id) return;
      const { city, neighborhood } = parseQuartier(p.quartier);
      if (!map.has(city)) map.set(city, new Map());
      const cityMap = map.get(city)!;
      cityMap.set(neighborhood, (cityMap.get(neighborhood) || 0) + 1);
    });
    return map;
  }, [profiles, currentUser]);

  // Available neighborhoods for current city filter
  const currentNeighborhoodList = useMemo(() => {
    if (selectedCity === 'all') {
      const allMap = new Map<string, number>();
      neighborhoodsByCity.forEach((neighs) => {
        neighs.forEach((count, name) => {
          allMap.set(name, (allMap.get(name) || 0) + count);
        });
      });
      return Array.from(allMap.entries()).map(([name, count]) => ({ name, count }));
    }
    const neighs = neighborhoodsByCity.get(selectedCity);
    if (!neighs) return [];
    return Array.from(neighs.entries()).map(([name, count]) => ({ name, count }));
  }, [selectedCity, neighborhoodsByCity]);

  // Handle setting city
  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    if (city === 'all') {
      setSelectedNeighborhood('all');
    } else {
      const neighs = neighborhoodsByCity.get(city);
      if (selectedNeighborhood !== 'all' && neighs && !neighs.has(selectedNeighborhood)) {
        setSelectedNeighborhood('all');
      }
    }
  };

  // Quick filter to user's neighborhood
  const handleNearMeClick = () => {
    if (!userLocation) return;
    setSelectedCity(userLocation.city);
    setSelectedNeighborhood(userLocation.neighborhood);
  };

  // Helper to format language label and flag
  const getLanguageLabel = (langStr: string): { label: string; flag: string } => {
    const match = SUPPORTED_LANGUAGES.find(
      (l) => l.id.toLowerCase() === langStr.toLowerCase() || l.code.toLowerCase() === langStr.toLowerCase()
    );
    if (match) {
      return {
        label: locale === 'no' ? match.labelNo : match.labelFr,
        flag: match.flag,
      };
    }
    return { label: langStr, flag: '🌐' };
  };

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (currentUser && p.id === currentUser.id) return false;

      // Filter compatibility: opposite native language
      if (onlyCompatible && currentUser) {
        const isDirectMatch =
          p.langue_maternelle.toLowerCase() === currentUser.langue_apprise.toLowerCase() &&
          p.langue_apprise.toLowerCase() === currentUser.langue_maternelle.toLowerCase();
        
        // Also allow secondary language cross-matches
        const isSecondaryMatch =
          (p.langues_secondaires?.some((s) => s.toLowerCase() === currentUser.langue_apprise.toLowerCase()) || false) &&
          (p.langue_apprise.toLowerCase() === currentUser.langue_maternelle.toLowerCase());

        if (!isDirectMatch && !isSecondaryMatch) return false;
      }

      // Filter by specific native language
      if (selectedNativeLang !== 'all') {
        if (p.langue_maternelle.toLowerCase() !== selectedNativeLang.toLowerCase()) {
          return false;
        }
      }

      // Filter by specific target language
      if (selectedTargetLang !== 'all') {
        const matchesTarget = p.langue_apprise.toLowerCase() === selectedTargetLang.toLowerCase();
        const matchesSecondary = p.langues_apprises_autres?.some(
          (l) => l.toLowerCase() === selectedTargetLang.toLowerCase()
        );
        if (!matchesTarget && !matchesSecondary) return false;
      }

      // Filter city
      if (selectedCity !== 'all') {
        const { city } = parseQuartier(p.quartier);
        if (
          city.toLowerCase() !== selectedCity.toLowerCase() &&
          !p.quartier.toLowerCase().includes(selectedCity.toLowerCase())
        ) {
          return false;
        }
      }

      // Filter neighborhood
      if (selectedNeighborhood !== 'all') {
        const { neighborhood } = parseQuartier(p.quartier);
        if (
          neighborhood.toLowerCase() !== selectedNeighborhood.toLowerCase() &&
          !p.quartier.toLowerCase().includes(selectedNeighborhood.toLowerCase())
        ) {
          return false;
        }
      }

      // Filter search term
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.prenom.toLowerCase().includes(q);
        const matchesQuartier = p.quartier.toLowerCase().includes(q);
        const matchesBio = p.bio.toLowerCase().includes(q);
        const matchesEnvies = p.envies.toLowerCase().includes(q);
        const matchesNative = p.langue_maternelle.toLowerCase().includes(q);
        const matchesTarget = p.langue_apprise.toLowerCase().includes(q);
        const matchesPlaces = p.lieux_preferes?.some(
          (pl) => pl.label.toLowerCase().includes(q) || pl.address?.toLowerCase().includes(q)
        );
        if (
          !matchesName &&
          !matchesQuartier &&
          !matchesBio &&
          !matchesEnvies &&
          !matchesNative &&
          !matchesTarget &&
          !matchesPlaces
        ) {
          return false;
        }
      }

      // Filter CEFR level
      if (selectedLevel !== 'all') {
        if (p.niveau !== selectedLevel) return false;
      }

      // Filter availability
      if (selectedAvailability !== 'all') {
        if (selectedAvailability === 'soir') {
          const hasEvening = p.disponibilites.some((d) => d.slots.includes('soir'));
          if (!hasEvening) return false;
        } else if (selectedAvailability === 'weekend') {
          const hasWeekend = p.disponibilites.some(
            (d) => (d.day === 'samedi' || d.day === 'dimanche') && d.slots.length > 0
          );
          if (!hasWeekend) return false;
        }
      }

      return true;
    });
  }, [
    profiles,
    currentUser,
    onlyCompatible,
    searchQuery,
    selectedCity,
    selectedNeighborhood,
    selectedLevel,
    selectedAvailability,
    selectedNativeLang,
    selectedTargetLang,
  ]);

  // Format activity timestamp into localized text
  const formatLastActivity = (isoString?: string): string => {
    if (!isoString) return locale === 'no' ? 'Nylig' : 'Récemment';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 10) return t.activeJustNow;
    if (diffMins < 60) return t.activeMinAgo.replace('{n}', diffMins.toString());
    if (diffHours < 24) return t.activeToday;
    if (diffDays === 1) return t.activeYesterday;
    if (diffDays <= 4) return t.activeDaysAgo.replace('{n}', diffDays.toString());
    return t.activeThisMonth;
  };

  const handleContactClick = (e: React.MouseEvent, profile: UserProfile) => {
    e.stopPropagation();

    if (!currentUser) {
      if (onNavigateAuth) {
        onNavigateAuth('signup');
      } else {
        onNavigate('auth');
      }
      return;
    }

    if (!currentUser.a_paye) {
      setPaymentTargetProfile(profile);
      setIsPaymentModalOpen(true);
    } else {
      onStartChat(profile.id);
    }
  };

  const handlePaymentSuccess = () => {
    if (paymentTargetProfile) {
      onStartChat(paymentTargetProfile.id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#2E4A3D] font-medium mb-1">
            <span className="w-2 h-2 rounded-full bg-[#2E4A3D]"></span>
            <span>{t.discoveryTitleBadge}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-normal text-[#1F2421]">
            {t.discoveryTitle}
          </h1>
          <p className="text-xs sm:text-sm text-[#525E56] mt-1">
            {t.discoverySubtitle}
          </p>
        </div>

        {currentUser ? (
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#E5E1D8] text-xs shadow-xs">
            <div className="text-left">
              <span className="text-[#717A74] block">{t.yourStatus}</span>
              <span className="font-medium text-[#1F2421]">
                {currentUser.a_paye ? t.statusUnlimitedActive : t.statusFreeBrowse}
              </span>
            </div>
            {!currentUser.a_paye && (
              <button
                onClick={() => {
                  setPaymentTargetProfile(null);
                  setIsPaymentModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-[#FF5B24] hover:bg-[#E54A15] text-white font-medium text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white text-[#FF5B24] flex items-center justify-center font-black text-[9px] leading-none">
                  v
                </div>
                <span>{t.unlockContactsBtn} (Vipps · 39 kr)</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-2.5 sm:p-3 bg-white rounded-xl border border-[#E5E1D8] text-xs shadow-xs">
            <div className="text-left hidden sm:block">
              <span className="text-[#717A74] block">{locale === 'no' ? 'Gjesteutforsking' : 'Mode découverte'}</span>
              <span className="font-medium text-[#1F2421]">
                {locale === 'no' ? 'Gratis besøk' : 'Visite libre'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => (onNavigateAuth ? onNavigateAuth('login') : onNavigate('auth'))}
                className="px-3 py-1.5 text-xs font-semibold text-[#1F2421] hover:text-[#2E4A3D] hover:bg-[#F2EFE9] rounded-xl transition-all cursor-pointer"
              >
                {t.navLogin}
              </button>
              <button
                onClick={() => (onNavigateAuth ? onNavigateAuth('signup') : onNavigate('auth'))}
                className="px-3.5 py-1.5 bg-[#2E4A3D] hover:bg-[#23382E] text-white font-semibold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-xs"
              >
                {t.navSignup}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Multi-language Phase 2 Announcement / Preview Banner */}
      {showMultiLangBanner && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F0F5F2] border border-[#D5E5DA] text-xs text-[#2E4A3D] flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#2E4A3D] text-white flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold block sm:inline mr-2">
                {t.phase2Badge} :
              </span>
              <span className="text-[#3F5949] leading-relaxed">
                {t.phase2Notice}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowMultiLangBanner(false)}
            className="p-1 text-[#717A74] hover:text-[#1F2421] transition-colors cursor-pointer shrink-0"
            title="Masquer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Demo Mode / Fake Profiles Notice Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center font-semibold text-sm shrink-0">
            🎭
          </div>
          <div>
            <div className="font-semibold text-[#1F2421]">
              {locale === 'no' ? 'Fiktive profiler (Demomodus)' : 'Profils factices (Mode démonstration)'}
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              {locale === 'no'
                ? 'Det vises kun 2 fiktive profiler for å teste funksjonene (søk, chat og filtrering).'
                : 'Seulement 2 profils factices sont affichés pour tester la recherche, le contact et les filtres.'}
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-200/80 text-amber-950 border border-amber-300 shrink-0">
          {locale === 'no' ? '2 demoprofiler' : '2 profils factices'}
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl border border-[#E5E1D8] shadow-xs space-y-3.5">
        {/* Row 1: Quick City Selector & Proximity */}
        <div className="flex items-center gap-2 pb-3 border-b border-[#F0ECE1] overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 text-xs text-[#525E56] font-medium shrink-0 mr-1">
            <MapPin className="w-3.5 h-3.5 text-[#2E4A3D]" />
            <span>{t.cityFilterLabel} :</span>
          </div>

          <button
            type="button"
            onClick={() => handleSelectCity('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
              selectedCity === 'all'
                ? 'bg-[#2E4A3D] text-white shadow-xs'
                : 'bg-[#FAF8F5] text-[#525E56] hover:text-[#1F2421] border border-[#E5E1D8]'
            }`}
          >
            {t.allCities} ({profiles.filter((p) => !currentUser || p.id !== currentUser.id).length})
          </button>

          {cityStats.map(({ city, count }) => (
            <button
              key={city}
              type="button"
              onClick={() => handleSelectCity(city)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedCity === city
                  ? 'bg-[#2E4A3D] text-white shadow-xs'
                  : 'bg-[#FAF8F5] text-[#525E56] hover:text-[#1F2421] border border-[#E5E1D8]'
              }`}
            >
              <span>{city}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCity === city ? 'bg-white/20 text-white' : 'bg-[#EAE5DC] text-[#717A74]'
                }`}
              >
                {count}
              </span>
            </button>
          ))}

          {userLocation && (
            <button
              type="button"
              onClick={handleNearMeClick}
              className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedCity === userLocation.city && selectedNeighborhood === userLocation.neighborhood
                  ? 'bg-[#FF5B24] text-white shadow-xs'
                  : 'bg-[#FFF6F3] text-[#FF5B24] border border-[#FFD9CD] hover:bg-[#FFEAE3]'
              }`}
              title={`${userLocation.neighborhood}, ${userLocation.city}`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{t.nearMeBtn} ({userLocation.neighborhood})</span>
            </button>
          )}
        </div>

        {/* Row 2: Quick Neighborhood sub-chips */}
        {currentNeighborhoodList.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] text-[#717A74] shrink-0 mr-1">
              {t.neighborhoodFilterLabel} :
            </span>

            <button
              type="button"
              onClick={() => setSelectedNeighborhood('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                selectedNeighborhood === 'all'
                  ? 'bg-[#E8EDE6] text-[#2E4A3D] font-semibold ring-1 ring-[#2E4A3D]/20'
                  : 'text-[#717A74] hover:text-[#1F2421] hover:bg-[#FAF8F5]'
              }`}
            >
              {selectedCity === 'all'
                ? t.allNeighborhoods
                : t.allNeighborhoodsInCity.replace('{city}', selectedCity)}
            </button>

            {currentNeighborhoodList.map(({ name, count }) => (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedNeighborhood(name)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                  selectedNeighborhood === name
                    ? 'bg-[#E8EDE6] text-[#2E4A3D] font-semibold ring-1 ring-[#2E4A3D]/20'
                    : 'text-[#525E56] hover:text-[#1F2421] hover:bg-[#FAF8F5]'
                }`}
              >
                <span>{name}</span>
                <span className="text-[10px] text-[#8C938E]">({count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Active Location Filter Badge if selected */}
        {(selectedCity !== 'all' || selectedNeighborhood !== 'all') && (
          <div className="flex items-center justify-between gap-2 p-2 px-3 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8] text-xs text-[#2E4A3D]">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#2E4A3D]" />
              <span className="text-[#717A74]">{t.selectedLocationBadge}</span>
              <strong className="font-semibold text-[#1F2421]">
                {selectedNeighborhood !== 'all' ? `${selectedNeighborhood}, ` : ''}
                {selectedCity !== 'all' ? selectedCity : t.allCities}
              </strong>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCity('all');
                setSelectedNeighborhood('all');
              }}
              className="text-xs text-[#717A74] hover:text-[#1F2421] flex items-center gap-1 cursor-pointer font-medium"
            >
              <X className="w-3 h-3" />
              <span>{t.resetFilters}</span>
            </button>
          </div>
        )}

        {/* Row 3: Dropdown Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pt-1">
          {/* Search by text / keyword / spot */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C938E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.locationSearchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D]"
            />
          </div>

          {/* City filter dropdown */}
          <div>
            <select
              value={selectedCity}
              onChange={(e) => handleSelectCity(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D] text-[#1F2421] font-medium"
            >
              <option value="all">📍 {t.allCities}</option>
              {cityStats.map(({ city, count }) => (
                <option key={city} value={city}>
                  {city} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* Neighborhood filter dropdown */}
          <div>
            <select
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D] text-[#1F2421]"
            >
              <option value="all">
                {selectedCity === 'all'
                  ? t.allNeighborhoods
                  : t.allNeighborhoodsInCity.replace('{city}', selectedCity)}
              </option>

              {selectedCity === 'all' ? (
                Array.from(neighborhoodsByCity.entries()).map(([city, neighMap]) => (
                  <optgroup key={city} label={city}>
                    {Array.from(neighMap.entries()).map(([name, count]) => (
                      <option key={name} value={name}>
                        {name} ({count})
                      </option>
                    ))}
                  </optgroup>
                ))
              ) : (
                currentNeighborhoodList.map(({ name, count }) => (
                  <option key={name} value={name}>
                    {name} ({count})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* CEFR Level filter */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D] text-[#1F2421]"
            >
              <option value="all">{t.allLevels}</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
            </select>
          </div>

          {/* Availability filter */}
          <div>
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D] text-[#1F2421]"
            >
              <option value="all">{t.allAvailabilities}</option>
              <option value="soir">{t.availEvening}</option>
              <option value="weekend">{t.availWeekend}</option>
            </select>
          </div>
        </div>

        {/* Row 2: Multi-Language Extensibility Filters (Phase 2 ready) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#F5F2EB]">
          {/* Native Language Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#717A74] whitespace-nowrap">
              {t.nativeLang} :
            </span>
            <select
              value={selectedNativeLang}
              onChange={(e) => {
                setSelectedNativeLang(e.target.value);
                if (e.target.value !== 'all') setOnlyCompatible(false);
              }}
              className="flex-1 px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D] text-[#1F2421]"
            >
              <option value="all">{t.allNativeLanguages}</option>
              <optgroup label={t.primaryLanguagesGroup}>
                <option value="français">🇫🇷 Français</option>
                <option value="norvégien">🇳🇴 Norsk</option>
              </optgroup>
              <optgroup label={t.upcomingLanguagesGroup}>
                {SUPPORTED_LANGUAGES.filter((l) => !l.isPrimary).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.flag} {locale === 'no' ? l.labelNo : l.labelFr}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Target Language Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#717A74] whitespace-nowrap">
              {t.targetLang} :
            </span>
            <select
              value={selectedTargetLang}
              onChange={(e) => {
                setSelectedTargetLang(e.target.value);
                if (e.target.value !== 'all') setOnlyCompatible(false);
              }}
              className="flex-1 px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D] text-[#1F2421]"
            >
              <option value="all">{t.allTargetLanguages}</option>
              <optgroup label={t.primaryLanguagesGroup}>
                <option value="norvégien">🇳🇴 Norsk</option>
                <option value="français">🇫🇷 Français</option>
              </optgroup>
              <optgroup label={t.upcomingLanguagesGroup}>
                {SUPPORTED_LANGUAGES.filter((l) => !l.isPrimary).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.flag} {locale === 'no' ? l.labelNo : l.labelFr}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Compatibility toggle & results count */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F0ECE1] text-xs text-[#525E56]">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyCompatible}
                onChange={(e) => {
                  setOnlyCompatible(e.target.checked);
                  if (e.target.checked) {
                    setSelectedNativeLang('all');
                    setSelectedTargetLang('all');
                  }
                }}
                className="rounded border-[#D0C9BC] text-[#2E4A3D] focus:ring-[#2E4A3D]"
              />
              <span>{t.filterCompatibleOnly}</span>
            </label>
          </div>

          <div className="flex items-center gap-2 text-[#717A74]">
            <span>
              {filteredProfiles.length} {t.profilesFound}
            </span>
            {(selectedNeighborhood !== 'all' ||
              selectedLevel !== 'all' ||
              selectedAvailability !== 'all' ||
              selectedNativeLang !== 'all' ||
              selectedTargetLang !== 'all' ||
              searchQuery) && (
              <button
                onClick={() => {
                  setSelectedNeighborhood('all');
                  setSelectedLevel('all');
                  setSelectedAvailability('all');
                  setSelectedNativeLang('all');
                  setSelectedTargetLang('all');
                  setSearchQuery('');
                  setOnlyCompatible(true);
                }}
                className="text-[#2E4A3D] underline ml-2 cursor-pointer"
              >
                {t.resetFilters}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profiles Cards Grid */}
      {filteredProfiles.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-[#E5E1D8] text-center space-y-3">
          <p className="font-display text-lg text-[#1F2421]">{t.noProfilesMatch}</p>
          <p className="text-xs text-[#525E56] max-w-sm mx-auto">{t.noProfilesHint}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => {
            const hasPaid = currentUser?.a_paye || false;
            const nativeInfo = getLanguageLabel(profile.langue_maternelle);
            const targetInfo = getLanguageLabel(profile.langue_apprise);

            return (
              <div
                key={profile.id}
                onClick={() => setActiveProfile(profile)}
                className="group p-5 bg-white rounded-2xl border border-[#E5E1D8] shadow-xs hover:border-[#2E4A3D] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-13 h-13 rounded-2xl bg-[#EAE5DC] text-[#2E4A3D] font-display text-xl font-semibold flex items-center justify-center overflow-hidden border border-[#E5E1D8] shrink-0">
                        {profile.photo_url ? (
                          <img
                            src={profile.photo_url}
                            alt={profile.prenom}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          profile.prenom.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-display text-lg font-normal text-[#1F2421] group-hover:text-[#2E4A3D] transition-colors truncate">
                            {profile.prenom}
                          </h3>
                          {profile.is_factice && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                              {locale === 'no' ? 'Fiktiv profil' : 'Profil factice'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#717A74] flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-[#2E4A3D] shrink-0" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const { city, neighborhood } = parseQuartier(profile.quartier);
                              setSelectedCity(city);
                              setSelectedNeighborhood(neighborhood);
                            }}
                            className="hover:text-[#2E4A3D] hover:underline transition-colors text-left truncate cursor-pointer"
                            title={locale === 'no' ? `Filtrer på ${profile.quartier}` : `Filtrer par ${profile.quartier}`}
                          >
                            {profile.quartier}
                          </button>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-[#717A74] bg-[#F5F2EB] px-2 py-0.5 rounded-full shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{formatLastActivity(profile.derniere_activite)}</span>
                    </div>
                  </div>

                  {/* Languages Display */}
                  <div className="border-y border-[#F0ECE1] py-2 flex items-center justify-between text-xs text-[#525E56]">
                    <div>
                      <span className="text-[#8C938E] text-[10px] block">{t.nativeLang}</span>
                      <strong className="text-[#1F2421] flex items-center gap-1">
                        <span>{nativeInfo.flag}</span>
                        <span>{nativeInfo.label}</span>
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[#8C938E] text-[10px] block">{t.targetLang}</span>
                      <strong className="text-[#1F2421] flex items-center gap-1 justify-end">
                        <span>{targetInfo.flag}</span>
                        <span>{targetInfo.label}</span>
                        <span className="font-medium text-[#2E4A3D] ml-0.5">({profile.niveau})</span>
                      </strong>
                    </div>
                  </div>

                  {/* Secondary Languages tags (Phase 2 preview) */}
                  {profile.langues_secondaires && profile.langues_secondaires.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-[#525E56]">
                      <span className="text-[#8C938E]">+ langues :</span>
                      {profile.langues_secondaires.map((sec) => {
                        const secInfo = getLanguageLabel(sec);
                        return (
                          <span
                            key={sec}
                            className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E5E1D8] flex items-center gap-1"
                          >
                            <span>{secInfo.flag}</span>
                            <span>{secInfo.label}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <p className="text-xs text-[#525E56] line-clamp-3 leading-relaxed">
                    {profile.bio}
                  </p>

                  {profile.lieux_preferes && profile.lieux_preferes.length > 0 && (
                    <div className="text-[11px] text-[#2E4A3D] bg-[#F7F5F0] p-2.5 rounded-xl border border-[#EBE6DC] flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{profile.lieux_preferes[0].label}</span>
                      </span>
                      {profile.lieux_preferes.length > 1 && (
                        <span className="text-[10px] text-[#717A74] shrink-0 ml-1">
                          +{profile.lieux_preferes.length - 1}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-[#F0ECE1] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#8C938E]">
                    {t.clickToSeeMap}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleContactClick(e, profile)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap ${
                      hasPaid
                        ? 'bg-[#2E4A3D] text-white hover:bg-[#23382E]'
                        : 'bg-[#FAF8F5] text-[#2E4A3D] border border-[#D5DDD7] hover:bg-[#F2F6F3]'
                    }`}
                  >
                    {hasPaid ? (
                      <>
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{t.contactBtnPaid}</span>
                      </>
                    ) : (
                      <>
                        <Coffee className="w-3.5 h-3.5 text-[#2E4A3D]" />
                        <span>{t.contactBtnFree}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Profile Detail Drawer / Modal */}
      {activeProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#FAF8F5] rounded-3xl border border-[#E5E1D8] shadow-2xl p-6 sm:p-8 text-[#1F2421] space-y-6">
            <button
              onClick={() => setActiveProfile(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-[#8C938E] hover:text-[#1F2421] hover:bg-[#EFECE6] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#EAE5DC] text-[#2E4A3D] font-display text-2xl font-semibold flex items-center justify-center overflow-hidden border border-[#E5E1D8] shrink-0">
                {activeProfile.photo_url ? (
                  <img
                    src={activeProfile.photo_url}
                    alt={activeProfile.prenom}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  activeProfile.prenom.charAt(0)
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-2xl font-normal text-[#1F2421]">
                    {activeProfile.prenom}
                  </h2>
                  {activeProfile.is_factice && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                      {locale === 'no' ? 'Fiktiv profil (Demo)' : 'Profil factice (Démo)'}
                    </span>
                  )}
                  <span className="text-[11px] text-[#717A74] bg-[#F5F2EB] px-2 py-0.5 rounded-full">
                    {formatLastActivity(activeProfile.derniere_activite)}
                  </span>
                </div>
                <p className="text-xs text-[#525E56] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#2E4A3D]" />
                  <button
                    type="button"
                    onClick={() => {
                      const { city, neighborhood } = parseQuartier(activeProfile.quartier);
                      setSelectedCity(city);
                      setSelectedNeighborhood(neighborhood);
                      setActiveProfile(null);
                    }}
                    className="hover:text-[#2E4A3D] hover:underline cursor-pointer"
                    title={locale === 'no' ? `Filtrer på ${activeProfile.quartier}` : `Filtrer par ${activeProfile.quartier}`}
                  >
                    {activeProfile.quartier}
                  </button>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white border border-[#E5E1D8] text-xs">
              <div>
                <span className="text-[#8C938E] text-[11px] block">{t.nativeLang}</span>
                <span className="font-medium text-[#1F2421] flex items-center gap-1.5">
                  <span>{getLanguageLabel(activeProfile.langue_maternelle).flag}</span>
                  <span>{getLanguageLabel(activeProfile.langue_maternelle).label}</span>
                </span>
              </div>
              <div>
                <span className="text-[#8C938E] text-[11px] block">{t.targetLang}</span>
                <span className="font-medium text-[#1F2421] flex items-center gap-1.5">
                  <span>{getLanguageLabel(activeProfile.langue_apprise).flag}</span>
                  <span>{getLanguageLabel(activeProfile.langue_apprise).label}</span>
                  <span className="text-[#2E4A3D]">({activeProfile.niveau})</span>
                </span>
              </div>
            </div>

            {/* Secondary languages if present */}
            {activeProfile.langues_secondaires && activeProfile.langues_secondaires.length > 0 && (
              <div className="p-3 bg-white rounded-xl border border-[#E5E1D8] text-xs space-y-1">
                <span className="text-[11px] font-semibold text-[#525E56] block">
                  {t.secondaryLanguagesLabel} :
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeProfile.langues_secondaires.map((sec) => {
                    const l = getLanguageLabel(sec);
                    return (
                      <span
                        key={sec}
                        className="px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] text-xs flex items-center gap-1"
                      >
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3 text-xs leading-relaxed text-[#525E56]">
              <div>
                <h3 className="font-semibold text-[#1F2421] uppercase text-[10px] tracking-wider mb-1">
                  {t.profileAbout} {activeProfile.prenom}
                </h3>
                <p className="bg-white p-3.5 rounded-xl border border-[#E5E1D8] text-sm text-[#1F2421]">
                  {activeProfile.bio}
                </p>
              </div>

              {activeProfile.envies && (
                <div>
                  <h3 className="font-semibold text-[#1F2421] uppercase text-[10px] tracking-wider mb-1">
                    {t.profileDesires}
                  </h3>
                  <p className="bg-white p-3 rounded-xl border border-[#E5E1D8] text-xs text-[#525E56]">
                    {activeProfile.envies}
                  </p>
                </div>
              )}
            </div>

            {/* Interactive Mapbox Section */}
            <div className="space-y-2">
              <h3 className="font-semibold text-[#1F2421] uppercase text-[10px] tracking-wider">
                {t.profileMeetingSpots}
              </h3>
              <MapboxViewer
                places={activeProfile.lieux_preferes || []}
                userName={activeProfile.prenom}
                className="h-60"
              />
            </div>

            {/* Contact Action Footer */}
            <div className="pt-4 border-t border-[#E5E1D8] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-[#717A74]">
                {!currentUser?.a_paye ? (
                  <span>{t.profileSinglePaymentNotice}</span>
                ) : (
                  <span>{t.profileUnlimitedNotice}</span>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  handleContactClick(e, activeProfile);
                  setActiveProfile(null);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-[#2E4A3D] text-white font-medium text-sm rounded-xl hover:bg-[#23382E] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {currentUser?.a_paye ? (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>
                      {t.profileSendMsgTo} {activeProfile.prenom}
                    </span>
                  </>
                ) : (
                  <>
                    <Coffee className="w-4 h-4" />
                    <span>
                      {t.contactBtnFree} · {activeProfile.prenom}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal with Vipps & Card */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        targetProfile={paymentTargetProfile}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
