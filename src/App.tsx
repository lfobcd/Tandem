import React, { useState, useEffect } from 'react';
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
import { AdminSubscriptionsPage } from './pages/AdminSubscriptionsPage';
import { TermsModal } from './components/TermsModal';
import { LaunchKitModal } from './components/LaunchKitModal';
import { PaymentModal } from './components/PaymentModal';
import { TandemLogo } from './components/TandemLogo';

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

  useEffect(() => {
    document.title = 'Tandem Franco-Norsk';
  }, []);

  const handleNavigateAuth = (mode: 'login' | 'signup' = 'signup') => {
    setAuthMode(mode);
    setCurrentPage('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateTo = (page: PageView) => {
    const activeUser = currentUser || dataStore.getCurrentUser();
    if ((page === 'messages' || page === 'profile-create') && !activeUser) {
      handleNavigateAuth('login');
      return;
    }
    // Admin page is strictly restricted to bcdlfo@gmail.com or confirmed admin
    if (page === 'admin') {
      const isManager = Boolean(
        activeUser?.email?.toLowerCase() === 'bcdlfo@gmail.com' || activeUser?.is_admin
      );
      if (!isManager) {
        return;
      }
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user: UserProfile, targetPage: PageView = 'discovery') => {
    setCurrentUser(user);
    setProfiles(dataStore.getProfiles());
    setCurrentPage(targetPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            profiles={profiles}
            onNavigate={navigateTo}
            onNavigateAuth={handleNavigateAuth}
            onStartChat={handleStartChat}
          />
        )}

        {currentPage === 'messages' && (
          currentUser ? (
            <MessagesPage
              currentUser={currentUser}
              initialConversationId={activeConversationId}
              onNavigate={navigateTo}
            />
          ) : (
            <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#EAE5DC] text-[#2E4A3D] mx-auto flex items-center justify-center font-display text-xl font-bold shadow-xs">
                💬
              </div>
              <h2 className="font-display text-2xl font-normal text-[#1F2421]">
                {locale === 'no' ? 'Logg inn for å se meldinger' : 'Connectez-vous pour vos messages'}
              </h2>
              <p className="text-xs sm:text-sm text-[#717A74] max-w-sm mx-auto">
                {locale === 'no'
                  ? 'Du må være innlogget for å starte eller fortsette en samtale med dine tandems.'
                  : 'Vous devez être connecté pour initier ou poursuivre des échanges avec vos partenaires de tandem.'}
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => handleNavigateAuth('login')}
                  className="px-5 py-2.5 bg-[#2E4A3D] hover:bg-[#23382E] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  {locale === 'no' ? 'Logg inn' : 'Se connecter'}
                </button>
                <button
                  onClick={() => handleNavigateAuth('signup')}
                  className="px-5 py-2.5 bg-white border border-[#E5E1D8] text-[#1F2421] hover:bg-[#F2EFE9] text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  {locale === 'no' ? 'Opprett gratis konto' : 'Créer un compte'}
                </button>
              </div>
            </div>
          )
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

        {currentPage === 'admin' && (
          <AdminSubscriptionsPage
            currentUser={currentUser}
            onNavigate={navigateTo}
            onRefreshData={() => {
              setProfiles(dataStore.getProfiles());
              const updated = dataStore.getCurrentUser();
              if (updated) setCurrentUser(updated);
            }}
          />
        )}
      </main>

      {/* Footer on non-chat pages */}
      {currentPage !== 'messages' && (
        <footer className="border-t border-[#E5E1D8] bg-[#F7F5F0] py-8 text-xs text-[#717A74]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <TandemLogo className="w-6 h-6" />
              <span className="font-display font-medium text-[#1F2421]">{t.brandName}</span>
              <span aria-hidden="true">·</span>
              <span>{locale === 'no' ? 'Fransk-norsk språkutveksling i Oslo' : 'Tandem Franco-Norvégien à Oslo'}</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] flex-wrap">
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
              {(currentUser?.email?.toLowerCase() === 'bcdlfo@gmail.com' || currentUser?.is_admin === true) && (
                <button
                  onClick={() => navigateTo('admin')}
                  className="hover:text-[#1F2421] transition-colors cursor-pointer text-[#2E4A3D] font-medium flex items-center gap-1"
                  title="Espace gestionnaire des souscriptions Vipps"
                >
                  <span>🛡️</span>
                  <span>{locale === 'no' ? 'Vipps-administrasjon' : 'Espace Gestionnaire Vipps'}</span>
                </button>
              )}
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
