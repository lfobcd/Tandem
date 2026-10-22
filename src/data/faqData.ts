export type FaqCategory = 'all' | 'basics' | 'practical' | 'pricing';

export interface FaqItem {
  id: string;
  category: 'basics' | 'practical' | 'pricing';
  questionFr: string;
  questionNo: string;
  answerFr: string;
  answerNo: string;
  badgeFr?: string;
  badgeNo?: string;
  keywords: string[];
}

export interface GoldenRule {
  step: string;
  titleFr: string;
  titleNo: string;
  descFr: string;
  descNo: string;
  tagFr: string;
  tagNo: string;
}

export const FAQ_GOLDEN_RULES: GoldenRule[] = [
  {
    step: '01',
    titleFr: 'La règle du 50 / 50 de temps',
    titleNo: '50 / 50-tidsregelen',
    descFr:
      'Partagez équitablement chaque session (ex. 30 min en français, 30 min en norvégien). Utilisez un minuteur si besoin pour que chacun profite pleinement de sa pratique orale.',
    descNo:
      'Del hver økt likt mellom dere (f.eks. 30 minutter på fransk og 30 minutter på norsk). Bruk gjerne en tidtaker slik at begge får like mye taletid.',
    tagFr: 'Équité & Partage',
    tagNo: 'Rettferdighet',
  },
  {
    step: '02',
    titleFr: 'Bienveillance & correction douce',
    titleNo: 'Tålmodighet & vennlig retting',
    descFr:
      "Vous n'êtes pas à l'école ! Ne cherchez pas à tout corriger d'un coup. Concentrez-vous sur la fluidité, notez 2 ou 3 expressions clés à retenir et encouragez votre partenaire.",
    descNo:
      'Dette er ikke en eksamen! Ikke rett på enhver liten feil. Fokuser på flyt og forståelse, noter gjerne 2–3 nøkkeluttrykk underveis og gi ros.',
    tagFr: 'Sans stress',
    tagNo: 'Uten prestasjonsangst',
  },
  {
    step: '03',
    titleFr: 'Régularité plutôt que perfection',
    titleNo: 'Jevnlighet framfor perfeksjon',
    descFr:
      'Un café de 45 minutes par semaine donne des résultats spectaculaires au bout de 2 mois. Mieux vaut de courtes sessions régulières et détendues que de longs cours espacés.',
    descNo:
      'En kaffeprat på 45 minutter én gang i uken gir fantastiske resultater etter to måneder. Korte og jevnlige samtaler slår sjeldne skippertak.',
    tagFr: 'Rythme durable',
    tagNo: 'Gode vaner',
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'who-created-tandem',
    category: 'basics',
    questionFr: "Qui a créé Tandem Franco-Norsk et quelle est son histoire ?",
    questionNo: "Hvem har skapt Tandem Franco-Norsk, og hva er historien bak?",
    badgeFr: "Fondateur & Vision",
    badgeNo: "Grunnlegger & Visjon",
    answerFr:
      "Le site Tandem Franco-Norsk a été créé par Léo Amilhat, passionné de pédagogie et d'échange linguistique. Professeur au Lycée Français d'Oslo (LFRD) et professeur de Français Langue Étrangère (FLE) à l'Atelier 24, Léo désirait lui-même disposer d'une véritable plateforme d'échange pour apprendre et pratiquer le norvégien au quotidien. Devant le manque d'outil dédié, convivial et géolocalisé pour connecter les francophones et les norvégiens à Oslo, il a conçu Tandem avec la conviction que la langue s'apprend avant tout dans la bienveillance, le partage direct et la convivialité d'un café.",
    answerNo:
      "Tandem Franco-Norsk ble skapt av Léo Amilhat, som brenner for pedagogikk og språkutveksling. Han er lærer ved Lycée Français d'Oslo (LFRD) og fransklærer (FLE) ved Atelier 24. Léo ønsket selv å finne en dedikert utvekslingsplattform for å lære og praktisere norsk i hverdagen. Siden det manglet en enkel, trygg og lokal plattform for å koble fransktalende og norsktalende i Oslo, skapte han Tandem — med troen på at språk læres best gjennom hyggelige samtaler og gjensidig nysgjerrighet over en god kaffe.",
    keywords: [
      'léo',
      'amilhat',
      'léo amilhat',
      'créateur',
      'fondateur',
      'lycée français',
      'oslo',
      'lfrd',
      'atelier 24',
      'fle',
      'pédagogie',
      'qui',
      'hvem',
      'grunnlegger',
      'lærer',
    ],
  },
  {
    id: 'beta-50-free-spots',
    category: 'pricing',
    questionFr: "Comment fonctionne la gratuité de la version Bêta pour les 50 premiers inscrits ?",
    questionNo: "Hvordan fungerer gratistilbudet i betaversjonen for de 50 første som melder seg på?",
    badgeFr: "Offre Bêta 0 NOK",
    badgeNo: "Beta-tilbud 0 kr",
    answerFr:
      "Pour récompenser les premiers membres qui font vivre la communauté à Oslo, les 50 premiers inscrits bénéficient automatiquement d'un accès illimité et complet 100% GRATUIT à vie (au lieu de la contribution de 39 NOK). Aucun paiement ni coordonnées bancaires ne sont demandés : vous pouvez envoyer des messages et organiser vos tandems immédiatement. Un décompte en temps réel sur la page d'accueil affiche les places gratuites restantes avant le retour au tarif standard.",
    answerNo:
      "For å belønne de første medlemmene som bygger opp fellesskapet i Oslo, får de 50 første som registrerer seg automatisk full og ubegrenset tilgang 100% GRATIS for alltid (ordinær engangspris 39 kr). Ingen betaling eller kort kreves: du kan sende meldinger og avtale kafémøter med en gang. En sanntidsteller på forsiden viser hvor mange gratisplasser som gjenstår før standardpris trer i kraft.",
    keywords: [
      '50',
      'premiers',
      'bêta',
      'gratuit',
      'décompte',
      'offre',
      'lancement',
      '0 nok',
      'gratis',
      'beta',
      'nedtelling',
    ],
  },
  {
    id: 'how-tandem-works',
    category: 'basics',
    questionFr: "Qu'est-ce qu'un tandem linguistique et comment se déroule une première rencontre ?",
    questionNo: "Hva er en språktandem, og hvordan foregår det første møtet?",
    badgeFr: "Fonctionnement",
    badgeNo: "Grunnleggende",
    answerFr:
      "Le tandem repose sur l'apprentissage réciproque d'égal à égal : une personne francophone apprend le norvégien, et une personne norvégophone apprend le français. Vous vous donnez rendez-vous (souvent dans un café cosy ou une bibliothèque) et divisez la rencontre en deux temps égaux : par exemple 30 minutes uniquement en français, puis 30 minutes uniquement en norvégien. Pas d'examen, pas de cours magistral : juste une discussion conviviale autour de votre quotidien, de vos passions ou de la culture locale.",
    answerNo:
      "En språktandem bygger på gjensidig og likeverdig utveksling: en fransktalende lærer norsk, og en norsktalende lærer fransk. Dere avtaler å møtes (gjerne på en koselig kafé eller et bibliotek) og deler tiden i to like deler: f.eks. 30 minutter kun på fransk, og deretter 30 minutter kun på norsk. Ingen karakterer eller formell undervisning — bare en hyggelig samtale om hverdagen, interesser og kultur.",
    keywords: ['fonctionnement', 'comment', 'rencontre', 'principe', 'déroulement', 'møte', 'hvordan'],
  },
  {
    id: 'language-level',
    category: 'basics',
    questionFr: "Quel niveau faut-il avoir pour participer ? Puis-je venir si je suis débutant (A1 / A2) ?",
    questionNo: "Hvilket nivå kreves for å delta? Kan jeg være med som nybegynner (A1/A2)?",
    badgeFr: "Niveau & Débutants",
    badgeNo: "Nivå & Nybegynner",
    answerFr:
      "Absolument, dès le niveau débutant ! Vous n'avez pas besoin d'être déjà bilingue ou fluide pour commencer. Au contraire, le tandem est le meilleur moyen de vaincre le blocage de la timidité orale. Même avec un vocabulaire restreint, vous pouvez vous présenter, commander au café, parler de la météo ou de vos loisirs. Votre partenaire apprend lui aussi une langue étrangère et fait preuve d'une grande empathie.",
    answerNo:
      "Helt klart, alle nivåer er velkomne, også helt ferske nybegynnere! Du trenger ikke å snakke flytende for å ha utbytte av en tandem. Tvert imot er uformelle samtaler den beste måten å overvinne sjenanse og få i gang taleferdighetene. Selv med et enkelt ordforråd kan dere hilse, bestille en kaffe eller snakke om helgeplaner. Partneren din lærer også et språk og har stor forståelse.",
    keywords: ['niveau', 'débutant', 'a1', 'a2', 'facile', 'fluide', 'begynner', 'level'],
  },
  {
    id: 'shy-or-no-topics',
    category: 'basics',
    questionFr: "Que faire si je suis timide ou si nous manquons de sujets de conversation ?",
    questionNo: "Hva hvis jeg er sjenert eller vi går tom for samtaleemner?",
    badgeFr: "Astuces & Brise-glace",
    badgeNo: "Tips & Isbrytere",
    answerFr:
      "C'est la crainte la plus fréquente chez les nouveaux utilisateurs, mais tout se passe toujours de façon naturelle ! Sur Tandem Oslo, chaque membre renseigne ses centres d'intérêt et ses envies d'échange. Pour lancer la discussion sans pression, vous pouvez préparer 2 ou 3 questions simples à l'avance (ex. « Quel est ton quartier préféré à Oslo ? », « Quels sont les clichés vrais/faux sur la France ou la Norvège ? », « Qu'as-tu fait le week-end dernier ? »). Apporter un article court ou une photo sur son téléphone fait aussi des miracles.",
    answerNo:
      "Dette er den vanligste bekymringen for nye deltakere, men samtalen flyter som regel overraskende lett! I profilene ser dere felles interesser på forhånd. Et godt tips er å ha med 2–3 enkle spørsmål i bakhodet (f.eks. om favorittsteder i Oslo, kulturforskjeller eller helgeaktiviteter). Dere kan også titte på et bilde eller en kort nyhetsartikkel sammen for å sette i gang praten.",
    keywords: ['timide', 'sujets', 'idées', 'conversation', 'peur', 'blocage', 'sjenert', 'tema'],
  },
  {
    id: 'meeting-spots-safety',
    category: 'practical',
    questionFr: "Où se déroulent les rencontres et comment garantissez-vous la sécurité ?",
    questionNo: "Hvor møtes man, og hvordan ivaretas tryggheten?",
    badgeFr: "Lieux & Sécurité",
    badgeNo: "Møtesteder & Trygghet",
    answerFr:
      "Toutes les rencontres se déroulent dans des lieux publics, conviviaux et bien fréquentés : cafés scandinaves renommés (comme Fuglen, Tim Wendelboe, Kaffebrenneriet), grands espaces d'étude calmes comme la bibliothèque Deichman Bjørvika, ou des parcs en été (St. Hanshaugen, Frognerparken). Chaque profil dispose d'une carte interactive affichant ses lieux favoris. Vous ne partagez vos coordonnées personnelles privées que lorsque vous vous sentez parfaitement en confiance.",
    answerNo:
      "Alle møter finner sted på åpne, trygge og trivelige offentlige steder: koselige kaffebarer (som Fuglen, Tim Wendelboe, Kaffebrenneriet), åpne kulturhus og biblioteker (som Deichman Bjørvika), eller i en park på en solrik dag. Hver bruker har et interaktivt kart med sine anbefalte favorittsteder, slik at det er lett å finne en møteplass dere begge trives på.",
    keywords: ['lieux', 'café', 'sécurité', 'deichman', 'oslo', 'rencontre', 'trygghet', 'sikkerhet'],
  },
  {
    id: 'cities-and-remote',
    category: 'practical',
    questionFr: "Est-ce réservé à Oslo ou ouvert à toute la Norvège (et en visio) ?",
    questionNo: "Gjelder dette kun for Oslo, eller andre byer og digitalt?",
    badgeFr: "Villes & Visio",
    badgeNo: "Byer & Digitalt",
    answerFr:
      "Le projet est né à Oslo, mais nous intégrons déjà des filtres pour Bergen, Trondheim, Stavanger et Tromsø ! De plus, de nombreux membres précisent dans leur bio qu'ils sont disponibles pour des sessions en visioconférence (Google Meet, Zoom, WhatsApp), idéal si vous habitez en dehors des grandes villes ou si vos emplois du temps sont serrés.",
    answerNo:
      "Tandem startet i Oslo, men du kan nå filtrere etter Bergen, Trondheim, Stavanger og Tromsø. Flere brukere oppgir også i profilen at de gjerne tar språkpraten over video (Google Meet, FaceTime, Zoom) om man bor litt unna eller har en travel hverdag.",
    keywords: ['villes', 'bergen', 'trondheim', 'stavanger', 'tromsø', 'visio', 'zoom', 'fjern'],
  },
  {
    id: 'pricing-and-commitment',
    category: 'pricing',
    questionFr: "Combien ça coûte ? Y a-t-il un abonnement ou des frais cachés ?",
    questionNo: "Hva koster tjenesten? Er det noe månedlig abonnement?",
    badgeFr: "Tarifs & Transparence",
    badgeNo: "Pris & Vilkår",
    answerFr:
      "L'inscription, la personnalisation du profil avec carte des lieux et la consultation libre de tous les membres sont 100% gratuites. Pour débloquer la messagerie et envoyer des invitations de contact, nous demandons une contribution symbolique unique de 39 NOK (~3,50 €) — le prix d'un café, payable directement via Vipps au 92 13 17 92 (ou par carte bancaire). C'est un accès illimité à vie : AUCUN abonnement mensuel, AUCUN prélèvement automatique, AUCUNE mauvaise surprise.",
    answerNo:
      "Det er helt gratis å registrere seg, opprette profil med favorittkafeer og utforske alle medlemmene i databasen. For å åpne meldingssystemet og ta kontakt med partnere, betaler du et symbolsk engangsbeløp på 39 kr — prisen av en kaffe. Beløpet vippses direkte til 92 13 17 92 (eller med kort), og gir livslang tilgang uten noe løpende abonnement eller skjulte kostnader.",
    keywords: ['prix', 'coût', 'gratuit', 'abonnement', 'payer', '39 nok', '39 kr', 'pris', 'gratis'],
  },
  {
    id: 'difference-with-classes',
    category: 'pricing',
    questionFr: "Quelle est la différence entre un tandem et des cours particuliers payants ?",
    questionNo: "Hva skiller en språktandem fra tradisjonelle språkkurs?",
    badgeFr: "Tandem vs Cours",
    badgeNo: "Tandem vs Kurs",
    answerFr:
      "Les cours traditionnels enseignent la grammaire formelle mais manquent souvent de spontanéité et coûtent plusieurs centaines d'euros par mois. Le tandem est une immersion vivante : vous apprenez le parler authentique des locaux, les expressions idiomatiques, les conseils de vie à Oslo et vous créez de réels liens d'amitié dans la communauté. C'est le complément parfait aux cours ou à vos applications.",
    answerNo:
      "Språkkurs fokuserer ofte på grammatikk og koster tusenvis av kroner. En språktandem gir deg derimot ekte muntlig flyt, dagligdagse talemåter og kulturell innsikt i en avslappet atmosfære. Mange får også nye venner i nærområdet. Det er det perfekte supplementet til selvstudier eller kurs.",
    keywords: ['cours', 'école', 'différence', 'professeur', 'pourquoi', 'forskjell', 'fordeler'],
  },
  {
    id: 'preparation-checklist',
    category: 'practical',
    questionFr: "Comment bien préparer sa première session de tandem ?",
    questionNo: "Hvordan forbereder man seg best til den første økten?",
    badgeFr: "Checklist pratique",
    badgeNo: "Sjekkliste",
    answerFr:
      "1. Choisissez un endroit facile d'accès (ex. un café de votre quartier épinglé sur l'app). 2. Convenez d'une durée (ex. 45 min à 1 heure au total). 3. Pensez à 1 ou 2 sujets légers qui vous intéressent tous les deux. 4. Prenez un carnet de notes ou votre téléphone pour noter les mots nouveaux. 5. Respirez et détendez-vous : votre binôme a exactement les mêmes hésitations que vous !",
    answerNo:
      "1. Velg et trivelig sted med god stemning (f.eks. en kafé fra kartet). 2. Bli enige om varighet på forhånd (f.eks. 50–60 minutter totalt). 3. Ha 1–2 lette temaer i bakhodet. 4. Ha mobilen eller en liten notatblokk klar for å skrive ned nye gloser. 5. Pust med magen og husk at partneren din er like spent som deg!",
    keywords: ['préparation', 'conseils', 'première fois', 'carnet', 'forberedelse', 'tips'],
  },
];
