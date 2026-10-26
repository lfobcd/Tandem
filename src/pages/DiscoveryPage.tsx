import React, { useState, useMemo, useEffect } from 'react';
import { PageView, UserProfile, SUPPORTED_LANGUAGES, AvailableLanguage } from '../types';
import { dataStore } from '../lib/supabase';
import { useTranslation } from '../lib/i18n';
import { MapboxViewer } from '../components/MapboxViewer';
import { PaymentModal } from '../components/PaymentModal';
import { Atelier24Promo } from '../components/Atelier24Promo';
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
  Heart,
  Tag,
  SlidersHorizontal,
  ArrowUpDown,
} from 'lucide-react';

export interface InterestCategory {
  id: string;
  labelFr: string;
  labelNo: string;
  emoji: string;
  keywords: string[];
}

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: 'cafe',
    labelFr: 'Café & Discussion',
    labelNo: 'Kaffe & Prat',
    emoji: '☕',
    keywords: ['café', 'kaffe', 'prat', 'conversation', 'discuter', 'papoter', 'boire', 'fika', 'thé', 'bar'],
  },
  {
    id: 'nature',
    labelFr: 'Randonnée & Nature',
    labelNo: 'Friluftsliv & Marka',
    emoji: '🥾',
    keywords: ['randonnée', 'tur', 'marka', 'ski', 'nature', 'plein air', 'nordmarka', 'fjord', 'balade', 'sognsvann', 'skog', 'hytte', 'montagne', 'fjell'],
  },
  {
    id: 'culture',
    labelFr: 'Art & Musées',
    labelNo: 'Kunst & Kultur',
    emoji: '🎨',
    keywords: ['art', 'musée', 'museum', 'kunst', 'kultur', 'expo', 'exposition', 'peinture', 'munch', 'design', 'architecture', 'histoire', 'teater', 'théâtre'],
  },
  {
    id: 'lecture',
    labelFr: 'Lecture & Livres',
    labelNo: 'Bøker & Litteratur',
    emoji: '📚',
    keywords: ['lecture', 'livre', 'bok', 'bøker', 'litteratur', 'littérature', 'deichman', 'bibliothèque', 'bibliotek', 'roman', 'lire'],
  },
  {
    id: 'sport',
    labelFr: 'Sport & Vélo',
    labelNo: 'Sport & Trening',
    emoji: '🚴',
    keywords: ['sport', 'sykkel', 'vélo', 'løping', 'running', 'course', 'jogging', 'yoga', 'escalade', 'klatring', 'kayak', 'kajakk', 'bade', 'baignade'],
  },
  {
    id: 'food',
    labelFr: 'Gastronomie & Cuisine',
    labelNo: 'Mat & Gastronomi',
    emoji: '🍷',
    keywords: ['cuisine', 'mat', 'gastronomie', 'vin', 'restaurant', 'manger', 'baking', 'pâtisserie', 'fromage', 'ost', 'recette', 'middag'],
  },
  {
    id: 'cinema',
    labelFr: 'Cinéma & Séries',
    labelNo: 'Film & Serier',
    emoji: '🎬',
    keywords: ['cinéma', 'film', 'kino', 'série', 'serier', 'docu', 'documentaire', 'netflix'],
  },
  {
    id: 'music',
    labelFr: 'Musique & Concerts',
    labelNo: 'Musikk & Konserter',
    emoji: '🎵',
    keywords: ['musique', 'musikk', 'concert', 'konsert', 'guitare', 'piano', 'chanson', 'sang', 'jazz', 'rock', 'opera'],
  },
  {
    id: 'travel',
    labelFr: 'Voyages & Découvertes',
    labelNo: 'Reise & Utforskning',
    emoji: '✈️',
    keywords: ['voyage', 'reise', 'voyager', 'découverte', 'expat', 'langues', 'språk', 'international'],
  },
];

export const profileMatchesInterest = (profile: UserProfile, category: InterestCategory): boolean => {
  const text = `${profile.envies || ''} ${profile.bio || ''} ${profile.lieux_preferes?.map((l) => `${l.label} ${l.address || ''}`).join(' ') || ''}`.toLowerCase();
  return category.keywords.some((kw) => text.includes(kw.toLowerCase()));
};

export const getProfileMatchingInterests = (profile: UserProfile): InterestCategory[] => {
  return INTEREST_CATEGORIES.filter((cat) => profileMatchesInterest(profile, cat));
};

interface DiscoveryPageProps {
  currentUser: UserProfile | null;
  profiles?: UserProfile[];
  onNavigate: (page: PageView) => void;
  onNavigateAuth?: (mode: 'login' | 'signup') => void;
  onStartChat: (partnerId: string) => void;
}

export const DiscoveryPage: React.FC<DiscoveryPageProps> = ({
  currentUser,
  profiles: profilesProp,
  onNavigate,
  onNavigateAuth,
  onStartChat,
}) => {
  const { t, locale } = useTranslation();
  const [internalProfiles, setInternalProfiles] = useState<UserProfile[]>(() => dataStore.getProfiles());

  // Listen to real-time server database updates
  useEffect(() => {
    const handleUpdate = () => {
      setInternalProfiles(dataStore.getProfiles());
    };
    window.addEventListener('tandem_profiles_updated', handleUpdate);
    dataStore.syncWithServer();
    return () => window.removeEventListener('tandem_profiles_updated', handleUpdate);
  }, []);

  // Dynamic profiles list that includes currentUser when completed
  const profiles = useMemo(() => {
    const baseList = profilesProp && profilesProp.length > 0 ? profilesProp : internalProfiles;
    if (currentUser) {
      const exists = baseList.some((p) => p.id === currentUser.id);
      if (!exists && (currentUser.prenom || currentUser.is_completed)) {
        return [currentUser, ...baseList];
      }
      return baseList.map((p) => (p.id === currentUser.id ? currentUser : p));
    }
    return baseList;
  }, [profilesProp, internalProfiles, currentUser]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');
  const [selectedNativeLang, setSelectedNativeLang] = useState<string>('all');
  const [selectedTargetLang, setSelectedTargetLang] = useState<string>('all');
  const [selectedInterest, setSelectedInterest] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<string[]>(() => dataStore.getFavorites());
  const [onlyCompatible, setOnlyCompatible] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'recent' | 'favorites_first' | 'french_first' | 'norwegian_first' | 'name_asc'>('recent');
  const [showMultiLangBanner, setShowMultiLangBanner] = useState<boolean>(true);

  // Sync favorites when updated in localStorage
  useEffect(() => {
    const handleFavUpdate = () => {
      setFavorites(dataStore.getFavorites());
    };
    window.addEventListener('tandem_favorites_updated', handleFavUpdate);
    window.addEventListener('storage', handleFavUpdate);
    return () => {
      window.removeEventListener('tandem_favorites_updated', handleFavUpdate);
      window.removeEventListener('storage', handleFavUpdate);
    };
  }, []);

  const handleToggleFavorite = (profileId: string) => {
    const next = dataStore.toggleFavorite(profileId);
    setFavorites(next);
  };

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
  }, [profiles]);

  // Neighborhoods grouped by city
  const neighborhoodsByCity = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    profiles.forEach((p) => {
      const { city, neighborhood } = parseQuartier(p.quartier);
      if (!map.has(city)) map.set(city, new Map());
      const cityMap = map.get(city)!;
      cityMap.set(neighborhood, (cityMap.get(neighborhood) || 0) + 1);
    });
    return map;
  }, [profiles]);

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

  // Stats on native languages (Français ou Norvégien)
  const nativeLangStats = useMemo(() => {
    const frenchCount = profiles.filter(
      (p) => p.langue_maternelle.toLowerCase() === 'français'
    ).length;
    const norwegianCount = profiles.filter(
      (p) => p.langue_maternelle.toLowerCase() === 'norvégien'
    ).length;
    return { frenchCount, norwegianCount, total: profiles.length };
  }, [profiles]);

  // Stats on interest categories
  const interestStats = useMemo(() => {
    return INTEREST_CATEGORIES.map((cat) => {
      const count = profiles.filter((p) => profileMatchesInterest(p, cat)).length;
      return { ...cat, count };
    });
  }, [profiles]);

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    const list = profiles.filter((p) => {
      const isCurrentUser = currentUser && p.id === currentUser.id;

      // Current user's profile MUST appear in the visible profiles when completed
      if (isCurrentUser) {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = p.prenom.toLowerCase().includes(q);
          const matchesQuartier = p.quartier.toLowerCase().includes(q);
          const matchesBio = p.bio.toLowerCase().includes(q);
          if (!matchesName && !matchesQuartier && !matchesBio) return false;
        }
        if (onlyFavorites && !favorites.includes(p.id)) {
          return false;
        }
        if (selectedInterest !== 'all') {
          const cat = INTEREST_CATEGORIES.find((c) => c.id === selectedInterest);
          if (cat && !profileMatchesInterest(p, cat)) return false;
        }
        if (selectedNativeLang !== 'all' && p.langue_maternelle.toLowerCase() !== selectedNativeLang.toLowerCase()) {
          return false;
        }
        return true;
      }

      // Filter by favorites
      if (onlyFavorites) {
        if (!favorites.includes(p.id)) return false;
      }

      // Filter compatibility: opposite native language (only active when no explicit native language filter is selected)
      if (onlyCompatible && currentUser && selectedNativeLang === 'all') {
        const isDirectMatch =
          p.langue_maternelle.toLowerCase() === currentUser.langue_apprise.toLowerCase() &&
          p.langue_apprise.toLowerCase() === currentUser.langue_maternelle.toLowerCase();
        
        // Also allow secondary language cross-matches
        const isSecondaryMatch =
          (p.langues_secondaires?.some((s) => s.toLowerCase() === currentUser.langue_apprise.toLowerCase()) || false) &&
          (p.langue_apprise.toLowerCase() === currentUser.langue_maternelle.toLowerCase());

        if (!isDirectMatch && !isSecondaryMatch) return false;
      }

      // Filter by specific native language (Français ou Norvégien)
      if (selectedNativeLang !== 'all') {
        if (p.langue_maternelle.toLowerCase() !== selectedNativeLang.toLowerCase()) {
          return false;
        }
      }

      // Filter by specific interest category
      if (selectedInterest !== 'all') {
        const cat = INTEREST_CATEGORIES.find((c) => c.id === selectedInterest);
        if (cat && !profileMatchesInterest(p, cat)) {
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

    // Dynamic sorting based on sortBy
    const sorted = [...list].sort((a, b) => {
      // Prioritize current user at the top of the visible profiles
      if (currentUser) {
        if (a.id === currentUser.id) return -1;
        if (b.id === currentUser.id) return 1;
      }

      if (sortBy === 'favorites_first') {
        const aFav = favorites.includes(a.id) ? 1 : 0;
        const bFav = favorites.includes(b.id) ? 1 : 0;
        if (aFav !== bFav) return bFav - aFav;
      } else if (sortBy === 'french_first') {
        const aFr = a.langue_maternelle.toLowerCase() === 'français' ? 1 : 0;
        const bFr = b.langue_maternelle.toLowerCase() === 'français' ? 1 : 0;
        if (aFr !== bFr) return bFr - aFr;
      } else if (sortBy === 'norwegian_first') {
        const aNo = a.langue_maternelle.toLowerCase() === 'norvégien' ? 1 : 0;
        const bNo = b.langue_maternelle.toLowerCase() === 'norvégien' ? 1 : 0;
        if (aNo !== bNo) return bNo - aNo;
      } else if (sortBy === 'name_asc') {
        return a.prenom.localeCompare(b.prenom, locale === 'no' ? 'nb' : 'fr');
      }

      // Default: recent activity timestamp
      const aTime = a.derniere_activite ? new Date(a.derniere_activite).getTime() : 0;
      const bTime = b.derniere_activite ? new Date(b.derniere_activite).getTime() : 0;
      return bTime - aTime;
    });

    return sorted;
  }, [
    profiles,
    currentUser,
    onlyCompatible,
    onlyFavorites,
    favorites,
    selectedInterest,
    searchQuery,
    selectedCity,
    selectedNeighborhood,
    selectedLevel,
    selectedAvailability,
    selectedNativeLang,
    selectedTargetLang,
    sortBy,
    locale,
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
              <span className="font-medium text-[#1F2421] flex items-center gap-1.5 mt-0.5">
                {currentUser.is_beta_pioneer ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <span>🔥</span>
                    <span>{locale === 'no' ? 'Pioner (Gratis)' : 'Pionnier Bêta (Gratuit)'}</span>
                  </span>
                ) : currentUser.a_paye ? (
                  t.statusUnlimitedActive
                ) : (
                  t.statusFreeBrowse
                )}
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
                ? 'Det vises fiktive profiler for demonstrasjon, i tillegg til din egen fullførte profil.'
                : 'Des profils factices de démonstration sont affichés, en plus de votre profil complété.'}
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-200/80 text-amber-950 border border-amber-300 shrink-0">
          {locale === 'no' ? 'Demoprofiler + din profil' : 'Profils démo + votre profil'}
        </span>
      </div>

      {/* Completed & Visible User Profile Banner */}
      {currentUser && (currentUser.is_completed || currentUser.prenom) && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/95 border border-emerald-300 text-xs text-emerald-950 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
              ✓
            </div>
            <div>
              <div className="font-semibold text-emerald-950 text-sm flex items-center gap-2">
                <span>
                  {locale === 'no'
                    ? 'Profilen din er fullført og synlig for fellesskapet !'
                    : 'Votre profil est complété et visible dans la communauté !'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 border border-emerald-400">
                  {locale === 'no' ? 'Aktiv' : 'En ligne'}
                </span>
              </div>
              <p className="text-emerald-800 text-[11px] leading-relaxed mt-0.5">
                {locale === 'no'
                  ? `Hei ${currentUser.prenom}! Profilkortet ditt vises nå øverst med bilde og møtesteder i Oslo.`
                  : `Bonjour ${currentUser.prenom} ! Votre carte apparaît désormais ci-dessous avec votre photo et vos lieux de rencontre.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('profile-create')}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-medium transition-all shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>{locale === 'no' ? '✏️ Rediger' : '✏️ Modifier'}</span>
          </button>
        </div>
      )}

      {/* Partner Spotlight: Atelier 24 */}
      <Atelier24Promo variant="compact" />

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl border border-[#E5E1D8] shadow-xs space-y-4">
        {/* Row 1: Primary Filters: Langue maternelle (Français ou Norvégien) + Favoris ❤️ + Tri */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#F0ECE1]">
          {/* Native Language quick selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-[#525E56] font-semibold mr-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#2E4A3D]" />
              <span>{t.nativeLanguageFilterLabel} :</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedNativeLang('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                selectedNativeLang === 'all'
                  ? 'bg-[#2E4A3D] text-white shadow-xs font-semibold'
                  : 'bg-[#FAF8F5] text-[#525E56] hover:text-[#1F2421] border border-[#E5E1D8]'
              }`}
            >
              <span>{t.filterAllLanguages}</span>
              <span
                className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedNativeLang === 'all' ? 'bg-white/20 text-white' : 'bg-[#EAE5DC] text-[#717A74]'
                }`}
              >
                {profiles.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedNativeLang('français');
                setOnlyCompatible(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedNativeLang === 'français'
                  ? 'bg-[#2E4A3D] text-white shadow-xs font-semibold ring-2 ring-[#2E4A3D]/20'
                  : 'bg-[#FAF8F5] text-[#525E56] hover:text-[#1F2421] border border-[#E5E1D8]'
              }`}
            >
              <span>{t.filterFrenchNative}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedNativeLang === 'français' ? 'bg-white/20 text-white' : 'bg-[#EAE5DC] text-[#717A74]'
                }`}
              >
                {nativeLangStats.frenchCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedNativeLang('norvégien');
                setOnlyCompatible(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedNativeLang === 'norvégien'
                  ? 'bg-[#2E4A3D] text-white shadow-xs font-semibold ring-2 ring-[#2E4A3D]/20'
                  : 'bg-[#FAF8F5] text-[#525E56] hover:text-[#1F2421] border border-[#E5E1D8]'
              }`}
            >
              <span>{t.filterNorwegianNative}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedNativeLang === 'norvégien' ? 'bg-white/20 text-white' : 'bg-[#EAE5DC] text-[#717A74]'
                }`}
              >
                {nativeLangStats.norwegianCount}
              </span>
            </button>

            {/* Quick Favorites button */}
            <button
              type="button"
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ml-0.5 sm:ml-2 ${
                onlyFavorites
                  ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-300'
                  : 'bg-[#FFF5F5] text-rose-700 hover:bg-[#FFEAEA] border border-rose-200'
              }`}
              title={onlyFavorites ? t.resetFilters : t.filterOnlyFavorites}
            >
              <Heart
                className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-white text-white' : 'fill-rose-500 text-rose-500'}`}
              />
              <span>{t.filterFavoritesLabel}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  onlyFavorites ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {favorites.length}
              </span>
            </button>
          </div>

          {/* Sort By Controls */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <span className="text-xs text-[#717A74] flex items-center gap-1 font-medium whitespace-nowrap">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#2E4A3D]" />
              <span>{t.sortByLabel} :</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D] text-[#1F2421] font-semibold cursor-pointer"
            >
              <option value="recent">⚡ {t.sortRecent}</option>
              <option value="favorites_first">❤️ {t.sortFavoritesFirst}</option>
              <option value="french_first">{t.sortFrenchFirst}</option>
              <option value="norwegian_first">{t.sortNorwegianFirst}</option>
              <option value="name_asc">🔤 {t.sortNameAsc}</option>
            </select>
          </div>
        </div>

        {/* Row 2: Centres d'intérêt (Interests Categories) Chips Carousel */}
        <div className="space-y-1.5 pb-3 border-b border-[#F0ECE1]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[#525E56] font-semibold">
              <Tag className="w-3.5 h-3.5 text-[#2E4A3D]" />
              <span>{t.filterInterestsLabel} :</span>
            </div>
            {selectedInterest !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedInterest('all')}
                className="text-[11px] text-[#717A74] hover:text-[#1F2421] flex items-center gap-1 cursor-pointer font-medium"
              >
                <X className="w-3 h-3" />
                <span>{locale === 'no' ? 'Vis alle interesser' : 'Tous les intérêts'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setSelectedInterest('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                selectedInterest === 'all'
                  ? 'bg-[#2E4A3D] text-white shadow-xs font-semibold'
                  : 'bg-[#FAF8F5] text-[#525E56] hover:text-[#1F2421] border border-[#E5E1D8]'
              }`}
            >
              {t.filterAllInterests}
            </button>

            {interestStats.map((cat) => {
              const isSelected = selectedInterest === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedInterest(isSelected ? 'all' : cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#2E4A3D] text-white shadow-xs font-semibold ring-2 ring-[#2E4A3D]/25'
                      : 'bg-[#FAF8F5] text-[#525E56] hover:text-[#1F2421] hover:bg-[#F2EFE9] border border-[#E5E1D8]'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{locale === 'no' ? cat.labelNo : cat.labelFr}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#EAE5DC] text-[#717A74]'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Quick City Selector & Proximity */}
        <div className="flex items-center gap-2 pb-2 overflow-x-auto no-scrollbar">
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

        {/* Row 4: Neighborhood sub-chips */}
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

        {/* Row 5: Detailed Filter Inputs (Search term, level, availability) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pt-1 border-t border-[#F5F2EB]">
          {/* Search by text / keyword / spot */}
          <div className="relative sm:col-span-2 lg:col-span-3">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C938E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.locationSearchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D]"
            />
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

          {/* Target language */}
          <div>
            <select
              value={selectedTargetLang}
              onChange={(e) => {
                setSelectedTargetLang(e.target.value);
                if (e.target.value !== 'all') setOnlyCompatible(false);
              }}
              className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D] text-[#1F2421]"
            >
              <option value="all">{t.allTargetLanguages}</option>
              <option value="norvégien">🇳🇴 Norsk</option>
              <option value="français">🇫🇷 Français</option>
            </select>
          </div>
        </div>

        {/* Active Filters Badges & Summary Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#F0ECE1] text-xs text-[#525E56]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#717A74] font-medium mr-1">
              <strong className="text-[#1F2421] font-semibold">{filteredProfiles.length}</strong> {t.profilesFound}
            </span>

            {/* Active filter badges */}
            {selectedNativeLang !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E8EDE6] text-[#2E4A3D] text-[11px] font-semibold">
                <span>{selectedNativeLang === 'français' ? '🇫🇷 Français natif' : '🇳🇴 Norvégien natif'}</span>
                <button
                  type="button"
                  onClick={() => setSelectedNativeLang('all')}
                  className="hover:text-black cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedInterest !== 'all' && (() => {
              const cat = INTEREST_CATEGORIES.find((c) => c.id === selectedInterest);
              if (!cat) return null;
              return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E8EDE6] text-[#2E4A3D] text-[11px] font-semibold">
                  <span>{cat.emoji} {locale === 'no' ? cat.labelNo : cat.labelFr}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedInterest('all')}
                    className="hover:text-black cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })()}

            {onlyFavorites && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-[11px] font-semibold">
                <span>❤️ {t.filterOnlyFavorites}</span>
                <button
                  type="button"
                  onClick={() => setOnlyFavorites(false)}
                  className="hover:text-rose-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(selectedCity !== 'all' || selectedNeighborhood !== 'all') && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] text-[#1F2421] text-[11px] font-medium">
                <MapPin className="w-3 h-3 text-[#2E4A3D]" />
                <span>
                  {selectedNeighborhood !== 'all' ? `${selectedNeighborhood}, ` : ''}
                  {selectedCity !== 'all' ? selectedCity : t.allCities}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCity('all');
                    setSelectedNeighborhood('all');
                  }}
                  className="hover:text-black cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] text-[#1F2421] text-[11px] font-medium">
                <Search className="w-3 h-3 text-[#8C938E]" />
                <span>"{searchQuery}"</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-black cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-[#525E56]">
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

            {(selectedNativeLang !== 'all' ||
              selectedInterest !== 'all' ||
              onlyFavorites ||
              selectedNeighborhood !== 'all' ||
              selectedCity !== 'all' ||
              selectedLevel !== 'all' ||
              selectedAvailability !== 'all' ||
              selectedTargetLang !== 'all' ||
              searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedNativeLang('all');
                  setSelectedInterest('all');
                  setOnlyFavorites(false);
                  setSelectedCity('all');
                  setSelectedNeighborhood('all');
                  setSelectedLevel('all');
                  setSelectedAvailability('all');
                  setSelectedTargetLang('all');
                  setSearchQuery('');
                  setOnlyCompatible(true);
                  setSortBy('recent');
                }}
                className="text-[#2E4A3D] hover:underline cursor-pointer font-semibold text-xs whitespace-nowrap"
              >
                {t.resetFilters}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profiles Cards Grid */}
      {filteredProfiles.length === 0 ? (
        onlyFavorites ? (
          <div className="p-12 bg-white rounded-3xl border border-rose-200 shadow-xs text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center text-3xl shadow-inner">
              ❤️
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-xl text-[#1F2421] font-semibold">
                {t.favoritesEmptyTitle}
              </h3>
              <p className="text-xs text-[#525E56] max-w-md mx-auto leading-relaxed">
                {t.favoritesEmptyDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOnlyFavorites(false)}
              className="px-4 py-2 bg-[#2E4A3D] text-white text-xs font-semibold rounded-xl hover:bg-[#23382E] transition-all cursor-pointer shadow-xs"
            >
              {locale === 'no' ? 'Utforsk alle profiler' : 'Explorer tous les profils'}
            </button>
          </div>
        ) : (
          <div className="p-12 bg-white rounded-2xl border border-[#E5E1D8] text-center space-y-3">
            <p className="font-display text-lg text-[#1F2421]">{t.noProfilesMatch}</p>
            <p className="text-xs text-[#525E56] max-w-sm mx-auto">{t.noProfilesHint}</p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => {
            const isCurrentUser = Boolean(currentUser && profile.id === currentUser.id);
            const hasPaid = currentUser?.a_paye || false;
            const nativeInfo = getLanguageLabel(profile.langue_maternelle);
            const targetInfo = getLanguageLabel(profile.langue_apprise);

            return (
              <div
                key={profile.id}
                onClick={() => setActiveProfile(profile)}
                className={`group p-5 bg-white rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isCurrentUser
                    ? 'border-[#2E4A3D] ring-2 ring-[#2E4A3D]/25 bg-gradient-to-b from-[#FAF8F5] via-white to-white shadow-sm'
                    : 'border-[#E5E1D8] shadow-xs hover:border-[#2E4A3D] hover:shadow-md'
                }`}
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
                          {isCurrentUser && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2E4A3D] text-white shrink-0 flex items-center gap-1 shadow-2xs">
                              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                              <span>{locale === 'no' ? 'Din profil (Synlig)' : 'Votre profil (Visible)'}</span>
                            </span>
                          )}
                          {profile.is_factice ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                              {locale === 'no' ? 'Fiktiv profil' : 'Profil factice'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0 flex items-center gap-0.5 shadow-2xs">
                              <span>✨</span>
                              <span>{locale === 'no' ? 'Nytt medlem' : 'Nouveau membre'}</span>
                            </span>
                          )}
                          {profile.is_beta_pioneer && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0 flex items-center gap-0.5">
                              <span>🔥</span>
                              <span>{locale === 'no' ? 'Pioner' : 'Pionnier Bêta'}</span>
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

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-[#717A74] bg-[#F5F2EB] px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>{formatLastActivity(profile.derniere_activite)}</span>
                      </div>

                      {/* Favorite Button on Card */}
                      {!isCurrentUser && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(profile.id);
                          }}
                          className={`p-1.5 rounded-full transition-all cursor-pointer ${
                            favorites.includes(profile.id)
                              ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'
                              : 'text-[#8C938E] hover:text-rose-500 hover:bg-[#F5F2EB]'
                          }`}
                          title={favorites.includes(profile.id) ? t.removeFromFavorites : t.addToFavorites}
                        >
                          <Heart
                            className={`w-4 h-4 transition-transform ${
                              favorites.includes(profile.id)
                                ? 'fill-rose-500 text-rose-500 scale-110'
                                : 'text-[#8C938E]'
                            }`}
                          />
                        </button>
                      )}
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

                  {/* Matching Interests Tags */}
                  {(() => {
                    const matchedCats = getProfileMatchingInterests(profile);
                    if (matchedCats.length === 0) return null;
                    return (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {matchedCats.slice(0, 3).map((cat) => {
                          const isCatSelected = selectedInterest === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedInterest(isCatSelected ? 'all' : cat.id);
                              }}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                                isCatSelected
                                  ? 'bg-[#2E4A3D] text-white shadow-2xs font-semibold'
                                  : 'bg-[#FAF8F5] hover:bg-[#F0ECE1] text-[#525E56] border border-[#E5E1D8]'
                              }`}
                              title={locale === 'no' ? `Filtrer på ${cat.labelNo}` : `Filtrer par ${cat.labelFr}`}
                            >
                              <span>{cat.emoji}</span>
                              <span>{locale === 'no' ? cat.labelNo : cat.labelFr}</span>
                            </button>
                          );
                        })}
                        {matchedCats.length > 3 && (
                          <span className="text-[10px] text-[#8C938E] font-medium">
                            +{matchedCats.length - 3}
                          </span>
                        )}
                      </div>
                    );
                  })()}

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

                  {isCurrentUser ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('profile-create');
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#2E4A3D] text-white hover:bg-[#23382E] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      <span>{locale === 'no' ? '✏️ Rediger profilen min' : '✏️ Modifier mon profil'}</span>
                    </button>
                  ) : (
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
                  )}
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
            <div className="absolute top-5 right-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleFavorite(activeProfile.id)}
                className={`p-2 rounded-full transition-all cursor-pointer ${
                  favorites.includes(activeProfile.id)
                    ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'
                    : 'text-[#8C938E] hover:text-rose-500 hover:bg-[#EFECE6]'
                }`}
                title={favorites.includes(activeProfile.id) ? t.removeFromFavorites : t.addToFavorites}
              >
                <Heart
                  className={`w-5 h-5 transition-transform ${
                    favorites.includes(activeProfile.id) ? 'fill-rose-500 text-rose-500 scale-110' : ''
                  }`}
                />
              </button>
              <button
                onClick={() => setActiveProfile(null)}
                className="p-1.5 rounded-full text-[#8C938E] hover:text-[#1F2421] hover:bg-[#EFECE6] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
                  {activeProfile.is_beta_pioneer && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <span>🔥</span>
                      <span>{locale === 'no' ? 'Pioner' : 'Pionnier Bêta'}</span>
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

            {/* Matched & Highlighted Interests in Drawer */}
            {(() => {
              const matchedCats = getProfileMatchingInterests(activeProfile);
              if (matchedCats.length === 0) return null;
              return (
                <div className="p-3 bg-white rounded-xl border border-[#E5E1D8] text-xs space-y-1.5">
                  <span className="text-[11px] font-semibold text-[#525E56] flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#2E4A3D]" />
                    <span>{t.filterInterestsLabel} :</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedCats.map((cat) => (
                      <span
                        key={cat.id}
                        className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] text-xs flex items-center gap-1.5 font-medium text-[#1F2421]"
                      >
                        <span>{cat.emoji}</span>
                        <span>{locale === 'no' ? cat.labelNo : cat.labelFr}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

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
