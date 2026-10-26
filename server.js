// server.ts
import express from "express";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer } from "vite";

// src/server/db.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// src/data/mockData.ts
var INITIAL_PROFILES = [
  {
    id: "user_astrid",
    email: "astrid.solberg@example.no",
    prenom: "Astrid",
    is_factice: true,
    langue_maternelle: "norv\xE9gien",
    langue_apprise: "fran\xE7ais",
    langues_secondaires: ["anglais"],
    langues_apprises_autres: ["espagnol"],
    niveau: "B1",
    quartier: "Gr\xFCnerl\xF8kka, Oslo",
    bio: "\u26A0\uFE0F Profil factice de d\xE9monstration. Hei! J'ai \xE9tudi\xE9 l'histoire de l'art \xE0 Oslo et je pr\xE9pare un s\xE9jour \xE0 Lyon. J'adore discuter de cin\xE9ma, d'architecture et de culture autour d'un bon caf\xE9 filtre.",
    envies: "Conversation informelle d\xE9tendue, enrichir mon vocabulaire quotidien et corriger les petites fautes naturelles.",
    photo_url: "/images/portrait_norwegian_woman_1790239297890.jpg",
    a_paye: false,
    derniere_activite: new Date(Date.now() - 5 * 60 * 1e3).toISOString(),
    // 5 min ago
    disponibilites: [
      { day: "mardi", slots: ["soir"] },
      { day: "jeudi", slots: ["soir"] },
      { day: "samedi", slots: ["matin", "apres-midi"] }
    ],
    lieux_preferes: [
      {
        id: "place_astrid_1",
        label: "Caf\xE9 Fuglen (Sentrum)",
        latitude: 59.9171,
        longitude: 10.7402,
        address: "Universitetsgata 2, 0164 Oslo",
        type: "cafe"
      },
      {
        id: "place_astrid_2",
        label: "Deichman Bj\xF8rvika (Biblioth\xE8que)",
        latitude: 59.9084,
        longitude: 10.7533,
        address: "Anne-Cath, Vestlys plass 1, 0150 Oslo",
        type: "library"
      },
      {
        id: "place_astrid_3",
        label: "Tim Wendelboe (Gr\xFCnerl\xF8kka)",
        latitude: 59.9235,
        longitude: 10.7574,
        address: "Gr\xFCners gate 1, 0552 Oslo",
        type: "cafe"
      }
    ]
  },
  {
    id: "user_julien",
    email: "julien.moreau@example.fr",
    prenom: "Julien",
    is_factice: true,
    langue_maternelle: "fran\xE7ais",
    langue_apprise: "norv\xE9gien",
    langues_secondaires: ["anglais"],
    langues_apprises_autres: ["allemand"],
    niveau: "A2",
    quartier: "Majorstuen, Oslo",
    bio: "\u26A0\uFE0F Profil factice de d\xE9monstration. Bonjour ! Install\xE9 \xE0 Oslo depuis 9 mois pour travailler dans la tech. Je commence \xE0 comprendre les bases du norsk et je cherche un bin\xF4me sympa pour progresser.",
    envies: "Pratiquer le norsk parl\xE9 du quotidien (au supermarch\xE9, au travail, ski de fond) en \xE9change de fran\xE7ais natif.",
    photo_url: "/images/portrait_french_man_1790239308331.jpg",
    a_paye: true,
    derniere_activite: new Date(Date.now() - 35 * 60 * 1e3).toISOString(),
    // 35 min ago
    disponibilites: [
      { day: "lundi", slots: ["soir"] },
      { day: "mercredi", slots: ["soir"] },
      { day: "dimanche", slots: ["apres-midi"] }
    ],
    lieux_preferes: [
      {
        id: "place_julien_1",
        label: "Kaffebrenneriet Frogner plass",
        latitude: 59.9213,
        longitude: 10.7071,
        address: "Frognerveien 62, 0266 Oslo",
        type: "cafe"
      },
      {
        id: "place_julien_2",
        label: "Parc Vigeland (Entr\xE9e principale)",
        latitude: 59.9242,
        longitude: 10.7049,
        address: "Nobels gate 32, 0268 Oslo",
        type: "park"
      }
    ]
  },
  {
    id: "user_mathilde",
    email: "mathilde.laurent@example.fr",
    prenom: "Mathilde",
    is_factice: true,
    langue_maternelle: "fran\xE7ais",
    langue_apprise: "norv\xE9gien",
    langues_secondaires: ["anglais"],
    langues_apprises_autres: ["italien"],
    niveau: "B1",
    quartier: "St. Hanshaugen, Oslo",
    bio: "Hei alle sammen ! Install\xE9e \xE0 Oslo depuis un an, architecte d'int\xE9rieur. J'adore explorer les friperies, courir \xE0 St. Hanshaugen et d\xE9couvrir de nouvelles adresses de caf\xE9. Je cherche un bin\xF4me norv\xE9gien pour converser r\xE9guli\xE8rement.",
    envies: "\xC9changer en toute d\xE9contraction, enrichir le vocabulaire du design et de la vie quotidienne.",
    photo_url: "",
    a_paye: true,
    derniere_activite: new Date(Date.now() - 15 * 60 * 1e3).toISOString(),
    // 15 min ago
    disponibilites: [
      { day: "mardi", slots: ["soir"] },
      { day: "jeudi", slots: ["soir"] },
      { day: "samedi", slots: ["apres-midi"] }
    ],
    lieux_preferes: [
      {
        id: "place_mathilde_1",
        label: "Rouleur Bar & Caf\xE9 (St. Hanshaugen)",
        latitude: 59.9272,
        longitude: 10.7412,
        address: "Ullev\xE5lsveien 16A, 0171 Oslo",
        type: "cafe"
      },
      {
        id: "place_mathilde_2",
        label: "Deichman Bj\xF8rvika",
        latitude: 59.9084,
        longitude: 10.7533,
        address: "Anne-Cath, Vestlys plass 1, 0150 Oslo",
        type: "library"
      }
    ]
  },
  {
    id: "user_lars",
    email: "lars.dahl@example.no",
    prenom: "Lars",
    is_factice: true,
    langue_maternelle: "norv\xE9gien",
    langue_apprise: "fran\xE7ais",
    langues_secondaires: ["anglais"],
    langues_apprises_autres: [],
    niveau: "B2",
    quartier: "Frogner, Oslo",
    bio: "Hei! Journalist og litteraturinteressert bosatt p\xE5 Frogner. Jeg har bodd et semester i Paris og vil gjerne vedlikeholde fransken min med hyggelige samtaler over en god kopp kaffe.",
    envies: "Snakke om b\xF8ker, samfunn, musikk og fransk kultur i bytte mot norsk dagligtale og grammatikkhjelp.",
    photo_url: "/images/portrait_norwegian_student_1790239320759.jpg",
    a_paye: true,
    derniere_activite: new Date(Date.now() - 50 * 60 * 1e3).toISOString(),
    disponibilites: [
      { day: "mercredi", slots: ["soir"] },
      { day: "samedi", slots: ["matin"] },
      { day: "dimanche", slots: ["apres-midi"] }
    ],
    lieux_preferes: [
      {
        id: "place_lars_1",
        label: "Pascal Konditori (Tollbugata)",
        latitude: 59.9114,
        longitude: 10.7431,
        address: "Tollbugata 11, 0152 Oslo",
        type: "cafe"
      },
      {
        id: "place_lars_2",
        label: "Litteraturhuset (Majorstuen/Sentrum)",
        latitude: 59.9198,
        longitude: 10.7289,
        address: "Wergelandsveien 29, 0167 Oslo",
        type: "library"
      }
    ]
  },
  {
    id: "user_celine",
    email: "celine.girard@example.fr",
    prenom: "C\xE9line",
    is_factice: true,
    langue_maternelle: "fran\xE7ais",
    langue_apprise: "norv\xE9gien",
    langues_secondaires: ["anglais", "espagnol"],
    langues_apprises_autres: [],
    niveau: "A1",
    quartier: "Sentrum, Oslo",
    bio: "Nouvelle arrivante \xE0 Oslo pour travailler dans les \xE9nergies renouvelables ! Je d\xE9bute totalement en norv\xE9gien et je cherche un(e) partenaire patient(e) pour d\xE9buter en douceur.",
    envies: "Apprendre les expressions cl\xE9s, la prononciation du norv\xE9gien et faire de belles rencontres.",
    photo_url: "",
    a_paye: false,
    derniere_activite: new Date(Date.now() - 2 * 60 * 60 * 1e3).toISOString(),
    disponibilites: [
      { day: "mardi", slots: ["soir"] },
      { day: "mercredi", slots: ["soir"] }
    ],
    lieux_preferes: [
      {
        id: "place_celine_1",
        label: "Kulturhuset (Youngstorget)",
        latitude: 59.9149,
        longitude: 10.7493,
        address: "Youngs gate 6, 0181 Oslo",
        type: "cafe"
      }
    ]
  },
  {
    id: "user_henrik",
    email: "henrik.lie@example.no",
    prenom: "Henrik",
    is_factice: true,
    langue_maternelle: "norv\xE9gien",
    langue_apprise: "fran\xE7ais",
    langues_secondaires: ["anglais"],
    langues_apprises_autres: [],
    niveau: "B1",
    quartier: "Sagene / Torshov, Oslo",
    bio: "Hei! Frilansutvikler som elsker fransk gastronomi og friluftsliv langs Akerselva. Jeg planlegger en tur til Bordeaux i h\xF8st og vil gjerne \xF8ve p\xE5 \xE5 bestille p\xE5 restaurant og snakke om hverdagen.",
    envies: "Uformell kaf\xE9prat, tips om Frankrike og gjensidig spr\xE5kl\xE6ring.",
    photo_url: "",
    a_paye: false,
    derniere_activite: new Date(Date.now() - 4 * 60 * 60 * 1e3).toISOString(),
    disponibilites: [
      { day: "lundi", slots: ["soir"] },
      { day: "jeudi", slots: ["soir"] },
      { day: "samedi", slots: ["matin"] }
    ],
    lieux_preferes: [
      {
        id: "place_henrik_1",
        label: "Supreme Roastworks (Gr\xFCnerl\xF8kka)",
        latitude: 59.9219,
        longitude: 10.7582,
        address: "Thorvald Meyers gate 18A, 0555 Oslo",
        type: "cafe"
      }
    ]
  }
];
var INITIAL_CONVERSATIONS = [
  {
    id: "conv_astrid_julien",
    participant_ids: ["current_user", "user_astrid"],
    updated_at: new Date(Date.now() - 10 * 60 * 1e3).toISOString(),
    last_message: {
      id: "msg_2",
      conversation_id: "conv_astrid_julien",
      sender_id: "user_astrid",
      content: "Hei! Oui avec grand plaisir pour Caf\xE9 Fuglen jeudi \xE0 17h30. Vi snakkes!",
      created_at: new Date(Date.now() - 10 * 60 * 1e3).toISOString()
    }
  }
];
var INITIAL_MESSAGES = [
  {
    id: "msg_1",
    conversation_id: "conv_astrid_julien",
    sender_id: "current_user",
    content: "Bonjour Astrid ! J'ai vu que tu allais souvent au Fuglen Sentrum, serais-tu partante pour un premier caf\xE9 tandem cette semaine ?",
    created_at: new Date(Date.now() - 30 * 60 * 1e3).toISOString()
  },
  {
    id: "msg_2",
    conversation_id: "conv_astrid_julien",
    sender_id: "user_astrid",
    content: "Hei! Oui avec grand plaisir pour Caf\xE9 Fuglen jeudi \xE0 17h30. Vi snakkes!",
    created_at: new Date(Date.now() - 10 * 60 * 1e3).toISOString()
  }
];

// src/server/db.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var DATA_DIR = path.resolve(__dirname, "../../data");
var DB_FILE = path.join(DATA_DIR, "tandem_db.json");
var DEFAULT_ADMIN_PROFILE = {
  id: "user_manager_bcdlfo",
  email: "bcdlfo@gmail.com",
  prenom: "Admin (bcdlfo)",
  langue_maternelle: "fran\xE7ais",
  langue_apprise: "norv\xE9gien",
  niveau: "C1",
  quartier: "Sentrum, Oslo",
  disponibilites: [
    { day: "lundi", slots: ["matin", "apres-midi", "soir"] },
    { day: "mardi", slots: ["matin", "apres-midi", "soir"] },
    { day: "mercredi", slots: ["matin", "apres-midi", "soir"] }
  ],
  envies: "Gestion de la communaut\xE9 et partenariats Tandem Fransk Norsk Oslo.",
  bio: "Compte administrateur et gestionnaire de Tandem Fransk Norsk Oslo.",
  photo_url: "",
  a_paye: true,
  is_completed: true,
  is_admin: true,
  derniere_activite: (/* @__PURE__ */ new Date()).toISOString(),
  lieux_preferes: [
    {
      id: "place_fuglen",
      label: "Caf\xE9 Fuglen (Sentrum)",
      latitude: 59.9171,
      longitude: 10.7402,
      address: "Universitetsgata 2, Oslo",
      type: "cafe"
    }
  ]
};
function getDefaultDatabase() {
  return {
    accounts: [
      {
        email: "bcdlfo@gmail.com",
        passwordHash: "vipps2026",
        profile: DEFAULT_ADMIN_PROFILE
      },
      {
        email: "alex@tandem.org",
        passwordHash: "password123",
        profile: {
          id: "user_alex",
          email: "alex@tandem.org",
          prenom: "Alex",
          langue_maternelle: "fran\xE7ais",
          langue_apprise: "norv\xE9gien",
          niveau: "B1",
          quartier: "Sentrum / Gr\xFCnerl\xF8kka, Oslo",
          bio: "Passionn\xE9 de randonn\xE9e dans la Nordmarka et de design scandinave. Je vis \xE0 Oslo depuis un an et je cherche un(e) partenaire norv\xE9gien(ne) pour papoter en norsk et en fran\xE7ais !",
          envies: "\xC9changes d\xE9contract\xE9s autour d'un caf\xE9, sorties \xE0 v\xE9lo ou balades au bord du fjord.",
          photo_url: "",
          a_paye: true,
          is_beta_pioneer: true,
          beta_rank: 1,
          derniere_activite: (/* @__PURE__ */ new Date()).toISOString(),
          disponibilites: [
            { day: "mardi", slots: ["soir"] },
            { day: "jeudi", slots: ["soir"] },
            { day: "samedi", slots: ["matin", "apres-midi"] }
          ]
        }
      }
    ],
    profiles: [...INITIAL_PROFILES],
    newsletterSubscribers: [
      {
        id: "sub_admin_1",
        email: "bcdlfo@gmail.com",
        prenom: "Admin",
        langue_maternelle: "fran\xE7ais",
        subscribed_at: (/* @__PURE__ */ new Date()).toISOString(),
        source: "inscription_compte",
        consent: true
      }
    ],
    vippsRequests: [],
    conversations: [...INITIAL_CONVERSATIONS],
    messages: [...INITIAL_MESSAGES],
    launchStartDate: (/* @__PURE__ */ new Date()).toISOString()
  };
}
var TandemDatabase = class {
  constructor() {
    this.ensureDirectory();
    this.data = this.load();
  }
  ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error("Failed to create data directory:", err);
      }
    }
  }
  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.accounts) && Array.isArray(parsed.profiles)) {
          const hasBcdlfo = parsed.accounts.some(
            (a) => a.email.toLowerCase() === "bcdlfo@gmail.com"
          );
          if (!hasBcdlfo) {
            parsed.accounts.unshift({
              email: "bcdlfo@gmail.com",
              passwordHash: "vipps2026",
              profile: DEFAULT_ADMIN_PROFILE
            });
          }
          return {
            accounts: parsed.accounts || [],
            profiles: parsed.profiles || [...INITIAL_PROFILES],
            newsletterSubscribers: parsed.newsletterSubscribers || [],
            vippsRequests: parsed.vippsRequests || [],
            conversations: parsed.conversations || [...INITIAL_CONVERSATIONS],
            messages: parsed.messages || [...INITIAL_MESSAGES],
            launchStartDate: parsed.launchStartDate || (/* @__PURE__ */ new Date()).toISOString()
          };
        }
      }
    } catch (err) {
      console.warn("Could not read existing database, initializing new store:", err);
    }
    const defaultData = getDefaultDatabase();
    this.save(defaultData);
    return defaultData;
  }
  save(dataToSave) {
    this.ensureDirectory();
    const data = dataToSave || this.data;
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error("Error saving database to file:", err);
    }
  }
  // --- PROFILES & MEMBERS ---
  getProfiles() {
    return this.data.profiles;
  }
  getAccounts() {
    return this.data.accounts;
  }
  getRealUsers() {
    const registered = this.data.accounts.map((a) => a.profile);
    return registered;
  }
  register(params) {
    const cleanEmail = params.email.trim().toLowerCase();
    const existing = this.data.accounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: "Un compte existe d\xE9j\xE0 avec cette adresse email." };
    }
    const isLaunchFree = true;
    const isOwner = cleanEmail === "bcdlfo@gmail.com";
    const newProfile = {
      id: "user_srv_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      email: cleanEmail,
      prenom: params.prenom.trim(),
      langue_maternelle: params.langue_maternelle,
      langue_apprise: params.langue_maternelle === "fran\xE7ais" ? "norv\xE9gien" : "fran\xE7ais",
      niveau: "A2",
      quartier: params.quartier || "Sentrum, Oslo",
      disponibilites: [
        { day: "mardi", slots: ["soir"] },
        { day: "jeudi", slots: ["soir"] },
        { day: "samedi", slots: ["matin"] }
      ],
      envies: params.langue_maternelle === "fran\xE7ais" ? "Conversations informelles autour d'un caf\xE9 et \xE9change culturel." : "Uformelle samtaler over en kaffe og kulturutveksling.",
      bio: `Hei! Je m'appelle ${params.prenom.trim()} et je souhaite pratiquer le ${params.langue_maternelle === "fran\xE7ais" ? "norv\xE9gien" : "fran\xE7ais"} !`,
      photo_url: "",
      a_paye: true,
      // 1st launch month free for everyone
      is_beta_pioneer: true,
      beta_rank: this.data.accounts.length + 1,
      is_admin: isOwner ? true : void 0,
      derniere_activite: (/* @__PURE__ */ new Date()).toISOString(),
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      newsletter_subscribed: params.newsletterConsent !== false,
      lieux_preferes: [
        {
          id: "place_" + Date.now(),
          label: "Caf\xE9 Fuglen (Sentrum)",
          latitude: 59.9171,
          longitude: 10.7402,
          address: "Universitetsgata 2, Oslo",
          type: "cafe"
        }
      ]
    };
    const newAccount = {
      email: cleanEmail,
      passwordHash: params.password,
      profile: newProfile
    };
    this.data.accounts.unshift(newAccount);
    this.data.profiles.unshift(newProfile);
    if (params.newsletterConsent !== false) {
      this.subscribeNewsletter({
        email: cleanEmail,
        prenom: params.prenom.trim(),
        langue_maternelle: params.langue_maternelle,
        source: "inscription_compte",
        consent: true
      });
    }
    this.save();
    return { success: true, user: newProfile };
  }
  oauthLogin(params) {
    const cleanEmail = params.email.trim().toLowerCase();
    const isOwner = cleanEmail === "bcdlfo@gmail.com";
    const existing = this.data.accounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      existing.profile.derniere_activite = (/* @__PURE__ */ new Date()).toISOString();
      if (params.prenom) existing.profile.prenom = params.prenom;
      if (params.photo_url) existing.profile.photo_url = params.photo_url;
      if (isOwner) {
        existing.profile.is_admin = true;
        existing.profile.a_paye = true;
      }
      this.save();
      return { success: true, user: existing.profile };
    }
    const lang = params.langue_maternelle || "fran\xE7ais";
    const newProfile = {
      id: `user_oauth_${params.provider}_${Date.now()}`,
      email: cleanEmail,
      prenom: params.prenom || (isOwner ? "Gestionnaire" : "Membre"),
      langue_maternelle: lang,
      langue_apprise: lang === "fran\xE7ais" ? "norv\xE9gien" : "fran\xE7ais",
      niveau: "A2",
      quartier: "Sentrum, Oslo",
      disponibilites: [
        { day: "mardi", slots: ["soir"] },
        { day: "jeudi", slots: ["soir"] },
        { day: "samedi", slots: ["matin"] }
      ],
      envies: lang === "fran\xE7ais" ? "Conversations conviviales autour d'un caf\xE9 et d\xE9couverte d'Oslo." : "Uformelle samtaler over en kaffe og kulturutveksling.",
      bio: isOwner ? "Profil administrateur Tandem Fransk Norsk Oslo." : `Hei! Je m'appelle ${params.prenom} et je suis ravi(e) de pratiquer le ${lang === "fran\xE7ais" ? "norv\xE9gien" : "fran\xE7ais"} avec Tandem !`,
      photo_url: params.photo_url || "",
      a_paye: true,
      // 1st launch month is free!
      is_beta_pioneer: true,
      beta_rank: this.data.accounts.length + 1,
      is_admin: isOwner ? true : void 0,
      derniere_activite: (/* @__PURE__ */ new Date()).toISOString(),
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      newsletter_subscribed: true,
      lieux_preferes: [
        {
          id: "place_fuglen_" + Date.now(),
          label: "Caf\xE9 Fuglen (Sentrum)",
          latitude: 59.9171,
          longitude: 10.7402,
          address: "Universitetsgata 2, Oslo",
          type: "cafe"
        }
      ]
    };
    const newAccount = {
      email: cleanEmail,
      passwordHash: `oauth_${params.provider}_${Date.now()}`,
      profile: newProfile
    };
    this.data.accounts.unshift(newAccount);
    this.data.profiles.unshift(newProfile);
    this.subscribeNewsletter({
      email: cleanEmail,
      prenom: params.prenom,
      langue_maternelle: lang,
      source: params.provider === "google" ? "google_oauth" : "social_oauth",
      consent: true
    });
    this.save();
    return { success: true, user: newProfile };
  }
  login(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    const isOwner = cleanEmail === "bcdlfo@gmail.com";
    const account = this.data.accounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (!account) {
      if (isOwner) {
        const res = this.oauthLogin({
          provider: "google",
          email: "bcdlfo@gmail.com",
          prenom: "Admin",
          langue_maternelle: "fran\xE7ais"
        });
        return { success: true, user: res.user };
      }
      return { success: false, error: "Aucun compte trouv\xE9 avec cet email." };
    }
    if (!isOwner && account.passwordHash && account.passwordHash !== password) {
      return { success: false, error: "Mot de passe incorrect." };
    }
    account.profile.derniere_activite = (/* @__PURE__ */ new Date()).toISOString();
    if (isOwner) {
      account.profile.is_admin = true;
      account.profile.a_paye = true;
    }
    this.save();
    return { success: true, user: account.profile };
  }
  updateProfile(id, updates) {
    const pIdx = this.data.profiles.findIndex((p) => p.id === id);
    const aIdx = this.data.accounts.findIndex(
      (a) => a.profile.id === id || updates.email && a.email.toLowerCase() === updates.email.toLowerCase()
    );
    let updated = null;
    if (pIdx >= 0) {
      this.data.profiles[pIdx] = {
        ...this.data.profiles[pIdx],
        ...updates,
        derniere_activite: (/* @__PURE__ */ new Date()).toISOString()
      };
      updated = this.data.profiles[pIdx];
    }
    if (aIdx >= 0) {
      this.data.accounts[aIdx].profile = {
        ...this.data.accounts[aIdx].profile,
        ...updates,
        derniere_activite: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (!updated) updated = this.data.accounts[aIdx].profile;
    }
    if (updated) this.save();
    return updated;
  }
  // --- NEWSLETTER ---
  getNewsletterSubscribers() {
    return this.data.newsletterSubscribers;
  }
  subscribeNewsletter(params) {
    const cleanEmail = (params.email || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, isNew: false };
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const existingIdx = this.data.newsletterSubscribers.findIndex(
      (s) => s.email.toLowerCase() === cleanEmail
    );
    if (existingIdx >= 0) {
      this.data.newsletterSubscribers[existingIdx] = {
        ...this.data.newsletterSubscribers[existingIdx],
        prenom: params.prenom || this.data.newsletterSubscribers[existingIdx].prenom,
        langue_maternelle: params.langue_maternelle || this.data.newsletterSubscribers[existingIdx].langue_maternelle,
        consent: params.consent !== false
      };
      this.save();
      return { success: true, isNew: false };
    }
    const newSub = {
      id: "sub_" + Date.now() + "_" + Math.random().toString(36).substring(2, 5),
      email: cleanEmail,
      prenom: params.prenom,
      langue_maternelle: params.langue_maternelle,
      langue: params.langue_maternelle,
      subscribed_at: now,
      date_inscription: now,
      source: params.source || "visiteur_landing",
      consent: params.consent !== false
    };
    this.data.newsletterSubscribers.unshift(newSub);
    this.save();
    return { success: true, isNew: true };
  }
  // --- VIPPS REQUESTS ---
  getVippsRequests() {
    return this.data.vippsRequests;
  }
  createVippsRequest(req) {
    this.data.vippsRequests.unshift(req);
    this.save();
    return req;
  }
  setPaymentStatus(userId, isPaid, vippsStatus = isPaid ? "approved" : "none") {
    this.updateProfile(userId, {
      a_paye: isPaid,
      vipps_status: vippsStatus,
      vipps_approved_at: isPaid ? (/* @__PURE__ */ new Date()).toISOString() : void 0
    });
    this.data.vippsRequests.forEach((r) => {
      if (r.userId === userId) {
        r.status = isPaid ? "approved" : vippsStatus === "rejected" ? "rejected" : "pending";
        if (isPaid) r.approvedAt = (/* @__PURE__ */ new Date()).toISOString();
      }
    });
    this.save();
    return true;
  }
  // --- MESSAGES ---
  getConversations(userId) {
    if (!userId) return this.data.conversations;
    return this.data.conversations.filter((c) => c.participant_ids.includes(userId));
  }
  getMessages(conversationId) {
    return this.data.messages.filter((m) => m.conversation_id === conversationId);
  }
  sendMessage(conversationId, content, senderId) {
    const newMsg = {
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
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
  syncOffline(payload) {
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
};
var db = new TandemDatabase();

// server.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
function getPort() {
  const portIdx = process.argv.indexOf("--port");
  if (portIdx !== -1 && process.argv[portIdx + 1]) {
    const parsed = parseInt(process.argv[portIdx + 1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return parseInt(process.env.PORT || "3000", 10);
}
var PORT = getPort();
var isProduction = process.env.NODE_ENV === "production";
async function startServer() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (_req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });
  app.get("/api/health", (_req, res) => {
    const realUsers = db.getRealUsers();
    const subscribers = db.getNewsletterSubscribers();
    res.json({
      status: "ok",
      time: (/* @__PURE__ */ new Date()).toISOString(),
      realUsersCount: realUsers.length,
      newsletterCount: subscribers.length
    });
  });
  app.get("/api/profiles", (_req, res) => {
    const profiles = db.getProfiles();
    res.json({ success: true, profiles });
  });
  app.get("/api/accounts", (_req, res) => {
    const accounts = db.getAccounts();
    res.json({ success: true, accounts });
  });
  app.post("/api/register", (req, res) => {
    const result = db.register(req.body);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  });
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const result = db.login(email, password);
    if (!result.success) {
      res.status(401).json(result);
      return;
    }
    res.json(result);
  });
  app.post("/api/oauth-login", (req, res) => {
    const result = db.oauthLogin(req.body);
    res.json(result);
  });
  app.put("/api/profiles/:id", (req, res) => {
    const updated = db.updateProfile(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: "Profil introuvable" });
      return;
    }
    res.json({ success: true, profile: updated });
  });
  app.get("/api/admin/users", (_req, res) => {
    const accounts = db.getAccounts();
    const profiles = db.getProfiles();
    const realUsers = db.getRealUsers();
    const subscribers = db.getNewsletterSubscribers();
    const vipps = db.getVippsRequests();
    res.json({
      success: true,
      totalProfiles: profiles.length,
      realUsersCount: accounts.length,
      realUsers: accounts.map((a) => a.profile),
      subscribersCount: subscribers.length,
      subscribers,
      vippsRequests: vipps,
      profiles
    });
  });
  app.post("/api/admin/set-payment", (req, res) => {
    const { userId, isPaid, vippsStatus } = req.body;
    const ok = db.setPaymentStatus(userId, Boolean(isPaid), vippsStatus);
    res.json({ success: ok });
  });
  app.get("/api/newsletter", (_req, res) => {
    const subscribers = db.getNewsletterSubscribers();
    res.json({ success: true, subscribers });
  });
  app.post("/api/newsletter/subscribe", (req, res) => {
    const result = db.subscribeNewsletter(req.body);
    res.json(result);
  });
  app.get("/api/newsletter/export", (_req, res) => {
    const subscribers = db.getNewsletterSubscribers();
    const rows = [
      ["Email", "Prenom", "Langue_Maternelle", "Date_Inscription", "Source", "Consentement_RGPD"],
      ...subscribers.map((s) => [
        `"${(s.email || "").replace(/"/g, '""')}"`,
        `"${(s.prenom || "").replace(/"/g, '""')}"`,
        `"${(s.langue_maternelle || "").replace(/"/g, '""')}"`,
        s.subscribed_at,
        s.source,
        s.consent ? "OUI" : "NON"
      ])
    ];
    const csvContent = "\uFEFF" + rows.map((r) => r.join(";")).join("\n");
    res.header("Content-Type", "text/csv; charset=utf-8");
    res.attachment(`tandem_oslo_newsletter_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
    res.send(csvContent);
  });
  app.get("/api/vipps", (_req, res) => {
    const requests = db.getVippsRequests();
    res.json({ success: true, requests });
  });
  app.post("/api/vipps", (req, res) => {
    const created = db.createVippsRequest(req.body);
    res.json({ success: true, request: created });
  });
  app.get("/api/conversations", (req, res) => {
    const userId = req.query.userId;
    const conversations = db.getConversations(userId);
    res.json({ success: true, conversations });
  });
  app.get("/api/messages/:conversationId", (req, res) => {
    const messages = db.getMessages(req.params.conversationId);
    res.json({ success: true, messages });
  });
  app.post("/api/messages", (req, res) => {
    const { conversationId, content, senderId } = req.body;
    if (!conversationId || !content || !senderId) {
      res.status(400).json({ success: false, error: "Champs requis manquants" });
      return;
    }
    const msg = db.sendMessage(conversationId, content, senderId);
    res.json({ success: true, message: msg });
  });
  app.post("/api/sync-offline", (req, res) => {
    const result = db.syncOffline(req.body);
    res.json({ success: true, ...result });
  });
  if (isProduction) {
    app.use(express.static(path2.join(__dirname2, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path2.join(__dirname2, "dist", "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Tandem Server] Running on http://0.0.0.0:${PORT} (${isProduction ? "production" : "development"})`);
  });
}
startServer().catch((err) => {
  console.error("[Tandem Server] Failed to start:", err);
  process.exit(1);
});
