import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Lock, HeartHandshake, Coffee, Check, Download, Trash2 } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy' | 'safety';
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
}) => {
  const { locale } = useTranslation();
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'safety'>(initialTab);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
    >
      <div
        className="bg-[#FAF8F5] w-full max-w-2xl rounded-3xl shadow-2xl border border-[#E5E1D8] flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E5E1D8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8EDE6] text-[#2E4A3D] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="terms-modal-title" className="font-display text-lg font-normal text-[#1F2421]">
                {locale === 'no' ? 'Vilkår, Personvern & Trygghet' : 'Conditions, Confidentialité & Sécurité'}
              </h2>
              <p className="text-xs text-[#717A74]">
                {locale === 'no'
                  ? 'Prat & Parle · Fransk-norsk språkutveksling i Oslo'
                  : 'Prat & Parle · Échange linguistique Franco-Norvégien à Oslo'}
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
            onClick={() => setActiveTab('terms')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'terms'
                ? 'bg-white text-[#2E4A3D] shadow-xs font-semibold'
                : 'text-[#717A74] hover:text-[#1F2421]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{locale === 'no' ? 'Brukervilkår (CGU)' : "Conditions d'utilisation (CGU)"}</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'bg-white text-[#2E4A3D] shadow-xs font-semibold'
                : 'text-[#717A74] hover:text-[#1F2421]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{locale === 'no' ? 'Personvern (GDPR)' : 'Confidentialité & Données'}</span>
          </button>

          <button
            onClick={() => setActiveTab('safety')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'safety'
                ? 'bg-white text-[#2E4A3D] shadow-xs font-semibold'
                : 'text-[#717A74] hover:text-[#1F2421]'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>{locale === 'no' ? 'Møte- & Samfunnsregler' : 'Charte de rencontre'}</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#3D4741] leading-relaxed">
          {/* TAB 1: TERMS */}
          {activeTab === 'terms' && (
            <div className="space-y-5">
              <section className="bg-white p-4 rounded-2xl border border-[#E5E1D8] space-y-2">
                <h3 className="font-display font-semibold text-sm text-[#1F2421]">
                  {locale === 'no' ? '1. Formål med tjenesten' : '1. Objet du service'}
                </h3>
                <p>
                  {locale === 'no'
                    ? 'Prat & Parle er en uavhengig plattform for språkutveksling mellom fransktalende og norsktalende i Oslo-regionen. Målet er å fremme læring, vennskap og kulturutveksling gjennom trygge møter i offentlige rom som biblioteker og kafeer.'
                    : 'Prat & Parle est une plateforme indépendante de mise en relation bienveillante dédiée aux échanges linguistiques (tandem) entre francophones et norvégophones dans la région d\'Oslo. Le service permet de découvrir des profils compatibles et de convenir de rendez-vous de conversation.'}
                </p>
              </section>

              <section className="bg-[#FFF6F3] p-4 rounded-2xl border border-[#FFD9CD] space-y-2">
                <div className="flex items-center gap-2 text-[#FF5B24] font-semibold text-xs">
                  <Coffee className="w-4 h-4" />
                  <span>
                    {locale === 'no'
                      ? '2. Medlemskap & Vipps-betaling (39 kr engangsbeløp)'
                      : '2. Cotisation & Paiement Vipps (39 NOK paiement unique)'}
                  </span>
                </div>
                <ul className="space-y-1.5 list-disc pl-4 text-[#525E56]">
                  <li>
                    <strong>{locale === 'no' ? 'Engangsbeløp uten abonnement:' : 'Paiement unique sans abonnement :'}</strong>{' '}
                    {locale === 'no'
                      ? 'Deltakeravgiften er på 39 NOK (tilsvarer prisen på en kopp filterkaffe). Dette er et engangsgebyr. Det forekommer ALDRI noen månedlig fornyelse eller skjult abonnement.'
                      : 'La participation aux frais est fixée à 39 NOK (~3,50 €, le prix d\'un café filtre). Il s\'agit d\'un versement UNIQUE. Aucun prélèvement récurrent ni reconduction tacite.'}
                  </li>
                  <li>
                    <strong>{locale === 'no' ? 'Tilgang som låses opp:' : 'Accès débloqué :'}</strong>{' '}
                    {locale === 'no'
                      ? 'Betalingen gir livslang tilgang til å kontakte alle nåværende og fremtidige medlemmer, sende ubegrensede meldinger og avtale møtesteder på kartet.'
                      : 'Le paiement ouvre un accès complet et illimité pour contacter tous les membres inscrits, envoyer des messages et convenir de lieux sur la carte.'}
                  </li>
                  <li>
                    <strong>{locale === 'no' ? 'Vipps direkte til 92 13 17 92:' : 'Vipps direct au 92 13 17 92 :'}</strong>{' '}
                    {locale === 'no'
                      ? 'Betalingen kan utføres sømløst via den offisielle Vipps-appen eller bankkort.'
                      : 'Le règlement s\'effectue en toute confiance via l\'application norvégienne officielle Vipps ou par carte bancaire.'}
                  </li>
                </ul>
              </section>

              <section className="bg-white p-4 rounded-2xl border border-[#E5E1D8] space-y-2">
                <h3 className="font-display font-semibold text-sm text-[#1F2421]">
                  {locale === 'no' ? '3. Brukeransvar og verifisering' : '3. Responsabilité des utilisateurs'}
                </h3>
                <p>
                  {locale === 'no'
                    ? 'Enhver bruker forplikter seg til å oppgi sannferdige opplysninger (fornavn, morsmål, språknivå) og opptre høflig. Tjenesten er utelukkende ment for språkopplæring og vennskapelig utveksling, og enhver form for kommersiell reklame eller upassende henvendelser fører til umiddelbar utestengelse.'
                    : 'Chaque membre s\'engage à renseigner des informations exactes (prénom, langues, niveau estimé) et à communiquer avec courtoisie. L\'application est strictement réservée à l\'apprentissage linguistique mutuel et aux échanges culturels.'}
                </p>
              </section>
            </div>
          )}

          {/* TAB 2: PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <section className="bg-white p-4 rounded-2xl border border-[#E5E1D8] space-y-2">
                <div className="flex items-center gap-2 text-[#2E4A3D] font-semibold text-xs">
                  <Lock className="w-4 h-4" />
                  <span>
                    {locale === 'no'
                      ? 'Overholdelse av Personvernforordningen (GDPR)'
                      : 'Conformité RGPD & Respect de la vie privée'}
                  </span>
                </div>
                <p>
                  {locale === 'no'
                    ? 'Vi tar personvernet ditt på største alvor. Vi samler kun inn nødvendige data for å koble deg sammen med en passende språkpartner i Oslo.'
                    : 'La protection de vos données personnelles est une priorité fondamentale. Nous appliquons le principe de minimisation des données (strictement le nécessaire pour le bon fonctionnement des tandems).'}
                </p>
              </section>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E5E1D8] space-y-1.5">
                  <span className="font-semibold text-[#1F2421] block">
                    {locale === 'no' ? 'Data vi samler inn' : 'Données collectées'}
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-[#525E56]">
                    <li>{locale === 'no' ? 'Fornavn og e-postadresse' : 'Prénom et adresse e-mail'}</li>
                    <li>{locale === 'no' ? 'Morsmål, lærespråk og nivå' : 'Langue maternelle, langue apprise et niveau'}</li>
                    <li>{locale === 'no' ? 'Omtrentlig bydel i Oslo (f.eks. Grünerløkka)' : "Quartier général d'Oslo (ex: Grünerløkka)"}</li>
                    <li>{locale === 'no' ? 'Foreslåtte kafeer eller biblioteker' : 'Cafés ou bibliothèques suggérés'}</li>
                  </ul>
                </div>

                <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E5E1D8] space-y-1.5">
                  <span className="font-semibold text-[#1F2421] block">
                    {locale === 'no' ? 'Hva vi ALDRI gjør' : 'Ce que nous ne faisons JAMAIS'}
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-[#525E56]">
                    <li>{locale === 'no' ? 'Ingen kontinuerlig GPS-sporing' : 'Aucun traçage GPS permanent'}</li>
                    <li>{locale === 'no' ? 'Ingen videresalg av opplysninger til tredjepart' : 'Aucune revente de données à des tiers'}</li>
                    <li>{locale === 'no' ? 'Ingen invaderende reklame-cookies' : 'Aucun cookie publicitaire invasif'}</li>
                    <li>{locale === 'no' ? 'Telefonnummer deles aldri automatisk' : 'Le numéro de téléphone n\'est jamais public'}</li>
                  </ul>
                </div>
              </div>

              <section className="bg-white p-4 rounded-2xl border border-[#E5E1D8] space-y-2">
                <h3 className="font-display font-semibold text-sm text-[#1F2421]">
                  {locale === 'no' ? 'Dine rettigheter: Innsyn, eksport og sletting' : 'Vos droits : Accès, export et suppression'}
                </h3>
                <p>
                  {locale === 'no'
                    ? 'I henhold til GDPR kan du når som helst redigere profilen din, eksportere en sikkerhetskopi av dataene dine eller slette kontoen din fullstendig med ett klikk fra Innstillinger-siden.'
                    : 'Conformément au RGPD, vous disposez d\'un droit permanent d\'accès, de modification, d\'exportation de vos données (portabilité) et de suppression définitive de votre compte depuis la page Paramètres.'}
                </p>
              </section>
            </div>
          )}

          {/* TAB 3: SAFETY */}
          {activeTab === 'safety' && (
            <div className="space-y-5">
              <section className="bg-[#F2F6F3] p-4 rounded-2xl border border-[#D5E5DA] space-y-2">
                <div className="flex items-center gap-2 text-[#2E4A3D] font-semibold text-xs">
                  <Coffee className="w-4 h-4" />
                  <span>
                    {locale === 'no'
                      ? 'Trygge språkmøter på offentlige steder i Oslo'
                      : 'Rencontres sereines dans les lieux publics d\'Oslo'}
                  </span>
                </div>
                <p>
                  {locale === 'no'
                    ? 'Vi oppfordrer sterkt til at de første språktandem-møtene alltid finner sted i trygge, hyggelige og åpne offentlige lokaler i Oslo.'
                    : 'Pour un premier échange en toute confiance, nous recommandons systématiquement de vous retrouver dans un lieu public ouvert et chaleureux à Oslo.'}
                </p>
              </section>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-[#E5E1D8]">
                  <div className="w-6 h-6 rounded-full bg-[#E8EDE6] text-[#2E4A3D] flex items-center justify-center shrink-0 font-bold text-xs">
                    1
                  </div>
                  <div>
                    <strong className="text-[#1F2421] block">
                      {locale === 'no' ? 'Velg biblioteker eller travle kafeer' : 'Privilégiez les bibliothèques et cafés'}
                    </strong>
                    <span className="text-[#717A74]">
                      {locale === 'no'
                        ? 'Deichman Bjørvika (egen språkafé-etasje), Kulturhuset på Youngstorget eller Café Fuglen er perfekte og trygge møteplasser.'
                        : 'Deichman Bjørvika (espaces de travail avec vue fjord), Kulturhuset à Youngstorget ou le Café Fuglen sont des cadres idéaux et très sécurisants.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-[#E5E1D8]">
                  <div className="w-6 h-6 rounded-full bg-[#E8EDE6] text-[#2E4A3D] flex items-center justify-center shrink-0 font-bold text-xs">
                    2
                  </div>
                  <div>
                    <strong className="text-[#1F2421] block">
                      {locale === 'no' ? 'Start med meldingstjenesten i appen' : 'Faites connaissance dans la messagerie'}
                    </strong>
                    <span className="text-[#717A74]">
                      {locale === 'no'
                        ? 'Bruk den innebygde meldingsfunksjonen til å diskutere felles interesser, forventet nivå og et passende tidspunkt før dere eventuelt utveksler private numre.'
                        : 'Échangez quelques messages sur la plateforme pour cibler vos attentes respectives (30 min français, 30 min norsk) avant de partager vos coordonnées personnelles.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-[#E5E1D8]">
                  <div className="w-6 h-6 rounded-full bg-[#E8EDE6] text-[#2E4A3D] flex items-center justify-center shrink-0 font-bold text-xs">
                    3
                  </div>
                  <div>
                    <strong className="text-[#1F2421] block">
                      {locale === 'no' ? 'Gjensidig respekt og nulltoleranse' : 'Respect mutuel et tolérance zéro'}
                    </strong>
                    <span className="text-[#717A74]">
                      {locale === 'no'
                        ? 'All trakassering, upassende oppførsel eller diskriminering medfører umiddelbar utestengelse fra plattformen.'
                        : 'Tout comportement irrespectueux, harcèlement ou propos inappropriés fait l\'objet d\'une exclusion immédiate de la communauté.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#E5E1D8] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-[#717A74]">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {locale === 'no' ? 'Oppdatert for lansering i Oslo (2026)' : 'Validé pour le lancement à Oslo (2026)'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#2E4A3D] hover:bg-[#23382E] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            {locale === 'no' ? 'Jeg forstår og godtar' : 'Compris et accepter'}
          </button>
        </div>
      </div>
    </div>
  );
};
