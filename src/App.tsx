import React, { useState } from 'react';
import { PageView, UserProfile } from './types';
import { dataStore } from './lib/supabase';
import { I18nProvider, useTranslation } from './lib/i18n';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { ProfileEditPage } from './pages/ProfileEditPage';
import { DiscoveryPage } from './pages/DiscoveryPage';
import { MessagesPage } from './pages/MessagesPage';
import { SettingsPage } from './pages/SettingsPage';
import { TermsModal } from './components/TermsModal';
import { LaunchKitModal } from './components/LaunchKitModal';
import { PaymentModal } from './components/PaymentModal';

function MainApp() {
  const { t, locale } = useTranslation();
  const [currentPage, setCurrentPage] = useState<PageView>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() =>
    dataStore.getCurrentUser()
  );
  const [profiles, setProfiles] = useState<UserProfile[]>(() =>
    dataStore.getProfiles()
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isLaunchKitOpen, setIsLaunchKitOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handleNavigateAuth = (mode: 'login' | 'signup' = 'signup') => {
    setAuthMode(mode);
    setCurrentPage('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateTo = (page: PageView) => {
    if ((page === 'messages' || page === 'profile-create') && !currentUser) {
      handleNavigateAuth('login');
      return;
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setProfiles(dataStore.getProfiles());
  };

  const handleLogout = () => {
    dataStore.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentPage('landing');
  };

  const handleStartChat = (partnerId: string) => {
    const convId = dataStore.startConversation(partnerId);
    setActiveConversationId(convId);
    setCurrentPage('messages');
  };

  const handleOpenPayment = () => {
    if (!currentUser) {
      handleNavigateAuth('signup');
    } else {
      setIsPaymentModalOpen(true);
    }
  };

  const handlePaymentSuccess = () => {
    const updated = dataStore.getCurrentUser();
    setCurrentUser(updated);
    setProfiles(dataStore.getProfiles());
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1F2421]">
      {/* Top Bar following 3-zone contract */}
      <Header
        currentPage={currentPage}
        onNavigate={navigateTo}
        onNavigateAuth={handleNavigateAuth}
        currentUser={currentUser}
        unreadCount={1}
        onOpenPayment={handleOpenPayment}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16 md:pb-0">
        {currentPage === 'landing' && (
          <LandingPage
            onNavigate={navigateTo}
            currentUser={currentUser}
            profiles={profiles}
            onOpenPayment={handleOpenPayment}
            onNavigateAuth={handleNavigateAuth}
          />
        )}

        {currentPage === 'auth' && (
          <AuthPage
            onNavigate={navigateTo}
            onLoginSuccess={handleLoginSuccess}
            initialMode={authMode}
          />
        )}

        {currentPage === 'profile-create' && currentUser && (
          <ProfileEditPage
            currentUser={currentUser}
            onNavigate={navigateTo}
            onProfileUpdated={(updated) => {
              setCurrentUser(updated);
              setProfiles(dataStore.getProfiles());
            }}
          />
        )}

        {currentPage === 'discovery' && (
          <DiscoveryPage
            currentUser={currentUser}
            onNavigate={navigateTo}
            onNavigateAuth={handleNavigateAuth}
            onStartChat={handleStartChat}
          />
        )}

        {currentPage === 'messages' && currentUser && (
          <MessagesPage
            currentUser={currentUser}
            initialConversationId={activeConversationId}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'settings' && (
          <SettingsPage
            currentUser={currentUser}
            onNavigate={navigateTo}
            onLogout={handleLogout}
            onUserUpdated={(updated) => {
              setCurrentUser(updated);
              setProfiles(dataStore.getProfiles());
            }}
          />
        )}
      </main>

      {/* Footer on non-chat pages */}
      {currentPage !== 'messages' && (
        <footer className="border-t border-[#E5E1D8] bg-[#F7F5F0] py-8 text-xs text-[#717A74]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-display font-medium text-[#1F2421]">{t.brandName}</span>
              <span aria-hidden="true">·</span>
              <span>{locale === 'no' ? 'Fransk-norsk språkutveksling i Oslo' : 'Tandem Franco-Norvégien à Oslo'}</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <button
                onClick={() => navigateTo('discovery')}
                className="hover:text-[#1F2421] transition-colors cursor-pointer"
              >
                {t.navDiscovery}
              </button>
              <button
                onClick={() => navigateTo('settings')}
                className="hover:text-[#1F2421] transition-colors cursor-pointer"
              >
                {t.navSettings}
              </button>
              <button
                onClick={() => setIsTermsOpen(true)}
                className="hover:text-[#1F2421] transition-colors cursor-pointer underline text-[#2E4A3D]"
              >
                {t.footerTerms}
              </button>
              <button
                onClick={() => setIsLaunchKitOpen(true)}
                className="hover:text-[#1F2421] transition-colors cursor-pointer font-medium text-[#FF5B24] flex items-center gap-1"
              >
                <span>🚀</span>
                <span>{locale === 'no' ? 'Lanseringskit & Plakat' : 'Kit de lancement & Affiche'}</span>
              </button>
              <span>·</span>
              <span>{locale === 'no' ? '39 kr prisen på en kaffe · Uten abonnement' : "39 NOK prix d'un café · Sans abonnement"}</span>
            </div>
          </div>
        </footer>
      )}

      {/* Mobile-first bottom navigation bar */}
      <BottomNav
        currentPage={currentPage}
        onNavigate={navigateTo}
        unreadCount={1}
      />

      {/* Legal & Privacy modal */}
      <TermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />

      {/* Launch Marketing Kit & Poster Modal */}
      <LaunchKitModal
        isOpen={isLaunchKitOpen}
        onClose={() => setIsLaunchKitOpen(false)}
      />

      {/* Global Subscription & Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <MainApp />
    </I18nProvider>
  );
}
