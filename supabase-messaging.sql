-- ==============================================================================
-- TANDEM - MESSAGERIE RÉELLE ENTRE MEMBRES + NOTIFICATIONS PAR EMAIL
-- À coller dans Supabase > SQL Editor > New query, puis cliquer sur "Run".
-- (À exécuter APRÈS supabase-setup.sql)
-- ==============================================================================

-- 1. Conversations (toujours 2 participants : les identifiants des profils)
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY,
  participant_ids TEXT[] NOT NULL CHECK (array_length(participant_ids, 1) = 2),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);

-- 3. Journal des notifications envoyées (anti-spam : 1 email max / 30 min / conversation)
CREATE TABLE IF NOT EXISTS public.message_notifications (
  conversation_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, recipient_id)
);

-- 4. Sécurité : seuls les 2 participants voient et écrivent dans leur conversation
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_notifications ENABLE ROW LEVEL SECURITY;  -- aucune règle = accès serveur uniquement

DROP POLICY IF EXISTS "conv_select_participants" ON public.conversations;
CREATE POLICY "conv_select_participants" ON public.conversations
  FOR SELECT USING (auth.uid()::text = ANY (participant_ids));

DROP POLICY IF EXISTS "conv_insert_participants" ON public.conversations;
CREATE POLICY "conv_insert_participants" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid()::text = ANY (participant_ids));

DROP POLICY IF EXISTS "conv_update_participants" ON public.conversations;
CREATE POLICY "conv_update_participants" ON public.conversations
  FOR UPDATE USING (auth.uid()::text = ANY (participant_ids))
  WITH CHECK (auth.uid()::text = ANY (participant_ids));

DROP POLICY IF EXISTS "msg_select_participants" ON public.messages;
CREATE POLICY "msg_select_participants" ON public.messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id AND auth.uid()::text = ANY (c.participant_ids)
  ));

DROP POLICY IF EXISTS "msg_insert_sender" ON public.messages;
CREATE POLICY "msg_insert_sender" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()::text AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id AND auth.uid()::text = ANY (c.participant_ids)
    )
  );
