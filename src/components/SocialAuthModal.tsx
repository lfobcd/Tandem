import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { supabaseAuth } from '../lib/supabase';
import { useTranslation } from '../lib/i18n';
import { X, ShieldCheck, Check, Sparkles, Lock, ArrowRight } from 'lucide-react';

interface SocialAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: 'apple' | 'facebook' | 'google' | null;
  onSuccess: (user: UserProfile) => void;
  initialLang?: 'français' | 'norvégien';
}

export const SocialAuthModal: React.FC<SocialAuthModalProps> = ({
  isOpen,
  onClose,
  provider,
  onSuccess,
  initialLang = 'français',
}) => {
  const { locale } = useTranslation();
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [langueMaternelle, setLangueMaternelle] = useState<'français' | 'norvégien'>(initialLang);
  const [hideAppleEmail, setHideAppleEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!provider) return;
    setError('');
    setLoading(false);

    if (provider === 'apple') {
      setPrenom('Camille');
      setEmail('camille.tandem@icloud.com');
      setHideAppleEmail(false);
    } else if (provider === 'facebook') {
      setPrenom('Henrik');
      setEmail('henrik.tandem@gmail.com');
    } else {
      setPrenom('Alexandre');
      setEmail('alexandre.tandem@gmail.com');
    }
  }, [provider]);

  if (!isOpen || !provider) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetPrenom = prenom.trim() || (provider === 'apple' ? 'Utilisateur Apple' : provider === 'facebook' ? 'Utilisateur Facebook' : 'Utilisateur Google');
    
    let targetEmail = email.trim();
    if (provider === 'apple' && hideAppleEmail) {
      targetEmail = `${targetPrenom.toLowerCase().replace(/\s+/g, '.')}.${Math.floor(Math.random() * 8999 + 1000)}@privaterelay.appleid.com`;
    }

    if (!targetEmail) {
      setError(locale === 'no' ? 'Vennligst oppgi en e-postadresse.' : 'Veuillez renseigner une adresse email valide.');
      return;
    }

    setLoading(true);

    try {
      const res = await supabaseAuth.signInWithOAuth(provider, {
        prenom: targetPrenom,
        email: targetEmail,
        langue_maternelle: langueMaternelle,
      });

      if (!res.success || !res.user) {
        throw new Error(res.error || 'Erreur lors de la connexion sociale.');
      }

      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E5E1D8] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="relative p-6 pb-4 border-b border-[#F0ECE1] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {provider === 'apple' && (
              <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.3-9.5-11.22-20.15-14.75-31.95-3.53-11.8-5.3-22.9-5.3-33.3 0-14.54 3.69-26.68 11.07-36.42 7.39-9.74 16.73-14.73 28.02-14.98 4.35 0 9.42 1.25 15.22 3.75 5.8 2.5 9.74 3.75 11.81 3.75 1.74 0 5.76-1.3 12.08-3.9 6.31-2.6 11.41-3.75 15.3-3.46 11.82.63 21.05 4.9 27.69 12.82-10.43 6.32-15.54 15.01-15.32 26.08.22 8.7 3.59 15.98 10.12 21.84 6.53 5.87 14.13 9.13 22.81 9.78-2.39 7.18-5.33 14.24-8.81 21.19zM119.22 31.81c0-7.07 2.61-13.7 7.83-19.89 5.22-6.19 11.74-10.16 19.57-11.92.22 1.3.33 2.5.33 3.6 0 6.96-2.72 13.7-8.15 20.21-5.43 6.52-12 10.55-19.7 12.1-.22-1.3-.33-2.5-.33-3.6z" />
                </svg>
              </div>
            )}
            {provider === 'facebook' && (
              <div className="w-10 h-10 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center shadow-xs">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
            )}
            {provider === 'google' && (
              <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5E1D8] flex items-center justify-center shadow-xs">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              </div>
            )}
            <div>
              <h3 className="font-display text-lg font-normal text-[#1F2421]">
                {provider === 'apple' && (locale === 'no' ? 'Logg inn med Apple' : 'Connexion avec Apple')}
                {provider === 'facebook' && (locale === 'no' ? 'Logg inn med Facebook' : 'Connexion via Facebook')}
                {provider === 'google' && (locale === 'no' ? 'Logg inn med Google' : 'Connexion avec Google')}
              </h3>
              <p className="text-[11px] text-[#717A74]">
                {provider === 'apple' && (locale === 'no' ? 'Sikker Apple ID-verifisering' : 'Identifiant Apple sécurisé')}
                {provider === 'facebook' && (locale === 'no' ? 'Meta Accounts Center' : 'Compte Meta vérifié')}
                {provider === 'google' && (locale === 'no' ? 'Google-konto' : 'Compte Google vérifié')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#717A74] hover:text-[#1F2421] rounded-full hover:bg-[#F2EFE9] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-[#525E56] leading-relaxed">
            {locale === 'no'
              ? `Tandem mottar profilen din for å koble deg til språkmakkere i Oslo.`
              : `Tandem utilise ces informations pour créer ou retrouver votre profil d'échange à Oslo.`}
          </p>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {/* First Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#525E56]">
              {locale === 'no' ? 'Fornavn' : 'Prénom'}
            </label>
            <input
              type="text"
              required
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Votre prénom"
              className="w-full px-3 py-2 text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D]"
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#525E56]">
              {locale === 'no' ? 'E-postadresse' : 'Adresse e-mail'}
            </label>
            <input
              type="email"
              required={!hideAppleEmail}
              disabled={provider === 'apple' && hideAppleEmail}
              value={provider === 'apple' && hideAppleEmail ? 'camille.privaterelay@appleid.com' : email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@exemple.com"
              className="w-full px-3 py-2 text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D] disabled:bg-[#F5F2EB] disabled:text-[#8C938E]"
            />
          </div>

          {/* Apple Privacy Relay Option */}
          {provider === 'apple' && (
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8] space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-[#1F2421]">
                <input
                  type="radio"
                  name="apple_email_choice"
                  checked={!hideAppleEmail}
                  onChange={() => setHideAppleEmail(false)}
                  className="text-[#2E4A3D] focus:ring-[#2E4A3D]"
                />
                <span>{locale === 'no' ? 'Del min e-postadresse' : 'Partager mon adresse e-mail'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[#1F2421]">
                <input
                  type="radio"
                  name="apple_email_choice"
                  checked={hideAppleEmail}
                  onChange={() => setHideAppleEmail(true)}
                  className="text-[#2E4A3D] focus:ring-[#2E4A3D]"
                />
                <div>
                  <span>{locale === 'no' ? 'Skjul min e-post' : 'Masquer mon adresse e-mail'}</span>
                  <span className="block text-[10px] text-[#717A74]">
                    {locale === 'no' ? 'Apple Private Relay videresender til deg' : 'Relais privé Apple anonymisé'}
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* Native Language Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#525E56]">
              {locale === 'no' ? 'Morsmål' : 'Votre langue maternelle'}
            </label>
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

          {/* Action Button */}
          <div className="pt-2">
            {provider === 'apple' && (
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-black hover:bg-[#1F2421] text-white text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.3-9.5-11.22-20.15-14.75-31.95-3.53-11.8-5.3-22.9-5.3-33.3 0-14.54 3.69-26.68 11.07-36.42 7.39-9.74 16.73-14.73 28.02-14.98 4.35 0 9.42 1.25 15.22 3.75 5.8 2.5 9.74 3.75 11.81 3.75 1.74 0 5.76-1.3 12.08-3.9 6.31-2.6 11.41-3.75 15.3-3.46 11.82.63 21.05 4.9 27.69 12.82-10.43 6.32-15.54 15.01-15.32 26.08.22 8.7 3.59 15.98 10.12 21.84 6.53 5.87 14.13 9.13 22.81 9.78-2.39 7.18-5.33 14.24-8.81 21.19zM119.22 31.81c0-7.07 2.61-13.7 7.83-19.89 5.22-6.19 11.74-10.16 19.57-11.92.22 1.3.33 2.5.33 3.6 0 6.96-2.72 13.7-8.15 20.21-5.43 6.52-12 10.55-19.7 12.1-.22-1.3-.33-2.5-.33-3.6z" />
                </svg>
                <span>{loading ? 'Connexion en cours...' : 'Continuer avec Apple ID'}</span>
              </button>
            )}

            {provider === 'facebook' && (
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>{loading ? 'Connexion en cours...' : `Continuer en tant que ${prenom || 'Facebook'}`}</span>
              </button>
            )}

            {provider === 'google' && (
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-white hover:bg-[#FAF8F5] border border-[#D5DDD7] text-[#1F2421] text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
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
                <span>{loading ? 'Connexion en cours...' : 'Continuer avec Google'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#717A74] pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2E4A3D]" />
            <span>
              {locale === 'no'
                ? 'Kryptert og konfidensiell innlogging'
                : 'Connexion chiffrée et confidentielle'}
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
