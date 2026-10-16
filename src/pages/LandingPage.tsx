import React from 'react';
import { PageView, UserProfile } from '../types';
import { useTranslation } from '../lib/i18n';
import heroCafeImage from '../assets/images/hero_scandi_cafe_1790239285793.jpg';
import { FaqSection } from '../components/FaqSection';
import {
  ArrowRight,
  Coffee,
  CheckCircle2,
  MapPin,
  Sparkles,
  Users,
  Compass,
  MessageSquare,
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

      {/* Featured Profiles Preview */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#2E4A3D] font-semibold block mb-1">
              {t.activeCommunityTitleBadge}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-normal text-[#1F2421]">
              {t.activeCommunityTitle}
            </h2>
          </div>
          <button
            onClick={() => onNavigate('discovery')}
            className="text-xs font-medium text-[#2E4A3D] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{t.viewAllProfiles}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.slice(0, 3).map((profile) => (
            <div
              key={profile.id}
              onClick={() => onNavigate('discovery')}
              className="p-5 bg-white rounded-2xl border border-[#E5E1D8] shadow-xs hover:border-[#2E4A3D] transition-all cursor-pointer space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#EAE5DC] text-[#2E4A3D] font-display text-lg font-semibold flex items-center justify-center overflow-hidden border border-[#E5E1D8]">
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
                <div>
                  <h3 className="font-display text-base font-normal text-[#1F2421]">
                    {profile.prenom}
                  </h3>
                  <p className="text-xs text-[#717A74] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#2E4A3D]" />
                    {profile.quartier}
                  </p>
                </div>
              </div>

              <div className="border-t border-[#F0ECE1] pt-3 text-xs text-[#525E56] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#8C938E]">{t.nativeLang}:</span>
                  <span className="font-medium text-[#1F2421] capitalize">
                    {profile.langue_maternelle === 'français' ? '🇫🇷 Français' : '🇳🇴 Norsk'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C938E]">{t.targetLang}:</span>
                  <span className="font-medium text-[#1F2421] capitalize">
                    {profile.langue_apprise === 'norvégien' ? '🇳🇴 Norsk' : '🇫🇷 Français'} ({profile.niveau})
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#525E56] line-clamp-2 leading-relaxed">
                {profile.bio}
              </p>

              {profile.lieux_preferes && profile.lieux_preferes[0] && (
                <div className="text-[11px] text-[#2E4A3D] bg-[#FAF8F5] p-2 rounded-lg flex items-center gap-1.5 border border-[#E5E1D8]">
                  <Coffee className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{profile.lieux_preferes[0].label}</span>
                </div>
              )}
            </div>
          ))}
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

            {/* Plan 2: Lifetime Unlimited Subscription */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFBF9] border-2 border-[#FF5B24] flex flex-col justify-between space-y-6 relative shadow-sm">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-[#FF5B24] text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                {locale === 'no' ? 'Anbefalt · Ubegrenset' : 'Accès illimité · Recommandé'}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#FF5B24] uppercase tracking-wider">
                    {locale === 'no' ? 'Full tilgang (Vipps)' : 'Souscription unique'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FFEAE2] text-[#FF5B24] text-xs font-semibold">
                    39 kr
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-3xl font-bold text-[#FF5B24]">39 NOK</span>
                    <span className="text-xs text-[#717A74]">/ {locale === 'no' ? 'engangsbeløp' : 'paiement unique (~3,50 €)'}</span>
                  </div>
                  <span className="text-xs text-[#717A74] block">
                    {locale === 'no' ? 'Prisen på en kaffe i Oslo · Ingen binding' : "Le prix d'un café à Oslo · Accès à vie"}
                  </span>
                </div>
                <ul className="space-y-2.5 text-xs text-[#1F2421] pt-2">
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#FF5B24] shrink-0" />
                    <span>{locale === 'no' ? 'Alt i gratis medlemskap inkludert' : 'Tout ce qui est inclus dans le compte gratuit'}</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#FF5B24] shrink-0" />
                    <span>{locale === 'no' ? 'Send ubegrenset med meldinger til alle tandems' : 'Messages illimités vers tous les profils'}</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#FF5B24] shrink-0" />
                    <span>{locale === 'no' ? 'Direkte betaling med Vipps til 92 13 17 92 eller kort' : 'Paiement direct Vipps (92 13 17 92) ou Carte'}</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#FF5B24] shrink-0" />
                    <span>{locale === 'no' ? 'Verifisert medlemsmerke på profilen din' : 'Badge membre vérifié sur votre profil'}</span>
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
                className="w-full py-3 bg-[#FF5B24] hover:bg-[#E54A15] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                {currentUser?.a_paye ? (
                  <span>{locale === 'no' ? '✓ Du har ubegrenset tilgang' : '✓ Vous avez la souscription active'}</span>
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

      {/* FAQ & Tandem Guide Section */}
      <FaqSection onNavigate={onNavigate} currentUser={currentUser} />

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
