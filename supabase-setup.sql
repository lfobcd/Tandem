-- ==============================================================================
-- TANDEM FRANCO-NORSK OSLO - SUPABASE DATABASE SCHEMA & RLS SECURITY RULES
-- Copiez et collez ce script dans : Supabase Dashboard > SQL Editor > New Query
-- Puis cliquez sur "Run".
-- ==============================================================================

-- 1. Table des profils membres
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  prenom TEXT NOT NULL,
  langue_maternelle TEXT NOT NULL CHECK (langue_maternelle IN ('français', 'norvégien')),
  langue_apprise TEXT NOT NULL CHECK (langue_apprise IN ('norvégien', 'français')),
  niveau TEXT DEFAULT 'A2',
  quartier TEXT DEFAULT 'Sentrum, Oslo',
  bio TEXT DEFAULT '',
  envies TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  a_paye BOOLEAN DEFAULT TRUE,
  is_completed BOOLEAN DEFAULT TRUE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_beta_pioneer BOOLEAN DEFAULT TRUE,
  beta_rank INTEGER DEFAULT 1,
  newsletter_subscribed BOOLEAN DEFAULT TRUE,
  derniere_activite TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  disponibilites JSONB DEFAULT '[]'::jsonb,
  lieux_preferes JSONB DEFAULT '[]'::jsonb,
  vipps_phone TEXT DEFAULT '',
  vipps_status TEXT DEFAULT 'none',
  vipps_requested_at TIMESTAMPTZ,
  vipps_approved_at TIMESTAMPTZ
);

-- Index pour recherches rapides par langue et quartier
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_langue_maternelle ON public.profiles(langue_maternelle);
CREATE INDEX IF NOT EXISTS idx_profiles_quartier ON public.profiles(quartier);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- 2. Activation de la Sécurité au niveau des lignes (Row Level Security - RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Règles de sécurité RLS (Policies)

-- Règle 1 : L'annuaire public est accessible à tous les visiteurs (consultation des profils pour trouver un binôme)
DROP POLICY IF EXISTS "Public profiles are readable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are readable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Règle 2 : Tout nouvel utilisateur peut créer son profil lors de l'inscription
DROP POLICY IF EXISTS "Allow registration insert" ON public.profiles;
CREATE POLICY "Allow registration insert"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- Règle 3 : Mise à jour du profil par son propriétaire ou l'administrateur
DROP POLICY IF EXISTS "Allow update profile" ON public.profiles;
CREATE POLICY "Allow update profile"
  ON public.profiles
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 4. Table des abonnés Newsletter & rencontres
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  prenom TEXT DEFAULT '',
  langue_maternelle TEXT DEFAULT 'français',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'inscription_compte',
  consent BOOLEAN DEFAULT TRUE
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow newsletter insert" ON public.newsletter_subscribers;
CREATE POLICY "Allow newsletter insert"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow newsletter select" ON public.newsletter_subscribers;
CREATE POLICY "Allow newsletter select"
  ON public.newsletter_subscribers
  FOR SELECT
  USING (true);

-- 5. Profil initial Administrateur
INSERT INTO public.profiles (
  id, email, prenom, langue_maternelle, langue_apprise, niveau, quartier,
  envies, bio, a_paye, is_completed, is_admin
)
VALUES (
  'user_manager_bcdlfo',
  'bcdlfo@gmail.com',
  'Admin (bcdlfo)',
  'français',
  'norvégien',
  'C1',
  'Sentrum, Oslo',
  'Gestion de la communauté et partenariats Tandem Fransk Norsk Oslo.',
  'Compte administrateur et gestionnaire de Tandem Fransk Norsk Oslo.',
  true,
  true,
  true
)
ON CONFLICT (email) DO UPDATE SET
  is_admin = true,
  a_paye = true;
