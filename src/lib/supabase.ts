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
  async signInWithOAuth(provider: 'google' | 'facebook' | 'apple'): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
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
        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        console.warn(`Supabase ${provider} OAuth error:`, err);
        return { success: false, error: err.message || `Erreur OAuth ${provider}` };
      }
    }

    // Fallback simulation when no live credentials are provided or in preview environment
    await new Promise((r) => setTimeout(r, 650));
    const providerNames: Record<string, string> = {
      google: 'Alexandre G.',
      apple: 'Camille A.',
      facebook: 'Henrik F.',
    };
    const providerAvatars: Record<string, string> = {
      google: '/images/portrait_french_man_1790239308331.jpg',
      apple: '/images/portrait_norwegian_woman_1790239297890.jpg',
      facebook: '',
    };

    const simulatedUser: UserProfile = {
      id: `sb_${provider}_${Date.now()}`,
      email: `${provider}.user@tandem.oslo`,
      prenom: providerNames[provider],
      langue_maternelle: 'français',
      langue_apprise: 'norvégien',
      niveau: 'B1',
      quartier: 'Sentrum, Oslo',
      disponibilites: [
        { day: 'mardi', slots: ['soir'] },
        { day: 'jeudi', slots: ['soir'] },
        { day: 'samedi', slots: ['matin'] },
      ],
      envies: 'Uformelle samtaler over en kaffe og kulturutveksling.',
      bio: `Connecté(e) avec Supabase Auth (${provider.toUpperCase()}). Prêt(e) à échanger en français et en norsk !`,
      photo_url: providerAvatars[provider],
      a_paye: false,
      derniere_activite: new Date().toISOString(),
      lieux_preferes: [
        {
          id: 'place_fuglen_oauth',
          label: 'Café Fuglen (Sentrum)',
          latitude: 59.9171,
          longitude: 10.7402,
          address: 'Universitetsgata 2, Oslo',
          type: 'cafe',
        },
      ],
    };

    dataStore.setCurrentUser(simulatedUser);
    return { success: true, user: simulatedUser };
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

const STORAGE_KEYS = {
  CURRENT_USER: 'tandem_current_user_v3',
  PROFILES: 'tandem_profiles_v3',
  CONVERSATIONS: 'tandem_conversations_v3',
  MESSAGES: 'tandem_messages_v3',
  MAPBOX_TOKEN: 'tandem_mapbox_token_v3',
};

// Default current user session (starts logged in as a French learner in Oslo, or can be logged out)
export const DEFAULT_CURRENT_USER: UserProfile = {
  id: 'current_user',
  email: 'moi@tandem.org',
  prenom: 'Thomas',
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
  if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEFAULT_CURRENT_USER));
  }
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
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setCurrentUser(user: UserProfile | null) {
    if (user) {
      user.derniere_activite = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      // update in profiles list if exists
      const profiles = this.getProfiles();
      const idx = profiles.findIndex((p) => p.id === user.id);
      if (idx >= 0) {
        profiles[idx] = user;
        this.saveProfiles(profiles);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
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
    return updated;
  },

  markUserPaid(): UserProfile {
    return this.updateCurrentUser({ a_paye: true });
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
