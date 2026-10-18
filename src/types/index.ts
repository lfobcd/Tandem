export type Language =
  | 'français'
  | 'norvégien'
  | 'anglais'
  | 'espagnol'
  | 'allemand'
  | 'italien'
  | 'portugais'
  | 'suédois'
  | 'danois'
  | string;

export interface AvailableLanguage {
  id: string;
  code: string;
  labelFr: string;
  labelNo: string;
  flag: string;
  isPrimary?: boolean;
  phase: 1 | 2; // Phase 1 = Franco-Norvégien au lancement ; Phase 2 = Autres langues prévues
}

export const SUPPORTED_LANGUAGES: AvailableLanguage[] = [
  // Cœur de l'application (Phase 1)
  { id: 'français', code: 'fr', labelFr: 'Français', labelNo: 'Fransk', flag: '🇫🇷', isPrimary: true, phase: 1 },
  { id: 'norvégien', code: 'no', labelFr: 'Norsk (Norvégien)', labelNo: 'Norsk', flag: '🇳🇴', isPrimary: true, phase: 1 },
  
  // Extension multilingue (Phase 2 - Prévu et activable)
  { id: 'anglais', code: 'en', labelFr: 'Anglais', labelNo: 'Engelsk', flag: '🇬🇧', isPrimary: false, phase: 2 },
  { id: 'espagnol', code: 'es', labelFr: 'Espagnol', labelNo: 'Spansk', flag: '🇪🇸', isPrimary: false, phase: 2 },
  { id: 'allemand', code: 'de', labelFr: 'Allemand', labelNo: 'Tysk', flag: '🇩🇪', isPrimary: false, phase: 2 },
  { id: 'italien', code: 'it', labelFr: 'Italien', labelNo: 'Italiensk', flag: '🇮🇹', isPrimary: false, phase: 2 },
  { id: 'suédois', code: 'sv', labelFr: 'Suédois', labelNo: 'Svensk', flag: '🇸🇪', isPrimary: false, phase: 2 },
  { id: 'danois', code: 'da', labelFr: 'Danois', labelNo: 'Dansk', flag: '🇩🇰', isPrimary: false, phase: 2 },
  { id: 'portugais', code: 'pt', labelFr: 'Portugais', labelNo: 'Portugisisk', flag: '🇵🇹', isPrimary: false, phase: 2 },
];

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface PreferredPlace {
  id: string;
  profile_id?: string;
  label: string;
  latitude: number;
  longitude: number;
  address?: string;
  type?: 'cafe' | 'library' | 'park' | 'cultural' | 'other';
}

export type DayOfWeek = 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi' | 'dimanche';
export type TimeSlot = 'matin' | 'apres-midi' | 'soir';

export interface AvailabilitySlot {
  day: DayOfWeek;
  slots: TimeSlot[];
}

export interface UserProfile {
  id: string;
  email?: string;
  prenom: string;
  is_factice?: boolean;
  langue_maternelle: Language;
  langue_apprise: Language;
  langues_secondaires?: Language[];
  langues_apprises_autres?: Language[];
  niveau: CEFRLevel;
  quartier: string;
  disponibilites: AvailabilitySlot[];
  envies: string;
  bio: string;
  photo_url: string;
  a_paye: boolean;
  is_completed?: boolean;
  vipps_status?: 'none' | 'pending' | 'approved' | 'rejected';
  vipps_phone?: string;
  vipps_requested_at?: string;
  vipps_approved_at?: string;
  is_admin?: boolean;
  derniere_activite: string; // ISO string
  lieux_preferes?: PreferredPlace[];
  created_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_ids: [string, string];
  other_user?: UserProfile;
  last_message?: Message;
  updated_at: string;
}

export type PageView = 'landing' | 'auth' | 'profile-create' | 'discovery' | 'messages' | 'settings' | 'admin';
