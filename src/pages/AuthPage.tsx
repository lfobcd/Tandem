import React, { useState, useEffect } from 'react';
import { PageView, UserProfile } from '../types';
import { dataStore } from '../lib/supabase';
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
} from 'lucide-react';
import { TermsModal } from '../components/TermsModal';
import { SocialAuthModal } from '../components/SocialAuthModal';

interface AuthPageProps {
  onNavigate: (page: PageView) => void;
  onLoginSuccess: (user: UserProfile, targetPage?: PageView) => void;
  initialMode?: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onNavigate,
  onLoginSuccess,
  initialMode = 'signup',
}) => {
  const { t, locale } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(initialMode !== 'login');

  useEffect(() => {
    if (initialMode) {
      setIsSignUp(initialMode === 'signup');
    }
  }, [initialMode]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [prenom, setPrenom] = useState('');
  const [langueMaternelle, setLangueMaternelle] = useState<'français' | 'norvégien'>('français');
  const [error, setError] = useState('');
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [accountAlreadyExists, setAccountAlreadyExists] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [socialModalProvider, setSocialModalProvider] = useState<'apple' | 'facebook' | 'google' | null>(null);

  // Trigger dedicated Social Authentication Dialog
  const handleOpenSocial = (provider: 'google' | 'apple' | 'facebook') => {
    setError('');
    setAccountNotFound(false);
    setSocialModalProvider(provider);
  };

  const handleSocialSuccess = (user: UserProfile) => {
    onLoginSuccess(user, 'discovery');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAccountNotFound(false);
    setAccountAlreadyExists(false);

    if (!email.trim() || !password) {
      setError(
        locale === 'no'
          ? 'Vennligst oppgi e-post og passord.'
          : 'Veuillez renseigner votre email et mot de passe.'
      );
      return;
    }

    if (isSignUp && !prenom.trim()) {
      setError(
        locale === 'no'
          ? 'Vennligst oppgi fornavnet ditt.'
          : 'Veuillez renseigner votre prénom.'
      );
      return;
    }

    if (isSignUp) {
      const res = dataStore.registerAccount({
        email: email.trim(),
        password,
        prenom: prenom.trim(),
        langue_maternelle: langueMaternelle,
        quartier: 'Sentrum, Oslo',
      });

      if (!res.success || !res.user) {
        if (res.error?.includes('déjà') || res.error?.includes('finnes')) {
          setAccountAlreadyExists(true);
        }
        setError(res.error || (locale === 'no' ? 'Kunne ikke opprette konto.' : 'Erreur lors de la création du compte.'));
        return;
      }

      // Successful registration -> Navigate to discovery
      onLoginSuccess(res.user, 'discovery');
    } else {
      const res = dataStore.loginAccount(email.trim(), password);
      if (!res.success || !res.user) {
        if (res.notFound) {
          setAccountNotFound(true);
        }
        setError(
          res.error ||
            (locale === 'no'
              ? 'Feil e-post eller passord.'
              : 'Email ou mot de passe incorrect.')
        );
        return;
      }

      // Successful login -> Navigate to discovery
      onLoginSuccess(res.user, 'discovery');
    }
  };

  const handleQuickDemoLogin = (emailTarget: string) => {
    setError('');
    setAccountNotFound(false);
    const res = dataStore.loginAccount(emailTarget, 'password123');
    if (res.success && res.user) {
      onLoginSuccess(res.user, 'discovery');
    } else {
      // Create and log in fallback
      if (emailTarget.includes('astrid')) {
        const fallbackAstrid = dataStore.getProfiles().find((p) => p.id === 'user_astrid') || {
          id: 'user_astrid',
          email: 'astrid@tandem.no',
          prenom: 'Astrid',
          is_factice: true,
          langue_maternelle: 'norvégien',
          langue_apprise: 'français',
          niveau: 'B1',
          quartier: 'Grünerløkka, Oslo',
          bio: 'Hei! J\'adore discuter de culture et de cinéma autour d\'un café.',
          envies: 'Échanges en français et en norvégien.',
          photo_url: '/images/portrait_norwegian_woman_1790239297890.jpg',
          a_paye: true,
          derniere_activite: new Date().toISOString(),
          disponibilites: [{ day: 'mardi', slots: ['soir'] }],
        };
        dataStore.setCurrentUser({ ...fallbackAstrid, a_paye: true });
        onLoginSuccess({ ...fallbackAstrid, a_paye: true }, 'discovery');
      } else {
        const fallbackAlex: UserProfile = {
          id: 'user_alex',
          email: 'alex@tandem.org',
          prenom: 'Alex',
          langue_maternelle: 'français',
          langue_apprise: 'norvégien',
          niveau: 'A2',
          quartier: 'Sentrum, Oslo',
          bio: "Hei! J'apprends le norvégien à Oslo. Prêt pour des tandems sympas autour d'un café !",
          envies: 'Échanges en français et en norvégien.',
          photo_url: '',
          a_paye: false,
          derniere_activite: new Date().toISOString(),
          disponibilites: [{ day: 'mardi', slots: ['soir'] }],
        };
        dataStore.setCurrentUser(fallbackAlex);
        onLoginSuccess(fallbackAlex, 'discovery');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white rounded-3xl border border-[#E5E1D8] shadow-xs p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="font-display text-2xl font-normal text-[#1F2421]">
            {isSignUp ? t.authTitleSignUp : t.authTitleLogin}
          </span>
          <p className="text-xs text-[#525E56] leading-relaxed">
            {isSignUp ? t.authSubtitleSignUp : t.authSubtitleLogin}
          </p>
        </div>

        {/* Toggle between Inscription and Connexion */}
        <div className="flex p-1 bg-[#F5F2EB] rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError('');
              setAccountNotFound(false);
              setAccountAlreadyExists(false);
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              isSignUp
                ? 'bg-white text-[#1F2421] shadow-xs font-semibold'
                : 'text-[#717A74] hover:text-[#1F2421]'
            }`}
          >
            {t.authTabSignUp}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError('');
              setAccountNotFound(false);
              setAccountAlreadyExists(false);
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              !isSignUp
                ? 'bg-white text-[#1F2421] shadow-xs font-semibold'
                : 'text-[#717A74] hover:text-[#1F2421]'
            }`}
          >
            {t.authTabLogin}
          </button>
        </div>

        {/* Dynamic Helpful Notice if Account Not Found in Login */}
        {accountNotFound && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2.5 text-xs text-amber-950">
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {locale === 'no'
                  ? 'Ingen konto funnet med denne e-posten.'
                  : "Aucun compte n'a été trouvé avec cet email."}
              </span>
            </div>
            <p className="text-[11px] text-amber-800 leading-normal">
              {locale === 'no'
                ? 'Ønsker du å opprette kontoen din nå? Vi har beholdt e-posten din!'
                : "Vous n'avez pas encore de compte ? Cliquez ci-dessous pour créer votre profil en 1 clic :"}
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
              <span>{locale === 'no' ? 'Opprett konto med denne e-posten' : 'Créer mon compte avec cet email'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Dynamic Notice if Account Already Exists in SignUp */}
        {accountAlreadyExists && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2.5 text-xs text-emerald-950">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {locale === 'no'
                  ? 'En konto finnes allerede med denne e-posten.'
                  : 'Un compte existe déjà avec cette adresse e-mail.'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError('');
                setAccountAlreadyExists(false);
              }}
              className="w-full py-2 px-3 bg-[#2E4A3D] text-white rounded-xl font-medium hover:bg-[#23382E] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>{locale === 'no' ? 'Logg inn på kontoen din' : 'Se connecter avec ce compte'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* General Error Banner */}
        {error && !accountNotFound && !accountAlreadyExists && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Social Authentication (Apple, Facebook, Google) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-[#717A74] px-1">
            <span>{locale === 'no' ? 'Hurtiginnlogging' : 'Connexion en 1 clic'}</span>
            <span className="text-[10px] font-medium text-[#2E4A3D] bg-[#F2F6F3] px-2 py-0.5 rounded-md">
              OAuth & Social
            </span>
          </div>

          {/* Apple Button */}
          <button
            type="button"
            onClick={() => handleOpenSocial('apple')}
            className="w-full py-2.5 px-4 bg-black hover:bg-[#1F2421] rounded-xl text-xs font-medium text-white transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xs"
            title="Connexion sécurisée avec Apple"
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.3-9.5-11.22-20.15-14.75-31.95-3.53-11.8-5.3-22.9-5.3-33.3 0-14.54 3.69-26.68 11.07-36.42 7.39-9.74 16.73-14.73 28.02-14.98 4.35 0 9.42 1.25 15.22 3.75 5.8 2.5 9.74 3.75 11.81 3.75 1.74 0 5.76-1.3 12.08-3.9 6.31-2.6 11.41-3.75 15.3-3.46 11.82.63 21.05 4.9 27.69 12.82-10.43 6.32-15.54 15.01-15.32 26.08.22 8.7 3.59 15.98 10.12 21.84 6.53 5.87 14.13 9.13 22.81 9.78-2.39 7.18-5.33 14.24-8.81 21.19zM119.22 31.81c0-7.07 2.61-13.7 7.83-19.89 5.22-6.19 11.74-10.16 19.57-11.92.22 1.3.33 2.5.33 3.6 0 6.96-2.72 13.7-8.15 20.21-5.43 6.52-12 10.55-19.7 12.1-.22-1.3-.33-2.5-.33-3.6z" />
            </svg>
            <span>{t.authContinueWithApple}</span>
          </button>

          {/* Facebook Button */}
          <button
            type="button"
            onClick={() => handleOpenSocial('facebook')}
            className="w-full py-2.5 px-4 bg-[#1877F2] hover:bg-[#166fe5] rounded-xl text-xs font-medium text-white transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xs"
            title="Connexion sécurisée avec Facebook"
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>{t.authContinueWithFacebook}</span>
          </button>

          {/* Google Button */}
          <button
            type="button"
            onClick={() => handleOpenSocial('google')}
            className="w-full py-2.5 px-4 bg-white border border-[#D5DDD7] hover:border-[#1F2421] hover:bg-[#FAF8F5] rounded-xl text-xs font-medium text-[#1F2421] transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xs"
            title="Connexion sécurisée avec Google"
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
            <span>{t.authContinueWithGoogle}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#E5E1D8] w-full"></div>
          <span className="bg-white px-3 text-[11px] text-[#8C938E] uppercase tracking-wider whitespace-nowrap">
            {t.authOrWithEmail}
          </span>
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#525E56]">{t.authNameLabel}</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-[#8C938E]" />
                  <input
                    type="text"
                    required
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    placeholder={t.authNamePlaceholder}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D]"
                  />
                </div>
              </div>

              {/* Langue Maternelle Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#525E56]">{t.authNativeLangLabel}</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setLangueMaternelle('français')}
                    className={`p-2.5 rounded-xl border text-left font-medium transition-colors cursor-pointer ${
                      langueMaternelle === 'français'
                        ? 'border-[#2E4A3D] bg-[#F2F6F3] text-[#2E4A3D]'
                        : 'border-[#E5E1D8] bg-white text-[#525E56]'
                    }`}
                  >
                    🇫🇷 Français
                    <span className="block text-[10px] font-normal text-[#717A74] mt-0.5">
                      {locale === 'no' ? 'Lærer norsk' : 'Apprend le norvégien'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLangueMaternelle('norvégien')}
                    className={`p-2.5 rounded-xl border text-left font-medium transition-colors cursor-pointer ${
                      langueMaternelle === 'norvégien'
                        ? 'border-[#2E4A3D] bg-[#F2F6F3] text-[#2E4A3D]'
                        : 'border-[#E5E1D8] bg-white text-[#525E56]'
                    }`}
                  >
                    🇳🇴 Norsk
                    <span className="block text-[10px] font-normal text-[#717A74] mt-0.5">
                      {locale === 'no' ? 'Lærer fransk' : 'Apprend le français'}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#525E56]">{t.authEmailLabel}</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-[#8C938E]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setAccountNotFound(false);
                }}
                placeholder="votre.email@exemple.com"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#525E56]">{t.authPasswordLabel}</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-[#8C938E]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D]"
              />
            </div>
          </div>

          {isSignUp && (
            <div className="text-[11px] text-[#717A74] text-center pt-1 leading-normal">
              <span>{t.authAgreeTerms} </span>
              <button
                type="button"
                onClick={() => setIsTermsOpen(true)}
                className="underline text-[#2E4A3D] font-medium hover:text-[#1F2421] cursor-pointer"
              >
                {locale === 'no' ? 'Les vilkår & personvern' : 'Lire les CGU & charte'}
              </button>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[#2E4A3D] text-white text-sm font-medium rounded-xl hover:bg-[#23382E] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2"
          >
            <span>{isSignUp ? t.authBtnSignUp : t.authBtnLogin}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick tab switch under form */}
          <div className="text-center pt-1">
            {isSignUp ? (
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError('');
                }}
                className="text-xs text-[#525E56] hover:text-[#2E4A3D] cursor-pointer"
              >
                {locale === 'no' ? 'Har du allerede en konto? ' : 'Vous avez déjà un compte ? '}
                <span className="font-semibold underline text-[#2E4A3D]">
                  {locale === 'no' ? 'Logg inn' : 'Se connecter'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError('');
                }}
                className="text-xs text-[#525E56] hover:text-[#2E4A3D] cursor-pointer"
              >
                {locale === 'no' ? 'Har du ikke konto ennå? ' : "Vous n'avez pas encore de compte ? "}
                <span className="font-semibold underline text-[#2E4A3D]">
                  {locale === 'no' ? 'Registrer deg' : "S'inscrire"}
                </span>
              </button>
            )}
          </div>
        </form>

        <div className="pt-2 border-t border-[#E5E1D8] space-y-3">
          {/* 1-Click Fast Demo Login for instant testing */}
          <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E5E1D8] space-y-2">
            <span className="text-[11px] font-semibold text-[#525E56] block text-center">
              {locale === 'no' ? '⚡ Hurtigtest (1-klikks testkontoer)' : '⚡ Test rapide (Comptes de test en 1 clic)'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('alex@tandem.org')}
                className="p-2.5 bg-white hover:bg-[#F2EFE9] border border-[#E5E1D8] rounded-xl text-left transition-colors cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1F2421]">Alex (0 kr)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#F0ECE1] text-[#717A74]">Gratuit</span>
                </div>
                <span className="text-[10px] text-[#717A74] block mt-0.5">
                  {locale === 'no' ? 'Lærer norsk · Ikke betalt' : 'Apprend le norsk · Non payé'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('astrid@tandem.no')}
                className="p-2.5 bg-white hover:bg-[#F2EFE9] border border-[#C5D7C9] rounded-xl text-left transition-colors cursor-pointer group shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#2E4A3D]">Astrid (39 kr)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#E8EDE6] text-[#2E4A3D] font-medium">Payé ✓</span>
                </div>
                <span className="text-[10px] text-[#717A74] block mt-0.5">
                  {locale === 'no' ? 'Lærer fransk · Full tilgang' : 'Apprend le français · Abonné'}
                </span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-[#8C938E] flex items-center justify-center gap-1.5 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2E4A3D]" />
            {t.authTrustBadge}
          </p>
          <button
            type="button"
            onClick={() => onNavigate('discovery')}
            className="text-xs text-[#2E4A3D] hover:underline cursor-pointer block mx-auto text-center"
          >
            {locale === 'no' ? '← Utforsk profiler i Oslo uten å logge inn' : '← Explorer les tandems à Oslo sans créer de compte'}
          </button>
        </div>
      </div>

      {/* Social Auth Modal (Apple, Facebook, Google) */}
      <SocialAuthModal
        isOpen={!!socialModalProvider}
        provider={socialModalProvider}
        onClose={() => setSocialModalProvider(null)}
        onSuccess={handleSocialSuccess}
        initialLang={langueMaternelle}
      />

      <TermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />
    </div>
  );
};
