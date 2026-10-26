import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read port from command line argv (e.g. --port 3000) or PORT env or 3000
function getPort(): number {
  const portIdx = process.argv.indexOf('--port');
  if (portIdx !== -1 && process.argv[portIdx + 1]) {
    const parsed = parseInt(process.argv[portIdx + 1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return parseInt(process.env.PORT || '3000', 10);
}

const PORT = getPort();
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();

  // Middleware
  app.use(express.json({ limit: '10mb' }));

  // CORS headers for safety
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (_req, res) => {
    const realUsers = db.getRealUsers();
    const subscribers = db.getNewsletterSubscribers();
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      realUsersCount: realUsers.length,
      newsletterCount: subscribers.length,
    });
  });

  // Get all visible profiles
  app.get('/api/profiles', (_req, res) => {
    const profiles = db.getProfiles();
    res.json({ success: true, profiles });
  });

  // Get accounts (for admin or sync)
  app.get('/api/accounts', (_req, res) => {
    const accounts = db.getAccounts();
    res.json({ success: true, accounts });
  });

  // Register a new user
  app.post('/api/register', (req, res) => {
    const result = db.register(req.body);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  });

  // Login
  app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const result = db.login(email, password);
    if (!result.success) {
      res.status(401).json(result);
      return;
    }
    res.json(result);
  });

  // OAuth Login (Google, Apple, Facebook)
  app.post('/api/oauth-login', (req, res) => {
    const result = db.oauthLogin(req.body);
    res.json(result);
  });

  // Update a profile
  app.put('/api/profiles/:id', (req, res) => {
    const updated = db.updateProfile(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Profil introuvable' });
      return;
    }
    res.json({ success: true, profile: updated });
  });

  // Admin: get all users with breakdown
  app.get('/api/admin/users', (_req, res) => {
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
      profiles,
    });
  });

  // Admin: set user payment status
  app.post('/api/admin/set-payment', (req, res) => {
    const { userId, isPaid, vippsStatus } = req.body;
    const ok = db.setPaymentStatus(userId, Boolean(isPaid), vippsStatus);
    res.json({ success: ok });
  });

  // Newsletter: get all subscribers
  app.get('/api/newsletter', (_req, res) => {
    const subscribers = db.getNewsletterSubscribers();
    res.json({ success: true, subscribers });
  });

  // Newsletter: subscribe
  app.post('/api/newsletter/subscribe', (req, res) => {
    const result = db.subscribeNewsletter(req.body);
    res.json(result);
  });

  // Newsletter: export CSV
  app.get('/api/newsletter/export', (_req, res) => {
    const subscribers = db.getNewsletterSubscribers();
    const rows = [
      ['Email', 'Prenom', 'Langue_Maternelle', 'Date_Inscription', 'Source', 'Consentement_RGPD'],
      ...subscribers.map((s) => [
        `"${(s.email || '').replace(/"/g, '""')}"`,
        `"${(s.prenom || '').replace(/"/g, '""')}"`,
        `"${(s.langue_maternelle || '').replace(/"/g, '""')}"`,
        s.subscribed_at,
        s.source,
        s.consent ? 'OUI' : 'NON',
      ]),
    ];

    const csvContent = '\uFEFF' + rows.map((r) => r.join(';')).join('\n');
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`tandem_oslo_newsletter_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  });

  // VIPPS requests
  app.get('/api/vipps', (_req, res) => {
    const requests = db.getVippsRequests();
    res.json({ success: true, requests });
  });

  app.post('/api/vipps', (req, res) => {
    const created = db.createVippsRequest(req.body);
    res.json({ success: true, request: created });
  });

  // Conversations & Messages
  app.get('/api/conversations', (req, res) => {
    const userId = req.query.userId as string | undefined;
    const conversations = db.getConversations(userId);
    res.json({ success: true, conversations });
  });

  app.get('/api/messages/:conversationId', (req, res) => {
    const messages = db.getMessages(req.params.conversationId);
    res.json({ success: true, messages });
  });

  app.post('/api/messages', (req, res) => {
    const { conversationId, content, senderId } = req.body;
    if (!conversationId || !content || !senderId) {
      res.status(400).json({ success: false, error: 'Champs requis manquants' });
      return;
    }
    const msg = db.sendMessage(conversationId, content, senderId);
    res.json({ success: true, message: msg });
  });

  // Offline / local cache sync
  app.post('/api/sync-offline', (req, res) => {
    const result = db.syncOffline(req.body);
    res.json({ success: true, ...result });
  });

  // --- STATIC / VITE SERVING ---
  if (isProduction) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Development mode: Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Bind to 0.0.0.0 for container accessibility
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Tandem Server] Running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[Tandem Server] Failed to start:', err);
  process.exit(1);
});
