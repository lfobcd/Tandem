import React, { createContext, useContext, useState, useEffect } from 'react';

export type Locale = 'fr' | 'no';

export interface Translations {
  // Brand
  brandName: string;
  brandTagline: string;

  // Nav
  navHome: string;
  navDiscovery: string;
  navMessages: string;
  navProfile: string;
  navSettings: string;
  navFindTandem: string;
  navLogin: string;
  navSignup: string;
  navStatusPaid: string;
  navFaq: string;
  footerTerms: string;
  authAgreeTerms: string;
  settingsGdprTitle: string;
  settingsGdprDesc: string;
  settingsExportDataBtn: string;
  settingsDeleteAccountBtn: string;
  settingsViewTermsBtn: string;

  // Auth & Social
  authTitleSignUp: string;
  authTitleLogin: string;
  authSubtitleSignUp: string;
  authSubtitleLogin: string;
  authTabSignUp: string;
  authTabLogin: string;
  authContinueWithGoogle: string;
  authContinueWithApple: string;
  authContinueWithFacebook: string;
  authOrWithEmail: string;
  authNameLabel: string;
  authNamePlaceholder: string;
  authEmailLabel: string;
  authPasswordLabel: string;
  authNativeLangLabel: string;
  authFrenchNative: string;
  authNorwegianNative: string;
  authBtnSignUp: string;
  authBtnLogin: string;
  authTrustBadge: string;
  authConnectingProvider: string;

  // Landing
  heroBadge: string;
  heroTitle1: string;
  heroTitle2: string;
  heroDescription: string;
  heroCheckFree: string;
  heroCheckBrowse: string;
  heroCheckCoffeePrice: string;
  heroBtnStart: string;
  heroBtnExplore: string;
  heroCardSubtitle: string;
  heroCardQuote: string;
  howTitleBadge: string;
  howTitle: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  activeCommunityTitleBadge: string;
  activeCommunityTitle: string;
  landingNewMembersBadge: string;
  landingNewMembersTitle: string;
  landingNewMembersSubtitle: string;
  filterAllMembers: string;
  filterFrenchNativeShort: string;
  filterNorwegianNativeShort: string;
  newMemberBadge: string;
  contactMemberBtn: string;
  viewAllProfiles: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaBtn: string;

  // FAQ & Guide Section
  faqBadge: string;
  faqTitle: string;
  faqSubtitle: string;
  faqSearchPlaceholder: string;
  faqFilterAll: string;
  faqFilterBasics: string;
  faqFilterPractical: string;
  faqFilterPricing: string;
  faqGoldenRulesBadge: string;
  faqGoldenRulesTitle: string;
  faqGoldenRulesSubtitle: string;
  faqNoResults: string;
  faqResetSearch: string;
  faqStillHaveQuestions: string;
  faqContactSupport: string;
  faqCtaTitle: string;
  faqCtaSubtitle: string;
  faqCtaBtn: string;

  // Discovery
  discoveryTitleBadge: string;
  discoveryTitle: string;
  discoverySubtitle: string;
  yourStatus: string;
  statusFreeBrowse: string;
  statusUnlimitedActive: string;
  unlockContactsBtn: string;
  searchPlaceholder: string;
  allNeighborhoods: string;
  allCities: string;
  cityFilterLabel: string;
  neighborhoodFilterLabel: string;
  nearMeBtn: string;
  allNeighborhoodsInCity: string;
  locationSearchPlaceholder: string;
  popularNeighborhoods: string;
  selectedLocationBadge: string;
  allLevels: string;
  allAvailabilities: string;
  availEvening: string;
  availWeekend: string;
  filterCompatibleOnly: string;
  allNativeLanguages: string;
  allTargetLanguages: string;
  phase2Badge: string;
  phase2Notice: string;
  secondaryLanguagesLabel: string;
  secondaryLanguagesDesc: string;
  primaryLanguagesGroup: string;
  upcomingLanguagesGroup: string;
  profilesFound: string;
  resetFilters: string;
  noProfilesMatch: string;
  noProfilesHint: string;
  contactBtnPaid: string;
  contactBtnFree: string;
  clickToSeeMap: string;
  viewOnMap: string;
  favoriteSpots: string;

  // Search Filters & Sorting
  nativeLanguageFilterLabel: string;
  filterFrenchNative: string;
  filterNorwegianNative: string;
  filterAllLanguages: string;
  filterInterestsLabel: string;
  filterAllInterests: string;
  filterFavoritesLabel: string;
  filterOnlyFavorites: string;
  sortByLabel: string;
  sortRecent: string;
  sortFavoritesFirst: string;
  sortFrenchFirst: string;
  sortNorwegianFirst: string;
  sortNameAsc: string;
  favoritesEmptyTitle: string;
  favoritesEmptyDesc: string;
  addToFavorites: string;
  removeFromFavorites: string;

  // Profile Drawer
  profileAbout: string;
  profileDesires: string;
  profileMeetingSpots: string;
  profileAvailabilities: string;
  profileSinglePaymentNotice: string;
  profileUnlimitedNotice: string;
  profileSendMsgTo: string;

  // Profile Edit
  editTitle: string;
  editSubtitle: string;
  editSuccess: string;
  photoLabel: string;
  clearPhoto: string;
  neighborhoodLabel: string;
  neighborhoodPlaceholder: string;
  languagesSection: string;
  nativeLang: string;
  targetLang: string;
  targetLevel: string;
  favoritePlacesSection: string;
  favoritePlacesDesc: string;
  availabilitySection: string;
  availabilityDesc: string;
  bioSection: string;
  bioLabel: string;
  bioPlaceholder: string;
  desiresLabel: string;
  desiresPlaceholder: string;
  cancelBtn: string;
  saveProfileBtn: string;

  // Mapbox & Places
  pinPlacesNotice: string;
  centerOn: string;
  searchPlacePlaceholder: string;
  addPlaceBtn: string;
  registeredPlaces: string;
  suggestionsOslo: string;
  placeInputPlaceholder: string;
  mapReadyMode: string;
  mapReadyDesc: string;
  clickToDropPin: string;
  customMapboxNotice: string;

  // Payment
  paymentBadge: string;
  paymentModalTitle: string;
  paymentModalDesc: string;
  vippsTabTitle: string;
  cardTabTitle: string;
  vippsPhoneLabel: string;
  vippsPhonePlaceholder: string;
  vippsNotice: string;
  vippsAppConfirmPrompt: string;
  vippsWaitingApp: string;
  vippsPayBtn: string;
  vippsOfficialBtnText: string;
  vippsRedirectTitle: string;
  vippsRedirectDesc: string;
  vippsSimulatedBrowserTitle: string;
  vippsMerchantName: string;
  vippsPushOption: string;
  vippsQrOption: string;
  vippsQrInstruction: string;
  vippsPushNotificationBanner: string;
  vippsPushNotificationDetail: string;
  vippsSimulateApproveBtn: string;
  vippsSimulateCancelBtn: string;
  vippsPaymentApprovedMsg: string;
  vippsReturningToApp: string;
  vippsRecipientLabel: string;
  vippsRecipientNumber: string;
  vippsCopyNumber: string;
  vippsCopied: string;
  vippsAmountLabel: string;
  vippsAmountValue: string;
  vippsCopyAmount: string;
  vippsMessageLabel: string;
  vippsMessageValue: string;
  vippsCopyMessage: string;
  vippsOpenAppBtn: string;
  vippsStep1: string;
  vippsStep2: string;
  vippsStep3: string;
  vippsConfirmSentBtn: string;
  vippsSenderPhonePlaceholder: string;
  vippsConfirmedSuccess: string;
  paymentLifetimeTitle: string;
  paymentLifetimeDesc: string;
  paymentCardNumber: string;
  paymentExpiry: string;
  paymentCvc: string;
  paymentProcessing: string;
  paymentSubmitBtn: string;
  paymentSecured: string;
  paymentNoFutureCharges: string;
  paymentSuccessTitle: string;
  paymentSuccessDesc: string;

  // Messaging
  messagingSafetyTitle: string;
  messagingConversationsTitle: string;
  messagingNewTandem: string;
  messagingNoConversations: string;
  messagingBrowseLink: string;
  messagingHideMap: string;
  messagingShowMap: string;
  messagingStartedWith: string;
  messagingEmptyHistory: string;
  messagingEmptyTip: string;
  messagingInputPlaceholder: string;
  messagingSelectPrompt: string;
  messagingSelectDesc: string;

  // Settings
  settingsTitle: string;
  settingsSubtitle: string;
  settingsEditProfileBtn: string;
  settingsPaymentTitle: string;
  settingsPaymentDesc: string;
  settingsTestToggleBtn: string;
  settingsMapboxTitle: string;
  settingsMapboxDesc: string;
  settingsMapboxInputLabel: string;
  settingsMapboxSaveBtn: string;
  settingsSupabaseTitle: string;
  settingsSupabaseDesc: string;
  settingsSupabaseSaveBtn: string;
  settingsSqlToggleShow: string;
  settingsSqlToggleHide: string;
  settingsResetTitle: string;
  settingsResetDesc: string;
  settingsResetBtn: string;

  // Activity Status
  activeJustNow: string;
  activeMinAgo: string;
  activeToday: string;
  activeYesterday: string;
  activeDaysAgo: string;
  activeThisMonth: string;
}

export const translations: Record<Locale, Translations> = {
  fr: {
    brandName: 'Tandem',
    brandTagline: 'Français · Norsk',

    navHome: 'Accueil',
    navDiscovery: 'Découvrir',
    navMessages: 'Messagerie',
    navProfile: 'Mon Profil',
    navSettings: 'Paramètres',
    navFindTandem: 'Chercher un tandem',
    navLogin: 'Se connecter',
    navSignup: "S'inscrire gratuitement",
    navStatusPaid: 'Accès illimité',
    navFaq: 'FAQ & Guide',
    footerTerms: 'Conditions & Confidentialité (RGPD)',
    authAgreeTerms: 'En créant un compte, vous acceptez nos Conditions Générales et notre Charte de Confidentialité.',
    settingsGdprTitle: 'Confidentialité & Mes données (RGPD)',
    settingsGdprDesc: 'Consultez, exportez ou supprimez définitivement vos données personnelles conformément au Règlement Général sur la Protection des Données.',
    settingsExportDataBtn: 'Télécharger mes données (JSON)',
    settingsDeleteAccountBtn: 'Supprimer mon compte et mes données',
    settingsViewTermsBtn: 'Consulter les CGU & Charte Personvern',

    authTitleSignUp: 'Rejoindre Tandem',
    authTitleLogin: 'Bon retour parmi nous',
    authSubtitleSignUp: 'Inscription 100% gratuite. Parcourez librement les profils.',
    authSubtitleLogin: 'Accédez à votre espace tandem et à vos conversations.',
    authTabSignUp: 'Inscription gratuite',
    authTabLogin: 'Se connecter',
    authContinueWithGoogle: 'Continuer avec Google',
    authContinueWithApple: 'Continuer avec Apple',
    authContinueWithFacebook: 'Continuer avec Facebook',
    authOrWithEmail: 'ou avec votre adresse email',
    authNameLabel: 'Prénom',
    authNamePlaceholder: 'Ex : Marianne ou Magnus',
    authEmailLabel: 'Adresse email',
    authPasswordLabel: 'Mot de passe',
    authNativeLangLabel: 'Votre langue maternelle',
    authFrenchNative: '🇫🇷 Français (Apprend le norvégien)',
    authNorwegianNative: '🇳🇴 Norsk (Apprend le français)',
    authBtnSignUp: 'Créer mon profil gratuitement',
    authBtnLogin: 'Accéder à mes tandems',
    authTrustBadge: 'Données protégées · Pas de spams · Connexion sécurisée',
    authConnectingProvider: 'Connexion sécurisée en cours...',

    heroBadge: 'Tandem linguistique · Oslo & Francophonie',
    heroTitle1: 'Parlez norvégien.',
    heroTitle2: 'Snakk fransk.',
    heroDescription:
      "Connectez-vous librement avec des francophones et norvégophones pour pratiquer la langue de l'autre en toute convivialité. Épinglez vos cafés préférés à Oslo et faites de réels progrès à l'oral.",
    heroCheckFree: 'Inscription 100% gratuite',
    heroCheckBrowse: 'Profils consultables librement',
    heroCheckCoffeePrice: "Prix d'un café (39 NOK) au 1er contact",
    heroBtnStart: 'Trouver un partenaire de tandem',
    heroBtnExplore: 'Voir les profils disponibles',
    heroCardSubtitle: 'Café Fuglen · Sentrum, Oslo',
    heroCardQuote:
      "« On s'est retrouvés pour 30 min de français et 30 min de norsk. Sans stress et ultra motivant ! »",
    howTitleBadge: 'Comment ça fonctionne',
    howTitle: 'Un tandem simple, bienveillant et sans abonnement',
    step1Title: 'Créez votre profil & carte',
    step1Desc:
      'Renseignez votre niveau CECRL (A1 à C2), vos créneaux et épinglez 1 à 3 lieux préférés sur la carte (café, Deichman, parc).',
    step2Title: 'Parcourez librement les membres',
    step2Desc:
      'Aucun paiement pour naviguer. Filtrez par quartier, compatibilité linguistique et disponibilités.',
    step3Title: "Contactez au prix d'un café",
    step3Desc:
      "Une contribution unique symbolique de 39 NOK (~3,50 €) au moment de contacter. Débloque l'accès illimité sans abonnement.",
    activeCommunityTitleBadge: 'Communauté active à Oslo',
    activeCommunityTitle: 'Derniers partenaires disponibles',
    landingNewMembersBadge: '✨ Nouveaux membres inscrits · Oslo',
    landingNewMembersTitle: 'Nouveaux membres de la communauté',
    landingNewMembersSubtitle:
      'Des francophones et des norvégiens motivés qui viennent de rejoindre Tandem pour échanger autour d\'un café.',
    filterAllMembers: 'Tous les nouveaux',
    filterFrenchNativeShort: '🇫🇷 Français natif',
    filterNorwegianNativeShort: '🇳🇴 Norsk morsmål',
    newMemberBadge: 'Nouveau membre',
    contactMemberBtn: 'Discuter',
    viewAllProfiles: 'Explorer tous les profils',
    ctaTitle: 'Prêt(e) pour votre première conversation ?',
    ctaSubtitle:
      "Rejoignez la communauté franco-norvégienne à Oslo et commencez à échanger dès aujourd'hui autour d'un kanelbolle ou d'un café.",
    ctaBtn: 'Créer un compte gratuit',

    faqBadge: 'Foire aux questions & Guide',
    faqTitle: 'Tout comprendre sur le tandem linguistique',
    faqSubtitle:
      "Des questions avant de vous lancer ? Découvrez comment fonctionne l'échange réciproque, comment se déroule une rencontre et dissipez vos doutes.",
    faqSearchPlaceholder: 'Rechercher une question (ex. niveau, débutant, prix, lieux, timide)...',
    faqFilterAll: 'Toutes les questions',
    faqFilterBasics: 'Comment débuter',
    faqFilterPractical: 'Organisation & Lieux',
    faqFilterPricing: 'Tarif & Sécurité',
    faqGoldenRulesBadge: 'Les 3 règles d’or',
    faqGoldenRulesTitle: 'Le secret d’un tandem réussi',
    faqGoldenRulesSubtitle:
      'Pas besoin d’être professeur ni bilingue : un bon échange linguistique repose avant tout sur ces trois principes simples.',
    faqNoResults: 'Aucune réponse trouvée pour cette recherche.',
    faqResetSearch: 'Réinitialiser la recherche',
    faqStillHaveQuestions: 'Vous avez une autre question ou une suggestion ?',
    faqContactSupport: 'Écrivez-nous à contact@tandem-oslo.no — nous vous répondons sous 24h avec plaisir.',
    faqCtaTitle: 'Prêt(e) à débloquer votre oral ?',
    faqCtaSubtitle:
      'Rejoignez la communauté bienveillante franco-norvégienne. Inscription gratuite en moins de 2 minutes.',
    faqCtaBtn: 'Commencer maintenant',

    discoveryTitleBadge: 'Tandems franco-norvégiens',
    discoveryTitle: 'Trouvez votre partenaire linguistique',
    discoverySubtitle:
      "Parcourez librement les profils compatibles à Oslo et proposez un échange autour d'un café.",
    yourStatus: 'Votre statut :',
    statusFreeBrowse: 'Consultation gratuite',
    statusUnlimitedActive: 'Accès illimité actif',
    unlockContactsBtn: 'Débloquer les contacts (39 NOK)',
    searchPlaceholder: 'Prénom, quartier, centres d’intérêt...',
    allNeighborhoods: 'Tous les quartiers',
    allCities: 'Toutes les villes',
    cityFilterLabel: 'Ville',
    neighborhoodFilterLabel: 'Quartier / Bydel',
    nearMeBtn: 'Autour de moi',
    allNeighborhoodsInCity: 'Tous les quartiers de {city}',
    locationSearchPlaceholder: 'Rechercher ville, quartier (ex: Grünerløkka, Bergen, Frogner...)',
    popularNeighborhoods: 'Quartiers populaires :',
    selectedLocationBadge: 'Filtre géographique :',
    allLevels: 'Tous niveaux (A1 à C2)',
    allAvailabilities: 'Toutes disponibilités',
    availEvening: 'Disponible en soirée',
    availWeekend: 'Disponible le week-end',
    filterCompatibleOnly: 'Tandems compatibles uniquement (langues croisées)',
    allNativeLanguages: 'Toutes langues maternelles',
    allTargetLanguages: 'Toutes langues apprises',
    phase2Badge: 'Évolution multilingue (Phase 2)',
    phase2Notice: 'Tandem démarre autour du franco-norvégien à Oslo. Vous pouvez déjà ajouter vos autres langues pour préparer les prochains tandems multilingues.',
    secondaryLanguagesLabel: 'Autres langues d’échange (Prévu pour la Phase 2)',
    secondaryLanguagesDesc: 'Ajoutez les autres langues que vous parlez ou aimeriez pratiquer dans un second temps.',
    primaryLanguagesGroup: 'Langues principales (Actives)',
    upcomingLanguagesGroup: 'Autres langues (Phase 2)',
    profilesFound: 'profil(s) trouvé(s)',
    resetFilters: 'Réinitialiser',
    noProfilesMatch: 'Aucun profil ne correspond à vos filtres',
    noProfilesHint:
      "Essayez d'élargir votre recherche ou décochez le filtre de compatibilité stricte.",
    contactBtnPaid: 'Contacter',
    contactBtnFree: 'Contacter (39 NOK)',
    clickToSeeMap: 'Cliquer pour voir la carte',
    viewOnMap: 'Voir les lieux',
    favoriteSpots: 'Lieux préférés',

    nativeLanguageFilterLabel: 'Langue maternelle',
    filterFrenchNative: '🇫🇷 Français natif',
    filterNorwegianNative: '🇳🇴 Norvégien natif (Norsk)',
    filterAllLanguages: 'Toutes les langues',
    filterInterestsLabel: "Centres d'intérêt",
    filterAllInterests: 'Tous les centres d’intérêt',
    filterFavoritesLabel: 'Mes favoris',
    filterOnlyFavorites: 'Favoris uniquement',
    sortByLabel: 'Trier par',
    sortRecent: 'Activité récente',
    sortFavoritesFirst: 'Favoris en premier ❤️',
    sortFrenchFirst: 'Français natif d’abord 🇫🇷',
    sortNorwegianFirst: 'Norvégien natif d’abord 🇳🇴',
    sortNameAsc: 'Nom (A à Z)',
    favoritesEmptyTitle: 'Aucun profil en favori',
    favoritesEmptyDesc: 'Cliquez sur l’icône cœur ❤️ sur les profils pour les enregistrer et les retrouver facilement.',
    addToFavorites: 'Ajouter aux favoris',
    removeFromFavorites: 'Retirer des favoris',

    profileAbout: 'À propos de',
    profileDesires: "Envies d'échange",
    profileMeetingSpots: 'Lieux de rendez-vous préférés (Carte interactive)',
    profileAvailabilities: 'Disponibilités',
    profileSinglePaymentNotice: 'Paiement unique de 39 NOK au 1er message · Illimité à vie',
    profileUnlimitedNotice: 'Accès illimité actif pour toutes vos conversations',
    profileSendMsgTo: 'Envoyer un message à',

    editTitle: 'Votre profil tandem',
    editSubtitle:
      'Renseignez vos langues, votre niveau et vos endroits fétiches pour faciliter la rencontre.',
    editSuccess: 'Enregistré avec succès !',
    photoLabel: 'Photo de profil',
    clearPhoto: 'Effacer',
    neighborhoodLabel: 'Quartier / Ville de rencontre (ex: Grünerløkka, Oslo)',
    neighborhoodPlaceholder: 'Ex: Majorstuen, Oslo ou Paris 10e',
    languagesSection: 'Langues & Niveau CECRL',
    nativeLang: 'Langue maternelle',
    targetLang: 'Langue apprise',
    targetLevel: 'Votre niveau dans la langue apprise',
    favoritePlacesSection: "Lieux préférés pour l'échange (1 à 3 lieux)",
    favoritePlacesDesc:
      'Épinglez sur la carte vos cafés, médiathèques ou parcs favoris pour donner envie de vous rencontrer.',
    availabilitySection: 'Vos disponibilités habituelles',
    availabilityDesc:
      'Sélectionnez les créneaux où vous êtes généralement partant(e) pour un café tandem.',
    bioSection: 'Présentation & Envies',
    bioLabel: 'Courte bio',
    bioPlaceholder:
      "Parlez brièvement de vos centres d'intérêt, de votre parcours à Oslo ou de vos passions...",
    desiresLabel: "Envies d'échange (ex: conversation informelle, examen, culture...)",
    desiresPlaceholder:
      'Ex : papoter de cinéma, préparer le Bergenstest, balades en ski de fond...',
    cancelBtn: 'Annuler',
    saveProfileBtn: 'Enregistrer et voir les tandems',

    pinPlacesNotice: 'Épinglez de 1 à 3 lieux où vous aimez retrouver votre tandem',
    centerOn: 'Centrer sur :',
    searchPlacePlaceholder: 'Rechercher un café, adresse ou parc (ex: Fuglen, Deichman...)',
    addPlaceBtn: 'Ajouter',
    registeredPlaces: 'Vos lieux enregistrés :',
    suggestionsOslo: 'Suggestions Oslo :',
    placeInputPlaceholder: 'Nom du lieu...',
    mapReadyMode: 'Google Maps interactif',
    mapReadyDesc:
      'Recherchez un café, une bibliothèque ou une adresse à Oslo avec Google Maps en direct.',
    clickToDropPin: 'Sélectionner ce lieu sur Google Maps',
    customMapboxNotice: 'Intégration directe Google Maps Oslo',

    paymentBadge: "Paiement unique · Le prix d'un café",
    paymentModalTitle: 'Contacter votre tandem',
    paymentModalDesc:
      "Afin de préserver des profils motivés et respectueux, l'accès à la messagerie requiert une contribution symbolique unique de 39 NOK (~3,50 €).",
    vippsTabTitle: 'Vipps (🇳🇴 Norvège)',
    cardTabTitle: 'Carte bancaire',
    vippsPhoneLabel: 'Numéro de mobile norvégien',
    vippsPhonePlaceholder: 'ex: +47 912 34 567',
    vippsNotice: 'Ouvrez votre application Vipps sur votre téléphone pour confirmer le paiement de 39 NOK.',
    vippsAppConfirmPrompt: 'Demande envoyée sur votre application Vipps',
    vippsWaitingApp: 'En attente de confirmation dans l\'application Vipps...',
    vippsPayBtn: 'Payer 39 NOK avec Vipps',
    vippsOfficialBtnText: 'Betal med Vipps',
    vippsRedirectTitle: 'Redirection vers Vipps Checkout...',
    vippsRedirectDesc: 'Ouverture de la session sécurisée sur api.vipps.no',
    vippsSimulatedBrowserTitle: 'Vipps Checkout (Paiement officiel sécurisé)',
    vippsMerchantName: 'Tandem Språkutveksling Oslo',
    vippsPushOption: 'Sur mobile (Push Vipps)',
    vippsQrOption: 'Scanner le QR code',
    vippsQrInstruction: 'Ouvrez l’application photo ou Vipps sur votre smartphone pour scanner ce code et confirmer les 39 kr.',
    vippsPushNotificationBanner: 'Notification Vipps reçue sur votre téléphone',
    vippsPushNotificationDetail: 'Appuyez sur la notification dans votre application Vipps pour confirmer 39 kr avec votre code ou biométrie.',
    vippsSimulateApproveBtn: 'Confirmer dans Vipps (Simulation)',
    vippsSimulateCancelBtn: 'Annuler et revenir à Tandem',
    vippsPaymentApprovedMsg: 'Paiement de 39 kr validé !',
    vippsReturningToApp: 'Activation en cours...',
    vippsRecipientLabel: 'Numéro Vipps destinataire',
    vippsRecipientNumber: '92 13 17 92',
    vippsCopyNumber: 'Copier le numéro (92 13 17 92)',
    vippsCopied: 'Copié !',
    vippsAmountLabel: 'Montant à envoyer',
    vippsAmountValue: '39 kr (39 NOK)',
    vippsCopyAmount: 'Copier 39 kr',
    vippsMessageLabel: 'Message recommandé dans Vipps',
    vippsMessageValue: 'Tandem Oslo',
    vippsCopyMessage: 'Copier le message',
    vippsOpenAppBtn: "Ouvrir l'application Vipps",
    vippsStep1: 'Envoyez 39 kr sur Vipps au 92 13 17 92',
    vippsStep2: 'Indiquez votre nom ou "Tandem" dans le message',
    vippsStep3: 'Cliquez sur le bouton ci-dessous pour débloquer votre accès immédiatement',
    vippsConfirmSentBtn: "J'ai envoyé 39 kr au 92 13 17 92",
    vippsSenderPhonePlaceholder: 'Votre numéro ou référence Vipps (optionnel)',
    vippsConfirmedSuccess: 'Paiement Vipps vers le 92 13 17 92 enregistré ! Accès illimité débloqué.',
    paymentLifetimeTitle: 'Accès illimité à vie',
    paymentLifetimeDesc: 'Tous les profils débloqués, sans aucun abonnement récurrent',
    paymentCardNumber: 'Numéro de carte (Mode Test)',
    paymentExpiry: 'Expiration',
    paymentCvc: 'CVC',
    paymentProcessing: 'Validation sécurisée...',
    paymentSubmitBtn: 'Régler 39 NOK et envoyer un message',
    paymentSecured: 'Paiement sécurisé SSL',
    paymentNoFutureCharges: 'Aucun prélèvement futur',
    paymentSuccessTitle: 'Paiement confirmé !',
    paymentSuccessDesc:
      'Votre accès illimité est activé. Vous pouvez dès maintenant échanger librement.',

    messagingSafetyTitle:
      "Espace d'échange sécurisé : Les coordonnées ne sont jamais partagées automatiquement. Prenez le temps de faire connaissance ici avant d'échanger vos numéros ou vos réseaux.",
    messagingConversationsTitle: 'Conversations',
    messagingNewTandem: '+ Nouveau tandem',
    messagingNoConversations: 'Aucune conversation active pour le moment.',
    messagingBrowseLink: 'Découvrir des tandems à Oslo',
    messagingHideMap: 'Masquer la carte',
    messagingShowMap: 'Voir ses lieux préférés',
    messagingStartedWith: 'Conversation démarrée avec',
    messagingEmptyHistory: 'Aucun message échangé pour l’instant.',
    messagingEmptyTip: 'Dites bonjour et proposez de faire un premier échange linguistique !',
    messagingInputPlaceholder: 'Écrire un message... (ex: Hei, vil du ta en kaffe?)',
    messagingSelectPrompt: 'Sélectionnez une conversation',
    messagingSelectDesc:
      'Choisissez un contact à gauche ou découvrez de nouveaux profils compatibles à Oslo.',

    settingsTitle: 'Paramètres & Intégrations',
    settingsSubtitle:
      'Gérez votre profil, vos identifiants Mapbox GL, la connexion Supabase et vos préférences.',
    settingsEditProfileBtn: 'Modifier mon profil',
    settingsPaymentTitle: 'Statut de paiement (Cotisation unique 39 NOK / Vipps)',
    settingsPaymentDesc:
      'Le paiement de 39 NOK (~3,50 €) est unique et débloque le droit de contacter tous les membres en illimité.',
    settingsTestToggleBtn: 'Basculer statut (Mode Test)',
    settingsMapboxTitle: 'Intégration Mapbox GL JS',
    settingsMapboxDesc:
      'Tandem utilise Mapbox GL JS pour afficher les cartes interactives centrées sur Oslo et permettre d’épingler 1 à 3 lieux préférés.',
    settingsMapboxInputLabel: "Jeton d'accès Mapbox (Public Token pk...)",
    settingsMapboxSaveBtn: 'Enregistrer la clé Mapbox',
    settingsSupabaseTitle: 'Base de données & Authentification Supabase (OAuth Google / Apple / Facebook)',
    settingsSupabaseDesc:
      'Tandem supporte nativement Supabase Auth avec les fournisseurs OAuth Google, Apple et Facebook, ainsi que les tables profiles, lieux_preferes, conversations et messages.',
    settingsSupabaseSaveBtn: 'Enregistrer Supabase',
    settingsSqlToggleShow: 'Afficher le script SQL Supabase',
    settingsSqlToggleHide: 'Masquer le script SQL',
    settingsResetTitle: 'Données de démonstration',
    settingsResetDesc:
      'Rétablir les profils tests à Oslo (Astrid, Julien, Lars) et conversations initiales.',
    settingsResetBtn: 'Réinitialiser',

    activeJustNow: 'Actif il y a 5 min',
    activeMinAgo: 'Actif il y a {n} min',
    activeToday: "Vu aujourd'hui",
    activeYesterday: 'Vu hier',
    activeDaysAgo: 'Vu il y a {n} jours',
    activeThisMonth: 'Actif ce mois-ci',
  },

  no: {
    brandName: 'Tandem',
    brandTagline: 'Fransk · Norsk',

    navHome: 'Hjem',
    navDiscovery: 'Utforsk',
    navMessages: 'Meldinger',
    navProfile: 'Min profil',
    navSettings: 'Innstillinger',
    navFindTandem: 'Finn en partner',
    navLogin: 'Logg inn',
    navSignup: 'Registrer deg gratis',
    navStatusPaid: 'Ubegrenset tilgang',
    navFaq: 'FAQ & Guide',
    footerTerms: 'Vilkår & Personvern (GDPR)',
    authAgreeTerms: 'Ved å opprette en konto godtar du våre Brukervilkår og Personvernerklæring.',
    settingsGdprTitle: 'Personvern & Mine data (GDPR)',
    settingsGdprDesc: 'Få innsyn, last ned eller slett dine personopplysninger i henhold til personvernforordningen.',
    settingsExportDataBtn: 'Eksporter mine data (JSON)',
    settingsDeleteAccountBtn: 'Slett konto og data',
    settingsViewTermsBtn: 'Vis Brukervilkår & Personvern',

    authTitleSignUp: 'Bli med i Tandem',
    authTitleLogin: 'Velkommen tilbake',
    authSubtitleSignUp: '100% gratis registrering. Utforsk profiler fritt.',
    authSubtitleLogin: 'Få tilgang til samtalene dine og profilen din.',
    authTabSignUp: 'Gratis registrering',
    authTabLogin: 'Logg inn',
    authContinueWithGoogle: 'Fortsett med Google',
    authContinueWithApple: 'Fortsett med Apple',
    authContinueWithFacebook: 'Fortsett med Facebook',
    authOrWithEmail: 'eller med e-postadresse',
    authNameLabel: 'Fornavn',
    authNamePlaceholder: 'F.eks: Astrid eller Lars',
    authEmailLabel: 'E-postadresse',
    authPasswordLabel: 'Passord',
    authNativeLangLabel: 'Morsmålet ditt',
    authFrenchNative: '🇫🇷 Fransk (Lærer norsk)',
    authNorwegianNative: '🇳🇴 Norsk (Lærer fransk)',
    authBtnSignUp: 'Opprett gratis profil',
    authBtnLogin: 'Gå til profilene',
    authTrustBadge: 'Trygg innlogging · Ingen spam · Personvern respektert',
    authConnectingProvider: 'Kobler til sikkert...',

    heroBadge: 'Språktandem · Oslo & Frankrike',
    heroTitle1: 'Snakk fransk.',
    heroTitle2: 'Parlez norvégien.',
    heroDescription:
      'Møt fransktalende og norsktalende for å øve på hverandres språk i hyggelige omgivelser. Merk favorittkafeene dine i Oslo og bli trygg muntlig.',
    heroCheckFree: '100% gratis registrering',
    heroCheckBrowse: 'Fri utforsking av profiler',
    heroCheckCoffeePrice: 'Prisen på en kaffe (39 kr) ved første kontakt',
    heroBtnStart: 'Finn en språkpartner',
    heroBtnExplore: 'Se tilgjengelige profiler',
    heroCardSubtitle: 'Fuglen Kaffebar · Sentrum, Oslo',
    heroCardQuote:
      '«Vi møttes for 30 minutter fransk og 30 minutter norsk. Uformelt og utrolig lærerikt!»',
    howTitleBadge: 'Slik fungerer det',
    howTitle: 'En enkel, hyggelig tandem uten abonnement',
    step1Title: 'Lag profil og kart',
    step1Desc:
      'Oppgi ditt nivå (A1 til C2), tilgjengelighet og merk 1 til 3 favorittsteder på kartet (kafé, Deichman, park).',
    step2Title: 'Bla fritt blant medlemmene',
    step2Desc:
      'Ingen betaling for å se profiler. Filtrer etter bydel, språkkombinasjon og tidspunkt.',
    step3Title: 'Ta kontakt for prisen av en kaffe',
    step3Desc:
      'Et symbolsk engangsbeløp på 39 kr når du vil sende din første melding. Gir livslang ubegrenset tilgang.',
    activeCommunityTitleBadge: 'Aktivt miljø i Oslo',
    activeCommunityTitle: 'Nylig aktive partnere',
    landingNewMembersBadge: '✨ Nylig innmeldte medlemmer · Oslo',
    landingNewMembersTitle: 'Nye medlemmer i fellesskapet',
    landingNewMembersSubtitle:
      'Fransktalende og norsktalende som nylig ble med for å øve sammen over en god kaffe.',
    filterAllMembers: 'Alle nye',
    filterFrenchNativeShort: '🇫🇷 Fransk morsmål',
    filterNorwegianNativeShort: '🇳🇴 Norsk morsmål',
    newMemberBadge: 'Nytt medlem',
    contactMemberBtn: 'Ta kontakt',
    viewAllProfiles: 'Utforsk alle profiler',
    ctaTitle: 'Klar for din første samtale?',
    ctaSubtitle:
      'Bli en del av det fransk-norske miljøet i Oslo og start språkutvekslingen over en kaffe og kanelbolle i dag.',
    ctaBtn: 'Opprett gratis profil',

    faqBadge: 'Ofte stilte spørsmål & Guide',
    faqTitle: 'Alt du trenger å vite om språktandem',
    faqSubtitle:
      'Lurer du på hvordan en språktandem fungerer før du blir med? Her forklarer vi prinsippene, hvordan dere møtes og svarer på vanlige spørsmål.',
    faqSearchPlaceholder: 'Søk i spørsmål (f.eks. nivå, nybegynner, pris, møtesteder, sjenert)...',
    faqFilterAll: 'Alle spørsmål',
    faqFilterBasics: 'Kom i gang',
    faqFilterPractical: 'Møtesteder & Praksis',
    faqFilterPricing: 'Pris & Trygghet',
    faqGoldenRulesBadge: 'Tre gylne regler',
    faqGoldenRulesTitle: 'Nøkkelen til en vellykket tandem',
    faqGoldenRulesSubtitle:
      'Du trenger verken å være lærer eller flytende. En god språkutveksling hviler på disse tre enkle prinsippene.',
    faqNoResults: 'Ingen spørsmål matchet søket ditt.',
    faqResetSearch: 'Nullstill søk',
    faqStillHaveQuestions: 'Har du andre spørsmål eller forslag?',
    faqContactSupport: 'Send oss en e-post på contact@tandem-oslo.no — vi svarer deg innen 24 timer.',
    faqCtaTitle: 'Klar for å løsne på snakketøyet?',
    faqCtaSubtitle:
      'Bli en del av det inkluderende fransk-norske miljøet. Gratis registrering på under to minutter.',
    faqCtaBtn: 'Start nå',

    discoveryTitleBadge: 'Fransk-norske tandemer',
    discoveryTitle: 'Finn din språkpartner',
    discoverySubtitle:
      'Bla gjennom kompatible profiler i Oslo og inviter til en hyggelig språkutveksling.',
    yourStatus: 'Din status:',
    statusFreeBrowse: 'Gratis utforsking',
    statusUnlimitedActive: 'Ubegrenset tilgang aktiv',
    unlockContactsBtn: 'Lås opp kontakter (39 kr)',
    searchPlaceholder: 'Navn, bydel, interesser...',
    allNeighborhoods: 'Alle bydeler',
    allCities: 'Alle byer',
    cityFilterLabel: 'By',
    neighborhoodFilterLabel: 'Bydel / Område',
    nearMeBtn: 'I mitt nærområde',
    allNeighborhoodsInCity: 'Alle bydeler i {city}',
    locationSearchPlaceholder: 'Søk etter by eller bydel (f.eks. Grünerløkka, Bergen, Frogner...)',
    popularNeighborhoods: 'Populære områder:',
    selectedLocationBadge: 'Valgt område:',
    allLevels: 'Alle nivåer (A1 til C2)',
    allAvailabilities: 'All tilgjengelighet',
    availEvening: 'Ledig på kveldstid',
    availWeekend: 'Ledig i helger',
    filterCompatibleOnly: 'Kun kompatible tandemer (kryssede språk)',
    allNativeLanguages: 'Alle morsmål',
    allTargetLanguages: 'Alle lærte språk',
    phase2Badge: 'Flerspråklig utvidelse (Fase 2)',
    phase2Notice: 'Tandem fokuserer på fransk-norsk i Oslo nå, men du kan allerede legge til andre språk du ønsker å utveksle i neste fase.',
    secondaryLanguagesLabel: 'Andre språk for utveksling (Planlagt i Fase 2)',
    secondaryLanguagesDesc: 'Legg til andre språk du snakker eller ønsker å øve på senere.',
    primaryLanguagesGroup: 'Hovedspråk (Aktive)',
    upcomingLanguagesGroup: 'Flere språk (Fase 2)',
    profilesFound: 'profil(er) funnet',
    resetFilters: 'Tilbakestill',
    noProfilesMatch: 'Ingen profiler matcher filtrene dine',
    noProfilesHint:
      'Prøv å utvide søket ditt eller fjern krysset for streng kompatibilitet.',
    contactBtnPaid: 'Ta kontakt',
    contactBtnFree: 'Ta kontakt (39 kr)',
    clickToSeeMap: 'Klikk for å se kartet',
    viewOnMap: 'Vis steder',
    favoriteSpots: 'Favorittsteder',

    nativeLanguageFilterLabel: 'Morsmål',
    filterFrenchNative: '🇫🇷 Fransk morsmål',
    filterNorwegianNative: '🇳🇴 Norsk morsmål',
    filterAllLanguages: 'Alle språk',
    filterInterestsLabel: 'Interesser og aktiviteter',
    filterAllInterests: 'Alle interesser',
    filterFavoritesLabel: 'Mine favoritter',
    filterOnlyFavorites: 'Kun favoritter',
    sortByLabel: 'Sorter etter',
    sortRecent: 'Nylig aktiv',
    sortFavoritesFirst: 'Favoritter først ❤️',
    sortFrenchFirst: 'Fransk morsmål først 🇫🇷',
    sortNorwegianFirst: 'Norsk morsmål først 🇳🇴',
    sortNameAsc: 'Navn (A til Å)',
    favoritesEmptyTitle: 'Ingen profiler i favoritter',
    favoritesEmptyDesc: 'Klikk på hjerteikonet ❤️ på profilene for å lagre dem og finne dem raskt igjen.',
    addToFavorites: 'Legg til i favoritter',
    removeFromFavorites: 'Fjern fra favoritter',

    profileAbout: 'Om',
    profileDesires: 'Hva jeg ønsker å øve på',
    profileMeetingSpots: 'Møtesteder på kartet (Interaktivt)',
    profileAvailabilities: 'Tilgjengelighet',
    profileSinglePaymentNotice: 'Engangsbeløp på 39 kr ved 1. melding · Livstids tilgang',
    profileUnlimitedNotice: 'Ubegrenset tilgang aktiv for alle meldinger',
    profileSendMsgTo: 'Send melding til',

    editTitle: 'Din tandemprofil',
    editSubtitle:
      'Fortell om språkene dine, nivået ditt og dine favorittsteder for å gjøre møtet enklere.',
    editSuccess: 'Lagret!',
    photoLabel: 'Profilbilde',
    clearPhoto: 'Fjern',
    neighborhoodLabel: 'Bydel / By (f.eks: Grünerløkka, Oslo)',
    neighborhoodPlaceholder: 'F.eks: Majorstuen, Oslo eller Paris',
    languagesSection: 'Språk og CEFR-nivå',
    nativeLang: 'Morsmål',
    targetLang: 'Språk du lærer',
    targetLevel: 'Nivå i språket du lærer',
    favoritePlacesSection: 'Favorittsteder for samtaler (1 til 3 steder)',
    favoritePlacesDesc:
      'Merk kafeer, biblioteker eller parker på kartet der du trives best.',
    availabilitySection: 'Din vanlige tilgjengelighet',
    availabilityDesc:
      'Velg tidspunkter der du vanligvis kan ta en kaffe.',
    bioSection: 'Presentasjon og ønsker',
    bioLabel: 'Kort bio',
    bioPlaceholder:
      'Fortell litt om dine interesser, din hverdag i Oslo eller hva du liker å gjøre...',
    desiresLabel: 'Ønsker for samtalen (f.eks: uformell prat, eksamen, kultur...)',
    desiresPlaceholder:
      'F.eks: snakke om film, forberede Bergenstesten, gå turer i marka...',
    cancelBtn: 'Avbryt',
    saveProfileBtn: 'Lagre og se partnere',

    pinPlacesNotice: 'Fest 1 til 3 steder på kartet der du liker å møtes',
    centerOn: 'Sentrer på:',
    searchPlacePlaceholder: 'Søk etter kafé, adresse eller park (f.eks: Fuglen, Deichman...)',
    addPlaceBtn: 'Legg til',
    registeredPlaces: 'Dine lagrede steder:',
    suggestionsOslo: 'Forslag i Oslo:',
    placeInputPlaceholder: 'Stedets navn...',
    mapReadyMode: 'Google Maps interaktiv',
    mapReadyDesc:
      'Søk etter kafé, bibliotek eller adresse i Oslo direkte med Google Maps.',
    clickToDropPin: 'Velg dette stedet på Google Maps',
    customMapboxNotice: 'Direkte Google Maps integrasjon i Oslo',

    paymentBadge: 'Engangsbeløp · Prisen på en kaffe',
    paymentModalTitle: 'Ta kontakt med din partner',
    paymentModalDesc:
      'For å sikre engasjerte og trygge profiler, koster det et symbolsk engangsbeløp på 39 kr for å åpne meldingssystemet.',
    vippsTabTitle: 'Vipps (🇳🇴 Norges favoritt)',
    cardTabTitle: 'Betalingskort',
    vippsPhoneLabel: 'Norsk mobilnummer',
    vippsPhonePlaceholder: 'f.eks. 912 34 567',
    vippsNotice: 'Bekreft betalingen på 39 kr i Vipps-appen på mobilen din.',
    vippsAppConfirmPrompt: 'Vipps-krav sendt til mobilen din',
    vippsWaitingApp: 'Venter på godkjenning i Vipps-appen...',
    vippsPayBtn: 'Betal 39 kr med Vipps',
    vippsOfficialBtnText: 'Betal med Vipps',
    vippsRedirectTitle: 'Omdirigerer til Vipps Checkout...',
    vippsRedirectDesc: 'Oppretter sikker økt mot api.vipps.no',
    vippsSimulatedBrowserTitle: 'Vipps Checkout (Sikker betaling)',
    vippsMerchantName: 'Tandem Språkutveksling Oslo',
    vippsPushOption: 'På mobil (Vipps-push)',
    vippsQrOption: 'Skann QR-kode med mobil',
    vippsQrInstruction: 'Åpne kameraet eller Vipps på mobilen for å skanne QR-koden og fullføre 39 kr.',
    vippsPushNotificationBanner: 'Vipps-varsel mottatt på telefonen din',
    vippsPushNotificationDetail: 'Trykk på varselet i Vipps eller åpne appen for å bekrefte med Face ID, fingeravtrykk eller PIN.',
    vippsSimulateApproveBtn: 'Bekreft i Vipps (Simulering)',
    vippsSimulateCancelBtn: 'Avbryt og gå tilbake til Tandem',
    vippsPaymentApprovedMsg: 'Betaling på 39 kr registrert!',
    vippsReturningToApp: 'Aktiverer tilgang...',
    vippsRecipientLabel: 'Vipps mottakernummer',
    vippsRecipientNumber: '92 13 17 92',
    vippsCopyNumber: 'Kopier nummer (92 13 17 92)',
    vippsCopied: 'Kopiert!',
    vippsAmountLabel: 'Beløp som sendes',
    vippsAmountValue: '39 kr',
    vippsCopyAmount: 'Kopier 39 kr',
    vippsMessageLabel: 'Melding / Referanse i Vipps',
    vippsMessageValue: 'Tandem Oslo',
    vippsCopyMessage: 'Kopier melding',
    vippsOpenAppBtn: 'Åpne Vipps på mobilen',
    vippsStep1: 'Send 39 kr i Vipps til 92 13 17 92',
    vippsStep2: 'Skriv navnet ditt eller "Tandem" i meldingen',
    vippsStep3: 'Trykk på knappen under for å låse opp umiddelbart',
    vippsConfirmSentBtn: 'Jeg har vippset 39 kr til 92 13 17 92',
    vippsSenderPhonePlaceholder: 'Ditt telefonnummer eller Vipps-referanse (valgfritt)',
    vippsConfirmedSuccess: 'Vipps-betaling til 92 13 17 92 er registrert! Ubegrenset tilgang er nå låst opp.',
    paymentLifetimeTitle: 'Ubegrenset tilgang for alltid',
    paymentLifetimeDesc: 'Alle profiler låses opp uten løpende abonnement',
    paymentCardNumber: 'Kortnummer (Testmodus)',
    paymentExpiry: 'Utløpsdato',
    paymentCvc: 'CVC',
    paymentProcessing: 'Bekrefter betaling...',
    paymentSubmitBtn: 'Betal 39 kr og send melding',
    paymentSecured: 'Sikker SSL-betaling',
    paymentNoFutureCharges: 'Ingen framtidige trekk',
    paymentSuccessTitle: 'Betaling bekreftet!',
    paymentSuccessDesc:
      'Din ubegrensede tilgang er aktivert. Du kan nå sende meldinger fritt.',

    messagingSafetyTitle:
      'Trygt samtalemiljø: Kontaktinformasjon deles aldri automatisk. Bli kjent her før dere eventuelt utveksler telefonnummer.',
    messagingConversationsTitle: 'Samtaler',
    messagingNewTandem: '+ Ny partner',
    messagingNoConversations: 'Ingen aktive samtaler for øyeblikket.',
    messagingBrowseLink: 'Finn språkpartnere i Oslo',
    messagingHideMap: 'Skjul kart',
    messagingShowMap: 'Vis favorittsteder',
    messagingStartedWith: 'Samtale startet med',
    messagingEmptyHistory: 'Ingen meldinger utvekslet ennå.',
    messagingEmptyTip: 'Si hei og foreslå en første språkutveksling over en kaffe!',
    messagingInputPlaceholder: 'Skriv en melding... (f.eks: Hei, vil du ta en kaffe?)',
    messagingSelectPrompt: 'Velg en samtale',
    messagingSelectDesc:
      'Velg en kontakt i listen til venstre eller finn nye profiler.',

    settingsTitle: 'Innstillinger og integrasjoner',
    settingsSubtitle:
      'Administrer profilen din, Mapbox GL-nøkkel, Supabase-kobling og språk.',
    settingsEditProfileBtn: 'Rediger profilen min',
    settingsPaymentTitle: 'Betalingsstatus (Engangsbeløp 39 kr / Vipps)',
    settingsPaymentDesc:
      'Betalingen på 39 kr er en engangssum som gir tilgang til å kontakte alle medlemmer.',
    settingsTestToggleBtn: 'Endre status (Testmodus)',
    settingsMapboxTitle: 'Mapbox GL JS-integrasjon',
    settingsMapboxDesc:
      'Tandem bruker Mapbox GL JS for interaktive kart over Oslo for å vise 1 til 3 favorittsteder.',
    settingsMapboxInputLabel: 'Mapbox offentlig nøkkel (pk...)',
    settingsMapboxSaveBtn: 'Lagre Mapbox-nøkkel',
    settingsSupabaseTitle: 'Supabase-database & innlogging (Google / Apple / Facebook)',
    settingsSupabaseDesc:
      'Tandem støtter direkte Supabase Auth med OAuth-leverandørene Google, Apple og Facebook, samt tabellene profiles, lieux_preferes, conversations og messages.',
    settingsSupabaseSaveBtn: 'Lagre Supabase',
    settingsSqlToggleShow: 'Vis Supabase SQL-skript',
    settingsSqlToggleHide: 'Skjul SQL-skript',
    settingsResetTitle: 'Demodata',
    settingsResetDesc:
      'Gjenopprett standardprofilene i Oslo (Astrid, Julien, Lars) og testsamtalene.',
    settingsResetBtn: 'Tilbakestill',

    activeJustNow: 'Aktiv for 5 min siden',
    activeMinAgo: 'Aktiv for {n} min siden',
    activeToday: 'Sett i dag',
    activeYesterday: 'Sett i går',
    activeDaysAgo: 'Sett for {n} dager siden',
    activeThisMonth: 'Aktiv denne måneden',
  },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'fr',
  setLocale: () => {},
  t: translations.fr,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('tandem_locale');
    if (saved === 'fr' || saved === 'no') return saved;
    // auto detect browser language if norwegian
    if (typeof navigator !== 'undefined' && navigator.language?.startsWith('no')) {
      return 'no';
    }
    return 'fr';
  });

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('tandem_locale', l);
  };

  const t = translations[locale];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
