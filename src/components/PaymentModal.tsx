import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import {
  Coffee,
  ShieldCheck,
  CreditCard,
  Lock,
  Smartphone,
  X,
  Check,
  QrCode,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Copy,
  Sparkles,
} from 'lucide-react';
import { dataStore } from '../lib/supabase';
import { UserProfile } from '../types';
import { useTranslation } from '../lib/i18n';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfile?: UserProfile | null;
  onSuccess: () => void;
}

export const VIPPS_TARGET_PHONE = '92131792';
export const VIPPS_TARGET_FORMATTED = '92 13 17 92';
export const VIPPS_AMOUNT_NOK = 39;

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  targetProfile,
  onSuccess,
}) => {
  const { t, locale } = useTranslation();
  const currentUser = dataStore.getCurrentUser();

  const [paymentMethodTab, setPaymentMethodTab] = useState<'vipps' | 'card'>('vipps');
  const [vippsMode, setVippsMode] = useState<'app' | 'qr'>('app');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Copy status indicators
  const [copiedField, setCopiedField] = useState<'number' | 'amount' | 'message' | null>(null);

  // Sender info (optional)
  const [senderPhone, setSenderPhone] = useState('');
  const [isActivatingVipps, setIsActivatingVipps] = useState(false);
  const [justActivatedSuccess, setJustActivatedSuccess] = useState(false);

  // Card settings
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const [isCardProcessing, setIsCardProcessing] = useState(false);

  const referenceMessage = `Tandem Oslo - ${currentUser?.prenom || 'Bruker'}`;

  // Generate QR code for Vipps payment to 92131792
  useEffect(() => {
    if (isOpen) {
      setPaymentMethodTab('vipps');
      setIsActivatingVipps(false);
      setJustActivatedSuccess(false);

      // Generate QR code pointing to tel or Vipps link
      QRCode.toDataURL(
        `tel:+47${VIPPS_TARGET_PHONE}`,
        {
          width: 220,
          margin: 1,
          color: {
            dark: '#1F2421',
            light: '#FFFFFF',
          },
        },
        (err, url) => {
          if (!err && url) {
            setQrCodeDataUrl(url);
          }
        }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, field: 'number' | 'amount' | 'message') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  // Launch Vipps app and copy target number to clipboard
  const handleOpenVippsApp = () => {
    // Copy the number to clipboard so user can paste immediately
    copyToClipboard(VIPPS_TARGET_PHONE, 'number');

    // Attempt to open the Vipps mobile app
    window.location.href = 'vipps://';
  };

  // User notifies admin that they sent the money via Vipps (92 13 17 92)
  const handleConfirmVippsSent = (instantUnlock: boolean = false) => {
    setIsActivatingVipps(true);

    setTimeout(() => {
      if (instantUnlock) {
        dataStore.markUserPaid();
      } else {
        dataStore.requestVippsPayment(senderPhone);
      }

      // Log transaction in localStorage for audit
      try {
        const txRecord = {
          date: new Date().toISOString(),
          recipient: VIPPS_TARGET_PHONE,
          amount_nok: VIPPS_AMOUNT_NOK,
          sender_phone: senderPhone || currentUser?.id,
          method: 'vipps',
          status: instantUnlock ? 'approved' : 'pending',
        };
        localStorage.setItem('tandem_last_vipps_tx', JSON.stringify(txRecord));
      } catch {
        // ignore
      }

      setIsActivatingVipps(false);
      setJustActivatedSuccess(true);

      if (instantUnlock) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FF5B24', '#2E4A3D', '#E28C68', '#FAF8F5'],
          });
        } catch {
          // fallback
        }
      }

      setTimeout(() => {
        onSuccess();
        onClose();
        setJustActivatedSuccess(false);
      }, 1600);
    }, 700);
  };

  // Card payment handler (test simulation)
  const handleCardPay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCardProcessing(true);

    setTimeout(() => {
      dataStore.markUserPaid();
      setIsCardProcessing(false);
      setJustActivatedSuccess(true);

      try {
        confetti({
          particleCount: 65,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#2E4A3D', '#E28C68', '#FAF8F5'],
        });
      } catch {
        // fallback
      }

      setTimeout(() => {
        onSuccess();
        onClose();
        setJustActivatedSuccess(false);
      }, 1400);
    }, 900);
  };

  const priceText = locale === 'no' ? '39 kr' : '39 NOK (~3,50 €)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#FAF8F5] rounded-3xl border border-[#E5E1D8] shadow-2xl overflow-hidden text-[#1F2421] my-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-4 right-4 z-10 p-2 rounded-full text-[#717A74] hover:text-[#1F2421] hover:bg-[#EFECE6] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Banner when just activated */}
        {justActivatedSuccess ? (
          <div className="p-8 text-center space-y-4 animate-in fade-in duration-200">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#EBF7EE] text-[#1E7E34] flex items-center justify-center shadow-sm">
              <Check className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-2xl font-normal text-[#1F2421]">
                {locale === 'no'
                  ? 'Vipps-betaling bekreftet!'
                  : 'Paiement Vipps confirmé !'}
              </h3>
              <p className="text-sm text-[#2E4A3D] font-medium max-w-sm mx-auto">
                {locale === 'no'
                  ? `Beløp på 39 kr til ${VIPPS_TARGET_FORMATTED} er registrert. Ubegrenset tilgang er nå aktivert for deg!`
                  : `39 kr vers le ${VIPPS_TARGET_FORMATTED} bien enregistrés. Votre accès illimité aux tandems est actif !`}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-[#717A74] pt-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#2E4A3D]" />
              <span>{locale === 'no' ? 'Låser opp profiler og kontakter...' : 'Déblocage des contacts...'}</span>
            </div>
          </div>
        ) : currentUser?.a_paye ? (
          <div className="p-8 text-center space-y-5 animate-in fade-in duration-200">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-[#FF5B24] text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                {locale === 'no' ? '🔥 Pioner-tilgang aktiv (0 kr)' : '🔥 Accès Pionnier Bêta Actif (0 NOK)'}
              </span>
              <h3 className="font-display text-2xl font-normal text-[#1F2421]">
                {locale === 'no'
                  ? 'Du har allerede full og ubegrenset tilgang!'
                  : 'Vous avez déjà un accès illimité à vie !'}
              </h3>
              <p className="text-xs sm:text-sm text-[#525E56] max-w-sm mx-auto leading-relaxed">
                {locale === 'no'
                  ? 'Kontoen din er en av de 50 første registrert under lanseringen. Du kan kontakte alle partnere helt gratis uten å betale!'
                  : 'Votre profil bénéficie de l’offre Bêta gratuite réservée aux 50 premiers membres. La messagerie et toutes les fonctionnalités sont débloquées à vie !'}
              </p>
            </div>
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-[#2E4A3D] text-white text-xs font-semibold rounded-xl hover:bg-[#23382E] transition-all cursor-pointer shadow-xs"
              >
                {locale === 'no' ? 'Lukk og fortsett' : 'Continuer sur Tandem'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-7 space-y-5">
            {/* Header */}
            <div className="space-y-1.5 pr-8">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAE5DC] text-[#2E4A3D] text-[11px] font-medium">
                <Coffee className="w-3.5 h-3.5" />
                <span>{t.paymentBadge}</span>
              </div>
              <h2 className="font-display text-2xl font-normal text-[#1F2421]">
                {targetProfile
                  ? `${t.paymentModalTitle} (${targetProfile.prenom})`
                  : t.paymentModalTitle}
              </h2>
              <p className="text-xs text-[#525E56] leading-relaxed">
                {locale === 'no'
                  ? `For å sikre trygge og engasjerte samtaler koster ubegrenset tilgang et engangsbeløp på 39 kr. Betalingen gjøres direkte med Vipps til ${VIPPS_TARGET_FORMATTED}.`
                  : `Pour garantir des échanges motivés et respectueux, l'accès illimité requiert une contribution unique de 39 NOK (~3,50 €) envoyée directement par Vipps au ${VIPPS_TARGET_FORMATTED}.`}
              </p>
            </div>

            {/* Price Banner */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5E1D8] flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-semibold text-[#1F2421] block">
                  {t.paymentLifetimeTitle}
                </span>
                <span className="text-[11px] text-[#717A74]">
                  {t.paymentLifetimeDesc}
                </span>
              </div>
              <div className="text-right">
                <span className="font-display text-2xl font-bold text-[#FF5B24]">
                  39 kr
                </span>
                <span className="block text-[10px] text-[#717A74]">
                  {locale === 'no' ? 'Engangsbeløp' : '~ 3,50 € unique'}
                </span>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F0ECE1] rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setPaymentMethodTab('vipps')}
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  paymentMethodTab === 'vipps'
                    ? 'bg-[#FF5B24] text-white shadow-xs font-semibold'
                    : 'text-[#525E56] hover:text-[#1F2421]'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white text-[#FF5B24] flex items-center justify-center font-bold text-[10px] leading-none">
                  v
                </div>
                <span>{locale === 'no' ? 'Vipps (Anbefalt)' : 'Vipps (Norvège)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethodTab('card')}
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  paymentMethodTab === 'card'
                    ? 'bg-white text-[#1F2421] shadow-xs font-semibold'
                    : 'text-[#525E56] hover:text-[#1F2421]'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>{t.cardTabTitle}</span>
              </button>
            </div>

            {/* ---------------------------------------------------------
                METHOD 1: VIPPS DIRECT TO 92131792
               --------------------------------------------------------- */}
            {paymentMethodTab === 'vipps' && (
              <div className="space-y-4">
                {/* Mode Selector: Mobile App vs QR Code */}
                <div className="flex items-center justify-between text-xs bg-[#FFF6F3] p-1.5 rounded-xl border border-[#FFD9CD]">
                  <span className="text-[11px] font-medium text-[#FF5B24] pl-2 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{locale === 'no' ? 'Betal til:' : 'Paiement vers :'}</span>
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setVippsMode('app')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        vippsMode === 'app'
                          ? 'bg-[#FF5B24] text-white shadow-xs'
                          : 'text-[#717A74] hover:text-[#1F2421]'
                      }`}
                    >
                      {locale === 'no' ? 'På mobil' : 'Sur mobile'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setVippsMode('qr')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        vippsMode === 'qr'
                          ? 'bg-[#FF5B24] text-white shadow-xs'
                          : 'text-[#717A74] hover:text-[#1F2421]'
                      }`}
                    >
                      {locale === 'no' ? 'QR-kode' : 'QR-code'}
                    </button>
                  </div>
                </div>

                {/* VIPPS PAYMENT DETAILS CARD */}
                <div className="p-4 rounded-2xl bg-[#FFF6F3] border-2 border-[#FFD9CD] space-y-3.5">
                  {/* Recipient Phone Row */}
                  <div className="p-3 bg-white rounded-xl border border-[#FFD9CD] shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#717A74] uppercase tracking-wider block font-semibold">
                        {locale === 'no' ? 'Vipps mottakernummer' : 'Numéro Vipps destinataire'}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xl sm:text-2xl font-bold text-[#1F2421] tracking-wide">
                          {VIPPS_TARGET_FORMATTED}
                        </span>
                        <span className="text-[11px] font-medium text-[#FF5B24] bg-[#FFEAE3] px-2 py-0.5 rounded-full">
                          +47
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(VIPPS_TARGET_PHONE, 'number')}
                      className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        copiedField === 'number'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-[#FF5B24] hover:bg-[#E54A15] text-white shadow-xs'
                      }`}
                    >
                      {copiedField === 'number' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{t.vippsCopied}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{locale === 'no' ? 'Kopier' : 'Copier'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Amount & Message Rows */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Amount */}
                    <div className="p-2.5 bg-white rounded-xl border border-[#FFD9CD] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#717A74] block">
                          {locale === 'no' ? 'Beløp' : 'Montant'}
                        </span>
                        <span className="font-bold text-[#1F2421] text-sm">
                          39 NOK
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('39', 'amount')}
                        className="text-[11px] text-[#FF5B24] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        {copiedField === 'amount' ? (
                          <span className="text-emerald-600 font-semibold">{t.vippsCopied}</span>
                        ) : (
                          <span>{locale === 'no' ? 'Kopier 39' : 'Copier 39'}</span>
                        )}
                      </button>
                    </div>

                    {/* Message / Reference */}
                    <div className="p-2.5 bg-white rounded-xl border border-[#FFD9CD] flex items-center justify-between">
                      <div className="truncate mr-2">
                        <span className="text-[10px] text-[#717A74] block">
                          {locale === 'no' ? 'Melding (valgfri)' : 'Message conseillé'}
                        </span>
                        <span className="font-medium text-[#1F2421] text-xs truncate block">
                          {referenceMessage}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(referenceMessage, 'message')}
                        className="text-[11px] text-[#FF5B24] hover:underline flex items-center gap-1 cursor-pointer font-medium whitespace-nowrap"
                      >
                        {copiedField === 'message' ? (
                          <span className="text-emerald-600 font-semibold">{t.vippsCopied}</span>
                        ) : (
                          <span>{locale === 'no' ? 'Kopier' : 'Copier'}</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* VIEW A: Mobile Launch Button */}
                  {vippsMode === 'app' ? (
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={handleOpenVippsApp}
                        className="w-full py-3.5 bg-[#FF5B24] hover:bg-[#E54A15] text-white rounded-2xl transition-all flex items-center justify-between px-5 cursor-pointer shadow-md shadow-[#FF5B24]/25 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white text-[#FF5B24] flex items-center justify-center font-black text-base shadow-xs group-hover:scale-105 transition-transform">
                            v
                          </div>
                          <div className="text-left">
                            <span className="font-bold text-sm block leading-tight">
                              {locale === 'no' ? 'Åpne Vipps og betal 39 kr' : 'Ouvrir Vipps pour payer 39 kr'}
                            </span>
                            <span className="text-[10px] text-white/85 block">
                              {locale === 'no'
                                ? `Sender til ${VIPPS_TARGET_FORMATTED}`
                                : `Destinataire : ${VIPPS_TARGET_FORMATTED}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-semibold bg-black/15 px-3 py-1.5 rounded-xl group-hover:translate-x-0.5 transition-transform">
                          <span>39 kr</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </button>
                      <p className="text-[11px] text-[#717A74] text-center">
                        {locale === 'no'
                          ? `Nummeret ${VIPPS_TARGET_FORMATTED} kopieres automatisk når du trykker på knappen.`
                          : `Le numéro ${VIPPS_TARGET_FORMATTED} sera copié dans votre presse-papiers.`}
                      </p>
                    </div>
                  ) : (
                    /* VIEW B: QR Code for PC/Screen Scanning */
                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-[#FFD9CD] space-y-2.5 text-center">
                      <div className="relative p-2 bg-white rounded-xl border border-[#EAE5DC] shadow-xs">
                        {qrCodeDataUrl ? (
                          <img
                            src={qrCodeDataUrl}
                            alt={`Vipps QR ${VIPPS_TARGET_PHONE}`}
                            className="w-40 h-40 object-contain mx-auto"
                          />
                        ) : (
                          <div className="w-40 h-40 flex items-center justify-center bg-gray-50 text-[#717A74]">
                            <QrCode className="w-10 h-10 animate-pulse" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-8 h-8 rounded-lg bg-[#FF5B24] text-white flex items-center justify-center font-bold text-sm shadow-md border-2 border-white">
                            v
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#525E56] max-w-xs leading-relaxed">
                        {locale === 'no'
                          ? `Skann koden med mobilkameraet for å åpne nummeret ${VIPPS_TARGET_FORMATTED} i Vipps.`
                          : `Scannez avec votre téléphone pour ouvrir le ${VIPPS_TARGET_FORMATTED} dans Vipps.`}
                      </p>
                    </div>
                  )}
                </div>

                {/* CONFIRMATION SECTION: "Jeg har vippset 39 kr" */}
                <div className="p-4 rounded-2xl bg-white border border-[#E5E1D8] space-y-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                    <span className="text-xs font-semibold text-[#1F2421]">
                      {locale === 'no'
                        ? 'Har du vippset 39 kr til 92 13 17 92?'
                        : 'Avez-vous effectué le virement au 92 13 17 92 ?'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#717A74] block">
                      {locale === 'no'
                        ? 'Ditt mobilnummer eller Vipps-navn (valgfritt):'
                        : 'Votre numéro ou nom Vipps expéditeur (optionnel) :'}
                    </label>
                    <input
                      type="tel"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder={locale === 'no' ? 'f.eks. 987 65 432' : 'ex: 987 65 432'}
                      className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl font-medium text-[#1F2421] focus:outline-none focus:border-[#FF5B24]"
                    />
                  </div>

                  {currentUser?.vipps_status === 'pending' && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                      <span>
                        {locale === 'no'
                          ? 'Vipps-betalingen din venter på godkjenning av administrator.'
                          : 'Votre virement Vipps est en cours de validation par le gestionnaire.'}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isActivatingVipps}
                    onClick={() => handleConfirmVippsSent(false)}
                    className="w-full py-3 bg-[#FF5B24] hover:bg-[#E54A15] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#FF5B24]/20 disabled:opacity-50"
                  >
                    {isActivatingVipps ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{locale === 'no' ? 'Sender til administrator...' : 'Envoi au gestionnaire...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>
                          {locale === 'no'
                            ? `Jeg har vippset 39 kr (Informer administrator)`
                            : `J'ai envoyé 39 kr (Informer le gestionnaire)`}
                        </span>
                      </>
                    )}
                  </button>

                  {/* Test-mode shortcut strictly reserved for bcdlfo@gmail.com or manager */}
                  {(currentUser?.email?.toLowerCase() === 'bcdlfo@gmail.com' || currentUser?.is_admin === true) && (
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        disabled={isActivatingVipps}
                        onClick={() => handleConfirmVippsSent(true)}
                        className="text-[11px] text-[#2E4A3D] hover:underline cursor-pointer font-medium"
                      >
                        {locale === 'no'
                          ? '⚡ Hurtigaktivering (kun synlig for administrator)'
                          : '⚡ Activation directe (visible uniquement pour gestionnaire)'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------
                METHOD 2: CARD / STRIPE ALTERNATIVE
               --------------------------------------------------------- */}
            {paymentMethodTab === 'card' && (
              <form onSubmit={handleCardPay} className="space-y-3.5">
                <div className="p-3 bg-[#F5F2EB] rounded-xl text-xs text-[#525E56] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#2E4A3D] shrink-0" />
                  <span>
                    {locale === 'no'
                      ? 'Alternativ for utenlandske kort (Visa / Mastercard).'
                      : 'Option recommandée pour les cartes internationales sans Vipps.'}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#525E56]">
                    {t.paymentCardNumber}
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 absolute left-3 top-3 text-[#717A74]" />
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E5E1D8] rounded-xl font-mono focus:outline-none focus:border-[#2E4A3D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#525E56]">
                      {t.paymentExpiry}
                    </label>
                    <input
                      type="text"
                      required
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E5E1D8] rounded-xl font-mono focus:outline-none focus:border-[#2E4A3D]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#525E56]">
                      {t.paymentCvc}
                    </label>
                    <input
                      type="text"
                      required
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E5E1D8] rounded-xl font-mono focus:outline-none focus:border-[#2E4A3D]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCardProcessing}
                  className="w-full py-3 bg-[#2E4A3D] text-white text-xs sm:text-sm font-medium rounded-xl hover:bg-[#23382E] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isCardProcessing ? (
                    <span>{t.paymentProcessing}</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>{t.paymentSubmitBtn}</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Reassurance footer */}
            <div className="pt-2 border-t border-[#E5E1D8] flex items-center justify-between text-[11px] text-[#717A74]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2E4A3D]" />
                {t.paymentSecured}
              </span>
              <span>{t.paymentNoFutureCharges}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
