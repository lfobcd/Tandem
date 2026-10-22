import React, { useState, useEffect, useMemo } from 'react';
import { PageView, UserProfile } from '../types';
import { dataStore, VippsPaymentRequest } from '../lib/supabase';
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
} from 'lucide-react';

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

  // Authentication check: bcdlfo@gmail.com has automatic full manager access
  const isOwnerEmail = currentUser?.email?.toLowerCase() === 'bcdlfo@gmail.com';
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return isOwnerEmail || Boolean(currentUser?.is_admin);
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Users and requests state
  const [users, setUsers] = useState<UserProfile[]>(() => dataStore.adminGetAllUsers());
  const [vippsRequests, setVippsRequests] = useState<VippsPaymentRequest[]>(() =>
    dataStore.getVippsRequests()
  );

  // Filters & Search
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'paid' | 'free'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(
    null
  );

  // Manual activate modal
  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');

  // Reload data
  const reloadData = () => {
    setUsers(dataStore.adminGetAllUsers());
    setVippsRequests(dataStore.getVippsRequests());
    if (onRefreshData) onRefreshData();
  };

  useEffect(() => {
    reloadData();
    const handleStorageUpdate = () => reloadData();
    window.addEventListener('tandem_profiles_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('tandem_profiles_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Stats
  const stats = useMemo(() => {
    const totalMembers = users.length;
    const paidUsers = users.filter((u) => u.a_paye).length;
    const pendingVipps = users.filter((u) => !u.a_paye && u.vipps_status === 'pending').length;
    const freeUsers = totalMembers - paidUsers;
    const revenueNOK = paidUsers * 39;

    return { totalMembers, paidUsers, pendingVipps, freeUsers, revenueNOK };
  }, [users]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Tab filter
      if (filterTab === 'pending' && (u.a_paye || u.vipps_status !== 'pending')) return false;
      if (filterTab === 'paid' && !u.a_paye) return false;
      if (filterTab === 'free' && u.a_paye) return false;

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
  }, [users, filterTab, searchQuery]);

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

  // Handle Passcode Unlock
  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === 'vipps2026' || pinInput.trim() === 'admin' || pinInput.trim() === '2424') {
      setIsAdminUnlocked(true);
      localStorage.setItem('tandem_admin_session', 'true');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // PIN Lock Screen
  if (!isAdminUnlocked) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#2E4A3D] text-white flex items-center justify-center mx-auto shadow-md">
          <ShieldCheck className="w-8 h-8 text-emerald-300" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl font-semibold text-[#1F2421]">
            {locale === 'no' ? 'Administratorinnlogging' : 'Espace Gestionnaire & Souscriptions Vipps'}
          </h1>
          <p className="text-xs text-[#525E56] leading-relaxed">
            {locale === 'no'
              ? 'Administrer Vipps-betalinger (92 13 17 92) og aktiver brukerkontoer.'
              : 'Gérez les souscriptions Vipps (92 13 17 92) et activez les profils ayant payé.'}
          </p>
        </div>

        <form onSubmit={handleUnlockPin} className="p-6 bg-white rounded-3xl border border-[#E5E1D8] shadow-xs space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-medium text-[#525E56]">
              {locale === 'no' ? 'Administrator-PIN eller passord' : 'Code PIN Gestionnaire'}
            </label>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              placeholder="Code (ex: vipps2026)"
              className="w-full px-4 py-2.5 text-sm bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D] text-center font-mono tracking-widest"
              autoFocus
            />
          </div>

          {pinError && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-xl border border-red-200">
              {locale === 'no' ? 'Ugyldig PIN-kode.' : 'Code incorrect. Indice : vipps2026'}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[#2E4A3D] hover:bg-[#23382E] text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4" />
            <span>{locale === 'no' ? 'Lås opp administrasjon' : 'Accéder à la gestion'}</span>
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => onNavigate('auth')}
              className="text-[11px] text-[#717A74] hover:text-[#1F2421] cursor-pointer"
            >
              {locale === 'no'
                ? 'Logg inn med administrator-epost (bcdlfo@gmail.com)'
                : 'Se connecter avec l\'email gestionnaire (bcdlfo@gmail.com)'}
            </button>
          </div>
        </form>
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
            <span>{locale === 'no' ? 'Eksporter CSV' : 'Exporter CSV'}</span>
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Members */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#717A74]">
            <span>{locale === 'no' ? 'Totalt medlemmer' : 'Membres inscrits'}</span>
            <Users className="w-4 h-4 text-[#2E4A3D]" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-semibold text-[#1F2421]">
            {stats.totalMembers}
          </div>
          <p className="text-[11px] text-[#8C938E]">
            {stats.freeUsers} {locale === 'no' ? 'på gratisnivå' : 'en accès gratuit'}
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
            {stats.paidUsers} × 39 kr {locale === 'no' ? 'engangssum' : 'cotisations uniques'}
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
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'all'
                  ? 'bg-white text-[#1F2421] shadow-2xs font-semibold'
                  : 'text-[#717A74] hover:text-[#1F2421]'
              }`}
            >
              {locale === 'no' ? 'Alle medlemmer' : 'Tous les membres'} ({stats.totalMembers})
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
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C938E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                locale === 'no'
                  ? 'Søk navn, e-post, tlf...'
                  : 'Rechercher nom, email, tél...'
              }
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D]"
            />
          </div>
        </div>

        {/* Users Management Table */}
        <div className="bg-white rounded-3xl border border-[#E5E1D8] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E5E1D8] text-[11px] font-semibold text-[#717A74] uppercase tracking-wider">
                <tr>
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
                    <td colSpan={6} className="py-8 text-center text-xs text-[#717A74]">
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
      </div>

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
