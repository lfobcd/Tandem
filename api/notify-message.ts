// Fonction serveur Vercel : envoie un email au membre qui vient de recevoir un message.
// Variables d'environnement à définir sur Vercel :
//   SUPABASE_SERVICE_ROLE_KEY  (Supabase > Project Settings > API Keys > "secret" / service_role)
//   RESEND_API_KEY             (resend.com > API Keys)
//   MAIL_FROM                  (ex : "Tandem Franco-Norsk <contact@votre-domaine.no>")
//   SITE_URL                   (facultatif, défaut : https://tandemfrnorsk.vercel.app)
import { createClient } from '@supabase/supabase-js';

const COOLDOWN_MINUTES = 30;

const esc = (s: string) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!supabaseUrl || !serviceKey || !resendKey) {
    console.error('[notify-message] Variables manquantes (SUPABASE_SERVICE_ROLE_KEY / RESEND_API_KEY).');
    return res.status(503).json({ error: 'Notifications non configurées' });
  }

  try {
    // 1. Qui appelle ? (jeton de session Supabase de l'expéditeur)
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Non connecté' });

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Session invalide' });
    const senderId = userData.user.id;

    // 2. Le message doit exister et appartenir à l'appelant
    const messageId = typeof req.body === 'string' ? JSON.parse(req.body)?.message_id : req.body?.message_id;
    if (!messageId) return res.status(400).json({ error: 'message_id manquant' });

    const { data: msg } = await admin.from('messages').select('*').eq('id', messageId).maybeSingle();
    if (!msg || msg.sender_id !== senderId) return res.status(403).json({ error: 'Message introuvable' });

    const { data: conv } = await admin.from('conversations').select('*').eq('id', msg.conversation_id).maybeSingle();
    const recipientId = conv?.participant_ids?.find((id: string) => id !== senderId);
    if (!recipientId) return res.status(200).json({ skipped: 'pas de destinataire' });

    // 3. Anti-spam : un seul email par conversation toutes les 30 minutes
    const { data: last } = await admin
      .from('message_notifications')
      .select('last_sent_at')
      .eq('conversation_id', conv.id)
      .eq('recipient_id', recipientId)
      .maybeSingle();
    if (last && Date.now() - new Date(last.last_sent_at).getTime() < COOLDOWN_MINUTES * 60 * 1000) {
      return res.status(200).json({ skipped: 'notification récente déjà envoyée' });
    }

    // 4. Destinataire et expéditeur
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, email, prenom, langue_maternelle')
      .in('id', [recipientId, senderId]);
    const recipient = profiles?.find((p: any) => p.id === recipientId);
    const sender = profiles?.find((p: any) => p.id === senderId);
    if (!recipient?.email) return res.status(200).json({ skipped: 'destinataire sans email' });

    const siteUrl = process.env.SITE_URL || 'https://tandemfrnorsk.vercel.app';
    const from = process.env.MAIL_FROM || 'Tandem Franco-Norsk <onboarding@resend.dev>';
    const senderName = esc(sender?.prenom || 'Un membre');
    const isNo = recipient.langue_maternelle === 'norvégien';

    const subject = isNo
      ? `${sender?.prenom || 'Et medlem'} har sendt deg en melding på Tandem`
      : `${sender?.prenom || 'Un membre'} t'a écrit sur Tandem`;
    const html = isNo
      ? `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#1F2421">
           <h2 style="color:#2E4A3D">Hei ${esc(recipient.prenom || '')} 👋</h2>
           <p><strong>${senderName}</strong> har sendt deg en melding på Tandem Franco-Norsk.</p>
           <p><a href="${siteUrl}" style="display:inline-block;background:#2E4A3D;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none">Se meldingen</a></p>
           <p style="color:#717A74;font-size:12px">Du får høyst én e-post per samtale hver halvtime.</p>
         </div>`
      : `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#1F2421">
           <h2 style="color:#2E4A3D">Bonjour ${esc(recipient.prenom || '')} 👋</h2>
           <p><strong>${senderName}</strong> t'a envoyé un message sur Tandem Franco-Norsk.</p>
           <p><a href="${siteUrl}" style="display:inline-block;background:#2E4A3D;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none">Voir le message</a></p>
           <p style="color:#717A74;font-size:12px">Tu reçois au maximum un email par conversation toutes les 30 minutes.</p>
         </div>`;

    // 5. Envoi via Resend
    const mailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [recipient.email], subject, html }),
    });
    if (!mailRes.ok) {
      const detail = await mailRes.text();
      console.error('[notify-message] Resend a refusé l\'envoi :', mailRes.status, detail);
      return res.status(502).json({ error: 'Envoi impossible', detail });
    }

    await admin
      .from('message_notifications')
      .upsert({ conversation_id: conv.id, recipient_id: recipientId, last_sent_at: new Date().toISOString() });

    return res.status(200).json({ sent: true });
  } catch (e: any) {
    console.error('[notify-message] Erreur :', e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
