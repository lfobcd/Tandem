-- =========================================================================
-- Schéma Supabase pour l'application Tandem Franco-Norvégien (Prat & Parle)
-- À coller directement dans le SQL Editor de Supabase
-- =========================================================================

-- 1. Table Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  prenom TEXT NOT NULL,
  langue_maternelle TEXT NOT NULL CHECK (langue_maternelle IN ('français', 'norvégien')),
  langue_apprise TEXT NOT NULL CHECK (langue_apprise IN ('français', 'norvégien')),
  niveau TEXT NOT NULL CHECK (niveau IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  quartier TEXT NOT NULL,
  disponibilites JSONB DEFAULT '[]'::jsonb,
  envies TEXT,
  bio TEXT,
  photo_url TEXT,
  a_paye BOOLEAN DEFAULT false,
  derniere_activite TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Table Lieux Préférés (1 à 3 par profil)
CREATE TABLE IF NOT EXISTS public.lieux_preferes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  type TEXT DEFAULT 'cafe',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Table Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(participant_1, participant_2)
);

-- 4. Table Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lieux_preferes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Politiques RLS simples
-- Profiles: lecture publique, mise à jour par le propriétaire
CREATE POLICY "Les profils sont visibles par tous" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Un utilisateur peut modifier son propre profil" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Lieux préférés: visibles par tous, gérés par le propriétaire
CREATE POLICY "Les lieux sont visibles par tous" ON public.lieux_preferes
  FOR SELECT USING (true);

CREATE POLICY "Un utilisateur peut gérer ses lieux" ON public.lieux_preferes
  FOR ALL USING (auth.uid() = profile_id);

-- Conversations & Messages: réservés aux participants
CREATE POLICY "Participants voient leurs conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Participants créent des conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Participants voient les messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = messages.conversation_id 
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Participants envoient des messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = messages.conversation_id 
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );
