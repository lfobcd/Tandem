import { UserProfile, Conversation } from '../types';

export const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'user_astrid',
    email: 'astrid.solberg@example.no',
    prenom: 'Astrid',
    is_factice: true,
    langue_maternelle: 'norvégien',
    langue_apprise: 'français',
    langues_secondaires: ['anglais'],
    langues_apprises_autres: ['espagnol'],
    niveau: 'B1',
    quartier: 'Grünerløkka, Oslo',
    bio: '⚠️ Profil factice de démonstration. Hei! J\'ai étudié l\'histoire de l\'art à Oslo et je prépare un séjour à Lyon. J\'adore discuter de cinéma, d\'architecture et de culture autour d\'un bon café filtre.',
    envies: 'Conversation informelle détendue, enrichir mon vocabulaire quotidien et corriger les petites fautes naturelles.',
    photo_url: '/images/portrait_norwegian_woman_1790239297890.jpg',
    a_paye: false,
    derniere_activite: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
    disponibilites: [
      { day: 'mardi', slots: ['soir'] },
      { day: 'jeudi', slots: ['soir'] },
      { day: 'samedi', slots: ['matin', 'apres-midi'] },
    ],
    lieux_preferes: [
      {
        id: 'place_astrid_1',
        label: 'Café Fuglen (Sentrum)',
        latitude: 59.9171,
        longitude: 10.7402,
        address: 'Universitetsgata 2, 0164 Oslo',
        type: 'cafe',
      },
      {
        id: 'place_astrid_2',
        label: 'Deichman Bjørvika (Bibliothèque)',
        latitude: 59.9084,
        longitude: 10.7533,
        address: 'Anne-Cath, Vestlys plass 1, 0150 Oslo',
        type: 'library',
      },
      {
        id: 'place_astrid_3',
        label: 'Tim Wendelboe (Grünerløkka)',
        latitude: 59.9235,
        longitude: 10.7574,
        address: 'Grüners gate 1, 0552 Oslo',
        type: 'cafe',
      },
    ],
  },
  {
    id: 'user_julien',
    email: 'julien.moreau@example.fr',
    prenom: 'Julien',
    is_factice: true,
    langue_maternelle: 'français',
    langue_apprise: 'norvégien',
    langues_secondaires: ['anglais'],
    langues_apprises_autres: ['allemand'],
    niveau: 'A2',
    quartier: 'Majorstuen, Oslo',
    bio: '⚠️ Profil factice de démonstration. Bonjour ! Installé à Oslo depuis 9 mois pour travailler dans la tech. Je commence à comprendre les bases du norsk et je cherche un binôme sympa pour progresser.',
    envies: 'Pratiquer le norsk parlé du quotidien (au supermarché, au travail, ski de fond) en échange de français natif.',
    photo_url: '/images/portrait_french_man_1790239308331.jpg',
    a_paye: true,
    derniere_activite: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 min ago
    disponibilites: [
      { day: 'lundi', slots: ['soir'] },
      { day: 'mercredi', slots: ['soir'] },
      { day: 'dimanche', slots: ['apres-midi'] },
    ],
    lieux_preferes: [
      {
        id: 'place_julien_1',
        label: 'Kaffebrenneriet Frogner plass',
        latitude: 59.9213,
        longitude: 10.7071,
        address: 'Frognerveien 62, 0266 Oslo',
        type: 'cafe',
      },
      {
        id: 'place_julien_2',
        label: 'Parc Vigeland (Entrée principale)',
        latitude: 59.9242,
        longitude: 10.7049,
        address: 'Nobels gate 32, 0268 Oslo',
        type: 'park',
      },
    ],
  },
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_astrid_julien',
    participant_ids: ['current_user', 'user_astrid'],
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    last_message: {
      id: 'msg_2',
      conversation_id: 'conv_astrid_julien',
      sender_id: 'user_astrid',
      content: 'Hei! Oui avec grand plaisir pour Café Fuglen jeudi à 17h30. Vi snakkes!',
      created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
  },
];

export const INITIAL_MESSAGES = [
  {
    id: 'msg_1',
    conversation_id: 'conv_astrid_julien',
    sender_id: 'current_user',
    content: 'Bonjour Astrid ! J\'ai vu que tu allais souvent au Fuglen Sentrum, serais-tu partante pour un premier café tandem cette semaine ?',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg_2',
    conversation_id: 'conv_astrid_julien',
    sender_id: 'user_astrid',
    content: 'Hei! Oui avec grand plaisir pour Café Fuglen jeudi à 17h30. Vi snakkes!',
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
];
