import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, PreferredPlace, Message, Conversation } from '../types';
import { INITIAL_PROFILES, INITIAL_CONVERSATIONS, INITIAL_MESSAGES } from '../data/mockData';

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

    const providerDefaults: Record<string, { prenom: string; email: string; avatar: string }> = {
      google: {
        prenom: 'Alexandre G.',
        email: 'alexandre.google@tandem.oslo',
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

    // Check if account already exists with this email
    const accounts = dataStore.getAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === targetEmail);

    if (existing) {
      existing.profile.derniere_activite = new Date().toISOString();
      if (userData?.prenom) existing.profile.prenom = userData.prenom.trim();
      dataStore.setCurrentUser(existing.profile);
      return { success: true, user: existing.profile };
    }

    // Otherwise create brand new user profile
    const newUser: UserProfile = {
      id: `user_${provider}_${Date.now()}`,
      email: targetEmail,
      prenom: targetPrenom,
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
      bio: `Hei! Je m'appelle ${targetPrenom} et je suis ravi(e) de pratiquer le ${
        targetLang === 'français' ? 'norvégien' : 'français'
      } avec Tandem !`,
      photo_url: targetPhoto,
      a_paye: false,
      derniere_activite: new Date().toISOString(),
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

    const newAccount: UserAccount = {
      email: targetEmail,
      passwordHash: `oauth_${provider}_${Date.now()}`,
      profile: newUser,
    };

    accounts.push(newAccount);
    dataStore.saveAccounts(accounts);

    // Save as active logged-in user
    dataStore.setCurrentUser(newUser);

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

const STORAGE_KEYS = {
  CURRENT_USER: 'tandem_current_user_v4',
  PROFILES: 'tandem_profiles_v4',
  ACCOUNTS: 'tandem_accounts_v4',
  CONVERSATIONS: 'tandem_conversations_v3',
  MESSAGES: 'tandem_messages_v3',
  MAPBOX_TOKEN: 'tandem_mapbox_token_v3',
  EXPLICIT_LOGIN: 'tandem_user_logged_in_v4',
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
  a_paye: false,
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
      // If old profiles cache had more than 2 profiles or missing is_factice marker, overwrite with the 2 dummy profiles
      if (!Array.isArray(parsed) || parsed.length > 2 || !parsed.some((p) => p.is_factice)) {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
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
        },
      },
    ];
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(defaultAccounts));
  }
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
      // update in profiles list if exists
      const profiles = this.getProfiles();
      const idx = profiles.findIndex((p) => p.id === user.id);
      if (idx >= 0) {
        profiles[idx] = user;
        this.saveProfiles(profiles);
      }
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

  registerAccount(params: {
    email: string;
    password: string;
    prenom: string;
    langue_maternelle: 'français' | 'norvégien';
    quartier?: string;
  }): { success: boolean; user?: UserProfile; error?: string } {
    const accounts = this.getAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === params.email.trim().toLowerCase());
    if (existing) {
      return { success: false, error: 'Un compte existe déjà avec cette adresse email.' };
    }

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
      a_paye: false,
      derniere_activite: new Date().toISOString(),
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

    // Also add to public profiles list
    const profiles = this.getProfiles();
    profiles.unshift(newProfile);
    this.saveProfiles(profiles);

    // Set as current logged-in user
    this.setCurrentUser(newProfile);

    return { success: true, user: newProfile };
  },

  loginAccount(email: string, password: string): { success: boolean; user?: UserProfile; error?: string; notFound?: boolean } {
    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    if (!account) {
      return {
        success: false,
        notFound: true,
        error: 'Aucun compte trouvé avec cet email. Vous pouvez le créer directement en 1 clic.',
      };
    }

    if (account.passwordHash && account.passwordHash !== password) {
      return { success: false, error: 'Mot de passe incorrect.' };
    }

    // Refresh profile in case a_paye or details updated
    const profiles = this.getProfiles();
    const currentProfile = profiles.find((p) => p.id === account.profile.id) || account.profile;
    currentProfile.derniere_activite = new Date().toISOString();

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

  getConversations(): Conversation[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    const convs: Conversation[] = raw ? JSON.parse(raw) : INITIAL_CONVERSATIONS;
    const current = this.getCurrentUser();
    const profiles = this.getProfiles();

    // Populate other_user for each conversation
    return convs.map((c) => {
      const otherId = c.participant_ids.find((id) => id !== (current?.id || 'current_user')) || c.participant_ids[1];
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

  getMessages(conversationId: string): Message[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    const map = raw ? JSON.parse(raw) : INITIAL_MESSAGES;
    return map[conversationId] || [];
  },

  sendMessage(conversationId: string, content: string, senderId: string): Message {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    const map = raw ? JSON.parse(raw) : { ...INITIAL_MESSAGES };
    const list = map[conversationId] || [];

    const newMsg: Message = {
      id: 'msg_' + Date.now(),
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      created_at: new Date().toISOString(),
    };

    list.push(newMsg);
    map[conversationId] = list;
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(map));

    // Update conversation last message & timestamp
    const convs = this.getConversations();
    const cIdx = convs.findIndex((c) => c.id === conversationId);
    if (cIdx >= 0) {
      convs[cIdx].last_message = newMsg;
      convs[cIdx].updated_at = newMsg.created_at;
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(convs));
    }

    return newMsg;
  },

  startConversation(partnerId: string): string {
    const current = this.getCurrentUser();
    const currentId = current?.id || 'current_user';
    const convs = this.getConversations();

    // Check if exists
    const existing = convs.find(
      (c) =>
        (c.participant_ids[0] === currentId && c.participant_ids[1] === partnerId) ||
        (c.participant_ids[1] === currentId && c.participant_ids[0] === partnerId)
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
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(convs));
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

  resetToDefault() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.PROFILES);
    localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    initStorage();
  },
};
