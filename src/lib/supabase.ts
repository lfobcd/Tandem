import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, PreferredPlace, Message, Conversation, NewsletterSubscriber } from '../types';
import { INITIAL_PROFILES, INITIAL_CONVERSATIONS, INITIAL_MESSAGES } from '../data/mockData';
import { VIPPS_SECURITY_CONFIG } from '../config/vippsSecurity';

// Supabase credentials configuration from env or local config
export function hashPasswordSync(password: string): string {
  let hash = 5381;
  const str = password + '_tandem_oslo_salt_2026';
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return `h_${Math.abs(hash).toString(16)}_${str.length}`;
}

export async function hashPassword(password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_tandem_oslo_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('[Security] Failed to hash password with Web Crypto, using safe fallback', err);
    return hashPasswordSync(password);
  }
}

export const PROFILE_MIN_BIO = 30;

/** Profil complet : photo + présentation d'au moins 30 caractères. */
export const isProfileComplete = (p?: Partial<UserProfile> | null): boolean =>
  Boolean(p && p.photo_url && (p.bio || '').trim().length >= PROFILE_MIN_BIO && p.is_completed !== false);

/** Profil « vérifié » : email confirmé + photo + présentation (jamais pour les profils de démonstration). */
export const isVerifiedProfile = (p?: Partial<UserProfile> | null): boolean =>
  Boolean(p && !p.is_factice && p.email_verified && isProfileComplete(p));

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
  /**
   * Lance une VRAIE connexion OAuth (Google / Facebook / Apple) via Supabase.
   * L'utilisateur est redirigé vers le fournisseur puis revient sur le site ;
   * le profil est alors créé par completeOAuthLogin().
   */
  async signInWithOAuth(
    provider: 'google' | 'facebook' | 'apple',
    options?: { langue_maternelle?: 'français' | 'norvégien' }
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase || !hasLiveSupabaseConfig()) {
      return {
        success: false,
        error:
          "La connexion sociale n'est pas disponible : la base de données Supabase n'est pas configurée (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).",
      };
    }
    try {
      if (options?.langue_maternelle) {
        localStorage.setItem('tandem_oauth_lang', options.langue_maternelle);
      }
    } catch {}
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      console.error(`[Supabase OAuth ${provider}]`, error);
      return { success: false, error: error.message };
    }
    // Le navigateur est redirigé vers le fournisseur : rien d'autre à faire ici.
    return { success: true };
  },

  /**
   * À appeler au chargement du site et sur onAuthStateChange : si une session
   * Supabase existe (retour d'OAuth), crée ou retrouve le profil dans la table
   * `profiles` et connecte l'utilisateur dans l'app.
   */
  async completeOAuthLogin(): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const supabase = getSupabase();
    if (!supabase || !hasLiveSupabaseConfig()) return { success: false };

    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData?.session?.user;
    if (!authUser) return { success: false };

    const email = (authUser.email || '').trim().toLowerCase();
    if (!email) {
      console.error('[OAuth] Le fournisseur ne fournit pas d\'email.', authUser);
      return {
        success: false,
        error: "Le fournisseur n'a pas communiqué votre adresse email. Inscrivez-vous avec votre email.",
      };
    }

    // 1. Profil déjà existant (même email) : on relie le compte au lieu de créer un doublon
    const { data: existingRows, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .limit(1);
    if (selectError) {
      console.error('[OAuth] Lecture du profil impossible :', selectError);
      return { success: false, error: `Base de données : ${selectError.message}` };
    }

    let profile: UserProfile;
    if (existingRows && existingRows.length > 0) {
      profile = { ...(existingRows[0] as UserProfile), derniere_activite: new Date().toISOString() };
      const oauthProvider = authUser.app_metadata?.provider;
      if (profile.is_admin && oauthProvider !== 'google' && oauthProvider !== 'email') {
        profile.is_admin = false; // email non garanti par ce fournisseur : pas de droits gestionnaire
      }
      await supabase.from('profiles').update({ derniere_activite: profile.derniere_activite }).eq('email', email);
    } else {
      // 2. Nouveau membre : création du profil
      let lang: 'français' | 'norvégien' = 'français';
      try {
        const stored = localStorage.getItem('tandem_oauth_lang');
        if (stored === 'norvégien') lang = 'norvégien';
        localStorage.removeItem('tandem_oauth_lang');
      } catch {}
      const meta: any = authUser.user_metadata || {};
      const fullName: string = meta.full_name || meta.name || email.split('@')[0];
      const prenom = String(fullName).trim().split(/\s+/)[0] || 'Membre';
      const isLaunchFree = dataStore.getLaunchOfferStats().isLaunchMonthActive;

      profile = {
        id: authUser.id,
        email,
        prenom,
        langue_maternelle: lang,
        langue_apprise: lang === 'français' ? 'norvégien' : 'français',
        niveau: 'A2',
        quartier: 'Sentrum, Oslo',
        disponibilites: [
          { day: 'mardi', slots: ['soir'] },
          { day: 'jeudi', slots: ['soir'] },
          { day: 'samedi', slots: ['matin'] },
        ],
        envies:
          lang === 'français'
            ? "Conversations conviviales autour d'un café et découverte d'Oslo."
            : 'Uformelle samtaler over en kaffe og kulturutveksling.',
        bio: `Hei! Je m'appelle ${prenom} et je souhaite pratiquer le ${
          lang === 'français' ? 'norvégien' : 'français'
        } avec Tandem !`,
        photo_url: meta.avatar_url || meta.picture || '',
        a_paye: isLaunchFree,
        is_beta_pioneer: isLaunchFree,
        beta_rank: 1,
        is_completed: false, // à compléter (photo + présentation) à la première connexion
        derniere_activite: new Date().toISOString(),
        newsletter_subscribed: true,
        lieux_preferes: [
          {
            id: 'place_oauth_' + Date.now(),
            label: 'Café Fuglen (Sentrum)',
            latitude: 59.9171,
            longitude: 10.7402,
            address: 'Universitetsgata 2, Oslo',
            type: 'cafe',
          },
        ],
      };

      const { error: insertError } = await supabase.from('profiles').insert(profile);
      if (insertError) {
        console.error('[OAuth] Création du profil impossible :', insertError);
        return { success: false, error: `Création du profil impossible : ${insertError.message}` };
      }
    }

    // 3. Session locale + liste visible du site
    const accounts = dataStore.getAccounts();
    const idx = accounts.findIndex((a) => a.email.toLowerCase() === email);
    const acc: UserAccount = { email, passwordHash: `oauth_${authUser.app_metadata?.provider || 'social'}`, profile };
    if (idx >= 0) accounts[idx] = acc;
    else accounts.unshift(acc);
    dataStore.saveAccounts(accounts);

    const profiles = dataStore.getProfiles();
    const pIdx = profiles.findIndex((p) => p.id === profile.id || (p.email && p.email.toLowerCase() === email));
    if (pIdx >= 0) profiles[pIdx] = profile;
    else profiles.unshift(profile);
    dataStore.saveProfiles(profiles);

    dataStore.setCurrentUser(profile);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tandem_profiles_updated'));
    }
    return { success: true, user: profile };
  },

  /**
   * Vérifie auprès de Supabase (et non dans le navigateur) que la personne connectée
   * est bien gestionnaire : session réelle + email confirmé + is_admin dans la base.
   */
  async verifyAdminRemote(): Promise<boolean> {
    try {
      const supabase = getSupabase();
      if (!supabase || !hasLiveSupabaseConfig()) return false;
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;
      if (!user?.email || !user.email_confirmed_at) return false;
      const provider = user.app_metadata?.provider;
      if (provider && provider !== 'google' && provider !== 'email') return false;
      const { data: rows } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('email', user.email.toLowerCase())
        .limit(1);
      return Boolean(rows?.[0]?.is_admin);
    } catch {
      return false;
    }
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
      return user;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: UserProfile | null) {
    if (user) {
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
    niveau?: any;
    newsletterConsent?: boolean;
    bio?: string;
    envies?: string;
    photo_url?: string;
  }): { success: boolean; user?: UserProfile; error?: string } {
    const cleanEmail = (params.email || '').trim().toLowerCase();
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Strict validation
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      console.error('[Registration Error] Invalid email address format:', params.email);
      return { success: false, error: 'Veuillez saisir une adresse email valide (ex: contact@domaine.com).' };
    }
    if (!params.prenom || !params.prenom.trim()) {
      console.error('[Registration Error] Missing first name');
      return { success: false, error: 'Veuillez renseigner votre prénom.' };
    }
    if (!params.password || params.password.length < 8) {
      console.error('[Registration Error] Password too short (< 8 chars)');
      return { success: false, error: 'Le mot de passe doit comporter au moins 8 caractères.' };
    }
    if (!params.photo_url) {
      return { success: false, error: 'Une photo de profil est obligatoire.' };
    }
    if ((params.bio || '').trim().length < PROFILE_MIN_BIO) {
      return { success: false, error: `Présentez-vous en au moins ${PROFILE_MIN_BIO} caractères.` };
    }

    const accounts = this.getAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      console.error('[Registration Error] Duplicate email detected:', cleanEmail);
      return { success: false, error: 'Un compte existe déjà avec cette adresse email. Veuillez vous connecter.' };
    }

    const isLaunchFree = this.getLaunchOfferStats().isLaunchMonthActive;
    const isOwner = false; // le statut gestionnaire ne s'obtient JAMAIS à l'inscription
    const pwdHash = hashPasswordSync(params.password);

    const newProfile: UserProfile = {
      id: 'user_' + Date.now(),
      email: cleanEmail,
      prenom: params.prenom.trim(),
      langue_maternelle: params.langue_maternelle,
      langue_apprise: params.langue_maternelle === 'français' ? 'norvégien' : 'français',
      niveau: params.niveau || 'A2',
      quartier: params.quartier || 'Sentrum, Oslo',
      disponibilites: [
        { day: 'mardi', slots: ['soir'] },
        { day: 'jeudi', slots: ['soir'] },
        { day: 'samedi', slots: ['matin'] },
      ],
      envies: params.envies || (params.langue_maternelle === 'français'
        ? "Conversations informelles autour d'un café et échange culturel."
        : 'Uformelle samtaler over en kaffe og kulturutveksling.'),
      bio: params.bio || `Hei! Je m'appelle ${params.prenom.trim()} et je souhaite pratiquer le ${
        params.langue_maternelle === 'français' ? 'norvégien' : 'français'
      } !`,
      photo_url: params.photo_url || '',
      a_paye: isOwner ? true : (isLaunchFree ? true : false),
      is_beta_pioneer: isLaunchFree ? true : false,
      beta_rank: accounts.length + 1,
      is_admin: isOwner ? true : undefined,
      is_completed: true,
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
      email: cleanEmail,
      passwordHash: pwdHash,
      profile: newProfile,
    };

    accounts.push(newAccount);
    this.saveAccounts(accounts);

    // Auto-collect email for the future newsletter
    if (params.newsletterConsent !== false) {
      this.subscribeNewsletter({
        email: cleanEmail,
        prenom: params.prenom.trim(),
        langue_maternelle: params.langue_maternelle,
        source: 'inscription_compte',
        consent: true,
      });
    }

    // Add to local profiles list immediately
    const profiles = this.getProfiles();
    const pIdx = profiles.findIndex((p) => p.id === newProfile.id || (p.email && p.email.toLowerCase() === cleanEmail));
    if (pIdx >= 0) profiles[pIdx] = newProfile;
    else profiles.unshift(newProfile);
    this.saveProfiles(profiles);

    // Set as current logged-in user
    this.setCurrentUser(newProfile);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tandem_profiles_updated'));
    }

    // Persist to central server database if server is accessible
    try {
      fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, email: cleanEmail }),
      })
        .then(async (r) => {
          const contentType = r.headers.get('content-type') || '';
          if (r.ok && contentType.includes('application/json')) {
            const data = await r.json();
            if (data.user && typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('tandem_profiles_updated'));
            }
          }
        })
        .catch((e) => console.warn('Background server registration notice:', e));
    } catch {}

    return { success: true, user: newProfile };
  },

  async registerAccountAsync(params: {
    email: string;
    password: string;
    prenom: string;
    langue_maternelle: 'français' | 'norvégien';
    quartier?: string;
    niveau?: any;
    newsletterConsent?: boolean;
    bio?: string;
    envies?: string;
    photo_url?: string;
  }): Promise<{ success: boolean; user?: UserProfile; error?: string; needsEmailConfirmation?: boolean }> {
    const cleanEmail = (params.email || '').trim().toLowerCase();
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // 1. Strict client validation
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      console.error('[Registration Error] Invalid email address format:', params.email);
      return { success: false, error: 'Veuillez saisir une adresse email valide (ex: contact@domaine.com).' };
    }
    if (!params.prenom || !params.prenom.trim()) {
      console.error('[Registration Error] Missing first name');
      return { success: false, error: 'Veuillez renseigner votre prénom.' };
    }
    if (!params.password || params.password.length < 8) {
      console.error('[Registration Error] Password too short (< 8 chars)');
      return { success: false, error: 'Le mot de passe doit comporter au moins 8 caractères.' };
    }
    if (!params.photo_url) {
      return { success: false, error: 'Une photo de profil est obligatoire.' };
    }
    if ((params.bio || '').trim().length < PROFILE_MIN_BIO) {
      return { success: false, error: `Présentez-vous en au moins ${PROFILE_MIN_BIO} caractères.` };
    }

    // 2. LIVE SUPABASE DATABASE CHECK & INSERT (if configured)
    const supabase = getSupabase();
    if (supabase && hasLiveSupabaseConfig()) {
      try {
        console.log('[Supabase DB] Attempting live registration for:', cleanEmail);
        
        // Check for existing profile in Supabase table
        const { data: existingProfiles, error: checkError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', cleanEmail)
          .limit(1);

        if (checkError) {
          console.error('[Supabase Check Error]', checkError);
        } else if (existingProfiles && existingProfiles.length > 0) {
          console.error('[Supabase Error] Profile already exists in database:', cleanEmail);
          return { success: false, error: 'Un compte existe déjà avec cette adresse email sur Tandem.' };
        }

        // Register user with Supabase Auth (passwords safely hashed by Supabase)
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: params.password,
        });

        if (authError && !authError.message.toLowerCase().includes('already registered')) {
          console.error('[Supabase Auth signUp Error]', authError);
          return { success: false, error: `Création du compte impossible : ${authError.message}` };
        }

        const needsEmailConfirmation = Boolean(authData?.user) && !authData?.session;
        const userId = authData?.user?.id || `user_sp_${Date.now()}`;
        const isLaunchFree = this.getLaunchOfferStats().isLaunchMonthActive;
        const isOwner = false; // le statut gestionnaire ne s'obtient JAMAIS à l'inscription

        const supaProfile: UserProfile = {
          id: userId,
          email: cleanEmail,
          prenom: params.prenom.trim(),
          langue_maternelle: params.langue_maternelle,
          langue_apprise: params.langue_maternelle === 'français' ? 'norvégien' : 'français',
          niveau: params.niveau || 'A2',
          quartier: params.quartier || 'Sentrum, Oslo',
          disponibilites: [
            { day: 'mardi', slots: ['soir'] },
            { day: 'jeudi', slots: ['soir'] },
            { day: 'samedi', slots: ['matin'] },
          ],
          envies: params.envies || (params.langue_maternelle === 'français'
            ? "Conversations informelles autour d'un café et échange culturel."
            : 'Uformelle samtaler over en kaffe og kulturutveksling.'),
          bio: params.bio || `Hei! Je m'appelle ${params.prenom.trim()} et je souhaite pratiquer le ${
            params.langue_maternelle === 'français' ? 'norvégien' : 'français'
          } !`,
          photo_url: params.photo_url || '',
          a_paye: isOwner ? true : (isLaunchFree ? true : false),
          is_beta_pioneer: isLaunchFree ? true : false,
          beta_rank: 1,
          is_admin: isOwner ? true : undefined,
          is_completed: true,
          derniere_activite: new Date().toISOString(),
          newsletter_subscribed: params.newsletterConsent !== false,
          lieux_preferes: [
            {
              id: 'place_sp_' + Date.now(),
              label: 'Café Fuglen (Sentrum)',
              latitude: 59.9171,
              longitude: 10.7402,
              address: 'Universitetsgata 2, Oslo',
              type: 'cafe',
            },
          ],
        };

        // Insert / Upsert into Supabase profiles table
        const { error: insertError } = await supabase.from('profiles').upsert(supaProfile);
        if (insertError) {
          console.error('[Supabase Profiles Insert Error]', insertError);
          // IMPORTANT : on n'affiche plus "Inscription réussie" si la base a refusé l'écriture
          return {
            success: false,
            error: `L'inscription n'a pas pu être enregistrée dans la base de données (${insertError.message}).`,
          };
        }
        console.log('[Supabase DB] Profile created successfully in Supabase!');

        if (needsEmailConfirmation) {
          // Supabase a envoyé un email de confirmation : le membre se connectera après l'avoir confirmé
          return { success: true, needsEmailConfirmation: true };
        }

        // Save locally and set current user
        const pwdHash = await hashPassword(params.password);
        const accounts = this.getAccounts();
        const aIdx = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);
        const accItem: UserAccount = {
          email: cleanEmail,
          passwordHash: pwdHash,
          profile: supaProfile,
        };
        if (aIdx >= 0) accounts[aIdx] = accItem;
        else accounts.unshift(accItem);
        this.saveAccounts(accounts);

        const profiles = this.getProfiles();
        const pIdx = profiles.findIndex((p) => p.id === supaProfile.id || (p.email && p.email.toLowerCase() === cleanEmail));
        if (pIdx >= 0) profiles[pIdx] = supaProfile;
        else profiles.unshift(supaProfile);
        this.saveProfiles(profiles);

        this.setCurrentUser(supaProfile);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tandem_profiles_updated'));
        }

        return { success: true, user: supaProfile };
      } catch (supaErr: any) {
        console.error('[Supabase Registration Exception]', supaErr);
        return { success: false, error: `Erreur réseau avec la base de données : ${supaErr?.message || supaErr}` };
      }
    }

    // 3. API SERVER REGISTRATION (if full-stack Node server is reachable)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, email: cleanEmail }),
      });
      const contentType = res.headers.get('content-type') || '';
      // Guard against Vercel static rewrite returning index.html (text/html)
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.user) {
          const pwdHash = await hashPassword(params.password);
          const accounts = this.getAccounts();
          const aIdx = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);
          const accItem: UserAccount = {
            email: cleanEmail,
            passwordHash: pwdHash,
            profile: data.user,
          };
          if (aIdx >= 0) accounts[aIdx] = accItem;
          else accounts.unshift(accItem);
          this.saveAccounts(accounts);

          const profiles = this.getProfiles();
          const pIdx = profiles.findIndex((p) => p.id === data.user.id || (p.email && p.email.toLowerCase() === cleanEmail));
          if (pIdx >= 0) profiles[pIdx] = data.user;
          else profiles.unshift(data.user);
          this.saveProfiles(profiles);

          this.setCurrentUser(data.user);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tandem_profiles_updated'));
          }
          return { success: true, user: data.user };
        } else if (data.error) {
          console.error('[API Registration Error]', data.error);
          return { success: false, error: data.error };
        }
      } else if (!contentType.includes('application/json')) {
        console.warn('[Vercel Notice] /api/register returned non-JSON response (likely static rewrite to index.html). Using direct store.');
      }
    } catch (e) {
      console.warn('Network registration API unavailable, using store:', e);
    }

    // 4. Sur le site en ligne, sans base configurée, on REFUSE l'inscription au lieu de
    //    l'enregistrer silencieusement dans le navigateur du visiteur (elle serait perdue).
    const isLocalHost = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
    if (!isLocalHost) {
      console.error('[Registration] Aucune base de données configurée : définir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sur Vercel puis redéployer.');
      return {
        success: false,
        error: "Le service d'inscription est momentanément indisponible (base de données non configurée). Merci de réessayer plus tard.",
      };
    }
    // Mode démo local (développement uniquement)
    return await this.registerAccount(params);
  },

  /** Connexion par email : ouvre une vraie session Supabase (nécessaire pour la messagerie). */
  async loginAccountAsync(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: UserProfile; error?: string; notFound?: boolean }> {
    const cleanEmail = email.trim().toLowerCase();
    const supabase = getSupabase();
    if (!supabase || !hasLiveSupabaseConfig()) return this.loginAccount(email, password);

    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (!error && data?.user) {
      const { data: rows, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .limit(1);
      if (profErr) return { success: false, error: `Base de données : ${profErr.message}` };
      const profile = rows?.[0] as UserProfile | undefined;
      if (!profile) {
        return { success: false, notFound: true, error: 'Aucun profil trouvé pour cet email.' };
      }
      profile.derniere_activite = new Date().toISOString();

      const accounts = this.getAccounts();
      const aIdx = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);
      const accItem: UserAccount = { email: cleanEmail, passwordHash: await hashPassword(password), profile };
      if (aIdx >= 0) accounts[aIdx] = accItem;
      else accounts.unshift(accItem);
      this.saveAccounts(accounts);

      const profiles = this.getProfiles();
      const pIdx = profiles.findIndex((p) => p.id === profile.id);
      if (pIdx >= 0) profiles[pIdx] = profile;
      else profiles.unshift(profile);
      this.saveProfiles(profiles);

      this.setCurrentUser(profile);
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('tandem_profiles_updated'));
      return { success: true, user: profile };
    }

    // Échec Supabase : on tente les comptes locaux créés avant la mise en place de la base
    const local = this.loginAccount(email, password);
    if (local.success) return local;
    const msg = error?.message || '';
    if (/email not confirmed/i.test(msg)) {
      return { success: false, error: 'Veuillez confirmer votre adresse email (lien reçu par email) avant de vous connecter.' };
    }
    if (/invalid login credentials/i.test(msg)) {
      return { success: false, error: 'Email ou mot de passe incorrect.' };
    }
    return local;
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

    const isManager = false; // plus aucun compte n'est dispensé de mot de passe
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

  /** Suppression définitive de profils (réservée au gestionnaire, vérifiée côté serveur). */
  async adminDeleteProfiles(
    ids: string[]
  ): Promise<{ success: boolean; deleted: string[]; skipped?: { id: string; reason: string }[]; error?: string }> {
    const removeLocally = (list: string[]) => {
      const set = new Set(list);
      this.saveProfiles(this.getProfiles().filter((p) => !set.has(p.id)));
      this.saveAccounts(this.getAccounts().filter((a) => !set.has(a.profile.id)));
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('tandem_profiles_updated'));
    };

    const supabase = getSupabase();
    if (!supabase || !hasLiveSupabaseConfig()) {
      removeLocally(ids);
      return { success: true, deleted: ids };
    }
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) return { success: false, deleted: [], error: 'Session expirée : reconnectez-vous.' };

    try {
      const res = await fetch('/api/admin-delete-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return { success: false, deleted: [], error: json?.error || `Erreur ${res.status}` };
      removeLocally(json.deleted || []);
      return { success: true, deleted: json.deleted || [], skipped: json.skipped || [] };
    } catch (e: any) {
      return { success: false, deleted: [], error: e?.message || 'Erreur réseau' };
    }
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

    // Envoi réel au destinataire (Supabase) + notification par email
    void this.pushMessageRemote(newMsg);

    return newMsg;
  },

  /** Enregistre le message dans Supabase puis demande l'envoi de l'email de notification. */
  async pushMessageRemote(msg: Message): Promise<void> {
    try {
      const supabase = getSupabase();
      if (!supabase || !hasLiveSupabaseConfig()) return;
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session || msg.sender_id !== session.user.id) return; // seulement mes propres messages

      const rawConvs = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      const convs: Conversation[] = rawConvs ? JSON.parse(rawConvs) : INITIAL_CONVERSATIONS;
      const conv = convs.find((c) => c.id === msg.conversation_id);
      if (!conv) return;
      const otherId = conv.participant_ids.find((id) => id !== msg.sender_id);
      const other = this.getProfiles().find((p) => p.id === otherId);
      if (!otherId || !other || other.is_factice) return; // pas de vrai membre en face

      const { error: convErr } = await supabase
        .from('conversations')
        .upsert({ id: conv.id, participant_ids: [msg.sender_id, otherId], updated_at: msg.created_at });
      if (convErr) {
        console.error('[Messagerie] Conversation non enregistrée :', convErr);
        return;
      }
      const { error: msgErr } = await supabase.from('messages').insert({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        content: msg.content,
        created_at: msg.created_at,
      });
      if (msgErr) {
        console.error('[Messagerie] Message non enregistré :', msgErr);
        return;
      }

      fetch('/api/notify-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ message_id: msg.id }),
      }).catch((e) => console.warn('[Messagerie] Notification email non envoyée :', e));
    } catch (e) {
      console.error('[Messagerie] Erreur d\'envoi :', e);
    }
  },

  /** Récupère depuis Supabase les conversations et messages de l'utilisateur connecté. */
  async syncMessagesFromSupabase(): Promise<void> {
    try {
      const supabase = getSupabase();
      if (!supabase || !hasLiveSupabaseConfig()) return;
      const { data } = await supabase.auth.getSession();
      if (!data?.session) return;

      const [{ data: remoteConvs, error: cErr }, { data: remoteMsgs, error: mErr }] = await Promise.all([
        supabase.from('conversations').select('*'),
        supabase.from('messages').select('*').order('created_at', { ascending: true }),
      ]);
      if (cErr || mErr) {
        console.warn('[Messagerie] Lecture impossible :', cErr || mErr);
        return;
      }

      let changed = false;

      const rawConvs = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      const convs: any[] = rawConvs ? JSON.parse(rawConvs) : [...INITIAL_CONVERSATIONS];
      const messages = this.getAllStoredMessages();
      const knownMsg = new Set(messages.map((m) => m.id));

      for (const m of remoteMsgs || []) {
        if (!knownMsg.has(m.id)) {
          messages.push({
            id: m.id,
            conversation_id: m.conversation_id,
            sender_id: m.sender_id,
            content: m.content,
            created_at: m.created_at,
          });
          knownMsg.add(m.id);
          changed = true;
        }
      }

      for (const rc of remoteConvs || []) {
        const lastMsg = [...(remoteMsgs || [])].reverse().find((m: any) => m.conversation_id === rc.id);
        const idx = convs.findIndex((c) => c.id === rc.id);
        const merged = {
          id: rc.id,
          participant_ids: rc.participant_ids,
          updated_at: lastMsg?.created_at || rc.updated_at,
          last_message: lastMsg
            ? {
                id: lastMsg.id,
                conversation_id: lastMsg.conversation_id,
                sender_id: lastMsg.sender_id,
                content: lastMsg.content,
                created_at: lastMsg.created_at,
              }
            : undefined,
        };
        if (idx < 0) {
          convs.unshift(merged);
          changed = true;
        } else if (convs[idx].last_message?.id !== merged.last_message?.id) {
          convs[idx] = { ...convs[idx], ...merged };
          changed = true;
        }
      }

      if (changed) {
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
        localStorage.setItem(
          STORAGE_KEYS.CONVERSATIONS,
          JSON.stringify(convs.map(({ other_user, ...rest }: any) => rest))
        );
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('tandem_messages_updated'));
      }
    } catch (e) {
      console.warn('[Messagerie] Synchronisation échouée :', e);
    }
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
    const newId = `conv_${[currentId, partnerId].sort().join('__')}`;
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
      let profilesCount = 0;
      let accountsCount = 0;
      let subscribersCount = 0;

      // 1. LIVE SUPABASE DIRECT DATABASE SYNC (if live database is configured)
      const supabase = getSupabase();
      if (supabase && hasLiveSupabaseConfig()) {
        try {
          const { data: supaProfiles, error: supaErr } = await supabase.from('profiles').select('*');
          if (supaErr) {
            console.error('[Supabase Sync Error] Failed to fetch profiles from table:', supaErr);
          } else if (Array.isArray(supaProfiles) && supaProfiles.length > 0) {
            const current = this.getProfiles();
            const supaEmails = new Set(supaProfiles.map((p: any) => (p.email || '').toLowerCase()));
            const myId = this.getCurrentUser()?.id;
            // Hors base, on ne garde que les profils de démonstration (et le sien) :
            // un membre supprimé par le gestionnaire doit disparaître partout.
            const nonSupa = current.filter(
              (p) => !supaEmails.has((p.email || '').toLowerCase()) && (p.is_factice || p.id === myId)
            );
            const merged = [...supaProfiles, ...nonSupa];
            this.saveProfiles(merged);
            profilesCount = supaProfiles.length;
          }
        } catch (e) {
          console.error('[Supabase Sync Exception]', e);
        }
      }

      // 2. Sync local accounts / subscribers to server (if offline earlier)
      const localAccounts = this.getAccounts();
      const localSubs = this.getNewsletterSubscribers();
      if (localAccounts.length > 0 || localSubs.length > 0) {
        await fetch('/api/sync-offline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accounts: localAccounts, subscribers: localSubs }),
        }).catch(() => {});
      }

      // 3. Pull server profiles (checking JSON content-type to avoid Vercel SPA index.html rewrite)
      const profRes = await fetch('/api/profiles').catch(() => null);
      if (profRes && profRes.ok) {
        const contentType = profRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await profRes.json();
          if (Array.isArray(data.profiles) && data.profiles.length > 0) {
            this.saveProfiles(data.profiles);
            profilesCount = data.profiles.length;
          }
        }
      }

      // 4. Pull server accounts
      const accRes = await fetch('/api/accounts').catch(() => null);
      if (accRes && accRes.ok) {
        const contentType = accRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await accRes.json();
          if (Array.isArray(data.accounts)) {
            this.saveAccounts(data.accounts);
            accountsCount = data.accounts.length;
          }
        }
      }

      // 5. Pull newsletter subscribers
      const newsRes = await fetch('/api/newsletter').catch(() => null);
      if (newsRes && newsRes.ok) {
        const contentType = newsRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await newsRes.json();
          if (Array.isArray(data.subscribers)) {
            this.saveNewsletterSubscribers(data.subscribers);
            subscribersCount = data.subscribers.length;
          }
        }
      }

      // 6. Pull VIPPS requests
      const vippsRes = await fetch('/api/vipps').catch(() => null);
      if (vippsRes && vippsRes.ok) {
        const contentType = vippsRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await vippsRes.json();
          if (Array.isArray(data.requests)) {
            this.saveVippsRequests(data.requests);
          }
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tandem_profiles_updated'));
        window.dispatchEvent(new CustomEvent('tandem_newsletter_updated'));
      }

      return { profilesCount, accountsCount, subscribersCount };
    } catch (err) {
      console.error('[Sync Error] Failed to synchronize:', err);
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
