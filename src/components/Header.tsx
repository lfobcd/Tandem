import React from 'react';
import { PageView, UserProfile } from '../types';
import { useTranslation, Locale } from '../lib/i18n';
import {
  MessageSquare,
  Search,
  Settings,
  Coffee,
  Globe,
  Sparkles,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface HeaderProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  currentUser: UserProfile | null;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  currentUser,
  unreadCount = 0,
}) => {
  const { t, locale, setLocale } = useTranslation();

  const toggleLocale = () => {
    setLocale(locale === 'fr' ? 'no' : 'fr');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E5E1D8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand & Language Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#2E4A3D] text-[#FAF8F5] flex items-center justify-center font-display text-lg font-normal shadow-xs">
              T
            </div>
            <div>
              <span className="font-display text-lg font-normal tracking-tight text-[#1F2421] block leading-none group-hover:text-[#2E4A3D] transition-colors">
                {t.brandName}
              </span>
              <span className="text-[10px] tracking-widest uppercase text-[#717A74] block mt-0.5 font-medium">
                {t.brandTagline}
              </span>
            </div>
          </button>

          {/* Language Switcher Pill [FR / NO] */}
          <div className="flex items-center p-0.5 rounded-lg border border-[#E5E1D8] bg-[#F5F2EB] text-xs font-medium ml-2">
            <button
              onClick={() => setLocale('fr')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                locale === 'fr'
                  ? 'bg-white text-[#1F2421] shadow-xs'
                  : 'text-[#717A74] hover:text-[#1F2421]'
              }`}
              title="Passer le site en français"
            >
              <span>🇫🇷</span>
              <span className="text-[11px]">FR</span>
            </button>
            <button
              onClick={() => setLocale('no')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                locale === 'no'
                  ? 'bg-white text-[#1F2421] shadow-xs'
                  : 'text-[#717A74] hover:text-[#1F2421]'
              }`}
              title="Bytt til norsk nettside"
            >
              <span>🇳🇴</span>
              <span className="text-[11px]">NO</span>
            </button>
          </div>
        </div>

        {/* Zone 2: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-[#525E56]">
          <button
            onClick={() => onNavigate('discovery')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentPage === 'discovery'
                ? 'bg-[#EAE5DC] text-[#1F2421] font-semibold'
                : 'hover:text-[#1F2421] hover:bg-[#F2EFE9]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>{t.navDiscovery}</span>
          </button>

          <button
            onClick={() => {
              if (currentPage !== 'landing') {
                onNavigate('landing');
                setTimeout(() => {
                  document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              } else {
                document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer hover:text-[#1F2421] hover:bg-[#F2EFE9]"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t.navFaq}</span>
          </button>

          {currentUser && (
            <button
              onClick={() => onNavigate('messages')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer relative ${
                currentPage === 'messages'
                  ? 'bg-[#EAE5DC] text-[#1F2421] font-semibold'
                  : 'hover:text-[#1F2421] hover:bg-[#F2EFE9]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{t.navMessages}</span>
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#2E4A3D]"></span>
              )}
            </button>
          )}

          <button
            onClick={() => onNavigate('settings')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentPage === 'settings'
                ? 'bg-[#EAE5DC] text-[#1F2421] font-semibold'
                : 'hover:text-[#1F2421] hover:bg-[#F2EFE9]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{t.navSettings}</span>
          </button>
        </nav>

        {/* Zone 3: User State & Action */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('profile-create')}
                className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-[#E5E1D8] hover:border-[#1F2421] transition-colors bg-white text-xs cursor-pointer shadow-xs"
              >
                <div className="w-6 h-6 rounded-full bg-[#EAE5DC] text-[#2E4A3D] font-display text-xs font-semibold flex items-center justify-center overflow-hidden">
                  {currentUser.photo_url ? (
                    <img
                      src={currentUser.photo_url}
                      alt={currentUser.prenom}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    currentUser.prenom.charAt(0)
                  )}
                </div>
                <span className="font-medium text-[#1F2421] hidden sm:inline">
                  {currentUser.prenom}
                </span>
                {currentUser.a_paye && (
                  <span title={t.navStatusPaid}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E4A3D]" />
                  </span>
                )}
              </button>

              <button
                onClick={() => onNavigate('discovery')}
                className="px-4 py-2 text-xs font-medium text-white bg-[#2E4A3D] rounded-lg hover:bg-[#23382E] transition-colors whitespace-nowrap shadow-xs cursor-pointer"
              >
                {t.navFindTandem}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('auth')}
                className="px-3 py-2 text-xs font-medium text-[#1F2421] hover:text-[#2E4A3D] transition-colors cursor-pointer"
              >
                {t.navLogin}
              </button>
              <button
                onClick={() => onNavigate('auth')}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#2E4A3D] rounded-lg hover:bg-[#23382E] transition-colors shadow-xs cursor-pointer whitespace-nowrap"
              >
                {t.navSignup}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
