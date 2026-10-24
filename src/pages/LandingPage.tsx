import React, { useState, useMemo } from 'react';
import { PageView, UserProfile } from '../types';
import { useTranslation } from '../lib/i18n';
import heroCafeImage from '../assets/images/hero_scandi_cafe_1790239285793.jpg';
import { FaqSection } from '../components/FaqSection';
import { Atelier24Promo } from '../components/Atelier24Promo';
import { dataStore } from '../lib/supabase';
import {
  ArrowRight,
  Coffee,
  CheckCircle2,
  MapPin,
  Sparkles,
  Users,
  Compass,
  MessageSquare,
  Flame,
  Gift,
  Award,
  Mail,
  Check,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: PageView) => void;
  currentUser: UserProfile | null;
  profiles: UserProfile[];
  onOpenPayment?: () => void;
  onNavigateAuth?: (mode: 'login' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  currentUser,
  profiles,
  onOpenPayment,
  onNavigateAuth,
}) => {
  const { t, locale } = useTranslation();
  const [memberFilter, setMemberFilter] = useState<'all' | 'fr' | 'no'>('all');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorNewsletterDone, setVisitorNewsletterDone] = useState(false);

  const handleVisitorNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorEmail || !visitorEmail.includes('@')) return;
    dataStore.subscribeNewsletter(
      visitorEmail,
      '',
      locale === 'no' ? 'no' : 'fr',
      'visiteur_landing'
    );
    setVisitorNewsletterDone(true);
    setVisitorEmail('');
  };

  // Dynamic Beta Pioneer stats (first month free launch offer countdown)
  const betaStats = useMemo(() => {
    return dataStore.getBetaPioneerStats(profiles.length);
  }, [profiles]);

  // Compute newest members sorted by recent activity or new registration
  const displayedNewMembers = useMemo(() => {
    const list = [...profiles].sort((a, b) => {
      if (currentUser && a.id === currentUser.id) return -1;
      if (currentUser && b.id === currentUser.id) return 1;

      // Real users who registered prioritize over seeded
      if (!a.is_factice && b.is_factice) return -1;
      if (a.is_factice && !b.is_factice) return 1;

      const dateA = new Date(a.derniere_activite || 0).getTime();
      const dateB = new Date(b.derniere_activite || 0).getTime();
      return dateB - dateA;
    });

    if (memberFilter === 'fr') {
      return list.filter((p) => p.langue_maternelle.toLowerCase() === 'français').slice(0, 6);
    }
    if (memberFilter === 'no') {
      return list.filter((p) => p.langue_maternelle.toLowerCase() === 'norvégien').slice(0, 6);
    }
    return list.slice(0, 6);
  }, [profiles, currentUser, memberFilter]);

  const frenchCount = useMemo(
    () => profiles.filter((p) => p.langue_maternelle.toLowerCase() === 'français').length,
    [profiles]
  );
  const norwegianCount = useMemo(
    () => profiles.filter((p) => p.langue_maternelle.toLowerCase() === 'norvégien').length,
    [profiles]
  );

  const formatTimeSince = (dateStr?: string) => {
    if (!dateStr) return locale === 'no' ? 'Nylig aktiv' : 'Récemment';
    try {
      const diffMin = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
      if (diffMin < 60) {
        return locale === 'no' ? `${Math.max(1, diffMin)} min siden` : `il y a ${Math.max(1, diffMin)} min`;
      }
      const diffHours = Math.round(diffMin / 60);
      if (diffHours < 24) {
        return locale === 'no' ? `${diffHours} t siden` : `il y a ${diffHours} h`;
      }
      const diffDays = Math.round(diffHours / 24);
      return locale === 'no' ? `${diffDays} d siden` : `il y a ${diffDays} j`;
    } catch {
      return locale === 'no' ? 'Nylig aktiv' : 'Récemment';
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAE5DC] text-[#2E4A3D] text-xs font-medium tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E4A3D]"></span>
              <span>{t.heroBadge}</span>
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal text-[#1F2421] tracking-tight leading-[1.1]">
                {t.heroTitle1} <br />
                <span className="italic font-light text-[#2E4A3D]">{t.heroTitle2}</span>
              </h1>
            </div>

            <p className="text-sm sm:text-base text-[#525E56] max-w-xl leading-relaxed">
              {t.heroDescription}
            </p>

            {/* Value checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-[#1F2421] font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E4A3D] shrink-0" />
                <span>{t.heroCheckFree}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E4A3D] shrink-0" />
                <span>{t.heroCheckBrowse}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E4A3D] shrink-0" />
                <span>{t.heroCheckCoffeePrice}</span>
              </div>
            </div>

            {/* Official Launch Month 100% Free Offer Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/95 via-[#FFFDF8] to-amber-50/80 border-2 border-emerald-300 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#2E4A3D] text-white shadow-xs shrink-0">
                    <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-[#1F2421] tracking-wide uppercase">
                        {locale === 'no' ? 'Offisiell lansering i Oslo' : 'Lancement Officiel à Oslo'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white">
                        {locale === 'no' ? '1. MÅNED 100% GRATIS' : '1ER MOIS 100% GRATUIT'}
                      </span>
                    </div>
                    <span className="text-xs text-[#525E56] font-medium block">
                      {locale === 'no'
                        ? 'Alle som registrerer seg denne måneden får full tilgang til meldinger helt gratis (0 kr i stedet for 39 kr)!'
                        : 'Accès illimité et messagerie offerts pour tous les membres inscrits ce mois-ci (0 NOK au lieu de 39 NOK)'}
                    </span>
                  </div>
                </div>
                <div className="bg-white/95 border border-emerald-300 px-3.5 py-1.5 rounded-xl shadow-2xs text-right">
                  <span className="text-[10px] uppercase font-bold text-[#717A74] block">
                    {locale === 'no' ? 'Tilbudet varer i' : 'Durée restante'}
                  </span>
                  <span className="font-display text-base font-bold text-emerald-700">
                    {betaStats.daysRemaining} {locale === 'no' ? 'dager' : 'jours'}
                  </span>
                </div>
              </div>

              {/* Countdown progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-[#1F2421]">
                  <span>
                    🎉 <strong>{betaStats.registeredCount} membres</strong> déjà inscrits pour échanger à Oslo
                  </span>
                  <span className="text-xs font-bold text-[#2E4A3D]">
                    {locale === 'no'
                      ? `Gratis lanseringsperiode: ${betaStats.daysRemaining} dager igjen !`
                      : `Mois de lancement : encore ${betaStats.daysRemaining} jours gratuits !`}
                  </span>
                </div>
                <div className="w-full h-3 bg-emerald-100 rounded-full overflow-hidden p-0.5 border border-emerald-200">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-[#2E4A3D] to-amber-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, Math.max(15, betaStats.progressPercent))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => {
                  if (currentUser) {
                    onNavigate('discovery');
                  } else if (onNavigateAuth) {
                    onNavigateAuth('signup');
                  } else {
                    onNavigate('auth');
                  }
                }}
                className="px-6 py-3.5 bg-[#2E4A3D] text-white text-sm font-medium rounded-xl hover:bg-[#23382E] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer group"
              >
                <span>{t.heroBtnStart}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('discovery')}
                className="px-5 py-3.5 bg-white border border-[#E5E1D8] text-[#1F2421] text-sm font-medium rounded-xl hover:bg-[#F2EFE9] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-[#717A74]" />
                <span>{t.heroBtnExplore}</span>
              </button>
            </div>

            <div className="text-[11px] text-[#717A74] flex items-center gap-2 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E4A3D]"></span>
              <span>
                {locale === 'no'
                  ? 'Fokusert på fransk & norsk i Oslo · Flere språk klargjort for neste fase 🌍'
                  : 'Focalisé sur le français & norvégien à Oslo · Autres langues prévues pour la suite 🌍'}
              </span>
            </div>
          </div>

          {/* Right Column: Hero Visual Asset */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-[#E5E1D8] bg-white aspect-[4/5] sm:aspect-[4/4] lg:aspect-[4/5]">
              <img
                src={heroCafeImage}
                alt="Café tandem à Oslo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/hero_scandi_cafe.jpg';
                }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

              {/* Scandinavian badge overlay */}
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E5E1D8] text-[#1F2421] shadow-lg">
                <div className="flex items-center justify-between text-xs font-medium text-[#717A74] mb-1">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2E4A3D]" />
                    {t.heroCardSubtitle}
                  </span>
                  <span className="text-[#2E4A3D] font-bold">14:30</span>
                </div>
                <p className="text-xs text-[#1F2421] italic font-serif">
                  {t.heroCardQuote}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-[#525E56]">
                  <span>Astrid (🇳🇴) & Julien (🇫🇷)</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#EAE5DC] text-[#2E4A3D] font-medium">
                    Tandem
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-white border-y border-[#E5E1D8] py-14 sm:py-18">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#2E4A3D] font-semibold">
              {t.howTitleBadge}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-normal text-[#1F2421]">
              {t.howTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAE5DC] text-[#2E4A3D] flex items-center justify-center font-display text-lg font-semibold">
                1
              </div>
              <h3 className="font-display text-lg font-normal text-[#1F2421]">
                {t.step1Title}
              </h3>
              <p className="text-xs text-[#525E56] leading-relaxed">
                {t.step1Desc}
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAE5DC] text-[#2E4A3D] flex items-center justify-center font-display text-lg font-semibold">
                2
              </div>
              <h3 className="font-display text-lg font-normal text-[#1F2421]">
                {t.step2Title}
              </h3>
              <p className="text-xs text-[#525E56] leading-relaxed">
                {t.step2Desc}
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAE5DC] text-[#2E4A3D] flex items-center justify-center font-display text-lg font-semibold">
                3
              </div>
              <h3 className="font-display text-lg font-normal text-[#1F2421]">
                {t.step3Title}
              </h3>
              <p className="text-xs text-[#525E56] leading-relaxed">
                {t.step3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Community: Nouveaux Membres & Profils Récents */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAE5DC] text-[#2E4A3D] text-xs font-medium tracking-wide mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{t.landingNewMembersBadge}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-normal text-[#1F2421]">
              {t.landingNewMembersTitle}
            </h2>
            <p className="text-xs sm:text-sm text-[#525E56] mt-1 max-w-2xl">
              {t.landingNewMembersSubtitle}
            </p>
          </div>

          <button
            onClick={() => onNavigate('discovery')}
            className="self-start md:self-auto text-xs font-semibold text-[#2E4A3D] hover:underline flex items-center gap-1.5 cursor-pointer bg-white px-3.5 py-2 rounded-xl border border-[#E5E1D8] shadow-2xs hover:bg-[#FAF8F5] transition-colors"
          >
            <span>{t.viewAllProfiles}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#EAE5DC] text-[#2E4A3D] text-[10px]">
              {profiles.length}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Language Filter Pills on Landing Page */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setMemberFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              memberFilter === 'all'
                ? 'bg-[#2E4A3D] text-white shadow-2xs'
                : 'bg-white border border-[#E5E1D8] text-[#525E56] hover:bg-[#F2EFE9]'
            }`}
          >
            <span>{t.filterAllMembers}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                memberFilter === 'all' ? 'bg-white/20 text-white' : 'bg-[#EAE5DC] text-[#2E4A3D]'
              }`}
            >
              {profiles.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMemberFilter('fr')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              memberFilter === 'fr'
                ? 'bg-[#1E40AF] text-white shadow-2xs'
                : 'bg-white border border-[#E5E1D8] text-[#525E56] hover:bg-[#F2EFE9]'
            }`}
          >
            <span>🇫🇷 {locale === 'no' ? 'Fransk morsmål' : 'Français natifs'}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                memberFilter === 'fr' ? 'bg-white/20 text-white' : 'bg-[#EAE5DC] text-[#2E4A3D]'
              }`}
            >
              {frenchCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMemberFilter('no')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              memberFilter === 'no'
                ? 'bg-[#DC2626] text-white shadow-2xs'
                : 'bg-white border border-[#E5E1D8] text-[#525E56] hover:bg-[#F2EFE9]'
            }`}
          >
            <span>🇳🇴 {locale === 'no' ? 'Norsk morsmål' : 'Norvégiens natifs'}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                memberFilter === 'no' ? 'bg-white/20 text-white' : 'bg-[#EAE5DC] text-[#2E4A3D]'
              }`}
            >
              {norwegianCount}
            </span>
          </button>
        </div>

        {/* Members Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedNewMembers.map((profile) => {
            const isCurrentUser = currentUser?.id === profile.id;
            const isFrench = profile.langue_maternelle.toLowerCase() === 'français';

            return (
              <div
                key={profile.id}
                onClick={() => onNavigate('discovery')}
                className={`group p-5 bg-white rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-md ${
                  isCurrentUser
                    ? 'border-[#2E4A3D] ring-2 ring-[#2E4A3D]/20 shadow-xs'
                    : 'border-[#E5E1D8] hover:border-[#2E4A3D]/50 shadow-2xs'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Top user header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <div className="w-13 h-13 rounded-2xl bg-[#EAE5DC] text-[#2E4A3D] font-display text-xl font-semibold flex items-center justify-center overflow-hidden border border-[#E5E1D8] shrink-0">
                          {profile.photo_url ? (
                            <img
                              src={profile.photo_url}
                              alt={profile.prenom}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            profile.prenom.charAt(0)
                          )}
                        </div>
                        {/* Native Language Mini Flag Badge on avatar */}
                        <span
                          className="absolute -bottom-1 -right-1 text-xs bg-white rounded-full p-0.5 shadow-2xs border border-[#E5E1D8]"
                          title={isFrench ? 'Français natif' : 'Norsk morsmål'}
                        >
                          {isFrench ? '🇫🇷' : '🇳🇴'}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-display text-base font-normal text-[#1F2421] group-hover:text-[#2E4A3D] transition-colors truncate">
                            {profile.prenom}
                          </h3>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#2E4A3D] text-white shrink-0 flex items-center gap-0.5 shadow-2xs">
                              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                              <span>{locale === 'no' ? 'Deg' : 'Vous'}</span>
                            </span>
                          )}
                          {!profile.is_factice && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>{t.newMemberBadge}</span>
                            </span>
                          )}
                          {profile.is_beta_pioneer && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200 shrink-0 flex items-center gap-1" title="Bénéficie de l'accès bêta gratuit">
                              <Flame className="w-2.5 h-2.5 text-amber-600" />
                              <span>{locale === 'no' ? 'Pioner' : 'Pionnier Bêta'}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#717A74] flex items-center gap-1 truncate mt-0.5">
                          <MapPin className="w-3 h-3 text-[#2E4A3D] shrink-0" />
                          <span className="truncate">{profile.quartier}</span>
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] text-[#8C938E] shrink-0 whitespace-nowrap bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#F0ECE1]">
                      {formatTimeSince(profile.derniere_activite)}
                    </span>
                  </div>

                  {/* Language Exchange Badges */}
                  <div className="border-y border-[#F0ECE1] py-2.5 flex items-center justify-between text-xs gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-[#8C938E] block font-medium">
                        {t.nativeLang}
                      </span>
                      <span className="font-semibold text-[#1F2421] truncate block text-xs">
                        {isFrench ? '🇫🇷 Français' : '🇳🇴 Norsk'}
                      </span>
                    </div>

                    <div className="h-6 w-[1px] bg-[#E5E1D8]"></div>

                    <div className="space-y-0.5 text-right min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-[#8C938E] block font-medium">
                        {t.targetLang}
                      </span>
                      <span className="font-semibold text-[#2E4A3D] truncate block text-xs">
                        {isFrench ? '🇳🇴 Norsk' : '🇫🇷 Français'}{' '}
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#EAE5DC] text-[#2E4A3D]">
                          {profile.niveau}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Bio teaser */}
                  <p className="text-xs text-[#525E56] line-clamp-2 leading-relaxed">
                    {profile.bio || profile.envies}
                  </p>

                  {/* Favorite cafe spot if exists */}
                  {profile.lieux_preferes && profile.lieux_preferes[0] && (
                    <div className="text-[11px] text-[#2E4A3D] bg-[#FAF8F5] p-2 rounded-xl flex items-center gap-1.5 border border-[#E5E1D8]/80">
                      <Coffee className="w-3.5 h-3.5 shrink-0 text-[#2E4A3D]" />
                      <span className="truncate font-medium">
                        {profile.lieux_preferes[0].label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card CTA row */}
                <div className="pt-2 flex items-center justify-between border-t border-[#F0ECE1] gap-2">
                  <span className="text-[11px] text-[#717A74] group-hover:text-[#2E4A3D] font-medium flex items-center gap-1">
                    <span>{locale === 'no' ? 'Se profil' : 'Voir le profil'}</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('discovery');
                    }}
                    className="px-3 py-1 bg-[#F5F2EB] hover:bg-[#2E4A3D] hover:text-white text-[#2E4A3D] text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    {t.contactMemberBtn}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Discovery Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FAF8F5] via-white to-[#FAF8F5] border border-[#E5E1D8] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium text-[#1F2421]">
              {locale === 'no'
                ? `Totalt ${profiles.length} motiverte språktandems i Oslo venter på deg`
                : `Au total, ${profiles.length} partenaires motivés à Oslo n'attendent que vous`}
            </p>
            <p className="text-xs text-[#717A74]">
              {locale === 'no'
                ? 'Filtrer etter nabolag (Grünerløkka, Majorstuen, Sentrum...), interesser og favorittkafeer.'
                : 'Filtrez par quartier (Grünerløkka, Majorstuen, Sentrum...), centres d\'intérêt et cafés favoris.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('discovery')}
              className="px-4 py-2.5 bg-[#2E4A3D] hover:bg-[#23382E] text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>{locale === 'no' ? 'Åpne interaktivt kart & søk' : 'Ouvrir la carte & filtres'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Subscription & Pricing Section */}
      <section className="bg-white border-y border-[#E5E1D8] py-14 sm:py-18">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#2E4A3D] font-semibold">
              {locale === 'no' ? 'Enkel & rettferdig modell' : 'Tarification simple & transparente'}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-normal text-[#1F2421]">
              {locale === 'no' ? 'Opprett konto gratis · Lås opp med Vipps' : 'Créer un compte gratuit · Activer par Vipps ou Carte'}
            </h2>
            <p className="text-xs sm:text-sm text-[#525E56] leading-relaxed">
              {locale === 'no'
                ? 'Ingen månedlige abonnementer eller bindingstid. Kun et engangsbeløp på 39 kr for å beskytte fellesskapet og sikre ekte samtaler.'
                : "Pas d'abonnement mensuel récurrent ni frais cachés. Une contribution unique de 39 NOK pour garantir des profils motivés et respectueux."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan 1: Free Account */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF8F5] border border-[#E5E1D8] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#525E56] uppercase tracking-wider">
                    {locale === 'no' ? 'Gratis medlemskap' : 'Compte Découverte'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EAE5DC] text-[#2E4A3D] text-xs font-medium">
                    0 kr
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="font-display text-3xl font-normal text-[#1F2421]">0 NOK</span>
                  <span className="text-xs text-[#717A74] block">{locale === 'no' ? 'Alltid gratis' : 'Gratuit pour toujours'}</span>
                </div>
                <ul className="space-y-2.5 text-xs text-[#525E56] pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2E4A3D] shrink-0" />
                    <span>{locale === 'no' ? 'Opprett profil på 30 sekunder' : 'Création de profil en 30 secondes'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2E4A3D] shrink-0" />
                    <span>{locale === 'no' ? 'Utforsk alle franske og norske profiler i Oslo' : 'Explorer tous les profils tandems à Oslo'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2E4A3D] shrink-0" />
                    <span>{locale === 'no' ? 'Se favorittkafeer og møtesteder på kartet' : 'Voir les cafés et lieux favoris sur la carte'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2E4A3D] shrink-0" />
                    <span>{locale === 'no' ? 'Filtrer etter bydel (Grünerløkka, Sentrum...)' : 'Filtres par quartier et par niveau'}</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (currentUser) {
                    onNavigate('discovery');
                  } else if (onNavigateAuth) {
                    onNavigateAuth('signup');
                  } else {
                    onNavigate('auth');
                  }
                }}
                className="w-full py-3 bg-white border border-[#E5E1D8] text-[#1F2421] hover:bg-[#F2EFE9] text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs text-center"
              >
                {currentUser
                  ? (locale === 'no' ? 'Gå til profiler' : 'Explorer les profils')
                  : (locale === 'no' ? 'Opprett gratis konto' : 'Créer un compte gratuit')}
              </button>
            </div>

            {/* Plan 2: Official Launch Month Free Offer / Full Access */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#F6FAF7] border-2 border-[#2E4A3D] flex flex-col justify-between space-y-6 relative shadow-md">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-300" />
                <span>
                  {betaStats.isFreeOfferActive
                    ? (locale === 'no' ? 'Lanseringstilbud · 0 kr' : '1er mois de lancement · 0 NOK')
                    : (locale === 'no' ? 'Anbefalt · Ubegrenset' : 'Accès illimité · Recommandé')}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#2E4A3D] uppercase tracking-wider">
                    {betaStats.isFreeOfferActive
                      ? (locale === 'no' ? 'Lanseringsmedlemskap' : 'Statut Membre Pionnier Lancement')
                      : (locale === 'no' ? 'Full tilgang (Vipps)' : 'Souscription unique')}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    {betaStats.isFreeOfferActive ? '0 NOK' : '39 kr'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    {betaStats.isFreeOfferActive ? (
                      <>
                        <span className="font-display text-3xl sm:text-4xl font-bold text-emerald-700">0 NOK</span>
                        <span className="text-sm text-neutral-400 line-through font-medium">39 NOK</span>
                        <span className="text-xs text-[#717A74]">/ {locale === 'no' ? 'gratis i lanseringsmåneden' : 'gratuit pendant le mois de lancement'}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-display text-3xl font-bold text-[#FF5B24]">39 NOK</span>
                        <span className="text-xs text-[#717A74]">/ {locale === 'no' ? 'engangsbeløp' : 'paiement unique (~3,50 €)'}</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-[#717A74] block">
                    {betaStats.isFreeOfferActive
                      ? (locale === 'no'
                          ? 'Tilbudet gjelder automatisk for alle som oppretter profil denne måneden!'
                          : 'Offre exclusive : gratuité totale pour tous les nouveaux inscrits ce mois-ci !')
                      : (locale === 'no' ? 'Prisen på en kaffe i Oslo · Ingen binding' : "Le prix d'un café à Oslo · Accès à vie")}
                  </span>
                </div>

                {/* Launch month banner in pricing card */}
                {betaStats.isFreeOfferActive && (
                  <div className="p-3 bg-emerald-50/90 rounded-2xl border border-emerald-200/90 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#1F2421]">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        <span>{locale === 'no' ? 'Lanseringsperiode pågår' : 'Mois de lancement en cours'}</span>
                      </span>
                      <span className="text-emerald-800 font-bold">
                        {locale === 'no'
                          ? `Ennå ${betaStats.daysRemaining} dager igjen !`
                          : `Encore ${betaStats.daysRemaining} jours gratuits !`}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-emerald-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-[#2E4A3D] rounded-full"
                        style={{ width: `${Math.min(100, Math.max(15, betaStats.progressPercent))}%` }}
                      />
                    </div>
                  </div>
                )}

                <ul className="space-y-2.5 text-xs text-[#1F2421] pt-2">
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#2E4A3D] shrink-0" />
                    <span>{locale === 'no' ? 'Alt i gratis medlemskap inkludert' : 'Tout ce qui est inclus dans le compte gratuit'}</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#2E4A3D] shrink-0" />
                    <span>{locale === 'no' ? 'Send ubegrenset med meldinger til alle tandems' : 'Messages illimités vers tous les profils'}</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#2E4A3D] shrink-0" />
                    <span>
                      {betaStats.isFreeOfferActive
                        ? (locale === 'no'
                            ? 'Ingen betaling eller Vipps kreves under lanseringsmåneden (0 kr)'
                            : 'Aucun paiement ni Vipps requis pendant le mois de lancement (0 NOK)')
                        : (locale === 'no'
                            ? 'Direkte betaling med Vipps til 92 13 17 92 eller kort'
                            : 'Paiement direct Vipps (92 13 17 92) ou Carte')}
                    </span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#2E4A3D] shrink-0" />
                    <span>
                      {locale === 'no'
                        ? 'Spesielt «Pioner»-merke på profilen din'
                        : 'Badge Membre Pionnier Lancement sur votre profil'}
                    </span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!currentUser) {
                    if (onNavigateAuth) {
                      onNavigateAuth('signup');
                    } else {
                      onNavigate('auth');
                    }
                  } else if (onOpenPayment) {
                    onOpenPayment();
                  } else {
                    onNavigate('discovery');
                  }
                }}
                className="w-full py-3.5 bg-[#FF5B24] hover:bg-[#E54A15] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                {currentUser?.a_paye ? (
                  <span>{locale === 'no' ? '✓ Du har ubegrenset tilgang (Pioner)' : '✓ Accès Pionnier Bêta actif'}</span>
                ) : betaStats.isFreeOfferActive ? (
                  <>
                    <span>
                      {locale === 'no'
                        ? `Bli med nå – 1. måned 100% gratis (${betaStats.daysRemaining} dager igjen)`
                        : `Profiter du 1er mois 100% gratuit (${betaStats.daysRemaining} jours restants)`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : currentUser ? (
                  <>
                    <span>{locale === 'no' ? 'Lås opp nå med Vipps (39 kr)' : 'Payer la souscription (39 kr)'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>{locale === 'no' ? 'Opprett konto & Lås opp (39 kr)' : 'Créer un compte & S\'abonner'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Spotlight: Atelier 24 French Language Courses */}
      <Atelier24Promo />

      {/* FAQ & Tandem Guide Section */}
      <FaqSection onNavigate={onNavigate} currentUser={currentUser} />

      {/* Visitor Newsletter Subscription Box */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E1D8] shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left max-w-md">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              <Mail className="w-3 h-3 text-emerald-700" />
              <span>{locale === 'no' ? 'Nyhetsbrev & Tandem-kafeer' : 'Newsletter & Événements'}</span>
            </div>
            <h3 className="font-display text-xl font-medium text-[#1F2421]">
              {locale === 'no'
                ? 'Få invitasjoner til neste språkmøter i Oslo'
                : 'Recevez les prochains rendez-vous tandem à Oslo'}
            </h3>
            <p className="text-xs text-[#525E56] leading-relaxed">
              {locale === 'no'
                ? 'Motta tips om fransk/norsk språkutveksling, kafe-treff og aktiviteter. Ingen spam, meld deg av når som helst.'
                : 'Soirées apéro-tandem, cafés de conversation et astuces bilingues. Pas de spam, désinscription en un clic.'}
            </p>
          </div>

          <div className="w-full md:w-auto shrink-0">
            {visitorNewsletterDone ? (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 flex items-center gap-3 text-xs text-emerald-950 font-medium">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  {locale === 'no'
                    ? 'Takk for din påmelding! Du er nå registrert.'
                    : 'Merci ! Votre email a été bien enregistré pour les prochaines invitations.'}
                </span>
              </div>
            ) : (
              <form onSubmit={handleVisitorNewsletterSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="email"
                  required
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  placeholder={locale === 'no' ? 'din.epost@eksempel.no' : 'votre.email@exemple.com'}
                  className="px-4 py-2.5 text-xs bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D] min-w-[240px]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#2E4A3D] hover:bg-[#23382E] text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer whitespace-nowrap"
                >
                  {locale === 'no' ? 'Hold meg oppdatert' : 'Je m\'inscris'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Warm Scandinavian CTA Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#2E4A3D] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 max-w-lg text-center md:text-left">
            <h2 className="font-display text-2xl sm:text-3xl font-normal leading-tight">
              {t.ctaTitle}
            </h2>
            <p className="text-xs sm:text-sm text-[#D5DDD7] leading-relaxed">
              {t.ctaSubtitle}
            </p>
          </div>
          <button
            onClick={() => onNavigate(currentUser ? 'discovery' : 'auth')}
            className="px-6 py-3.5 bg-white text-[#2E4A3D] text-xs sm:text-sm font-medium rounded-xl hover:bg-[#FAF8F5] transition-all flex items-center gap-2 cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
          >
            <span>{t.ctaBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
