// Fonction serveur Vercel : suppression de profils par le gestionnaire.
// Variable requise : SUPABASE_SERVICE_ROLE_KEY (la clé "secret" de Supabase).
import { createClient } from '@supabase/supabase-js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(503).json({ error: 'Suppression non configurée (SUPABASE_SERVICE_ROLE_KEY manquante).' });
  }

  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Non connecté' });

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const caller = userData?.user;
    if (userErr || !caller?.email || !caller.email_confirmed_at) {
      return res.status(401).json({ error: 'Session invalide' });
    }
    const provider = caller.app_metadata?.provider;
    if (provider && provider !== 'google' && provider !== 'email') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // L'appelant doit être gestionnaire dans la base
    const { data: callerProfile } = await admin
      .from('profiles')
      .select('id, is_admin')
      .eq('email', caller.email.toLowerCase())
      .maybeSingle();
    if (!callerProfile?.is_admin) return res.status(403).json({ error: 'Accès réservé au gestionnaire' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const ids: string[] = Array.isArray(body?.ids)
      ? [...new Set<string>(body.ids.filter((x: unknown) => typeof x === 'string'))].slice(0, 100)
      : [];
    if (ids.length === 0) return res.status(400).json({ error: 'Aucun profil indiqué' });

    const { data: targets } = await admin.from('profiles').select('id, is_admin, email').in('id', ids);
    const deleted: string[] = [];
    const skipped: { id: string; reason: string }[] = [];

    for (const id of ids) {
      const target = targets?.find((t: any) => t.id === id);
      if (!target) {
        skipped.push({ id, reason: 'introuvable' });
        continue;
      }
      if (target.is_admin || id === callerProfile.id || id === caller.id) {
        skipped.push({ id, reason: 'profil gestionnaire protégé' });
        continue;
      }

      // Conversations (les messages sont supprimés avec) et journal de notifications
      await admin.from('conversations').delete().contains('participant_ids', [id]);
      await admin.from('message_notifications').delete().eq('recipient_id', id);

      const { error: delErr } = await admin.from('profiles').delete().eq('id', id);
      if (delErr) {
        skipped.push({ id, reason: delErr.message });
        continue;
      }
      // Compte de connexion associé
      if (UUID.test(id)) {
        const { error: authErr } = await admin.auth.admin.deleteUser(id);
        if (authErr && !/not found/i.test(authErr.message)) {
          console.warn('[admin-delete-profiles] Compte de connexion non supprimé :', id, authErr.message);
        }
      }
      deleted.push(id);
    }

    return res.status(200).json({ deleted, skipped });
  } catch (e: any) {
    console.error('[admin-delete-profiles] Erreur :', e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
