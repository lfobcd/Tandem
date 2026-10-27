-- ==============================================================================
-- TANDEM - DURCISSEMENT DE LA SÉCURITÉ DE LA BASE
-- À coller dans Supabase > SQL Editor > New query, puis "Run".
-- (À exécuter après supabase-setup.sql et supabase-messaging.sql)
-- ==============================================================================

-- Qui est gestionnaire ? Un profil is_admin dont l'email correspond à un compte
-- Supabase dont l'email est confirmé.
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN auth.users u ON lower(u.email) = lower(p.email)
    WHERE u.id = auth.uid()
      AND u.email_confirmed_at IS NOT NULL
      AND p.is_admin = TRUE
  );
$$;

-- 1. Inscription : personne ne peut se créer un profil gestionnaire
DROP POLICY IF EXISTS "Allow registration insert" ON public.profiles;
CREATE POLICY "Allow registration insert" ON public.profiles
  FOR INSERT WITH CHECK (COALESCE(is_admin, FALSE) = FALSE);

-- 2. Modification : seulement son propre profil (ou le gestionnaire)
DROP POLICY IF EXISTS "Allow update profile" ON public.profiles;
CREATE POLICY "Allow update own profile" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid()::text OR public.is_admin_user())
  WITH CHECK (id = auth.uid()::text OR public.is_admin_user());

-- 3. Champs sensibles : seul le gestionnaire (ou ce SQL Editor) peut les modifier
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF COALESCE(auth.role(), '') IN ('anon', 'authenticated') AND NOT public.is_admin_user() THEN
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
       OR NEW.a_paye IS DISTINCT FROM OLD.a_paye
       OR NEW.is_beta_pioneer IS DISTINCT FROM OLD.is_beta_pioneer
       OR NEW.beta_rank IS DISTINCT FROM OLD.beta_rank
       OR NEW.vipps_status IS DISTINCT FROM OLD.vipps_status
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Modification non autorisée de champs protégés';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_protect_profile_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

-- 4. Liste des abonnés newsletter : réservée au gestionnaire (l'ajout reste ouvert)
DROP POLICY IF EXISTS "Allow newsletter select" ON public.newsletter_subscribers;
CREATE POLICY "Newsletter lecture gestionnaire" ON public.newsletter_subscribers
  FOR SELECT USING (public.is_admin_user());

-- 5. Suppression de profils : réservée au gestionnaire (la fonction serveur du site utilise la clé "secret")
DROP POLICY IF EXISTS "Admin delete profiles" ON public.profiles;
CREATE POLICY "Admin delete profiles" ON public.profiles
  FOR DELETE USING (public.is_admin_user());
