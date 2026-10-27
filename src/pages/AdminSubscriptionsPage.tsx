import React, { useState, useEffect, useMemo } from 'react';
import { PageView, UserProfile } from '../types';
import { dataStore, supabaseAuth, VippsPaymentRequest } from '../lib/supabase';
import { useTranslation } from '../lib/i18n';
import { VIPPS_SECURITY_CONFIG } from '../config/vippsSecurity';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  DollarSign,
  Users,
  Smartphone,
  Sparkles,
  ArrowRight,
  RefreshCw,
  X,
  AlertCircle,
  Lock,
  Unlock,
  Eye,
  Key,
  Check,
  UserCheck,
  UserX,
  CreditCard,
  Download,
  Mail,
  Copy,
  Trash2,
} from 'lucide-react';
import { NewsletterSubscriber } from '../types';

interface AdminSubscriptionsPageProps {
  currentUser: UserProfile | null;
  onNavigate: (page: PageView) => void;
  onRefreshData?: () => void;
}

export const AdminSubscriptionsPage: React.FC<AdminSubscriptionsPageProps> = ({
  currentUser,
  onNavigate,
  onRefreshData,
}) => {
  const { locale } = useTranslation();

  // Accès gestionnaire : vérifié auprès de Supabase (session réelle + is_admin dans la base).
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    supabaseAuth.verifyAdminRemote().then((ok) => {
      if (alive) setIsAdminUnlocked(ok);
    });
    return () => {
      alive = false;
    };
  }, [currentUser?.id]);

  // Users and requests state
  const [users, setUsers] = useState<UserProfile[]>(() => dataStore.adminGetAllUsers());
  const [vippsRequests, setVippsRequests] = useState<VippsPaymentRequest[]>(() =>
    dataStore.getVippsRequests()
  );

  // Filters & Search
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'paid' | 'free' | 'newsletter' | 'real' | 'inactive' | 'incomplete'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inactiveDays, setInactiveDays] = useState<number>(90);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriber[]>(() =>
    dataStore.getNewsletterSubscribers()
  );
  const [copiedNewsletter, setCopiedNewsletter] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(
    null
  );
  const [realAccountsCount, setRealAccountsCount] = useState<number>(0);
  const [isServerSyncing, setIsServerSyncing] = useState<boolean>(false);

  // Manual activate modal
  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');

  // Reload data from server and local cache
  const reloadData = async () => {
    setIsServerSyncing(true);
    try {
      await dataStore.syncWithServer();
      const serverData = await dataStore.getServerAdminData();
      if (serverData && serverData.success) {
        if (Array.isArray(serverData.profiles)) setUsers(serverData.profiles);
        if (Array.isArray(serverData.vippsRequests)) setVippsRequests(serverData.vippsRequests);
        if (Array.isArray(serverData.subscribers)) setNewsletterSubscribers(serverData.subscribers);
        setRealAccountsCount(serverData.realUsersCount || 0);
      } else {
        setUsers(dataStore.adminGetAllUsers());
        setVippsRequests(dataStore.getVippsRequests());
        setNewsletterSubscribers(dataStore.getNewsletterSubscribers());
      }
    } catch {
      setUsers(dataStore.adminGetAllUsers());
      setVippsRequests(dataStore.getVippsRequests());
      setNewsletterSubscribers(dataStore.getNewsletterSubscribers());
    } finally {
      setIsServerSyncing(false);
      if (onRefreshData) onRefreshData();
    }
  };

  useEffect(() => {
    reloadData();
    const handleStorageUpdate = () => reloadData();
    window.addEventListener('tandem_profiles_updated', handleStorageUpdate);
    window.addEventListener('tandem_newsletter_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    // Auto-refresh every 8 seconds while on admin panel
    const interval = setInterval(() => {
      reloadData();
    }, 8000);

    return () => {
      window.removeEventListener('tandem_profiles_updated', handleStorageUpdate);
      window.removeEventListener('tandem_newsletter_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
      clearInterval(interval);
    };
  }, []);

  // Stats
  const stats = useMemo(() => {
    const totalMembers = users.length;
    const realUsers = users.filter((u) => !u.is_factice).length;
    const paidUsers = users.filter((u) => u.a_paye).length;
    const pendingVipps = users.filter((u) => !u.a_paye && u.vipps_status === 'pending').length;
    const freeUsers = totalMembers - paidUsers;
    const revenueNOK = paidUsers * 39;

    return { totalMembers, realUsers, paidUsers, pendingVipps, freeUsers, revenueNOK };
  }, [users]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Tab filter
      if (filterTab === 'real' && u.is_factice) return false;
      if (filterTab === 'pending' && (u.a_paye || u.vipps_status !== 'pending')) return false;
      if (filterTab === 'paid' && !u.a_paye) return false;
      if (filterTab === 'free' && u.a_paye) return false;
      if (filterTab === 'inactive') {
        if (u.is_factice) return false;
        const last = new Date(u.derniere_activite || u.created_at || 0).getTime();
        if (Date.now() - last < inactiveDays * 24 * 3600 * 1000) return false;
      }
      if (filterTab === 'incomplete') {
        if (u.is_factice) return false;
        if (!(u.is_completed === false || !(u.bio || '').trim())) return false;
      }

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = u.prenom.toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        const matchQuartier = (u.quartier || '').toLowerCase().includes(q);
        const matchPhone = (u.vipps_phone || '').includes(q);
        if (!matchName && !matchEmail && !matchQuartier && !matchPhone) return false;
      }

      return true;
    });
  }, [users, filterTab, searchQuery, inactiveDays]);

  // Filtered newsletter subscribers list
  const filteredNewsletterSubscribers = useMemo(() => {
    return newsletterSubscribers.filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchEmail = (s.email || '').toLowerCase().includes(q);
      const matchName = (s.prenom || '').toLowerCase().includes(q);
      const matchSource = (s.source || '').toLowerCase().includes(q);
      return matchEmail || matchName || matchSource;
    });
  }, [newsletterSubscribers, searchQuery]);

  // Action: Validate & Activate Vipps subscription
  const handleActivateUser = (userId: string, userName: string) => {
    const res = dataStore.adminSetUserPayment(userId, true, 'approved');
    if (res.success) {
      reloadData();
      setNotification({
        message:
          locale === 'no'
            ? `Abonnement for ${userName} er aktivert (39 kr)!`
            : `Souscription Vipps validée et activée pour ${userName} (39 kr) !`,
        type: 'success',
      });
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // Action: Deactivate subscription (revert to free)
  const handleDeactivateUser = (userId: string, userName: string) => {
    const res = dataStore.adminSetUserPayment(userId, false, 'none');
    if (res.success) {
      reloadData();
      setNotification({
        message:
          locale === 'no'
            ? `Abonnement for ${userName} er deaktivert.`
            : `Souscription pour ${userName} désactivée (profil repassé en gratuit).`,
        type: 'info',
      });
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // Action: Manual activation form submission
  const handleManualActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim()) return;

    const emailTarget = manualEmail.trim().toLowerCase();
    const existing = users.find((u) => (u.email || '').toLowerCase() === emailTarget);

    if (existing) {
      handleActivateUser(existing.id, existing.prenom);
      setShowManualAddModal(false);
      setManualEmail('');
      setManualPhone('');
    } else {
      // Create user account/profile if doesn't exist yet and activate
      const reg = dataStore.registerAccount({
        email: emailTarget,
        password: 'vipps_client_' + Date.now(),
        prenom: emailTarget.split('@')[0],
        langue_maternelle: 'norvégien',
        quartier: 'Sentrum, Oslo',
      });

      if (reg.user) {
        dataStore.adminSetUserPayment(reg.user.id, true, 'approved');
        reloadData();
        setNotification({
          message:
            locale === 'no'
              ? `Ny profil opprettet og aktivert for ${emailTarget}!`
              : `Nouveau profil créé et activé pour ${emailTarget} !`,
          type: 'success',
        });
        setTimeout(() => setNotification(null), 3500);
        setShowManualAddModal(false);
        setManualEmail('');
        setManualPhone('');
      }
    }
  };

  // Action: Simulate a pending Vipps request to test approval workflow
  const handleSimulatePendingVipps = (userId: string, userName: string) => {
    const res = dataStore.adminSetUserPayment(userId, false, 'pending');
    if (res.success) {
      reloadData();
      setNotification({
        message:
          locale === 'no'
            ? `Simulert Vipps-betaling registrert for ${userName}. Profilen venter nå på godkjenning!`
            : `Simulation Vipps enregistrée pour ${userName}. Le profil est désormais en attente de validation !`,
        type: 'info',
      });
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // Suppression : jamais un profil gestionnaire, le sien, ni un profil de démonstration
  const canDeleteUser = (u: UserProfile) => !u.is_admin && !u.is_factice && u.id !== currentUser?.id;
  const deletableFiltered = filteredUsers.filter(canDeleteUser);
  const selectedUsers = users.filter((u) => selectedIds.has(u.id) && canDeleteUser(u));

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    const allSelected = deletableFiltered.length > 0 && deletableFiltered.every((u) => selectedIds.has(u.id));
    setSelectedIds(allSelected ? new Set() : new Set(deletableFiltered.map((u) => u.id)));
  };

  const handleConfirmDelete = async () => {
    const ids = selectedUsers.map((u) => u.id);
    if (ids.length === 0) return;
    setIsDeleting(true);
    const res = await dataStore.adminDeleteProfiles(ids);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    setSelectedIds(new Set());
    const skippedCount = res.skipped?.length || 0;
    setNotification({
      message: res.success
        ? `${res.deleted.length} profil(s) supprimé(s)${skippedCount ? ` — ${skippedCount} ignoré(s)` : ''}.`
        : `Suppression impossible : ${res.error}`,
      type: res.success ? 'success' : 'info',
    });
    setTimeout(() => setNotification(null), 5000);
    reloadData();
  };

  // Action: Toggle admin role on a user
  const handleToggleAdminUser = (userId: string, currentIsAdmin: boolean, userName: string) => {
    const profiles = dataStore.getProfiles();
    const idx = profiles.findIndex((p) => p.id === userId);
    if (idx >= 0) {
      profiles[idx].is_admin = !currentIsAdmin;
      dataStore.saveProfiles(profiles);
      reloadData();
      setNotification({
        message: !currentIsAdmin
          ? (locale === 'no' ? `Administratorrolle tildelt ${userName}.` : `Rôle Gestionnaire Admin attribué à ${userName}.`)
          : (locale === 'no' ? `Administratorrolle fjernet for ${userName}.` : `Rôle Gestionnaire Admin retiré à ${userName}.`),
        type: 'success',
      });
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // Action: Export paid users to CSV
  const handleExportCSV = () => {
    const rows = [
      ['ID', 'Prenom', 'Email', 'Quartier', 'Statut', 'Paye_39_NOK', 'Statut_Vipps', 'Telephone_Vipps', 'Date_Demande', 'Date_Validation'],
      ...users.map((u) => [
        u.id,
        `"${(u.prenom || '').replace(/"/g, '""')}"`,
        `"${(u.email || '').replace(/"/g, '""')}"`,
        `"${(u.quartier || '').replace(/"/g, '""')}"`,
        u.a_paye ? 'PAYE' : u.vipps_status === 'pending' ? 'EN_ATTENTE_VIPPS' : 'GRATUIT',
        u.a_paye ? 'OUI' : 'NON',
        u.vipps_status || 'none',
        `"${(u.vipps_phone || '').replace(/"/g, '""')}"`,
        u.vipps_requested_at || '',
        u.vipps_approved_at || '',
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((r) => r.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tandem_oslo_souscriptions_vipps_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Action: Export newsletter subscribers to CSV (Mailchimp, Brevo, Substack compatible)
  const handleExportNewsletterCSV = () => {
    dataStore.exportNewsletterCSV();
    setNotification({
      message:
        locale === 'no'
          ? `Eksporterte ${newsletterSubscribers.length} nyhetsbrevabonnenter til CSV!`
          : `Export de ${newsletterSubscribers.length} abonnés newsletter au format CSV réussi !`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 3500);
  };

  // Action: Copy all newsletter subscriber emails to clipboard
  const handleCopyAllNewsletterEmails = () => {
    const emails = newsletterSubscribers.map((s) => s.email).filter(Boolean).join(', ');
    if (!emails) {
      setNotification({
        message: locale === 'no' ? 'Ingen e-postadresser å kopiere.' : 'Aucune adresse email à copier.',
        type: 'info',
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    navigator.clipboard.writeText(emails);
    setCopiedNewsletter(true);
    setTimeout(() => setCopiedNewsletter(false), 3000);
    setNotification({
      message:
        locale === 'no'
          ? `${newsletterSubscribers.length} e-postadresser kopiert til utklippstavlen!`
          : `${newsletterSubscribers.length} adresses email copiées dans le presse-papier !`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 3500);
  };

  // Écran verrouillé : plus de code PIN ni de connexion directe
  if (!isAdminUnlocked) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#2E4A3D] text-white flex items-center justify-center mx-auto shadow-md">
          <ShieldCheck className="w-8 h-8 text-emerald-300" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-semibold text-[#1F2421]">
            {locale === 'no' ? 'Administratorinnlogging' : 'Espace Gestionnaire'}
          </h1>
          <p className="text-xs text-[#525E56] leading-relaxed">
            {isAdminUnlocked === null
              ? locale === 'no' ? 'Kontrollerer tilgang…' : 'Vérification de l\'accès…'
              : locale === 'no'
              ? 'Tilgang forbeholdt administratoren. Logg inn med administratorkontoen.'
              : 'Accès réservé au gestionnaire. Connectez-vous avec le compte gestionnaire (Google ou email).'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-4 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
              : 'bg-blue-50 text-blue-950 border-blue-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E1D8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF5B24] text-white">
              Vipps {VIPPS_SECURITY_CONFIG.phoneFormatted}
            </span>
            <span className="text-xs font-semibold text-[#2E4A3D]">
              {locale === 'no' ? 'Administrasjonspanel' : 'Gestionnaire des Souscriptions'}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-normal text-[#1F2421] mt-1">
            {locale === 'no' ? 'Vipps-abonnementskontroll' : 'Gestion des Paiements & Profils Payés'}
          </h1>
          <p className="text-xs sm:text-sm text-[#525E56] mt-0.5">
            {locale === 'no'
              ? 'Godkjenn Vipps-innbetalinger (39 kr) og styr tilgang for fransktalende og norsktalende.'
              : 'Validez les paiements reçus par Vipps (39 NOK) et activez les profils illimités en 1 clic.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={reloadData}
            className="px-3.5 py-2 bg-white border border-[#E5E1D8] text-[#1F2421] rounded-xl text-xs font-medium hover:bg-[#FAF8F5] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Rafraîchir les données"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#2E4A3D]" />
            <span>{locale === 'no' ? 'Oppdater' : 'Actualiser'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-[#E5E1D8] text-[#1F2421] rounded-xl text-xs font-medium hover:bg-[#FAF8F5] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Exporter la liste des souscriptions au format CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#FF5B24]" />
            <span>{locale === 'no' ? 'Vipps CSV' : 'Vipps CSV'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportNewsletterCSV}
            className="px-3.5 py-2 bg-white border border-emerald-300 text-emerald-950 rounded-xl text-xs font-medium hover:bg-emerald-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Exporter les abonnés newsletter au format CSV (Mailchimp, Brevo, Substack)"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-700" />
            <span>{locale === 'no' ? 'Nyhetsbrev CSV' : 'Newsletter CSV'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowManualAddModal(true)}
            className="px-4 py-2 bg-[#2E4A3D] hover:bg-[#23382E] text-white rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>+ {locale === 'no' ? 'Aktiver manuelt' : 'Activer manuellement'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('discovery')}
            className="px-3.5 py-2 bg-[#FAF8F5] border border-[#E5E1D8] text-[#525E56] hover:text-[#1F2421] rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            <span>{locale === 'no' ? 'Tilbake til app' : 'Retour aux profils'}</span>
          </button>
        </div>
      </div>

      {/* Central Server Database Live Status Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-teal-50/40 border border-emerald-300 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#2E4A3D] text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-[#1F2421]">
                {locale === 'no' ? 'Sentralisert serverdatabase aktiv' : 'Base de données centralisée active en direct'}
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono font-semibold rounded-md text-[10px]">
                {isServerSyncing ? (locale === 'no' ? 'Synkroniserer...' : 'Synchronisation...') : 'data/tandem_db.json'}
              </span>
            </div>
            <p className="text-xs text-[#525E56]">
              {locale === 'no'
                ? `Hver påmelding fra en hvilken som helst mobil eller datamaskin lagres nå umiddelbart på serveren. ${stats.realUsers} ekte medlem(mer) registrert, ${newsletterSubscribers.length} nyhetsbrevabonnenter.`
                : `Toutes les inscriptions depuis n'importe quel téléphone ou ordinateur sont sauvegardées sur le serveur central. ${stats.realUsers} membre(s) réel(s) enregistrés, ${newsletterSubscribers.length} inscrits newsletter.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs shrink-0">
          <button
            type="button"
            onClick={reloadData}
            disabled={isServerSyncing}
            className="px-3.5 py-1.5 bg-[#2E4A3D] hover:bg-[#23382E] text-white rounded-xl font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isServerSyncing ? 'animate-spin' : ''}`} />
            <span>{locale === 'no' ? 'Oppdater nå' : 'Actualiser en direct'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Real Members KPI */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-300 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-900 font-semibold">
            <span>{locale === 'no' ? 'Ekte påmeldte' : 'Inscrits réels'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-emerald-950">
            {stats.realUsers}
          </div>
          <p className="text-[11px] text-emerald-800">
            {locale === 'no' ? 'Registrert på serveren' : 'Comptes créés sur le serveur'}
          </p>
        </div>

        {/* Total Members */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#717A74]">
            <span>{locale === 'no' ? 'Totalt profiler' : 'Total profils'}</span>
            <Users className="w-4 h-4 text-[#2E4A3D]" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-semibold text-[#1F2421]">
            {stats.totalMembers}
          </div>
          <p className="text-[11px] text-[#8C938E]">
            {stats.totalMembers - stats.realUsers} {locale === 'no' ? 'fiktive demoer' : 'démos factices'}
          </p>
        </div>

        {/* Paid / Active Profiles */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F0F5F2] border border-[#D5E5DA] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#2E4A3D] font-medium">
            <span>{locale === 'no' ? 'Aktive (39 kr)' : 'Profils Actifs (Payés)'}</span>
            <CheckCircle2 className="w-4 h-4 text-[#2E4A3D]" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-semibold text-[#2E4A3D]">
            {stats.paidUsers}
          </div>
          <p className="text-[11px] text-[#3F5949]">
            {locale === 'no' ? 'Full tilgang til meldinger' : 'Accès illimité aux contacts'}
          </p>
        </div>

        {/* Pending Vipps Validations */}
        <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs space-y-1 transition-all ${
          stats.pendingVipps > 0
            ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-300/40'
            : 'bg-white border-[#E5E1D8]'
        }`}>
          <div className="flex items-center justify-between text-xs text-amber-900 font-medium">
            <span>{locale === 'no' ? 'Venter på Vipps' : 'En attente Vipps'}</span>
            <Clock className={`w-4 h-4 ${stats.pendingVipps > 0 ? 'text-amber-600 animate-spin' : 'text-[#8C938E]'}`} />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-semibold text-amber-950">
            {stats.pendingVipps}
          </div>
          <p className="text-[11px] text-amber-800">
            {stats.pendingVipps > 0
              ? locale === 'no'
                ? 'Innbetalinger som krever godkjenning'
                : 'Paiements à vérifier sur Vipps'
              : locale === 'no'
              ? 'Ingen ventende betalinger'
              : 'Aucun paiement en attente'}
          </p>
        </div>

        {/* Estimated Revenue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF6F3] border border-[#FFD9CD] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#FF5B24] font-medium">
            <span>{locale === 'no' ? 'Vipps-inntekter' : 'Revenus encaissés'}</span>
            <DollarSign className="w-4 h-4 text-[#FF5B24]" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-[#FF5B24]">
            {stats.revenueNOK} NOK
          </div>
          <p className="text-[11px] text-[#B83E15]">
            {stats.paidUsers} × 39 kr {locale === 'no' ? 'engangssum' : 'cotisations'}
          </p>
        </div>

        {/* Newsletter Subscribers KPI */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-medium">
            <span>{locale === 'no' ? 'Nyhetsbrev' : 'Base Newsletter'}</span>
            <Mail className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-[#2E4A3D]">
            {newsletterSubscribers.length}
          </div>
          <p className="text-[11px] text-[#525E56]">
            {locale === 'no' ? 'E-postadresser samlet inn' : 'Emails qualifiés récoltés'}
          </p>
        </div>
      </div>

      {/* Receiving Vipps Account Reminder Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FAF8F5] via-white to-orange-50/40 border border-[#E5E1D8] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FF5B24] text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
            v
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1F2421]">Compte Vipps récepteur :</span>
              <span className="px-2.5 py-0.5 bg-white border border-[#FFD0C0] text-[#FF5B24] font-mono font-bold rounded-lg text-sm">
                92 13 17 92
              </span>
            </div>
            <p className="text-xs text-[#525E56]">
              {locale === 'no'
                ? 'Når du mottar en Vipps-betaling på 39 kr, finn brukeren nedenfor og klikk på "Godkjenn & Aktiver".'
                : 'Dès que vous recevez une notification Vipps de 39 kr sur votre téléphone, repérez le nom/numéro ci-dessous et cliquez sur « Valider & Activer ».'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs shrink-0">
          <span className="text-[#717A74]">Tarif fixé :</span>
          <span className="font-bold text-[#2E4A3D] bg-[#E8EDE6] px-2.5 py-1 rounded-lg">
            39 NOK à vie
          </span>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8] overflow-x-auto text-xs font-medium">
            <button
              onClick={() => setFilterTab('real')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterTab === 'real'
                  ? 'bg-emerald-700 text-white shadow-2xs font-semibold'
                  : 'text-emerald-900 bg-emerald-50 hover:bg-emerald-100'
              }`}
            >
              <span>✨ {locale === 'no' ? 'Ekte påmeldte' : 'Inscrits réels'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                filterTab === 'real' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-950'
              }`}>
                {stats.realUsers}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'all'
                  ? 'bg-white text-[#1F2421] shadow-2xs font-semibold'
                  : 'text-[#717A74] hover:text-[#1F2421]'
              }`}
            >
              {locale === 'no' ? 'Alle' : 'Tous'} ({stats.totalMembers})
            </button>

            <button
              onClick={() => setFilterTab('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterTab === 'pending'
                  ? 'bg-amber-500 text-white shadow-2xs font-semibold'
                  : 'text-amber-800 hover:text-amber-950 hover:bg-amber-100/50'
              }`}
            >
              <span>{locale === 'no' ? 'Venter Vipps' : 'À valider Vipps'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                filterTab === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'
              }`}>
                {stats.pendingVipps}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('paid')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterTab === 'paid'
                  ? 'bg-[#2E4A3D] text-white shadow-2xs font-semibold'
                  : 'text-[#2E4A3D] hover:text-[#1F2421]'
              }`}
            >
              <span>{locale === 'no' ? 'Aktive betalte' : 'Actifs payés'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                filterTab === 'paid' ? 'bg-white/20 text-white' : 'bg-[#E8EDE6] text-[#2E4A3D]'
              }`}>
                {stats.paidUsers}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('free')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'free'
                  ? 'bg-white text-[#1F2421] shadow-2xs font-semibold'
                  : 'text-[#717A74] hover:text-[#1F2421]'
              }`}
            >
              {locale === 'no' ? 'Ikke betalt (Gratis)' : 'Non payés'} ({stats.freeUsers})
            </button>

            <button
              onClick={() => setFilterTab('inactive')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterTab === 'inactive'
                  ? 'bg-red-700 text-white shadow-2xs font-semibold'
                  : 'text-red-900 hover:bg-red-50'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{locale === 'no' ? 'Inaktive' : 'Inactifs'}</span>
            </button>

            <button
              onClick={() => setFilterTab('incomplete')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterTab === 'incomplete'
                  ? 'bg-red-700 text-white shadow-2xs font-semibold'
                  : 'text-red-900 hover:bg-red-50'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{locale === 'no' ? 'Ufullstendige' : 'Profils vides'}</span>
            </button>

            <button
              onClick={() => setFilterTab('newsletter')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filterTab === 'newsletter'
                  ? 'bg-emerald-700 text-white shadow-2xs font-semibold'
                  : 'text-emerald-900 hover:text-emerald-950 hover:bg-emerald-100/50'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{locale === 'no' ? 'Nyhetsbrev' : 'Base Newsletter'}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  filterTab === 'newsletter' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {newsletterSubscribers.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C938E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                filterTab === 'newsletter'
                  ? locale === 'no'
                    ? 'Søk e-post, fornavn...'
                    : 'Rechercher email, prénom...'
                  : locale === 'no'
                  ? 'Søk navn, e-post, tlf...'
                  : 'Rechercher nom, email, tél...'
              }
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D]"
            />
          </div>
        </div>

        {/* Conditional Rendering: Newsletter Subscribers Table vs Users/Payment Table */}
        {filterTab === 'newsletter' ? (
          <div className="bg-white rounded-3xl border border-[#E5E1D8] shadow-xs overflow-hidden space-y-0">
            {/* Newsletter Control Bar */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50/60 to-white border-b border-[#E5E1D8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                  <h3 className="font-semibold text-sm text-[#1F2421]">
                    {locale === 'no'
                      ? 'Nyhetsbrevabonnenter (Tandem Oslo)'
                      : 'Base de contacts Newsletter & Événements Tandem'}
                  </h3>
                </div>
                <p className="text-xs text-[#525E56] mt-0.5">
                  {locale === 'no'
                    ? 'E-postadresser samlet inn ved registrering med samtykke. Klar til eksport for Mailchimp, Brevo eller Substack.'
                    : 'Adresses récoltées avec consentement RGPD lors de l\'inscription ou via le site. Prêt pour import Mailchimp, Brevo ou Substack.'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyAllNewsletterEmails}
                  className="px-3 py-1.5 bg-white border border-[#E5E1D8] text-[#1F2421] rounded-xl text-xs font-medium hover:bg-[#FAF8F5] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Copier toutes les adresses séparées par des virgules"
                >
                  {copiedNewsletter ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#525E56]" />
                      <span>{locale === 'no' ? 'Kopier alle' : 'Copier tous les emails'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleExportNewsletterCSV}
                  className="px-3.5 py-1.5 bg-[#2E4A3D] hover:bg-[#23382E] text-white rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{locale === 'no' ? 'Last ned CSV' : 'Télécharger CSV'}</span>
                </button>
              </div>
            </div>

            {/* Newsletter Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-[#E5E1D8] text-[11px] font-semibold text-[#717A74] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Adresse Email</th>
                    <th className="py-3 px-4">Prénom</th>
                    <th className="py-3 px-4">Langue</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Date d'inscription</th>
                    <th className="py-3 px-4 text-right">Consentement RGPD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0ECE1]">
                  {filteredNewsletterSubscribers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-xs text-[#717A74]">
                        <Mail className="w-8 h-8 text-[#8C938E] mx-auto mb-2 opacity-50" />
                        <p className="font-medium text-[#1F2421]">
                          {locale === 'no' ? 'Ingen abonnenter funnet' : 'Aucun abonné trouvé'}
                        </p>
                        <p className="text-[11px] text-[#8C938E] mt-0.5">
                          {locale === 'no'
                            ? 'Nye medlemmer som godtar nyhetsbrevet vil vises her.'
                            : 'Les nouveaux membres qui acceptent la newsletter apparaîtront automatiquement ici.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredNewsletterSubscribers.map((subscriber, idx) => (
                      <tr key={subscriber.email + idx} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-[#1F2421]">
                          <div className="flex items-center gap-2">
                            <span>{subscriber.email}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(subscriber.email);
                                setNotification({
                                  message: `${subscriber.email} copié !`,
                                  type: 'success',
                                });
                                setTimeout(() => setNotification(null), 2000);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer rounded"
                              title="Copier cet email"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#1F2421]">
                          {subscriber.prenom || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-[11px]">
                          <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E5E1D8] text-[#525E56]">
                            {subscriber.langue === 'fr'
                              ? '🇫🇷 Français'
                              : subscriber.langue === 'no'
                              ? '🇳🇴 Norsk'
                              : subscriber.langue || '—'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-[#717A74]">
                          <span className="capitalize">{subscriber.source || 'Inscription'}</span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-[#717A74]">
                          {subscriber.date_inscription
                            ? new Date(subscriber.date_inscription).toLocaleDateString(
                                locale === 'no' ? 'nb-NO' : 'fr-FR',
                                { day: '2-digit', month: 'short', year: 'numeric' }
                              )
                            : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Opt-in actif</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Users Management Table */
          <>
          {(filterTab === 'inactive' || filterTab === 'incomplete' || selectedUsers.length > 0) && (
            <div className="mb-3 p-3 rounded-2xl border border-red-200 bg-red-50/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3 text-[#525E56]">
                {filterTab === 'inactive' && (
                  <label className="flex items-center gap-2">
                    <span>{locale === 'no' ? 'Ikke aktive siden' : 'Sans connexion depuis'}</span>
                    <select
                      value={inactiveDays}
                      onChange={(e) => setInactiveDays(Number(e.target.value))}
                      className="px-2 py-1 rounded-lg border border-[#E5E1D8] bg-white"
                    >
                      {[30, 60, 90, 180, 365].map((d) => (
                        <option key={d} value={d}>
                          {d} {locale === 'no' ? 'dager' : 'jours'}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {filterTab === 'incomplete' && (
                  <span>{locale === 'no' ? 'Profiler uten beskrivelse eller ikke fullført.' : 'Profils non complétés ou sans présentation.'}</span>
                )}
                <span className="font-medium text-[#1F2421]">
                  {selectedUsers.length} {locale === 'no' ? 'valgt' : 'sélectionné(s)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAllFiltered}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E1D8] bg-white hover:bg-[#FAF8F5] cursor-pointer"
                >
                  {locale === 'no' ? 'Velg alle' : 'Tout sélectionner'}
                </button>
                <button
                  type="button"
                  disabled={selectedUsers.length === 0}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{locale === 'no' ? 'Slett valgte' : 'Supprimer la sélection'}</span>
                </button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-3xl border border-[#E5E1D8] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-[#E5E1D8] text-[11px] font-semibold text-[#717A74] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 w-8"></th>
                    <th className="py-3 px-4">Utilisateur</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Statut Vipps / Paiement</th>
                    <th className="py-3 px-4">Téléphone Vipps</th>
                    <th className="py-3 px-4">Date de demande</th>
                    <th className="py-3 px-4 text-right">Actions Gestionnaire</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0ECE1]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#717A74]">
                        {locale === 'no'
                          ? 'Ingen profiler matcher dette filteret.'
                          : 'Aucun utilisateur ne correspond à ce filtre.'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isPaid = user.a_paye;
                      const isPending = !isPaid && user.vipps_status === 'pending';

                      return (
                        <tr
                          key={user.id}
                          className={`hover:bg-[#FAF8F5] transition-colors ${
                            isPending ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          <td className="py-3.5 px-3">
                            {canDeleteUser(user) && (
                              <input
                                type="checkbox"
                                checked={selectedIds.has(user.id)}
                                onChange={() => toggleSelected(user.id)}
                                className="w-4 h-4 cursor-pointer accent-red-600"
                                aria-label="Sélectionner"
                              />
                            )}
                          </td>
                          {/* User Identity */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#EAE5DC] text-[#2E4A3D] font-display text-sm font-semibold flex items-center justify-center overflow-hidden border border-[#E5E1D8] shrink-0">
                                {user.photo_url ? (
                                  <img
                                    src={user.photo_url}
                                    alt={user.prenom}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  user.prenom.charAt(0)
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-[#1F2421] flex items-center gap-1.5 flex-wrap">
                                  <span>{user.prenom}</span>
                                  {user.is_admin && (
                                    <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-1.5 py-0.2 rounded">
                                      Gestionnaire
                                    </span>
                                  )}
                                  {user.is_factice && (
                                    <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                                      Démo
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-[#717A74] block">
                                  {user.quartier || 'Oslo'} · {user.langue_maternelle === 'français' ? '🇫🇷 FR' : '🇳🇴 NO'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#525E56]">
                            {user.email || '—'}
                          </td>

                          {/* Payment Status Badge */}
                          <td className="py-3.5 px-4">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{locale === 'no' ? 'Aktiv (39 kr)' : 'Payé (Actif · 39 NOK)'}</span>
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>{locale === 'no' ? 'Venter Vipps-validering' : 'Vipps en attente'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#F0ECE1] text-[#717A74]">
                                <span>{locale === 'no' ? 'Gratis (Ikke betalt)' : 'Non payé (Gratuit)'}</span>
                              </span>
                            )}
                          </td>

                          {/* Vipps Phone */}
                          <td className="py-3.5 px-4 font-mono text-xs">
                            {user.vipps_phone ? (
                              <span className="text-[#1F2421] font-semibold flex items-center gap-1">
                                <Smartphone className="w-3.5 h-3.5 text-[#FF5B24]" />
                                <span>{user.vipps_phone}</span>
                              </span>
                            ) : (
                              <span className="text-[#8C938E] text-[11px]">Non spécifié</span>
                            )}
                          </td>

                          {/* Request Date */}
                          <td className="py-3.5 px-4 text-[11px] text-[#717A74]">
                            {user.vipps_requested_at
                              ? new Date(user.vipps_requested_at).toLocaleDateString(
                                  locale === 'no' ? 'nb-NO' : 'fr-FR',
                                  { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
                                )
                              : user.derniere_activite
                              ? new Date(user.derniere_activite).toLocaleDateString(
                                  locale === 'no' ? 'nb-NO' : 'fr-FR',
                                  { day: '2-digit', month: 'short' }
                                )
                              : '—'}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Option to simulate Vipps reception for testing */}
                              {!isPaid && !isPending && (
                                <button
                                  type="button"
                                  onClick={() => handleSimulatePendingVipps(user.id, user.prenom)}
                                  className="px-2 py-1 text-[10px] text-[#FF5B24] bg-[#FFF4F0] hover:bg-[#FFE8E0] border border-[#FFD0C0] rounded-lg transition-colors cursor-pointer"
                                  title="Simuler l'envoi de 39 kr par Vipps pour ce profil (test)"
                                >
                                  {locale === 'no' ? 'Simuler Vipps' : 'Simuler Vipps'}
                                </button>
                              )}

                              {!isPaid ? (
                                <button
                                  type="button"
                                  onClick={() => handleActivateUser(user.id, user.prenom)}
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                                    isPending
                                      ? 'bg-[#FF5B24] hover:bg-[#E54A15] text-white ring-2 ring-orange-400/50'
                                      : 'bg-[#2E4A3D] hover:bg-[#23382E] text-white'
                                  }`}
                                  title="Valider le paiement Vipps et activer l'accès illimité"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>
                                    {isPending
                                      ? locale === 'no'
                                        ? 'Godkjenn Vipps (39 kr)'
                                        : 'Valider Vipps (39 kr)'
                                      : locale === 'no'
                                      ? 'Aktiver (39 kr)'
                                      : 'Activer (39 kr)'}
                                  </span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeactivateUser(user.id, user.prenom)}
                                  className="px-2.5 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-200"
                                  title="Désactiver et repasser en accès gratuit"
                                >
                                  {locale === 'no' ? 'Deaktiver' : 'Désactiver'}
                                </button>
                              )}

                              {canDeleteUser(user) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedIds(new Set([user.id]));
                                    setShowDeleteConfirm(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-transparent text-[#8C938E] hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                                  title={locale === 'no' ? 'Slett profil' : 'Supprimer ce profil'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Manager Admin Role Toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleAdminUser(user.id, Boolean(user.is_admin), user.prenom)}
                                className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                                  user.is_admin
                                    ? 'bg-[#E8EDE6] text-[#2E4A3D] border-[#C5D7C9]'
                                    : 'text-[#8C938E] hover:text-[#1F2421] border-transparent hover:border-[#E5E1D8]'
                                }`}
                                title={user.is_admin ? 'Retirer les droits gestionnaire' : 'Nommer gestionnaire admin'}
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}
      </div>

      {/* Confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E1D8] shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-700">
              <Trash2 className="w-5 h-5" />
              <h3 className="font-display text-lg font-semibold">
                {locale === 'no' ? 'Slette profiler permanent?' : 'Supprimer définitivement ?'}
              </h3>
            </div>
            <p className="text-xs text-[#525E56] leading-relaxed">
              {selectedUsers.length} {locale === 'no' ? 'profil(er) slettes, med innloggingskonto og meldinger. Dette kan ikke angres.' : 'profil(s) seront supprimés avec leur compte de connexion et leurs messages. Cette action est irréversible.'}
            </p>
            <ul className="max-h-40 overflow-y-auto text-xs text-[#1F2421] space-y-1 bg-[#FAF8F5] rounded-xl border border-[#E5E1D8] p-3">
              {selectedUsers.slice(0, 15).map((u) => (
                <li key={u.id}>
                  {u.prenom} <span className="text-[#8C938E]">{u.email ? `— ${u.email}` : ''}</span>
                </li>
              ))}
              {selectedUsers.length > 15 && <li>… +{selectedUsers.length - 15}</li>}
            </ul>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs text-[#717A74] hover:text-[#1F2421] cursor-pointer"
              >
                {locale === 'no' ? 'Avbryt' : 'Annuler'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? '…' : locale === 'no' ? 'Slett permanent' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Activation Modal */}
      {showManualAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#E5E1D8] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#2E4A3D] text-white flex items-center justify-center font-bold text-sm">
                  +
                </div>
                <h3 className="font-display text-lg font-semibold text-[#1F2421]">
                  {locale === 'no' ? 'Aktiver bruker manuelt' : 'Activer une souscription manuellement'}
                </h3>
              </div>
              <button
                onClick={() => setShowManualAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#525E56] leading-relaxed">
              {locale === 'no'
                ? 'Oppgi e-posten til personen som har sendt 39 kr via Vipps. Profilen aktiveres umiddelbart med ubegrenset tilgang.'
                : 'Renseignez l\'adresse email de la personne ayant réglé 39 kr par Vipps. Son profil sera immédiatement activé en accès illimité.'}
            </p>

            <form onSubmit={handleManualActivate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#525E56]">
                  {locale === 'no' ? 'Brukerens e-post *' : 'Email de l\'utilisateur *'}
                </label>
                <input
                  type="email"
                  required
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="ex: marie.dupont@gmail.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#525E56]">
                  {locale === 'no' ? 'Vipps-telefonnummer (valgfritt)' : 'Numéro de téléphone Vipps (optionnel)'}
                </label>
                <input
                  type="text"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="ex: 412 34 567"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowManualAddModal(false)}
                  className="px-4 py-2 text-xs text-[#717A74] hover:text-[#1F2421]"
                >
                  {locale === 'no' ? 'Avbryt' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2E4A3D] text-white text-xs font-semibold rounded-xl hover:bg-[#23382E] transition-all shadow-xs cursor-pointer"
                >
                  {locale === 'no' ? 'Godkjenn & Aktiver (39 kr)' : 'Valider & Activer (39 kr)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
