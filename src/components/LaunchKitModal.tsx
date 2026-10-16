import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  Copy,
  Check,
  Share2,
  FileText,
  Sparkles,
  QrCode,
  Coffee,
  Database,
  ExternalLink,
  MessageCircle,
  Users,
} from 'lucide-react';
import { useTranslation } from '../lib/i18n';
import { hasLiveSupabaseConfig } from '../lib/supabase';

interface LaunchKitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LaunchKitModal: React.FC<LaunchKitModalProps> = ({ isOpen, onClose }) => {
  const { locale } = useTranslation();
  const [activeTab, setActiveTab] = useState<'poster' | 'social' | 'database'>('poster');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentAppUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tandem.oslo';

  useEffect(() => {
    QRCode.toDataURL(
      currentAppUrl,
      {
        width: 320,
        margin: 1.5,
        color: {
          dark: '#1F3D2B',
          light: '#FFFFFF',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrCodeDataUrl(url);
        }
      }
    );
  }, [currentAppUrl]);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  // Social templates
  const frenchFacebookPost = `☕ Tu habites à Oslo et tu souhaites pratiquer le norvégien tout en aidant un(e) Norvégien(ne) en français ?

Découvrez "Prat & Parle", la plateforme locale de tandems linguistiques à Oslo ! 🇳🇴🇫🇷

Le principe est simple et convivial :
📍 Trouvez des partenaires dans votre quartier (Grünerløkka, Majorstuen, Sentrum, Frogner...).
☕ Proposez de vous retrouver dans des cafés sympas (Fuglen, Deichman Bjørvika, Kulturhuset...) pour 30 min en français et 30 min en norsk.
🔒 Plateforme sécurisée : profil vérifié, consultation 100% gratuite, et cotisation unique de seulement 39 kr (le prix d'un café, sans aucun abonnement).

👉 Rejoins-nous ici : ${currentAppUrl}
Ha det bra og velkommen!`;

  const norwegianFacebookPost = `☕ Lyst til å øve på fransk over en uformell kaffe i Oslo? 

Møt fransktalende som bor i Oslo og ønsker å lære norsk gjennom språktandem på "Prat & Parle"! 🇳🇴🇫🇷

Hvordan fungerer det?
📍 Se hvem som er i ditt nærområde (Grünerløkka, Majorstuen, Sentrum...).
☕ Avtal et 30 min fransk / 30 min norsk møte på Deichman Bjørvika, Kulturhuset eller Café Fuglen.
🔒 Kun 39 kr i engangsgebyr (prisen på en kaffe) for ubegrenset tilgang – helt uten abonnement eller skjulte kostnader.

👉 Bli med gratis i dag: ${currentAppUrl}
A bientôt over en kaffe!`;

  const shortWhatsAppPost = `Hei! Sjekk ut "Prat & Parle" for å finne fransktalende og norsktalende språktandems i Oslo: ${currentAppUrl} (30 min FR / 30 min NO over en kaffe, kun 39 kr engangssum uten abonnement) ☕🇳🇴🇫🇷`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#FAF8F5] w-full max-w-3xl rounded-3xl shadow-2xl border border-[#E5E1D8] flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E5E1D8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8EDE6] text-[#2E4A3D] flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-normal text-[#1F2421]">
                {locale === 'no' ? 'Lanseringskit & Markedsføring' : 'Kit de Lancement & Communication'}
              </h2>
              <p className="text-xs text-[#717A74]">
                {locale === 'no'
                  ? 'Affiche A4 for kafeer i Oslo og ferdige innlegg for sosiale medier'
                  : 'Affiche A4 pour les cafés partenaires et annonces prêtes à partager'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#717A74] hover:text-[#1F2421] hover:bg-[#F2EFE9] rounded-xl transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 pb-2 bg-[#F5F2EB] border-b border-[#E5E1D8] flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('poster')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'poster'
                ? 'bg-white text-[#2E4A3D] shadow-xs font-semibold'
                : 'text-[#717A74] hover:text-[#1F2421]'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{locale === 'no' ? 'Affiche A4 Café & Bibliotek' : 'Affiche A4 (Cafés & Deichman)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('social')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'social'
                ? 'bg-white text-[#2E4A3D] shadow-xs font-semibold'
                : 'text-[#717A74] hover:text-[#1F2421]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{locale === 'no' ? 'Innlegg til sosiale medier' : 'Textes prêts à poster'}</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'database'
                ? 'bg-white text-[#2E4A3D] shadow-xs font-semibold'
                : 'text-[#717A74] hover:text-[#1F2421]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{locale === 'no' ? 'Database & Produksjon' : 'Guide Base en Ligne'}</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* TAB 1: PRINTABLE POSTER */}
          {activeTab === 'poster' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold text-sm text-[#1F2421]">
                    {locale === 'no' ? 'Plakat tilpasset A4-utskrift' : 'Affiche prête à être imprimée en format A4'}
                  </h3>
                  <p className="text-xs text-[#717A74]">
                    {locale === 'no'
                      ? 'Perfekt til oppslagstavler på Deichman Bjørvika, Kulturhuset, Fuglen eller UiO.'
                      : 'Idéale pour les tableaux d’affichage à Deichman Bjørvika, Kulturhuset, Fuglen ou UiO.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-[#2E4A3D] hover:bg-[#23382E] text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{locale === 'no' ? 'Skriv ut plakat (A4 / PDF)' : "Imprimer l'affiche (A4 / PDF)"}</span>
                </button>
              </div>

              {/* Printable Poster Container */}
              <div
                id="printable-poster"
                className="bg-white border-2 border-[#1F3D2B]/20 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center text-center max-w-xl mx-auto space-y-6"
              >
                {/* Header Branding */}
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8EDE6] text-[#1F3D2B] text-xs font-bold uppercase tracking-wider">
                    <span>🇳🇴 Oslo Tandem 🇫🇷</span>
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-medium text-[#1F2421] leading-tight">
                    Vil du øve på fransk eller norsk over en kaffe?
                  </h1>
                  <p className="text-sm font-display italic text-[#525E56]">
                    Prat & Parle · Språkutveksling i Oslo
                  </p>
                </div>

                {/* Big QR Code */}
                <div className="p-4 bg-white rounded-2xl border-2 border-[#1F3D2B] shadow-md flex flex-col items-center">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code Tandem Oslo"
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-[#F5F2EB] animate-pulse rounded-xl" />
                  )}
                  <span className="text-xs font-bold text-[#1F3D2B] mt-2 block tracking-tight">
                    {locale === 'no' ? 'SKANN MED MOBILEN FOR Å STARTE' : 'SCANNEZ POUR COMMENCER'}
                  </span>
                </div>

                {/* 3 Steps */}
                <div className="grid grid-cols-3 gap-3 w-full text-left">
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8]">
                    <span className="w-6 h-6 rounded-full bg-[#1F3D2B] text-white flex items-center justify-center font-bold text-xs mb-1">
                      1
                    </span>
                    <strong className="text-xs text-[#1F2421] block">
                      {locale === 'no' ? 'Skann koden' : 'Scannez le code'}
                    </strong>
                    <span className="text-[10px] text-[#717A74] block mt-0.5">
                      {locale === 'no' ? 'Åpne direkte i nettleseren' : 'Accès instantané sans appli'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8]">
                    <span className="w-6 h-6 rounded-full bg-[#1F3D2B] text-white flex items-center justify-center font-bold text-xs mb-1">
                      2
                    </span>
                    <strong className="text-xs text-[#1F2421] block">
                      {locale === 'no' ? 'Finn en partner' : 'Trouvez un tandem'}
                    </strong>
                    <span className="text-[10px] text-[#717A74] block mt-0.5">
                      {locale === 'no' ? 'I Grünerløkka, Sentrum...' : 'Dans votre quartier'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8]">
                    <span className="w-6 h-6 rounded-full bg-[#1F3D2B] text-white flex items-center justify-center font-bold text-xs mb-1">
                      3
                    </span>
                    <strong className="text-xs text-[#1F2421] block">
                      {locale === 'no' ? '30 / 30 min samtale' : '30 min FR / 30 min NO'}
                    </strong>
                    <span className="text-[10px] text-[#717A74] block mt-0.5">
                      {locale === 'no' ? 'På en hyggelig kafé' : 'Autour d’un bon café'}
                    </span>
                  </div>
                </div>

                {/* Price and Trust Footer */}
                <div className="pt-2 border-t border-[#E5E1D8] w-full flex items-center justify-between text-xs text-[#525E56]">
                  <span className="font-semibold text-[#1F2421]">
                    {locale === 'no'
                      ? '39 kr engangssum (prisen på en kaffe) · Ingen abonnement'
                      : '39 NOK (~3,50 €) paiement unique · Sans abonnement'}
                  </span>
                  <span className="font-mono text-[11px] text-[#717A74]">{currentAppUrl.replace('https://', '')}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SOCIAL MEDIA POSTS */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              <p className="text-xs text-[#717A74]">
                {locale === 'no'
                  ? 'Kopier disse ferdige tekstene med ett klikk for å publisere i relevante grupper i Oslo.'
                  : 'Copiez ces textes en un clic pour vos publications dans les groupes cibles à Oslo.'}
              </p>

              {/* POST 1: French Expat Groups */}
              <div className="bg-white p-4 rounded-2xl border border-[#E5E1D8] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[11px] font-semibold">
                      🇫🇷 Groupes Facebook "Français à Oslo / En Norvège"
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(frenchFacebookPost, 'fr_fb')}
                    className="px-3 py-1 bg-[#F5F2EB] hover:bg-[#EBE7DE] text-[#2E4A3D] text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'fr_fb' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier l'annonce</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-[#FAF8F5] rounded-xl text-xs font-sans text-[#3D4741] leading-relaxed whitespace-pre-wrap border border-[#E5E1D8]">
                  {frenchFacebookPost}
                </pre>
              </div>

              {/* POST 2: Norwegian Students & Francophiles */}
              <div className="bg-white p-4 rounded-2xl border border-[#E5E1D8] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-red-50 text-red-800 text-[11px] font-semibold">
                      🇳🇴 Norske grupper (UiO Fransk, Deichman, Språkkafeer)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(norwegianFacebookPost, 'no_fb')}
                    className="px-3 py-1 bg-[#F5F2EB] hover:bg-[#EBE7DE] text-[#2E4A3D] text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'no_fb' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Kopiert!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopier teksten</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-[#FAF8F5] rounded-xl text-xs font-sans text-[#3D4741] leading-relaxed whitespace-pre-wrap border border-[#E5E1D8]">
                  {norwegianFacebookPost}
                </pre>
              </div>

              {/* POST 3: Quick WhatsApp / Telegram */}
              <div className="bg-white p-4 rounded-2xl border border-[#E5E1D8] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                      💬 Message court (WhatsApp / Telegram / Stories)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(shortWhatsAppPost, 'wa')}
                    className="px-3 py-1 bg-[#F5F2EB] hover:bg-[#EBE7DE] text-[#2E4A3D] text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'wa' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Kopiert!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopier melding</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-[#FAF8F5] rounded-xl text-xs font-sans text-[#3D4741] leading-relaxed whitespace-pre-wrap border border-[#E5E1D8]">
                  {shortWhatsAppPost}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: DATABASE GUIDE */}
          {activeTab === 'database' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-[#E5E1D8] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#2E4A3D]" />
                    <h3 className="font-display font-semibold text-sm text-[#1F2421]">
                      {locale === 'no' ? 'Status for datalagring' : 'État de la base de données'}
                    </h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      hasLiveSupabaseConfig()
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-[#F5F2EB] text-[#717A74]'
                    }`}
                  >
                    {hasLiveSupabaseConfig()
                      ? (locale === 'no' ? '✓ Aktiv Supabase-skybase' : '✓ Base distante Supabase connectée')
                      : (locale === 'no' ? 'Lokal demomodus (aktiv nå)' : 'Mode démonstration local actif')}
                  </span>
                </div>
                <p className="text-xs text-[#525E56] leading-relaxed">
                  {locale === 'no'
                    ? 'Appen fungerer for øyeblikket umiddelbart i lokal modus (alle registreringer og samtaler lagres trygt i nettleserens localStorage). For å dele samme base med alle eksterne brukere på tvers av enheter, trenger du bare å legge inn prosjekt-URL og anon-nøkkel fra et gratis Supabase-prosjekt.'
                    : "L'application fonctionne immédiatement en mode autonome (toutes les inscriptions, profils et conversations sont sauvegardés dans le navigateur). Pour synchroniser les vrais utilisateurs d'Oslo sur tous leurs appareils respectifs, il vous suffit de créer un projet gratuit sur Supabase et d'entrer l'URL et la clé dans la page Paramètres."}
                </p>
              </div>

              <div className="p-4 bg-[#F2F6F3] rounded-2xl border border-[#D5E5DA] space-y-2">
                <span className="font-semibold text-xs text-[#2E4A3D] block">
                  {locale === 'no' ? 'Slik kobler du til Supabase på 2 minutter:' : 'Étapes pour connecter Supabase en 2 minutes :'}
                </span>
                <ol className="list-decimal pl-4 space-y-1.5 text-xs text-[#3D4741]">
                  <li>
                    {locale === 'no' ? 'Opprett et gratis prosjekt på' : 'Créez un projet gratuit sur'}{' '}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold text-[#2E4A3D]"
                    >
                      supabase.com
                    </a>.
                  </li>
                  <li>
                    {locale === 'no'
                      ? 'Gå til "SQL Editor" i Supabase og lim inn SQL-skriptet som finnes i Tandem-innstillingene.'
                      : 'Allez dans le "SQL Editor" de Supabase et collez le script SQL présent dans vos Paramètres.'}
                  </li>
                  <li>
                    {locale === 'no'
                      ? 'Kopier din Project URL og anon public API key til Innstillinger i Tandem.'
                      : 'Copiez votre Project URL et votre clé anon public dans la page Paramètres de Tandem.'}
                  </li>
                  <li>
                    {locale === 'no'
                      ? 'Ferdig! Profiler, meldinger og OAuth (Google/Apple/Facebook) synkroniseres direkte i skyen.'
                      : 'Terminé ! Les profils, messages et connexions (Google/Apple/Facebook) sont instantanément en direct.'}
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#E5E1D8] flex items-center justify-between">
          <span className="text-xs text-[#717A74]">
            {locale === 'no' ? 'Klar for lansering i Oslo' : 'Prêt pour le lancement à Oslo'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#2E4A3D] hover:bg-[#23382E] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {locale === 'no' ? 'Lukk' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
};
