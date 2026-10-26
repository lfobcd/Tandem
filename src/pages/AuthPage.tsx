import React, { useState, useEffect } from 'react';
import { PageView, UserProfile } from '../types';
import { dataStore, supabaseAuth } from '../lib/supabase';
import { useTranslation } from '../lib/i18n';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  MapPin,
  Globe,
} from 'lucide-react';
import { TermsModal } from '../components/TermsModal';
import { SocialAuthModal } from '../components/SocialAuthModal';

interface AuthPageProps {
  onNavigate: (page: PageView) => void;
  onLoginSuccess: (user: UserProfile, targetPage?: PageView) => void;
  initialMode?: 'login' | 'signup';
}

const OSLO_NEIGHBORHOODS = [
  'Sentrum, Oslo',
  'Grünerløkka, Oslo',
  'Majorstuen, Oslo',
  'Frogner, Oslo',
  'St. Hanshaugen, Oslo',
  'Gamle Oslo / Bjørvika, Oslo',
  'Tøyen, Oslo',
  'Sagene / Torshov, Oslo',
  'Bislett, Oslo',
  'Ullern, Oslo',
  'Nordstrand, Oslo',
  'Autre quartier, Oslo',
];

export const AuthPage: React.FC<AuthPageProps> = ({
  onNavigate,
  onLoginSuccess,
  initialMode = 'signup',
}) => {
  const { t, locale } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(initialMode !== 'login');
  const betaStats = dataStore.getBetaPioneerStats();

  useEffect(() => {
    if (initialMode) {
      setIsSignUp(initialMode === 'signup');
    }
  }, [initialMode]);

  // Form inputs
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [langueMaternelle, setLangueMaternelle] = useState<'français' | 'norvégien'>('français');
  const [quartier, setQuartier] = useState('Sentrum, Oslo');
  const [niveau, setNiveau] = useState('A2');
  const [newsletterConsent, setNewsletterConsent] = useState(true);

  // Status & Modals
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [accountAlreadyExists, setAccountAlreadyExists] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [socialModalProvider, setSocialModalProvider] = useState<'apple' | 'facebook' | 'google' | null>(null);

  // Handle standard registration or login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setAccountNotFound(false);
    setAccountAlreadyExists(false);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPrenom = prenom.trim();
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail) {
      const msg = locale === 'no' ? 'Erreur : Vennligst oppgi en e-postadresse.' : 'Erreur : Veuillez renseigner votre adresse e-mail.';
      setError(msg);
      console.error('[Auth Form] Missing email field');
      return;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      const msg = locale === 'no' 
        ? 'Erreur : Vennligst oppgi en gyldig e-postadresse (f.eks. navn@eksempel.no).' 
        : 'Erreur : Format d\'email invalide (ex: alex@tandem.org).';
      setError(msg);
      console.error('[Auth Form] Invalid email format:', { input: cleanEmail });
      return;
    }

    if (!password) {
      const msg = locale === 'no' ? 'Erreur : Vennligst oppgi et passord.' : 'Erreur : Veuillez choisir un mot de passe.';
      setError(msg);
      console.error('[Auth Form] Missing password field');
      return;
    }

    if (password.length < 4) {
      const msg = locale === 'no'
        ? 'Erreur : Passordet må ha minst 4 tegn.'
        : 'Erreur : Le mot de passe doit comporter au moins 4 caractères.';
      setError(msg);
      console.error('[Auth Form] Password length too short:', password.length);
      return;
    }

    if (isSignUp && !cleanPrenom) {
      const msg = locale === 'no'
        ? 'Erreur : Vennligst oppgi fornavnet ditt.'
        : 'Erreur : Veuillez renseigner votre prénom.';
      setError(msg);
      console.error('[Auth Form] Missing first name in sign-up mode');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        console.log('[Auth Form] Submitting registration for:', { email: cleanEmail, prenom: cleanPrenom, quartier, langueMaternelle });

        // Asynchronous registration with direct server database sync
        const res = await dataStore.registerAccountAsync({
          email: cleanEmail,
          password,
          prenom: cleanPrenom,
          langue_maternelle: langueMaternelle,
          quartier,
          niveau,
          newsletterConsent,
        });

        if (!res.success || !res.user) {
          const rawErr = res.error || (locale === 'no' ? 'Kunne ikke opprette konto.' : 'Erreur lors de la création du compte.');
          console.error('[Auth Form] Registration failed with message:', rawErr);
          
          if (rawErr.toLowerCase().includes('déjà') || rawErr.toLowerCase().includes('already')) {
            setAccountAlreadyExists(true);
            setError(locale === 'no' ? 'Erreur : En konto med denne e-posten finnes allerede.' : 'Erreur : Un compte existe déjà avec cette adresse e-mail.');
          } else {
            setError(rawErr.startsWith('Erreur') ? rawErr : `Erreur : ${rawErr}`);
          }
          return;
        }

        console.log('[Auth Form] Registration succeeded!', { userId: res.user.id, email: res.user.email });
        setSuccessMessage(
          locale === 'no'
            ? 'Inscription réussie ! Velkommen til Tandem Oslo. Omdirigerer...'
            : 'Inscription réussie ! Bienvenue sur Tandem Oslo. Redirection en cours...'
        );

        // Allow visible feedback for 650ms before routing to discovery
        setTimeout(() => {
          onLoginSuccess(res.user!, 'discovery');
        }, 650);
      } else {
        // Login
        console.log('[Auth Form] Attempting login for:', cleanEmail);
        const res = dataStore.loginAccount(cleanEmail, password);
        if (!res.success || !res.user) {
          if (res.notFound) {
            setAccountNotFound(true);
            console.error('[Auth Form] Account not found for email:', cleanEmail);
          } else {
            console.error('[Auth Form] Invalid credentials for email:', cleanEmail);
          }
          const rawErr = res.error || (locale === 'no' ? 'Feil e-postadresse eller passord.' : 'Email ou mot de passe incorrect.');
          setError(rawErr.startsWith('Erreur') ? rawErr : `Erreur : ${rawErr}`);
          return;
        }

        console.log('[Auth Form] Login succeeded!', { userId: res.user.id });
        setSuccessMessage(
          locale === 'no'
            ? 'Innlogging vellykket! Velkommen tilbake.'
            : 'Connexion réussie ! Heureux de vous revoir.'
        );

        setTimeout(() => {
          onLoginSuccess(res.user!, 'discovery');
        }, 500);
      }
    } catch (err: any) {
      console.error('[Auth Form Critical Exception]', err);
      setError(`Erreur : ${err?.message || 'Une erreur inattendue est survenue.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSuccess = (user: UserProfile) => {
    setSuccessMessage(
      locale === 'no'
        ? 'Innlogging vellykket! Omdirigerer...'
        : 'Connexion réussie ! Redirection en cours...'
    );
    setTimeout(() => {
      onLoginSuccess(user, 'discovery');
    }, 400);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Header and Offer Badge */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-900 border border-emerald-300 text-xs font-semibold shadow-2xs">
          <span>🎁</span>
          <span>
            {locale === 'no'
              ? '1. måned 100% gratis (0 kr i stedet for 39 kr)'
              : '1er mois 100% offert (0 NOK au lieu de 39)'}
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-normal text-[#1F2421]">
          {isSignUp
            ? locale === 'no'
              ? 'Bli med i Tandem Oslo'
              : 'Rejoindre Tandem Oslo'
            : locale === 'no'
            ? 'Velkommen tilbake'
            : 'Bon retour parmi nous'}
        </h1>
        <p className="text-xs text-[#525E56] max-w-sm mx-auto">
          {isSignUp
            ? locale === 'no'
              ? 'Opprett profilen din på 1 minutt og finn en samtalepartner i Oslo.'
              : 'Créez votre profil en 1 minute et commencez à échanger avec un binôme à Oslo.'
            : locale === 'no'
            ? 'Logg inn for å få tilgang til dine samtaler og meldinger.'
            : 'Connectez-vous pour retrouver vos messages et vos binômes.'}
        </p>
      </div>

      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E5E1D8] shadow-sm space-y-5">
        {/* Inscription vs Connexion Tabs */}
        <div className="flex p-1 bg-[#F5F2EB] rounded-2xl text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError('');
              setSuccessMessage('');
              setAccountNotFound(false);
              setAccountAlreadyExists(false);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer text-center ${
              isSignUp
                ? 'bg-white text-[#1F2421] shadow-xs font-semibold'
                : 'text-[#717A74] hover:text-[#1F2421]'
            }`}
          >
            {locale === 'no' ? 'Opprett profil (Gratis)' : 'Créer un profil (Gratuit)'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError('');
              setSuccessMessage('');
              setAccountNotFound(false);
              setAccountAlreadyExists(false);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer text-center ${
              !isSignUp
                ? 'bg-white text-[#1F2421] shadow-xs font-semibold'
                : 'text-[#717A74] hover:text-[#1F2421]'
            }`}
          >
            {locale === 'no' ? 'Logg inn' : 'Déjà inscrit'}
          </button>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-50 text-emerald-900 text-xs rounded-xl border border-emerald-300 flex items-start gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span className="font-semibold leading-snug">{successMessage}</span>
          </div>
        )}

        {/* Account Already Exists Banner */}
        {accountAlreadyExists && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-950 shadow-2xs">
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {locale === 'no'
                  ? 'Denne e-postadressen er allerede registrert.'
                  : 'Cet e-mail est déjà associé à un compte.'}
              </span>
            </div>
            <p className="text-[11px] text-amber-800">
              {locale === 'no'
                ? 'Klikk nedenfor for å logge inn med passordet ditt :'
                : 'Connectez-vous directement pour accéder à votre profil et vos messages :'}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError('');
                setAccountAlreadyExists(false);
              }}
              className="w-full py-2 px-3 bg-[#2E4A3D] text-white rounded-xl font-medium hover:bg-[#23382E] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>{locale === 'no' ? 'Gå til innlogging' : 'Se connecter avec ce compte'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Account Not Found Banner */}
        {accountNotFound && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-950 shadow-2xs">
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {locale === 'no'
                  ? 'Ingen konto funnet med denne e-posten.'
                  : 'Aucun compte trouvé avec cet e-mail.'}
              </span>
            </div>
            <p className="text-[11px] text-amber-800">
              {locale === 'no'
                ? 'Klikk nedenfor for å opprette profilen din gratis i dag :'
                : 'Cliquez ci-dessous pour créer votre profil gratuitement :'}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError('');
                setAccountNotFound(false);
              }}
              className="w-full py-2 px-3 bg-[#2E4A3D] text-white rounded-xl font-medium hover:bg-[#23382E] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>{locale === 'no' ? 'Opprett kontoen min' : 'Créer mon profil'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error Banner */}
        {error && !accountNotFound && !accountAlreadyExists && (
          <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-start gap-2 shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span className="leading-snug font-medium">{error}</span>
          </div>
        )}

        {/* MAIN EMAIL & PASSWORD FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sign Up Fields: Prénom */}
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#1F2421]">
                {locale === 'no' ? 'Fornavn' : 'Votre prénom'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-[#8C938E]" />
                <input
                  type="text"
                  required
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder={locale === 'no' ? 'f.eks. Astrid, Julien...' : 'ex: Julien, Astrid, Sarah...'}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D] text-[#1F2421]"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#1F2421]">
              {locale === 'no' ? 'E-postadresse' : 'Adresse e-mail'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#8C938E]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setAccountNotFound(false);
                }}
                placeholder="votre.email@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D] text-[#1F2421]"
              />
            </div>
          </div>

          {/* Password Field with Show/Hide Toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#1F2421]">
                {isSignUp
                  ? locale === 'no' ? 'Velg et passord' : 'Choisissez votre mot de passe'
                  : locale === 'no' ? 'Passord' : 'Votre mot de passe'}{' '}
                <span className="text-red-500">*</span>
              </label>
              {isSignUp && (
                <span className="text-[10px] text-[#717A74]">
                  {locale === 'no' ? 'min. 4 tegn' : 'au moins 4 caractères'}
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#8C938E]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D] text-[#1F2421]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-1 text-[#8C938E] hover:text-[#1F2421] cursor-pointer"
                title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sign Up Language Choice & Neighborhood */}
          {isSignUp && (
            <>
              {/* Native Language Selector */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-medium text-[#1F2421]">
                  {locale === 'no' ? 'Ditt morsmål' : 'Votre langue maternelle'} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setLangueMaternelle('français')}
                    className={`p-3 rounded-2xl border text-left font-medium transition-all cursor-pointer flex flex-col gap-0.5 ${
                      langueMaternelle === 'français'
                        ? 'border-[#2E4A3D] bg-[#F2F6F3] text-[#2E4A3D] ring-2 ring-[#2E4A3D]/20 shadow-xs'
                        : 'border-[#E5E1D8] bg-[#FAF8F5] text-[#525E56] hover:bg-white'
                    }`}
                  >
                    <span className="font-semibold text-sm">🇫🇷 Français</span>
                    <span className="text-[10px] text-[#717A74]">
                      {locale === 'no' ? 'Vil lære norsk' : 'Je veux pratiquer le norvégien'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLangueMaternelle('norvégien')}
                    className={`p-3 rounded-2xl border text-left font-medium transition-all cursor-pointer flex flex-col gap-0.5 ${
                      langueMaternelle === 'norvégien'
                        ? 'border-[#2E4A3D] bg-[#F2F6F3] text-[#2E4A3D] ring-2 ring-[#2E4A3D]/20 shadow-xs'
                        : 'border-[#E5E1D8] bg-[#FAF8F5] text-[#525E56] hover:bg-white'
                    }`}
                  >
                    <span className="font-semibold text-sm">🇳🇴 Norsk</span>
                    <span className="text-[10px] text-[#717A74]">
                      {locale === 'no' ? 'Vil lære fransk' : 'Je veux pratiquer le français'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Oslo Neighborhood */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#1F2421]">
                  {locale === 'no' ? 'Bydel i Oslo' : 'Votre quartier à Oslo'}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-[#8C938E]" />
                  <select
                    value={quartier}
                    onChange={(e) => setQuartier(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 text-xs bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D] text-[#1F2421] appearance-none"
                  >
                    {OSLO_NEIGHBORHOODS.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CEFR Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#1F2421]">
                  {locale === 'no' ? 'Nivå i språket du lærer' : 'Votre niveau dans la langue apprise'}
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3.5 top-3 text-[#8C938E]" />
                  <select
                    value={niveau}
                    onChange={(e) => setNiveau(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 text-xs bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D] text-[#1F2421] appearance-none"
                  >
                    <option value="A1">A1 - Débutant complet (Nybegynner)</option>
                    <option value="A2">A2 - Premières bases (Litt erfaring) · Recommandé</option>
                    <option value="B1">B1 - Intermédiaire (Mellomnivå, samtaler)</option>
                    <option value="B2">B2 - Avancé (Selvstendig)</option>
                    <option value="C1">C1 - Courant / Bilingue (Flytende)</option>
                  </select>
                </div>
              </div>

              {/* Newsletter Consent */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAF7] border border-[#E0E8DF] text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={newsletterConsent}
                  onChange={(e) => setNewsletterConsent(e.target.checked)}
                  className="mt-0.5 rounded text-[#2E4A3D] focus:ring-[#2E4A3D]"
                />
                <span className="text-[#525E56] leading-snug">
                  {locale === 'no'
                    ? 'Hold meg oppdatert om uformelle Tandem-kafeer og språktreff i Oslo.'
                    : 'Prévenez-moi par email des cafés et rencontres Tandem organisés à Oslo.'}
                </span>
              </label>
            </>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-[#2E4A3D] hover:bg-[#23382E] text-white text-xs font-semibold rounded-2xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{locale === 'no' ? 'Behandler...' : 'Enregistrement en cours...'}</span>
              </>
            ) : (
              <>
                <span>
                  {isSignUp
                    ? locale === 'no'
                      ? 'Opprett profilen min (100% gratis)'
                      : 'Créer mon profil (1er mois gratuit)'
                    : locale === 'no'
                    ? 'Logg inn'
                    : 'Se connecter'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="grow border-t border-[#E5E1D8]"></div>
          <span className="shrink mx-2 text-[10px] text-[#717A74] uppercase tracking-wider font-semibold">
            {locale === 'no' ? 'Eller med Google' : 'Ou continuer avec Google'}
          </span>
          <div className="grow border-t border-[#E5E1D8]"></div>
        </div>

        {/* GOOGLE SIGN IN BUTTON */}
        <button
          type="button"
          onClick={() => setSocialModalProvider('google')}
          className="w-full py-2.5 px-4 bg-white border border-[#D5DDD7] hover:border-[#1F2421] hover:bg-[#FAF8F5] rounded-xl text-xs font-medium text-[#1F2421] transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{locale === 'no' ? 'Fortsett med Google' : 'Continuer avec Google'}</span>
        </button>

        {/* Quick Manager login link for bcdlfo@gmail.com */}
        <div className="pt-2 text-center border-t border-[#F0ECE1]">
          <button
            type="button"
            onClick={() => {
              const res = dataStore.loginAccount('bcdlfo@gmail.com', 'vipps2026');
              if (res.success && res.user) {
                onLoginSuccess(res.user, 'discovery');
              }
            }}
            className="text-[11px] text-[#717A74] hover:text-[#2E4A3D] font-medium transition-colors cursor-pointer"
          >
            🛡️ {locale === 'no' ? 'Administrator-innlogging (bcdlfo@gmail.com)' : 'Connexion Responsable (bcdlfo@gmail.com)'}
          </button>
        </div>
      </div>

      {/* Social Auth Modal for clean Google/Apple/Facebook pop-up */}
      <SocialAuthModal
        isOpen={Boolean(socialModalProvider)}
        provider={socialModalProvider}
        onClose={() => setSocialModalProvider(null)}
        onSuccess={handleSocialSuccess}
        initialLang={langueMaternelle}
      />

      {/* Terms and Privacy Modal */}
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
};
