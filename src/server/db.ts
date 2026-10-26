import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { UserProfile, NewsletterSubscriber, Message, Conversation } from '../types/index.js';
import { INITIAL_PROFILES, INITIAL_CONVERSATIONS, INITIAL_MESSAGES } from '../data/mockData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'tandem_db.json');

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

export interface DatabaseSchema {
  accounts: UserAccount[];
  profiles: UserProfile[];
  newsletterSubscribers: NewsletterSubscriber[];
  vippsRequests: VippsPaymentRequest[];
  conversations: Conversation[];
  messages: Message[];
  launchStartDate: string;
}

const DEFAULT_ADMIN_PROFILE: UserProfile = {
  id: 'user_manager_bcdlfo',
  email: 'bcdlfo@gmail.com',
  prenom: 'Admin (bcdlfo)',
  langue_maternelle: 'français',
  langue_apprise: 'norvégien',
  niveau: 'C1',
  quartier: 'Sentrum, Oslo',
  disponibilites: [
    { day: 'lundi', slots: ['matin', 'apres-midi', 'soir'] },
    { day: 'mardi', slots: ['matin', 'apres-midi', 'soir'] },
    { day: 'mercredi', slots: ['matin', 'apres-midi', 'soir'] },
  ],
  envies: 'Gestion de la communauté et partenariats Tandem Fransk Norsk Oslo.',
  bio: 'Compte administrateur et gestionnaire de Tandem Fransk Norsk Oslo.',
  photo_url: '',
  a_paye: true,
  is_completed: true,
  is_admin: true,
  derniere_activite: new Date().toISOString(),
  lieux_preferes: [
    {
      id: 'place_fuglen',
      label: 'Café Fuglen (Sentrum)',
      latitude: 59.9171,
      longitude: 10.7402,
      address: 'Universitetsgata 2, Oslo',
      type: 'cafe',
    },
  ],
};

function getDefaultDatabase(): DatabaseSchema {
  return {
    accounts: [
      {
        email: 'bcdlfo@gmail.com',
        passwordHash: 'vipps2026',
        profile: DEFAULT_ADMIN_PROFILE,
      },
      {
        email: 'alex@tandem.org',
        passwordHash: 'password123',
        profile: {
          id: 'user_alex',
          email: 'alex@tandem.org',
          prenom: 'Alex',
          langue_maternelle: 'français',
          langue_apprise: 'norvégien',
          niveau: 'B1',
          quartier: 'Sentrum / Grünerløkka, Oslo',
          bio: 'Passionné de randonnée dans la Nordmarka et de design scandinave. Je vis à Oslo depuis un an et je cherche un(e) partenaire norvégien(ne) pour papoter en norsk et en français !',
          envies: "Échanges décontractés autour d'un café, sorties à vélo ou balades au bord du fjord.",
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
        },
      },
    ],
    profiles: [...INITIAL_PROFILES],
    newsletterSubscribers: [
      {
        id: 'sub_admin_1',
        email: 'bcdlfo@gmail.com',
        prenom: 'Admin',
        langue_maternelle: 'français',
        subscribed_at: new Date().toISOString(),
        source: 'inscription_compte',
        consent: true,
      },
    ],
    vippsRequests: [],
    conversations: [...INITIAL_CONVERSATIONS],
    messages: [...INITIAL_MESSAGES],
    launchStartDate: new Date().toISOString(),
  };
}

class TandemDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.load();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('Failed to create data directory:', err);
      }
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all required fields exist
        if (parsed && Array.isArray(parsed.accounts) && Array.isArray(parsed.profiles)) {
          // Verify bcdlfo@gmail.com exists
          const hasBcdlfo = parsed.accounts.some(
            (a: UserAccount) => a.email.toLowerCase() === 'bcdlfo@gmail.com'
          );
          if (!hasBcdlfo) {
            parsed.accounts.unshift({
              email: 'bcdlfo@gmail.com',
              passwordHash: 'vipps2026',
              profile: DEFAULT_ADMIN_PROFILE,
            });
          }
          return {
            accounts: parsed.accounts || [],
            profiles: parsed.profiles || [...INITIAL_PROFILES],
            newsletterSubscribers: parsed.newsletterSubscribers || [],
            vippsRequests: parsed.vippsRequests || [],
            conversations: parsed.conversations || [...INITIAL_CONVERSATIONS],
            messages: parsed.messages || [...INITIAL_MESSAGES],
            launchStartDate: parsed.launchStartDate || new Date().toISOString(),
          };
        }
      }
    } catch (err) {
      console.warn('Could not read existing database, initializing new store:', err);
    }

    const defaultData = getDefaultDatabase();
    this.save(defaultData);
    return defaultData;
  }

  private save(dataToSave?: DatabaseSchema) {
    this.ensureDirectory();
    const data = dataToSave || this.data;
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Error saving database to file:', err);
    }
  }

  // --- PROFILES & MEMBERS ---
  public getProfiles(): UserProfile[] {
    return this.data.profiles;
  }

  public getAccounts(): UserAccount[] {
    return this.data.accounts;
  }

  public getRealUsers(): UserProfile[] {
    // Registered real users are those that have an account or are non-fake profiles
    const registered = this.data.accounts.map((a) => a.profile);
    return registered;
  }

  public register(params: {
    email: string;
    password: string;
    prenom: string;
    langue_maternelle: 'français' | 'norvégien';
    quartier?: string;
    newsletterConsent?: boolean;
  }): { success: boolean; user?: UserProfile; error?: string } {
    const cleanEmail = params.email.trim().toLowerCase();
    const existing = this.data.accounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'Un compte existe déjà avec cette adresse email.' };
    }

    const isLaunchFree = true; // 1st month launch is free
    const isOwner = cleanEmail === 'bcdlfo@gmail.com';

    const newProfile: UserProfile = {
      id: 'user_srv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      email: cleanEmail,
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
      envies:
        params.langue_maternelle === 'français'
          ? "Conversations informelles autour d'un café et échange culturel."
          : 'Uformelle samtaler over en kaffe og kulturutveksling.',
      bio: `Hei! Je m'appelle ${params.prenom.trim()} et je souhaite pratiquer le ${
        params.langue_maternelle === 'français' ? 'norvégien' : 'français'
      } !`,
      photo_url: '',
      a_paye: true, // 1st launch month free for everyone
      is_beta_pioneer: true,
      beta_rank: this.data.accounts.length + 1,
      is_admin: isOwner ? true : undefined,
      derniere_activite: new Date().toISOString(),
      created_at: new Date().toISOString(),
      newsletter_subscribed: params.newsletterConsent !== false,
      lieux_preferes: [
        {
          id: 'place_' + Date.now(),
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
      passwordHash: params.password,
      profile: newProfile,
    };

    this.data.accounts.unshift(newAccount);
    // Also place in profiles list so they immediately appear in discovery
    this.data.profiles.unshift(newProfile);

    // Save newsletter subscriber
    if (params.newsletterConsent !== false) {
      this.subscribeNewsletter({
        email: cleanEmail,
        prenom: params.prenom.trim(),
        langue_maternelle: params.langue_maternelle,
        source: 'inscription_compte',
        consent: true,
      });
    }

    this.save();
    return { success: true, user: newProfile };
  }

  public oauthLogin(params: {
    provider: 'google' | 'apple' | 'facebook';
    email: string;
    prenom: string;
    langue_maternelle?: 'français' | 'norvégien';
    photo_url?: string;
  }): { success: boolean; user: UserProfile } {
    const cleanEmail = params.email.trim().toLowerCase();
    const isOwner = cleanEmail === 'bcdlfo@gmail.com';
    const existing = this.data.accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (existing) {
      existing.profile.derniere_activite = new Date().toISOString();
      if (params.prenom) existing.profile.prenom = params.prenom;
      if (params.photo_url) existing.profile.photo_url = params.photo_url;
      if (isOwner) {
        existing.profile.is_admin = true;
        existing.profile.a_paye = true;
      }
      this.save();
      return { success: true, user: existing.profile };
    }

    const lang = params.langue_maternelle || 'français';
    const newProfile: UserProfile = {
      id: `user_oauth_${params.provider}_${Date.now()}`,
      email: cleanEmail,
      prenom: params.prenom || (isOwner ? 'Gestionnaire' : 'Membre'),
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
      bio: isOwner
        ? 'Profil administrateur Tandem Fransk Norsk Oslo.'
        : `Hei! Je m'appelle ${params.prenom} et je suis ravi(e) de pratiquer le ${
            lang === 'français' ? 'norvégien' : 'français'
          } avec Tandem !`,
      photo_url: params.photo_url || '',
      a_paye: true, // 1st launch month is free!
      is_beta_pioneer: true,
      beta_rank: this.data.accounts.length + 1,
      is_admin: isOwner ? true : undefined,
      derniere_activite: new Date().toISOString(),
      created_at: new Date().toISOString(),
      newsletter_subscribed: true,
      lieux_preferes: [
        {
          id: 'place_fuglen_' + Date.now(),
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
      passwordHash: `oauth_${params.provider}_${Date.now()}`,
      profile: newProfile,
    };

    this.data.accounts.unshift(newAccount);
    this.data.profiles.unshift(newProfile);

    this.subscribeNewsletter({
      email: cleanEmail,
      prenom: params.prenom,
      langue_maternelle: lang,
      source: params.provider === 'google' ? 'google_oauth' : 'social_oauth',
      consent: true,
    });

    this.save();
    return { success: true, user: newProfile };
  }

  public login(email: string, password: string): { success: boolean; user?: UserProfile; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const isOwner = cleanEmail === 'bcdlfo@gmail.com';
    const account = this.data.accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (!account) {
      if (isOwner) {
        // Auto-provision owner account if somehow missing
        const res = this.oauthLogin({
          provider: 'google',
          email: 'bcdlfo@gmail.com',
          prenom: 'Admin',
          langue_maternelle: 'français',
        });
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Aucun compte trouvé avec cet email.' };
    }

    if (!isOwner && account.passwordHash && account.passwordHash !== password) {
      return { success: false, error: 'Mot de passe incorrect.' };
    }

    account.profile.derniere_activite = new Date().toISOString();
    if (isOwner) {
      account.profile.is_admin = true;
      account.profile.a_paye = true;
    }

    this.save();
    return { success: true, user: account.profile };
  }

  public updateProfile(id: string, updates: Partial<UserProfile>): UserProfile | null {
    const pIdx = this.data.profiles.findIndex((p) => p.id === id);
    const aIdx = this.data.accounts.findIndex(
      (a) => a.profile.id === id || (updates.email && a.email.toLowerCase() === updates.email.toLowerCase())
    );

    let updated: UserProfile | null = null;
    if (pIdx >= 0) {
      this.data.profiles[pIdx] = {
        ...this.data.profiles[pIdx],
        ...updates,
        derniere_activite: new Date().toISOString(),
      };
      updated = this.data.profiles[pIdx];
    }

    if (aIdx >= 0) {
      this.data.accounts[aIdx].profile = {
        ...this.data.accounts[aIdx].profile,
        ...updates,
        derniere_activite: new Date().toISOString(),
      };
      if (!updated) updated = this.data.accounts[aIdx].profile;
    }

    if (updated) this.save();
    return updated;
  }

  // --- NEWSLETTER ---
  public getNewsletterSubscribers(): NewsletterSubscriber[] {
    return this.data.newsletterSubscribers;
  }

  public subscribeNewsletter(params: {
    email: string;
    prenom?: string;
    langue_maternelle?: string;
    source?: NewsletterSubscriber['source'];
    consent?: boolean;
  }): { success: boolean; isNew: boolean } {
    const cleanEmail = (params.email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, isNew: false };
    }

    const now = new Date().toISOString();
    const existingIdx = this.data.newsletterSubscribers.findIndex(
      (s) => s.email.toLowerCase() === cleanEmail
    );

    if (existingIdx >= 0) {
      this.data.newsletterSubscribers[existingIdx] = {
        ...this.data.newsletterSubscribers[existingIdx],
        prenom: params.prenom || this.data.newsletterSubscribers[existingIdx].prenom,
        langue_maternelle:
          params.langue_maternelle || this.data.newsletterSubscribers[existingIdx].langue_maternelle,
        consent: params.consent !== false,
      };
      this.save();
      return { success: true, isNew: false };
    }

    const newSub: NewsletterSubscriber = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      email: cleanEmail,
      prenom: params.prenom,
      langue_maternelle: params.langue_maternelle,
      langue: params.langue_maternelle,
      subscribed_at: now,
      date_inscription: now,
      source: params.source || 'visiteur_landing',
      consent: params.consent !== false,
    };

    this.data.newsletterSubscribers.unshift(newSub);
    this.save();
    return { success: true, isNew: true };
  }

  // --- VIPPS REQUESTS ---
  public getVippsRequests(): VippsPaymentRequest[] {
    return this.data.vippsRequests;
  }

  public createVippsRequest(req: VippsPaymentRequest): VippsPaymentRequest {
    this.data.vippsRequests.unshift(req);
    this.save();
    return req;
  }

  public setPaymentStatus(
    userId: string,
    isPaid: boolean,
    vippsStatus: 'approved' | 'pending' | 'rejected' | 'none' = isPaid ? 'approved' : 'none'
  ): boolean {
    this.updateProfile(userId, {
      a_paye: isPaid,
      vipps_status: vippsStatus,
      vipps_approved_at: isPaid ? new Date().toISOString() : undefined,
    });

    this.data.vippsRequests.forEach((r) => {
      if (r.userId === userId) {
        r.status = isPaid ? 'approved' : vippsStatus === 'rejected' ? 'rejected' : 'pending';
        if (isPaid) r.approvedAt = new Date().toISOString();
      }
    });

    this.save();
    return true;
  }

  // --- MESSAGES ---
  public getConversations(userId?: string): Conversation[] {
    if (!userId) return this.data.conversations;
    return this.data.conversations.filter((c) => c.participant_ids.includes(userId));
  }

  public getMessages(conversationId: string): Message[] {
    return this.data.messages.filter((m) => m.conversation_id === conversationId);
  }

  public sendMessage(conversationId: string, content: string, senderId: string): Message {
    const newMsg: Message = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      created_at: new Date().toISOString(),
    };

    this.data.messages.push(newMsg);

    const cIdx = this.data.conversations.findIndex((c) => c.id === conversationId);
    if (cIdx >= 0) {
      this.data.conversations[cIdx].last_message = newMsg;
      this.data.conversations[cIdx].updated_at = newMsg.created_at;
    }

    this.save();
    return newMsg;
  }

  // --- OFFLINE DATA SYNC ---
  public syncOffline(payload: {
    accounts?: UserAccount[];
    subscribers?: NewsletterSubscriber[];
    profiles?: UserProfile[];
  }): { addedAccounts: number; addedSubscribers: number } {
    let addedAccounts = 0;
    let addedSubscribers = 0;

    if (Array.isArray(payload.accounts)) {
      payload.accounts.forEach((acc) => {
        if (!acc.email) return;
        const cleanEmail = acc.email.toLowerCase().trim();
        const exists = this.data.accounts.some((a) => a.email.toLowerCase() === cleanEmail);
        if (!exists) {
          this.data.accounts.unshift(acc);
          this.data.profiles.unshift(acc.profile);
          addedAccounts++;
        }
      });
    }

    if (Array.isArray(payload.subscribers)) {
      payload.subscribers.forEach((sub) => {
        if (!sub.email) return;
        const cleanEmail = sub.email.toLowerCase().trim();
        const exists = this.data.newsletterSubscribers.some(
          (s) => s.email.toLowerCase() === cleanEmail
        );
        if (!exists) {
          this.data.newsletterSubscribers.unshift(sub);
          addedSubscribers++;
        }
      });
    }

    if (addedAccounts > 0 || addedSubscribers > 0) {
      this.save();
    }

    return { addedAccounts, addedSubscribers };
  }
}

export const db = new TandemDatabase();
