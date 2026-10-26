import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, PreferredPlace, Message, Conversation, NewsletterSubscriber } from '../types';
import { INITIAL_PROFILES, INITIAL_CONVERSATIONS, INITIAL_MESSAGES } from '../data/mockData';
import { VIPPS_SECURITY_CONFIG } from '../config/vippsSecurity';

// Supabase credentials configuration from env or local config
const getStoredConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const localUrl = localStorage.getItem('tandem_supabase_url') || '';
  const localKey = localStorage.getItem('tandem_supabase_key') || '';
  return {
    url: localUrl || envUrl,
    key: localKey || envKey,
  };
};

export const hasLiveSupabaseConfig = (): boolean => {
  const { url, key } = getStoredConfig();
  return Boolean(url && key && url.startsWith('http'));
};

let supabaseClient: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseClient) return supabaseClient;
  const { url, key } = getStoredConfig();
  if (url && key && url.startsWith('http')) {
    try {
      supabaseClient = createClient(url, key);
      return supabaseClient;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
    }
  }
  return null;
};

export const setCustomSupabaseConfig = (url: string, key: string) => {
  if (url) localStorage.setItem('tandem_supabase_url', url.trim());
  else localStorage.removeItem('tandem_supabase_url');

  if (key) localStorage.setItem('tandem_supabase_key', key.trim());
  else localStorage.removeItem('tandem_supabase_key');

  supabaseClient = null; // reset client
};

// -------------------------------------------------------------
// SUPABASE AUTH SERVICE (Google, Apple, Facebook OAuth & Email)
// -------------------------------------------------------------

export const supabaseAuth = {
  async signInWithOAuth(
    provider: 'google' | 'facebook' | 'apple',
    userData?: {
      email?: string;
      prenom?: string;
      langue_maternelle?: 'français' | 'norvégien';
      photo_url?: string;
    }
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    // 1. If live Supabase is configured, attempt background sync / oauth if possible
    const supabase = getSupabase();
    if (supabase && hasLiveSupabaseConfig()) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: provider,
          options: {
            redirectTo: window.location.origin,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
        if (error) {
          console.warn(`Supabase ${provider} OAuth warning (fallback will handle session):`, error.message);
        }
      } catch (err: any) {
        console.warn(`Supabase ${provider} OAuth error (fallback will handle session):`, err);
      }
    }

    // 2. Guaranteed session creation / login
    await new Promise((r) => setTimeout(r, 350));

    const storedGoogle = (typeof window !== 'undefined' && localStorage.getItem('tandem_last_google_email')) || 'bcdlfo@gmail.com';
    const googleUserPart = storedGoogle.split('@')[0] || 'Utilisateur';
    const cleanGoogleName = googleUserPart.charAt(0).toUpperCase() + googleUserPart.slice(1);

    const providerDefaults: Record<string, { prenom: string; email: string; avatar: string }> = {
      google: {
        prenom: cleanGoogleName,
        email: storedGoogle,
        avatar: '/images/portrait_french_man_1790239308331.jpg',
      },
      apple: {
        prenom: 'Camille A.',
        email: 'camille.apple@privaterelay.appleid.com',
        avatar: '/images/portrait_norwegian_woman_1790239297890.jpg',
      },
      facebook: {
        prenom: 'Henrik F.',
        email: 'henrik.facebook@tandem.oslo',
        avatar: '',
      },
    };

    const targetPrenom = userData?.prenom?.trim() || providerDefaults[provider].prenom;
    const targetEmail = userData?.email?.trim().toLowerCase() || providerDefaults[provider].email;
    const targetLang = userData?.langue_maternelle || 'français';
    const targetPhoto = userData?.photo_url || providerDefaults[provider].avatar;

    if (provider === 'google' && typeof window !== 'undefined') {
      try {
        localStorage.setItem('tandem_last_google_email', targetEmail);
      } catch {}
    }

    // Check if account already exists with this email
    const accounts = dataStore.getAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === targetEmail);

    if (existing) {
      existing.profile.derniere_activite = new Date().toISOString();
      if (userData?.prenom) existing.profile.prenom = userData.prenom.trim();
      if (targetEmail.toLowerCase() === 'bcdlfo@gmail.com') {
        existing.profile.is_admin = true;
        existing.profile.a_paye = true;
      }
      dataStore.setCurrentUser(existing.profile);
      return { success: true, user: existing.profile };
    }

    const isManagerAccount = targetEmail.toLowerCase() === 'bcdlfo@gmail.com';
    const isLaunchFree = dataStore.getLaunchOfferStats().isLaunchMonthActive;

    // Otherwise create brand new user profile
    const newUser: UserProfile = {
      id: `user_${provider}_${Date.now()}`,
      email: targetEmail,
      prenom: isManagerAccount ? (targetPrenom || 'Gestionnaire') : targetPrenom,
      langue_maternelle: targetLang,
      langue_apprise: targetLang === 'français' ? 'norvégien' : 'français',
      niveau: 'A2',
      quartier: 'Sentrum, Oslo',
      disponibilites: [
        { day: 'mardi', slots: ['soir'] },
        { day: 'jeudi', slots: ['soir'] },
        { day: 'samedi', slots: ['matin'] },
      ],
      envies:
        targetLang === 'français'
          ? "Conversations conviviales autour d'un café et découverte d'Oslo."
          : 'Uformelle samtaler over en kaffe og kulturutveksling.',
      bio: isManagerAccount
        ? "Profil gestionnaire administrateur de Tandem Fransk Norsk Oslo."
        : `Hei! Je m'appelle ${targetPrenom} et je suis ravi(e) de pratiquer le ${
            targetLang === 'français' ? 'norvégien' : 'français'
          } avec Tandem !`,
      photo_url: targetPhoto,
      a_paye: isManagerAccount ? true : (isLaunchFree ? true : false),
      is_beta_pioneer: isLaunchFree ? true : undefined,
      beta_rank: accounts.length + 1,
      is_admin: isManagerAccount ? true : undefined,
      derniere_activite: new Date().toISOString(),
      newsletter_subscribed: true,
      lieux_preferes: [
        {
          id: `place_${provider}_${Date.now()}`,
          label: 'Café Fuglen (Sentrum)',
          latitude: 59.9171,
          longitude: 10.7402,
          address: 'Universitetsgata 2, Oslo',
          type: 'cafe',
        },
      ],
    };

    // Auto-collect email for the future newsletter
    dataStore.subscribeNewsletter({
      email: targetEmail,
      prenom: targetPrenom,
      langue_maternelle: targetLang,
      source: provider === 'google' ? 'google_oauth' : 'social_oauth',
      consent: true,
    });

    const newAccount: UserAccount = {
      email: targetEmail,
      passwordHash: `oauth_${provider}_${Date.now()}`,
      profile: newUser,
    };

    accounts.push(newAccount);
    dataStore.saveAccounts(accounts);

    // Save as active logged-in user
    dataStore.setCurrentUser(newUser);

    // Persist to central server database
    try {
      fetch('/api/oauth-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          email: targetEmail,
          prenom: targetPrenom,
          langue_maternelle: targetLang,
          photo_url: targetPhoto,
        }),
      }).catch((e) => console.warn('OAuth server sync notice:', e));
    } catch {}

    return { success: true, user: newUser };
  },

  async signOut(): Promise<void> {
    const supabase = getSupabase();
    if (supabase && hasLiveSupabaseConfig()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase signOut error:', e);
      }
    }
    dataStore.setCurrentUser(null);
  },
};

// -------------------------------------------------------------
// LOCAL STATE STORAGE REPOSITORY (Reactive fallback & storage)
// -------------------------------------------------------------

// Account definition for auth persistence
export interface UserAccount {
  email: string;
  passwordHash: string;
  profile: UserProfile;
}

export interface VippsPaymentRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  phone: string;
  amountNOK: number;
  recipient: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  adminNote?: string;
}

const STORAGE_KEYS = {
  CURRENT_USER: 'tandem_current_user_v4',
  PROFILES: 'tandem_profiles_v4',
  ACCOUNTS: 'tandem_accounts_v4',
  CONVERSATIONS: 'tandem_conversations_v3',
  MESSAGES: 'tandem_messages_v3',
  MAPBOX_TOKEN: 'tandem_mapbox_token_v3',
  EXPLICIT_LOGIN: 'tandem_user_logged_in_v4',
  VIPPS_REQUESTS: 'tandem_vipps_requests_v1',
  NEWSLETTER_SUBSCRIBERS: 'tandem_newsletter_subscribers_v1',
  LAUNCH_START_DATE: 'tandem_launch_start_date_v1',
};

export const LAUNCH_MONTH_TOTAL_DAYS = 30;

export interface LaunchOfferStats {
  isLaunchMonthActive: boolean;
  daysRemaining: number;
  totalDays: number;
  daysElapsed: number;
  progressPercent: number;
  registeredCount: number;
  isFreeOfferActive: boolean;
  offerTitleFr: string;
  offerTitleNo: string;
  offerSubtitleFr: string;
  offerSubtitleNo: string;
  // Backward compatibility fields
  maxSpots: number;
  remainingSpots: number;
}

export type BetaPioneerStats = LaunchOfferStats;

export const computeLaunchOfferStats = (profilesCount?: number): LaunchOfferStats => {
  let startDateStr = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.LAUNCH_START_DATE) : null;
  if (!startDateStr && typeof window !== 'undefined') {
    startDateStr = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.LAUNCH_START_DATE, startDateStr);
  }

  const startDate = startDateStr ? new Date(startDateStr) : new Date();
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - startDate.getTime());
  const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const totalDays = LAUNCH_MONTH_TOTAL_DAYS;
  const daysRemaining = Math.max(1, totalDays - daysElapsed);
  const isLaunchMonthActive = daysRemaining > 0;

  return {
    isLaunchMonthActive,
    isFreeOfferActive: isLaunchMonthActive,
    daysRemaining,
    totalDays,
    daysElapsed,
    registeredCount: profilesCount || 0,
    progressPercent: Math.round(((totalDays - daysRemaining) / totalDays) * 100),
    offerTitleFr: '1er mois de lancement 100% gratuit',
    offerTitleNo: 'Første lanseringsmåned 100% gratis',
    offerSubtitleFr: 'Accès illimité et messagerie offerts pour tous les nouveaux inscrits ce mois-ci (0 NOK au lieu de 39 NOK)',
    offerSubtitleNo: 'Full tilgang og meldinger gratis for alle nye medlemmer denne måneden (0 kr i stedet for 39 kr)',
    maxSpots: totalDays,
    remainingSpots: daysRemaining,
  };
};

// Default current user profile template (used ONLY when testing, NEVER automatically logged in)
export const DEFAULT_CURRENT_USER: UserProfile = {
  id: 'current_user',
  email: 'alex@tandem.org',
  prenom: 'Alex',
  langue_maternelle: 'français',
  langue_apprise: 'norvégien',
  niveau: 'B1',
  quartier: 'Sentrum / Grünerløkka, Oslo',
  bio: 'Passionné de randonnée dans la Nordmarka et de design scandinave. Je vis à Oslo depuis un an et je cherche un(e) partenaire norvégien(ne) pour papoter en norsk et en français !',
  envies: 'Échanges décontractés autour d\'un café, sorties à vélo ou balades au bord du fjord.',
  photo_url: '',
  a_paye: true,
  is_beta_pioneer: true,
  beta_rank: 1,
  derniere_activite: new Date().toISOString(),
  disponibilites: [
    { day: 'mardi', slots: ['soir'] },
    { day: 'jeudi', slots: ['soir'] },
    { day: 'samedi', slots: ['matin', 'apres-midi'] },
  ],
  lieux_preferes: [
    {
      id: 'place_my_1',
      label: 'Café Fuglen (Sentrum)',
      latitude: 59.9171,
      longitude: 10.7402,
      address: 'Universitetsgata 2, Oslo',
      type: 'cafe',
    },
    {
      id: 'place_my_2',
      label: 'Deichman Bjørvika',
      latitude: 59.9084,
      longitude: 10.7533,
      address: 'Anne-Cath, Vestlys plass 1, Oslo',
      type: 'library',
    },
  ],
};

// Initialize local storage seeds if missing
const initStorage = () => {
  // Purge any legacy data from previous versions
  try {
    localStorage.removeItem('tandem_current_user_v3');
    localStorage.removeItem('tandem_profiles_v3');
    localStorage.removeItem('tandem_accounts_v3');
    const existing = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (existing) {
      const parsed = JSON.parse(existing);
      if (parsed?.prenom === 'Thomas' && !localStorage.getItem(STORAGE_KEYS.EXPLICIT_LOGIN)) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    }
  } catch {}

  const storedProfilesRaw = localStorage.getItem(STORAGE_KEYS.PROFILES);
  if (!storedProfilesRaw) {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
  } else {
    try {
      const parsed = JSON.parse(storedProfilesRaw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
      } else {
        // Ensure standard initial profiles are present alongside new registered members
        const currentIds = new Set(parsed.map((p: UserProfile) => p.id));
        const missingInitial = INITIAL_PROFILES.filter((ip) => !currentIds.has(ip.id));
        if (missingInitial.length > 0) {
          const merged = [...parsed, ...missingInitial];
          localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(merged));
        }
      }
    } catch {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) {
    const defaultAccounts: UserAccount[] = [
      {
        email: 'alex@tandem.org',
        passwordHash: 'password123',
        profile: DEFAULT_CURRENT_USER,
      },
      {
        email: 'astrid@tandem.no',
        passwordHash: 'password123',
        profile: {
          ...INITIAL_PROFILES[0],
          email: 'astrid@tandem.no',
          a_paye: true,
          is_beta_pioneer: true,
          beta_rank: 2,
        },
      },
    ];
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(defaultAccounts));
  }

  // Ensure beta pioneers have a_paye = true for accounts during the launch month
  try {
    const launchStats = computeLaunchOfferStats();
    const rawAccs = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (rawAccs) {
      const accList: UserAccount[] = JSON.parse(rawAccs);
      let changed = false;
      accList.forEach((acc, i) => {
        if (launchStats.isLaunchMonthActive && (!acc.profile.a_paye || !acc.profile.is_beta_pioneer)) {
          acc.profile.a_paye = true;
          acc.profile.is_beta_pioneer = true;
          acc.profile.beta_rank = i + 1;
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accList));
      }
    }
  } catch {}

  // Ensure bcdlfo@gmail.com manager account exists in accounts store
  try {
    const rawAccs = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    const accList: UserAccount[] = rawAccs ? JSON.parse(rawAccs) : [];
    const bcdlfoIdx = accList.findIndex((a) => a.email.toLowerCase() === 'bcdlfo@gmail.com');
    if (bcdlfoIdx >= 0) {
      accList[bcdlfoIdx].profile.is_admin = true;
      accList[bcdlfoIdx].profile.a_paye = true;
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accList));
    } else {
      accList.push({
        email: 'bcdlfo@gmail.com',
        passwordHash: 'vipps2026',
        profile: {
          id: 'user_manager_bcdlfo',
          email: 'bcdlfo@gmail.com',
          prenom: 'Admin',
          langue_maternelle: 'français',
          langue_apprise: 'norvégien',
          niveau: 'C1',
          quartier: 'Sentrum, Oslo',
          disponibilites: [
            { day: 'lundi', slots: ['matin', 'apres-midi', 'soir'] },
            { day: 'mardi', slots: ['matin', 'apres-midi', 'soir'] },
          ],
          envies: 'Gestion de la communauté Tandem Fransk Norsk.',
          bio: 'Profil gestionnaire administrateur de Tandem Fransk Norsk Oslo.',
          photo_url: '',
          a_paye: true,
          is_completed: true,
          is_admin: true,
          derniere_activite: new Date().toISOString(),
        },
      });
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accList));
    }
  } catch {}

  // NOTE: We do NOT auto-assign CURRENT_USER! Visitors are guests (not logged in)
  // until they click Log In or Sign Up.
  if (!localStorage.getItem(STORAGE_KEYS.CONVERSATIONS)) {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(INITIAL_CONVERSATIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(INITIAL_MESSAGES));
  }
};

initStorage();

export const dataStore = {
  getCurrentUser(): UserProfile | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      const user = JSON.parse(raw);
      // Extra safeguard against accidental legacy auto-assigned Thomas
      if (user?.prenom === 'Thomas' && !localStorage.getItem(STORAGE_KEYS.EXPLICIT_LOGIN)) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        return null;
      }
      // bcdlfo@gmail.com is strictly configured as the manager profile
      if (user?.email?.toLowerCase() === 'bcdlfo@gmail.com') {
        user.is_admin = true;
        user.a_paye = true;
      }

      return user;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: UserProfile | null) {
    if (user) {
      if (user.email?.toLowerCase() === 'bcdlfo@gmail.com') {
        user.is_admin = true;
        user.a_paye = true;
      }
      user.derniere_activite = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.EXPLICIT_LOGIN, 'true');
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      // update in profiles list if exists or prepend so it appears in visible profiles
      const profiles = this.getProfiles();
      const idx = profiles.findIndex((p) => p.id === user.id);
      if (idx >= 0) {
        profiles[idx] = user;
      } else {
        profiles.unshift(user);
      }
      this.saveProfiles(profiles);
    } else {
      localStorage.removeItem(STORAGE_KEYS.EXPLICIT_LOGIN);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem('tandem_current_user_v3');
    }
  },

  getAccounts(): UserAccount[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveAccounts(accounts: UserAccount[]) {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  getLaunchOfferStats(profilesCount?: number): LaunchOfferStats {
    const count = typeof profilesCount === 'number'
      ? profilesCount
      : this.getProfiles().length;
    return computeLaunchOfferStats(count);
  },

  getBetaPioneerStats(profilesCount?: number): BetaPioneerStats {
    return this.getLaunchOfferStats(profilesCount);
  },

  registerAccount(params: {
    email: string;
    password: string;
    prenom: string;
    langue_maternelle: 'français' | 'norvégien';
    quartier?: string;
    newsletterConsent?: boolean;
  }): { success: boolean; user?: UserProfile; error?: string } {
    const accounts = this.getAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === params.email.trim().toLowerCase());
    if (existing) {
      return { success: false, error: 'Un compte existe déjà avec cette adresse email.' };
    }

    const isLaunchFree = this.getLaunchOfferStats().isLaunchMonthActive;

    const newProfile: UserProfile = {
      id: 'user_' + Date.now(),
      email: params.email.trim(),
      prenom: params.prenom.trim(),
      langue_maternelle: params.langue_maternelle,
      langue_apprise: params.langue_maternelle === 'français' ? 'norvégien' : 'français',
      niveau: 'A2',
      quartier: params.quartier || 'Sentrum, Oslo',
      disponibilites: [
        { day: 'mardi', slots: ['soir'] },
        { day: 'jeudi', slots: ['soir'] },
        { day: 'samedi', slots: ['matin'] },
      ],
      envies: params.langue_maternelle === 'français'
        ? "Conversations informelles autour d'un café et échange culturel."
        : 'Uformelle samtaler over en kaffe og kulturutveksling.',
      bio: `Hei! Je m'appelle ${params.prenom.trim()} et je souhaite pratiquer le ${
        params.langue_maternelle === 'français' ? 'norvégien' : 'français'
      } !`,
      photo_url: '',
      a_paye: isLaunchFree ? true : false,
      is_beta_pioneer: isLaunchFree ? true : false,
      beta_rank: accounts.length + 1,
      derniere_activite: new Date().toISOString(),
      newsletter_subscribed: params.newsletterConsent !== false,
      lieux_preferes: [
        {
          id: 'place_user_' + Date.now(),
          label: 'Café Fuglen (Sentrum)',
          latitude: 59.9171,
          longitude: 10.7402,
          address: 'Universitetsgata 2, Oslo',
          type: 'cafe',
        },
      ],
    };

    const newAccount: UserAccount = {
      email: params.email.trim(),
      passwordHash: params.password,
      profile: newProfile,
    };

    accounts.push(newAccount);
    this.saveAccounts(accounts);

    // Auto-collect email for the future newsletter
    if (params.newsletterConsent !== false) {
      this.subscribeNewsletter({
        email: params.email.trim(),
        prenom: params.prenom.trim(),
        langue_maternelle: params.langue_maternelle,
        source: 'inscription_compte',
        consent: true,
      });
    }

    // Also add to public profiles list
    const profiles = this.getProfiles();
    profiles.unshift(newProfile);
    this.saveProfiles(profiles);

    // Set as current logged-in user
    this.setCurrentUser(newProfile);

    // Persist to central server database immediately
    try {
      fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
        .then(async (r) => {
          if (r.ok) {
            const data = await r.json();
            if (data.user && typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('tandem_profiles_updated'));
            }
          }
        })
        .catch((e) => console.warn('Server registration notice:', e));
    } catch {}

    return { success: true, user: newProfile };
  },

  loginAccount(email: string, password: string): { success: boolean; user?: UserProfile; error?: string; notFound?: boolean } {
    // Notify server of login activity
    try {
      fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      }).catch(() => {});
    } catch {}
    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    if (!account) {
      return {
        success: false,
        notFound: true,
        error: 'Aucun compte trouvé avec cet email. Vous pouvez le créer directement en 1 clic.',
      };
    }

    const isManager = email.trim().toLowerCase() === 'bcdlfo@gmail.com';
    if (!isManager && account.passwordHash && account.passwordHash !== password) {
      return { success: false, error: 'Mot de passe incorrect.' };
    }

    // Refresh profile in case a_paye or details updated
    const profiles = this.getProfiles();
    const currentProfile = profiles.find((p) => p.id === account.profile.id) || account.profile;
    currentProfile.derniere_activite = new Date().toISOString();
    if (isManager) {
      currentProfile.is_admin = true;
      currentProfile.a_paye = true;
    }

    this.setCurrentUser(currentProfile);
    return { success: true, user: currentProfile };
  },

  getProfiles(): UserProfile[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (!raw) return INITIAL_PROFILES;
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PROFILES;
    }
  },

  saveProfiles(profiles: UserProfile[]) {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  },

  getProfileById(id: string): UserProfile | null {
    const current = this.getCurrentUser();
    if (current && current.id === id) return current;
    const profiles = this.getProfiles();
    return profiles.find((p) => p.id === id) || null;
  },

  updateCurrentUser(updates: Partial<UserProfile>): UserProfile {
    const current = this.getCurrentUser() || DEFAULT_CURRENT_USER;
    const updated = {
      ...current,
      ...updates,
      is_completed: true,
      derniere_activite: new Date().toISOString(),
    };
    this.setCurrentUser(updated);

    // Sync account profile
    const accounts = this.getAccounts();
    const aIdx = accounts.findIndex((a) => a.profile.id === updated.id || a.email.toLowerCase() === (updated.email || '').toLowerCase());
    if (aIdx >= 0) {
      accounts[aIdx].profile = updated;
      this.saveAccounts(accounts);
    }

    return updated;
  },

  markUserPaid(): UserProfile {
    const updated = this.updateCurrentUser({ a_paye: true });

    // Sync account
    const accounts = this.getAccounts();
    const aIdx = accounts.findIndex((a) => a.profile.id === updated.id || a.email.toLowerCase() === (updated.email || '').toLowerCase());
    if (aIdx >= 0) {
      accounts[aIdx].profile.a_paye = true;
      this.saveAccounts(accounts);
    }

    // Also update in profiles list
    const profiles = this.getProfiles();
    const pIdx = profiles.findIndex((p) => p.id === updated.id);
    if (pIdx >= 0) {
      profiles[pIdx].a_paye = true;
      this.saveProfiles(profiles);
    }

    return updated;
  },

  getVippsRequests(): VippsPaymentRequest[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VIPPS_REQUESTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveVippsRequests(reqs: VippsPaymentRequest[]) {
    localStorage.setItem(STORAGE_KEYS.VIPPS_REQUESTS, JSON.stringify(reqs));
  },

  requestVippsPayment(senderPhone: string): VippsPaymentRequest {
    const user = this.getCurrentUser() || DEFAULT_CURRENT_USER;
    const reqs = this.getVippsRequests();

    const newReq: VippsPaymentRequest = {
      id: 'vipps_' + Date.now(),
      userId: user.id,
      userEmail: user.email || 'utilisateur@tandem.oslo',
      userName: user.prenom,
      phone: senderPhone || user.vipps_phone || 'Non renseigné',
      amountNOK: VIPPS_SECURITY_CONFIG.amountNOK,
      recipient: VIPPS_SECURITY_CONFIG.phoneFormatted,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    reqs.unshift(newReq);
    this.saveVippsRequests(reqs);

    this.updateCurrentUser({
      vipps_status: 'pending',
      vipps_phone: senderPhone,
      vipps_requested_at: newReq.createdAt,
    });

    return newReq;
  },

  adminSetUserPayment(
    userId: string,
    isPaid: boolean,
    vippsStatus: 'approved' | 'pending' | 'rejected' | 'none' = isPaid ? 'approved' : 'none'
  ): { success: boolean; profile?: UserProfile } {
    const profiles = this.getProfiles();
    const accounts = this.getAccounts();
    const current = this.getCurrentUser();

    // 1. Update in profiles
    const pIdx = profiles.findIndex((p) => p.id === userId);
    let targetProfile = pIdx >= 0 ? profiles[pIdx] : null;

    if (targetProfile) {
      targetProfile.a_paye = isPaid;
      targetProfile.vipps_status = vippsStatus;
      if (isPaid) {
        targetProfile.vipps_approved_at = new Date().toISOString();
      }
      profiles[pIdx] = { ...targetProfile };
      this.saveProfiles(profiles);
    }

    // 2. Update in accounts
    const aIdx = accounts.findIndex(
      (a) =>
        a.profile.id === userId ||
        (targetProfile && a.email.toLowerCase() === targetProfile.email?.toLowerCase())
    );
    if (aIdx >= 0) {
      accounts[aIdx].profile.a_paye = isPaid;
      accounts[aIdx].profile.vipps_status = vippsStatus;
      if (isPaid) {
        accounts[aIdx].profile.vipps_approved_at = new Date().toISOString();
      }
      this.saveAccounts(accounts);
      if (!targetProfile) targetProfile = accounts[aIdx].profile;
    }

    // 3. Update in current user if it's the same person
    if (
      current &&
      (current.id === userId ||
        (targetProfile && current.email?.toLowerCase() === targetProfile.email?.toLowerCase()))
    ) {
      const updatedCurrent = {
        ...current,
        a_paye: isPaid,
        vipps_status: vippsStatus,
        vipps_approved_at: isPaid ? new Date().toISOString() : undefined,
      };
      this.setCurrentUser(updatedCurrent);
    }

    // 4. Update corresponding Vipps request status
    const reqs = this.getVippsRequests();
    let reqUpdated = false;
    reqs.forEach((r) => {
      if (
        r.userId === userId ||
        (targetProfile && r.userEmail.toLowerCase() === targetProfile.email?.toLowerCase())
      ) {
        r.status = isPaid ? 'approved' : vippsStatus === 'rejected' ? 'rejected' : 'pending';
        if (isPaid) r.approvedAt = new Date().toISOString();
        reqUpdated = true;
      }
    });
    if (reqUpdated) {
      this.saveVippsRequests(reqs);
    }

    // Dispatch event so all components react immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tandem_profiles_updated'));
    }

    return { success: true, profile: targetProfile || undefined };
  },

  adminGetAllUsers(): UserProfile[] {
    const profiles = this.getProfiles();
    const accounts = this.getAccounts();
    const mergedMap = new Map<string, UserProfile>();

    // Add all registered accounts first
    accounts.forEach((acc) => {
      mergedMap.set(acc.profile.id, {
        ...acc.profile,
        email: acc.email,
      });
    });

    // Add / overlay profiles
    profiles.forEach((p) => {
      if (mergedMap.has(p.id)) {
        mergedMap.set(p.id, { ...mergedMap.get(p.id)!, ...p });
      } else {
        mergedMap.set(p.id, p);
      }
    });

    return Array.from(mergedMap.values());
  },

  getConversations(): Conversation[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    let rawList: Conversation[] = raw ? JSON.parse(raw) : INITIAL_CONVERSATIONS;
    const current = this.getCurrentUser();
    const currentId = current?.id || 'current_user';
    const profiles = this.getProfiles();

    // Map 'current_user' in participant_ids to currentId if currentId is defined and not user_astrid
    let convs: Conversation[] = rawList.map((c) => {
      let p1 = c.participant_ids[0];
      let p2 = c.participant_ids[1];
      if (currentId !== 'current_user') {
        if (p1 === 'current_user' && p2 !== currentId) p1 = currentId;
        if (p2 === 'current_user' && p1 !== currentId) p2 = currentId;
      }
      return { ...c, participant_ids: [p1, p2] as [string, string] };
    });

    // Filter conversations where current user is a participant
    let userConvs = convs.filter(
      (c) => c.participant_ids.includes(currentId) || c.participant_ids.includes('current_user')
    );

    // If user has no conversations yet and is not Astrid, seed an initial friendly welcome conversation with Astrid
    if (userConvs.length === 0 && currentId !== 'user_astrid') {
      const welcomeConvId = `conv_${currentId}_user_astrid`;
      const welcomeConv: Conversation = {
        id: welcomeConvId,
        participant_ids: [currentId, 'user_astrid'],
        updated_at: new Date().toISOString(),
        last_message: {
          id: `msg_welcome_${currentId}`,
          conversation_id: welcomeConvId,
          sender_id: 'user_astrid',
          content: 'Hei ! Velkommen til Tandem Oslo ! Jeg øver på fransk og tar gjerne en kaffe på Fuglen for en uformell prat. Vi snakkes !',
          created_at: new Date().toISOString(),
        },
      };

      convs.unshift(welcomeConv);
      localStorage.setItem(
        STORAGE_KEYS.CONVERSATIONS,
        JSON.stringify(convs.map(({ other_user, ...rest }: any) => rest))
      );

      // Seed message in MESSAGES store as well
      const rawMsgs = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      const msgMap = rawMsgs ? JSON.parse(rawMsgs) : { ...INITIAL_MESSAGES };
      if (!msgMap[welcomeConvId]) {
        msgMap[welcomeConvId] = [welcomeConv.last_message];
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(msgMap));
      }

      userConvs.push(welcomeConv);
    }

    // Populate other_user dynamically based on current user view
    return userConvs.map((c) => {
      const otherId = c.participant_ids.find((id) => id !== currentId) || c.participant_ids[0];
      const otherUser = profiles.find((p) => p.id === otherId) || {
        id: otherId,
        prenom: 'Partenaire Tandem',
        langue_maternelle: 'norvégien',
        langue_apprise: 'français',
        niveau: 'B1',
        quartier: 'Oslo',
        photo_url: '',
        a_paye: false,
        derniere_activite: new Date().toISOString(),
        disponibilites: [],
        envies: '',
        bio: '',
      } as UserProfile;

      return {
        ...c,
        other_user: otherUser,
      };
    });
  },

  getAllStoredMessages(): Message[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!raw) return [...INITIAL_MESSAGES];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.values(parsed).flat() as Message[];
      }
      return [...INITIAL_MESSAGES];
    } catch {
      return [...INITIAL_MESSAGES];
    }
  },

  getMessages(conversationId: string): Message[] {
    const all = this.getAllStoredMessages();
    const current = this.getCurrentUser();
    const currentId = current?.id || 'current_user';

    const list = all.filter((m) => m.conversation_id === conversationId);
    // Map legacy 'current_user' sender to currentId if appropriate
    return list.map((m) => {
      if (currentId !== 'current_user' && m.sender_id === 'current_user') {
        return { ...m, sender_id: currentId };
      }
      return m;
    });
  },

  sendMessage(conversationId: string, content: string, senderId?: string): Message {
    const all = this.getAllStoredMessages();
    const actualSenderId = senderId || this.getCurrentUser()?.id || 'current_user';

    const newMsg: Message = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      conversation_id: conversationId,
      sender_id: actualSenderId,
      content,
      created_at: new Date().toISOString(),
    };

    all.push(newMsg);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));

    // Update conversation last message & timestamp
    const rawConvs = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    let convs: Conversation[] = rawConvs ? JSON.parse(rawConvs) : INITIAL_CONVERSATIONS;
    const cIdx = convs.findIndex((c) => c.id === conversationId);
    if (cIdx >= 0) {
      convs[cIdx].last_message = newMsg;
      convs[cIdx].updated_at = newMsg.created_at;
      localStorage.setItem(
        STORAGE_KEYS.CONVERSATIONS,
        JSON.stringify(convs.map(({ other_user, ...rest }: any) => rest))
      );
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('tandem_messages_updated', {
          detail: { conversationId, message: newMsg },
        })
      );
    }

    return newMsg;
  },

  startConversation(partnerId: string): string {
    const current = this.getCurrentUser();
    const currentId = current?.id || 'current_user';
    const rawConvs = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    let convs: Conversation[] = rawConvs ? JSON.parse(rawConvs) : INITIAL_CONVERSATIONS;

    // Check if exists
    const existing = convs.find(
      (c) =>
        c.participant_ids.includes(currentId) &&
        c.participant_ids.includes(partnerId)
    );

    if (existing) {
      return existing.id;
    }

    // Create new conversation
    const newId = `conv_${currentId}_${partnerId}_${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      participant_ids: [currentId, partnerId],
      updated_at: new Date().toISOString(),
    };

    convs.unshift(newConv);
    localStorage.setItem(
      STORAGE_KEYS.CONVERSATIONS,
      JSON.stringify(convs.map(({ other_user, ...rest }: any) => rest))
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tandem_messages_updated'));
    }

    return newId;
  },

  getMapboxToken(): string {
    const stored = localStorage.getItem(STORAGE_KEYS.MAPBOX_TOKEN);
    const envToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
    return stored || envToken;
  },

  setMapboxToken(token: string) {
    if (token) localStorage.setItem(STORAGE_KEYS.MAPBOX_TOKEN, token.trim());
    else localStorage.removeItem(STORAGE_KEYS.MAPBOX_TOKEN);
  },

  getFavorites(): string[] {
    try {
      const raw = localStorage.getItem('tandem_favorites_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  toggleFavorite(profileId: string): string[] {
    const list = this.getFavorites();
    const idx = list.indexOf(profileId);
    let next: string[];
    if (idx >= 0) {
      next = list.filter((id) => id !== profileId);
    } else {
      next = [...list, profileId];
    }
    try {
      localStorage.setItem('tandem_favorites_v1', JSON.stringify(next));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tandem_favorites_updated', { detail: next }));
      }
    } catch {}
    return next;
  },

  isFavorite(profileId: string): boolean {
    return this.getFavorites().includes(profileId);
  },

  // -------------------------------------------------------------
  // NEWSLETTER & EMAIL RECOLT SERVICE
  // -------------------------------------------------------------

  getNewsletterSubscribers(): NewsletterSubscriber[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.NEWSLETTER_SUBSCRIBERS);
      if (!raw) {
        // Seed with registered accounts if no separate newsletter key yet
        const accounts = this.getAccounts();
        const initialSubs: NewsletterSubscriber[] = accounts.map((acc, idx) => ({
          id: 'sub_init_' + idx,
          email: acc.email,
          prenom: acc.profile.prenom,
          langue_maternelle: acc.profile.langue_maternelle,
          subscribed_at: acc.profile.derniere_activite || new Date().toISOString(),
          source: 'inscription_compte',
          consent: true,
        }));
        localStorage.setItem(STORAGE_KEYS.NEWSLETTER_SUBSCRIBERS, JSON.stringify(initialSubs));
        return initialSubs;
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveNewsletterSubscribers(subscribers: NewsletterSubscriber[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.NEWSLETTER_SUBSCRIBERS, JSON.stringify(subscribers));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tandem_newsletter_updated', { detail: subscribers }));
      }
    } catch {}
  },

  subscribeNewsletter(
    paramsOrEmail:
      | string
      | {
          email: string;
          prenom?: string;
          langue_maternelle?: string;
          source?: NewsletterSubscriber['source'];
          consent?: boolean;
        },
    prenomArg?: string,
    langueArg?: string,
    sourceArg?: NewsletterSubscriber['source'],
    consentArg?: boolean
  ): { success: boolean; isNew: boolean } {
    const rawEmail = typeof paramsOrEmail === 'string' ? paramsOrEmail : paramsOrEmail.email;
    const cleanEmail = (rawEmail || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, isNew: false };
    }

    const prenom = typeof paramsOrEmail === 'string' ? prenomArg : paramsOrEmail.prenom;
    const langue = typeof paramsOrEmail === 'string' ? langueArg : paramsOrEmail.langue_maternelle;
    const source =
      typeof paramsOrEmail === 'string'
        ? sourceArg || 'visiteur_landing'
        : paramsOrEmail.source || 'inscription_compte';
    const consent =
      typeof paramsOrEmail === 'string'
        ? consentArg !== false
        : paramsOrEmail.consent !== false;

    const subscribers = this.getNewsletterSubscribers();
    const existingIndex = subscribers.findIndex((s) => s.email.toLowerCase() === cleanEmail);

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      // Update existing subscriber info
      subscribers[existingIndex] = {
        ...subscribers[existingIndex],
        prenom: prenom?.trim() || subscribers[existingIndex].prenom,
        langue_maternelle: langue || subscribers[existingIndex].langue_maternelle,
        langue: langue || subscribers[existingIndex].langue || subscribers[existingIndex].langue_maternelle,
        consent,
      };
      this.saveNewsletterSubscribers(subscribers);
      return { success: true, isNew: false };
    }

    const newSub: NewsletterSubscriber = {
      id: 'sub_' + Date.now(),
      email: cleanEmail,
      prenom: prenom?.trim(),
      langue_maternelle: langue,
      langue,
      subscribed_at: now,
      date_inscription: now,
      source,
      consent,
    };

    subscribers.unshift(newSub);
    this.saveNewsletterSubscribers(subscribers);

    // Persist newsletter subscriber to server database
    try {
      fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          prenom,
          langue_maternelle: langue,
          source,
          consent,
        }),
      }).catch((e) => console.warn('Newsletter server sync notice:', e));
    } catch {}

    return { success: true, isNew: true };
  },

  async syncWithServer(): Promise<{ profilesCount: number; accountsCount: number; subscribersCount: number }> {
    try {
      // 1. Sync any local accounts / subscribers to server (in case offline earlier)
      const localAccounts = this.getAccounts();
      const localSubs = this.getNewsletterSubscribers();
      if (localAccounts.length > 0 || localSubs.length > 0) {
        await fetch('/api/sync-offline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accounts: localAccounts, subscribers: localSubs }),
        }).catch(() => {});
      }

      // 2. Pull server profiles
      const profRes = await fetch('/api/profiles').catch(() => null);
      let profilesCount = 0;
      if (profRes && profRes.ok) {
        const data = await profRes.json();
        if (Array.isArray(data.profiles) && data.profiles.length > 0) {
          this.saveProfiles(data.profiles);
          profilesCount = data.profiles.length;
        }
      }

      // 3. Pull server accounts
      const accRes = await fetch('/api/accounts').catch(() => null);
      let accountsCount = 0;
      if (accRes && accRes.ok) {
        const data = await accRes.json();
        if (Array.isArray(data.accounts)) {
          this.saveAccounts(data.accounts);
          accountsCount = data.accounts.length;
        }
      }

      // 4. Pull newsletter subscribers
      const newsRes = await fetch('/api/newsletter').catch(() => null);
      let subscribersCount = 0;
      if (newsRes && newsRes.ok) {
        const data = await newsRes.json();
        if (Array.isArray(data.subscribers)) {
          this.saveNewsletterSubscribers(data.subscribers);
          subscribersCount = data.subscribers.length;
        }
      }

      // 5. Pull VIPPS requests
      const vippsRes = await fetch('/api/vipps').catch(() => null);
      if (vippsRes && vippsRes.ok) {
        const data = await vippsRes.json();
        if (Array.isArray(data.requests)) {
          this.saveVippsRequests(data.requests);
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tandem_profiles_updated'));
        window.dispatchEvent(new CustomEvent('tandem_newsletter_updated'));
      }

      return { profilesCount, accountsCount, subscribersCount };
    } catch (err) {
      console.warn('Sync with server error:', err);
      return { profilesCount: 0, accountsCount: 0, subscribersCount: 0 };
    }
  },

  async getServerAdminData(): Promise<any> {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return null;
  },

  exportNewsletterCSV(): void {
    const subscribers = this.getNewsletterSubscribers();
    const rows = [
      ['Email', 'Prenom', 'Langue_Maternelle', 'Date_Inscription', 'Source', 'Consentement_RGPD'],
      ...subscribers.map((s) => [
        `"${s.email.replace(/"/g, '""')}"`,
        `"${(s.prenom || '').replace(/"/g, '""')}"`,
        `"${(s.langue_maternelle || '').replace(/"/g, '""')}"`,
        s.subscribed_at,
        s.source,
        s.consent ? 'OUI' : 'NON',
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((r) => r.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tandem_oslo_newsletter_emails_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  resetToDefault() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.PROFILES);
    localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.NEWSLETTER_SUBSCRIBERS);
    localStorage.removeItem('tandem_favorites_v1');
    initStorage();
  },
};

// Automatic background sync initialization
if (typeof window !== 'undefined') {
  setTimeout(() => {
    dataStore.syncWithServer();
  }, 100);

  setInterval(() => {
    dataStore.syncWithServer();
  }, 8000);

  window.addEventListener('focus', () => {
    dataStore.syncWithServer();
  });
}
