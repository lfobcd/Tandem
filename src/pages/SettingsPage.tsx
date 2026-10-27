import React, { useState } from 'react';
import { PageView, UserProfile } from '../types';
import { dataStore, setCustomSupabaseConfig, hasLiveSupabaseConfig } from '../lib/supabase';
import { useTranslation } from '../lib/i18n';
import { PaymentModal } from '../components/PaymentModal';
import { TermsModal } from '../components/TermsModal';
import { LaunchKitModal } from '../components/LaunchKitModal';
import {
  Key,
  Database,
  User,
  LogOut,
  RotateCcw,
  Check,
  CreditCard,
  Copy,
  Globe,
  ArrowRight,
  Shield,
  Download,
  Trash2,
  FileText,
  Share2,
  Printer,
  Sparkles,
} from 'lucide-react';

interface SettingsPageProps {
  currentUser: UserProfile | null;
  onNavigate: (page: PageView) => void;
  onLogout: () => void;
  onUserUpdated: (user: UserProfile) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser,
  onNavigate,
  onLogout,
  onUserUpdated,
}) => {
  const { t, locale, setLocale } = useTranslation();
  const [mapboxToken, setMapboxToken] = useState(dataStore.getMapboxToken());
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('tandem_supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('tandem_supabase_key') || '');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isLaunchKitOpen, setIsLaunchKitOpen] = useState(false);

  const handleExportData = () => {
    if (!currentUser) return;
    const conversations = dataStore.getConversations();
    const exportPayload = {
      app: 'Prat & Parle - Tandem Franco-Norvégien à Oslo',
      exportDate: new Date().toISOString(),
      user: currentUser,
      conversations: conversations,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tandem-oslo-data-${(currentUser.prenom || 'user').toLowerCase()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setSavedNotice(locale === 'no' ? 'Dine data ble lastet ned!' : 'Vos données ont été téléchargées !');
    setTimeout(() => setSavedNotice(null), 2500);
  };

  const handleDeleteAccount = () => {
    const confirmMessage = locale === 'no'
      ? 'Er du sikker på at du vil slette kontoen din og alle personopplysninger? Denne handlingen er permanent.'
      : 'Êtes-vous certain de vouloir supprimer définitivement votre compte et vos données ? Cette action est irréversible.';
    if (window.confirm(confirmMessage)) {
      onLogout();
      setSavedNotice(locale === 'no' ? 'Kontoen din er slettet.' : 'Votre compte a été supprimé.');
    }
  };

  const handleSaveMapbox = (e: React.FormEvent) => {
    e.preventDefault();
    dataStore.setMapboxToken(mapboxToken);
    setSavedNotice(locale === 'no' ? 'Mapbox-nøkkel lagret!' : 'Clé Mapbox enregistrée avec succès !');
    setTimeout(() => setSavedNotice(null), 2500);
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomSupabaseConfig(supabaseUrl, supabaseKey);
    setSavedNotice(locale === 'no' ? 'Supabase-innstillinger lagret!' : 'Configuration Supabase enregistrée !');
    setTimeout(() => setSavedNotice(null), 2500);
  };

  const handleTogglePaymentStatus = () => {
    if (!currentUser) return;
    const updated = dataStore.updateCurrentUser({ a_paye: !currentUser.a_paye });
    onUserUpdated(updated);
    setSavedNotice(
      updated.a_paye
        ? (locale === 'no' ? 'Status oppdatert: Ubegrenset tilgang aktiv' : 'Statut mis à jour : Accès illimité actif')
        : (locale === 'no' ? 'Status oppdatert: Gratis utforsking' : 'Statut mis à jour : Mode découverte (non payé)')
    );
    setTimeout(() => setSavedNotice(null), 2500);
  };

  const handleResetData = () => {
    if (confirm(locale === 'no' ? 'Vil du tilbakestille testprofilene i Oslo?' : 'Voulez-vous réinitialiser les profils et conversations de démonstration ?')) {
      dataStore.resetToDefault();
      window.location.reload();
    }
  };

  const sqlSchemaText = `-- Schéma PostgreSQL / Supabase pour Tandem (Norsk · Français)
-- Prend en charge l'authentification Email + OAuth (Google, Apple, Facebook)

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  prenom TEXT NOT NULL,
  langue_maternelle TEXT NOT NULL,
  langue_apprise TEXT NOT NULL,
  niveau TEXT NOT NULL,
  quartier TEXT NOT NULL,
  disponibilites JSONB DEFAULT '[]'::jsonb,
  envies TEXT,
  bio TEXT,
  photo_url TEXT,
  a_paye BOOLEAN DEFAULT false,
  derniere_activite TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.lieux_preferes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL
);

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL,
  participant_2 UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Title */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-normal text-[#1F2421]">
          {t.settingsTitle}
        </h1>
        <p className="text-xs text-[#525E56] mt-1">
          {t.settingsSubtitle}
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 bg-[#E8EDE6] text-[#2E4A3D] text-xs font-medium rounded-xl border border-[#D5E0D7] flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Language Selection Card */}
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAE5DC] text-[#2E4A3D] flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-normal text-[#1F2421]">
              {locale === 'no' ? 'Språk for nettsiden' : 'Langue du site'}
            </h3>
            <p className="text-xs text-[#717A74]">
              {locale === 'no'
                ? 'Velg mellom norsk og fransk for hele grensesnittet'
                : 'Basculez à tout moment entre le français et le norvégien'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocale('fr')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
              locale === 'fr'
                ? 'border-[#2E4A3D] bg-[#2E4A3D] text-white shadow-xs'
                : 'border-[#E5E1D8] bg-white text-[#525E56] hover:bg-[#FAF8F5]'
            }`}
          >
            <span>🇫🇷</span>
            <span>Français</span>
          </button>
          <button
            onClick={() => setLocale('no')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
              locale === 'no'
                ? 'border-[#2E4A3D] bg-[#2E4A3D] text-white shadow-xs'
                : 'border-[#E5E1D8] bg-white text-[#525E56] hover:bg-[#FAF8F5]'
            }`}
          >
            <span>🇳🇴</span>
            <span>Norsk</span>
          </button>
        </div>
      </div>

      {/* Profile Overview Card */}
      {currentUser && (
        <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#EAE5DC] text-[#2E4A3D] font-display text-xl font-semibold flex items-center justify-center overflow-hidden border border-[#E5E1D8]">
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
            <div>
              <h2 className="font-display text-lg font-normal text-[#1F2421]">
                {currentUser.prenom}
              </h2>
              <p className="text-xs text-[#525E56]">
                {currentUser.email || 'Tandem'} · {currentUser.quartier}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-[#717A74] mt-1">
                <span>{t.nativeLang}: <strong>{currentUser.langue_maternelle}</strong></span>
                <span>·</span>
                <span>{t.targetLang}: <strong>{currentUser.langue_apprise} ({currentUser.niveau})</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('profile-create')}
              className="px-4 py-2 bg-[#2E4A3D] text-white text-xs font-medium rounded-xl hover:bg-[#23382E] transition-colors cursor-pointer"
            >
              {t.settingsEditProfileBtn}
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-[#8C938E] hover:text-red-600 transition-colors"
              title="Logg ut / Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Payment Status Card */}
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-xs p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-[#2E4A3D]" />
              <h3 className="font-display text-base font-normal text-[#1F2421]">
                {t.settingsPaymentTitle}
              </h3>
            </div>
            <p className="text-xs text-[#525E56] max-w-xl leading-relaxed">
              {t.settingsPaymentDesc}
            </p>
          </div>

          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
              currentUser?.is_beta_pioneer
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : currentUser?.a_paye
                ? 'bg-[#E8EDE6] text-[#2E4A3D]'
                : 'bg-[#F5F2EB] text-[#717A74]'
            }`}
          >
            {currentUser?.is_beta_pioneer ? (
              <span>🔥 {locale === 'no' ? 'Pioner (Lansering)' : 'Pionnier Lancement (Gratuit)'}</span>
            ) : currentUser?.a_paye ? (
              t.statusUnlimitedActive
            ) : (
              t.statusFreeBrowse
            )}
          </span>
        </div>

        {/* Vipps Direct Payment Action */}
        {!currentUser?.a_paye ? (
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FFF6F3] border border-[#FFD9CD]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FF5B24] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                v
              </div>
              <div>
                <span className="text-xs font-semibold text-[#1F2421] block">
                  {locale === 'no' ? 'Lås opp alle kontakter med Vipps (92 13 17 92)' : 'Débloquer tous les contacts avec Vipps (92 13 17 92)'}
                </span>
                <span className="text-[11px] text-[#717A74]">
                  {locale === 'no' ? 'Engangsbeløp 39 kr · Vipps direkte til 92 13 17 92' : 'Paiement unique 39 kr (~3,50 €) · Vipps direct au 92 13 17 92'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              className="px-4 py-2 bg-[#FF5B24] hover:bg-[#E54A15] text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <span>{locale === 'no' ? 'Vipps 39 kr' : 'Vipps 39 kr'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="p-3 bg-[#F2F6F3] rounded-xl border border-[#D5E5DA] text-xs text-[#2E4A3D] flex items-center justify-between">
            <span className="font-medium">
              {currentUser?.is_beta_pioneer
                ? (locale === 'no'
                    ? '🎉 Gratulerer! Du er registrert i lanseringsmåneden og har gratis livslang tilgang til alt.'
                    : '🎉 Félicitations ! Vous êtes inscrit pendant le mois de lancement : accès gratuit illimité à vie.')
                : (locale === 'no' ? '✓ Ubegrenset tilgang er aktiv på din konto.' : '✓ Accès illimité actif sur votre compte.')}
            </span>
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              className="text-xs underline text-[#2E4A3D] cursor-pointer"
            >
              {locale === 'no' ? 'Vis detaljer' : 'Voir les détails'}
            </button>
          </div>
        )}

        {currentUser?.is_admin === true && (
          <div className="pt-2 flex items-center justify-between border-t border-[#F0ECE1]">
            <span className="text-xs text-[#8C938E]">
              {locale === 'no' ? 'Hurtigknapp for administrator (veksle status manuelt):' : 'Option gestionnaire (basculer le statut test) :'}
            </span>
            <button
              onClick={handleTogglePaymentStatus}
              className="px-3.5 py-1.5 rounded-lg border border-[#E5E1D8] text-xs font-medium text-[#2E4A3D] hover:bg-[#F5F2EB] transition-colors cursor-pointer"
            >
              {t.settingsTestToggleBtn}
            </button>
          </div>
        )}
      </div>

      {/* Profil Gestionnaire & Souscriptions Vipps - visible UNIQUEMENT pour bcdlfo@gmail.com ou profil gestionnaire */}
      {currentUser?.is_admin === true && (
        <div className="bg-gradient-to-br from-[#F5FAF7] via-white to-[#F0F5F2] rounded-2xl border-2 border-[#2E4A3D]/25 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#2E4A3D]" />
                <h3 className="font-display text-base font-semibold text-[#1F2421]">
                  {locale === 'no' ? 'Administrator & Vipps-styring' : 'Profil Gestionnaire & Souscriptions Vipps'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {locale === 'no' ? 'Aktiv administrator' : 'Gestionnaire Actif'}
                </span>
              </div>
              <p className="text-xs text-[#525E56] max-w-xl leading-relaxed">
                {locale === 'no'
                  ? 'Styr hvem som har betalt og hvem som ikke har betalt via Vipps (92 13 17 92). Godkjenn og aktiver profiler med ett klikk.'
                  : 'Gérez qui a payé et qui n\'a pas payé via Vipps (92 13 17 92). Activez ou désactivez les profils des utilisateurs en un clic avec votre rôle gestionnaire.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="px-4 py-2.5 bg-[#2E4A3D] hover:bg-[#23382E] text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer whitespace-nowrap self-start"
            >
              <span>🛡️</span>
              <span>{locale === 'no' ? 'Åpne Vipps-kontrollpanel' : 'Ouvrir l\'Espace Gestionnaire'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Mapbox Configuration */}
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-xs p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Key className="w-4 h-4 text-[#2E4A3D]" />
              <h3 className="font-display text-base font-normal text-[#1F2421]">
                {t.settingsMapboxTitle}
              </h3>
            </div>
            <p className="text-xs text-[#525E56] leading-relaxed max-w-2xl">
              {t.settingsMapboxDesc}
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveMapbox} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#525E56]">{t.settingsMapboxInputLabel}</label>
            <input
              type="text"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              placeholder="pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNseXl..."
              className="w-full px-3.5 py-2 text-xs bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl font-mono focus:outline-none focus:border-[#2E4A3D]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-[11px] text-[#717A74]">
              {locale === 'no' ? 'Google Maps er direkte integrert som standard for alle møtesteder i Oslo.' : 'Google Maps est directement intégré par défaut pour tous les lieux de rencontre à Oslo.'}
            </span>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2E4A3D] text-white text-xs font-medium rounded-xl hover:bg-[#23382E] transition-colors cursor-pointer"
            >
              {t.settingsMapboxSaveBtn}
            </button>
          </div>
        </form>
      </div>

      {/* Supabase Configuration with OAuth info */}
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-xs p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-[#2E4A3D]" />
              <h3 className="font-display text-base font-normal text-[#1F2421]">
                {t.settingsSupabaseTitle}
              </h3>
            </div>
            <p className="text-xs text-[#525E56] leading-relaxed max-w-2xl">
              {t.settingsSupabaseDesc}
            </p>
          </div>
          <span
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full ${
              hasLiveSupabaseConfig()
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-[#F5F2EB] text-[#717A74]'
            }`}
          >
            {hasLiveSupabaseConfig() ? 'Supabase tilkoblet' : 'Lokal demomodus'}
          </span>
        </div>

        <form onSubmit={handleSaveSupabase} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#525E56]">URL du projet Supabase</label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl font-mono focus:outline-none focus:border-[#2E4A3D]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#525E56]">Clé publique anon / API key</label>
              <input
                type="text"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl font-mono focus:outline-none focus:border-[#2E4A3D]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
            <button
              type="button"
              onClick={() => setShowSqlSchema(!showSqlSchema)}
              className="text-[#2E4A3D] underline"
            >
              {showSqlSchema ? t.settingsSqlToggleHide : t.settingsSqlToggleShow}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2E4A3D] text-white text-xs font-medium rounded-xl hover:bg-[#23382E] transition-colors cursor-pointer"
            >
              {t.settingsSupabaseSaveBtn}
            </button>
          </div>
        </form>

        {showSqlSchema && (
          <div className="mt-3 p-3.5 bg-[#1F2421] text-emerald-300 rounded-xl text-xs font-mono relative overflow-x-auto">
            <div className="flex items-center justify-between text-[#8C938E] pb-2 border-b border-white/10 mb-2">
              <span>supabase_schema.sql</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlSchemaText);
                  setSqlCopied(true);
                  setTimeout(() => setSqlCopied(false), 2000);
                }}
                className="text-white hover:text-emerald-400 flex items-center gap-1 text-[11px]"
              >
                <Copy className="w-3 h-3" />
                <span>{sqlCopied ? 'Kopiert! / Copié !' : 'Kopier / Copier'}</span>
              </button>
            </div>
            <pre className="text-[11px] leading-relaxed whitespace-pre-wrap">
              {sqlSchemaText}
            </pre>
          </div>
        )}
      </div>

      {/* GDPR & Privacy Data Rights */}
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-xs p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-[#2E4A3D]" />
              <h3 className="font-display text-base font-normal text-[#1F2421]">
                {t.settingsGdprTitle}
              </h3>
            </div>
            <p className="text-xs text-[#525E56] leading-relaxed max-w-2xl">
              {t.settingsGdprDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsTermsModalOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-[#E5E1D8] text-xs font-medium text-[#2E4A3D] hover:bg-[#F5F2EB] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t.settingsViewTermsBtn}</span>
          </button>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0ECE1]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportData}
              className="px-3.5 py-2 bg-[#F5F2EB] hover:bg-[#EBE7DE] text-[#2E4A3D] text-xs font-medium rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.settingsExportDataBtn}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleDeleteAccount}
            className="px-3.5 py-2 text-red-600 hover:bg-red-50 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-red-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.settingsDeleteAccountBtn}</span>
          </button>
        </div>
      </div>

      {/* Launch Marketing Kit & Poster Card */}
      <div className="bg-gradient-to-br from-[#FFF6F3] to-[#FAF8F5] rounded-2xl border border-[#FFD9CD] shadow-xs p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#FF5B24]" />
              <h3 className="font-display text-base font-semibold text-[#1F2421]">
                {locale === 'no' ? 'Lanseringskit & Markedsføring for Oslo' : 'Kit de Lancement & Affiche Cafés'}
              </h3>
            </div>
            <p className="text-xs text-[#525E56] leading-relaxed max-w-xl">
              {locale === 'no'
                ? 'Generer en elegant A4-plakat med QR-kode for Deichman, Fuglen og Kulturhuset, samt ferdige innlegg for Facebook- og studentgrupper.'
                : 'Imprimez l’affiche A4 officielle avec QR code pour les cafés partenaires (Deichman, Fuglen, Kulturhuset) et copiez les annonces pour les réseaux sociaux.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsLaunchKitOpen(true)}
            className="px-4 py-2 bg-[#FF5B24] hover:bg-[#E54A15] text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{locale === 'no' ? 'Åpne lanseringskit' : 'Ouvrir le kit & affiche'}</span>
          </button>
        </div>
      </div>

      {/* Reset System Data */}
      <div className="p-4 bg-white rounded-2xl border border-[#E5E1D8] flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-[#1F2421] block">
            {t.settingsResetTitle}
          </span>
          <span className="text-[11px] text-[#717A74]">
            {t.settingsResetDesc}
          </span>
        </div>
        <button
          onClick={handleResetData}
          className="px-3.5 py-1.5 rounded-lg border border-[#E5E1D8] text-xs text-[#717A74] hover:text-[#1F2421] hover:bg-[#F5F2EB] transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t.settingsResetBtn}</span>
        </button>
      </div>

      {/* Payment Modal with Vipps & Card */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => {
          if (currentUser) {
            const fresh = dataStore.getCurrentUser();
            if (fresh) onUserUpdated(fresh);
          }
        }}
      />

      {/* Terms & Privacy Modal */}
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />

      {/* Launch Marketing Kit & Poster Modal */}
      <LaunchKitModal
        isOpen={isLaunchKitOpen}
        onClose={() => setIsLaunchKitOpen(false)}
      />
    </div>
  );
};
