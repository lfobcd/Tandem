import React, { useState } from 'react';
import {
  PageView,
  UserProfile,
  Language,
  CEFRLevel,
  DayOfWeek,
  TimeSlot,
  PreferredPlace,
  SUPPORTED_LANGUAGES,
} from '../types';
import { dataStore } from '../lib/supabase';
import { useTranslation } from '../lib/i18n';
import { MapboxPicker } from '../components/MapboxPicker';
import { PhotoUpload } from '../components/PhotoUpload';
import { PROFILE_MIN_BIO, isProfileComplete } from '../lib/supabase';
import {
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
  Globe,
  Camera,
  CheckCircle2,
} from 'lucide-react';

interface ProfileEditPageProps {
  currentUser: UserProfile;
  onNavigate: (page: PageView) => void;
  onProfileUpdated: (user: UserProfile) => void;
}

const CEFR_LEVELS: { level: CEFRLevel; descFr: string; descNo: string }[] = [
  { level: 'A1', descFr: 'Débutant complet', descNo: 'Helt nybegynner' },
  { level: 'A2', descFr: 'Élémentaire (phrases simples)', descNo: 'Elementært nivå' },
  { level: 'B1', descFr: 'Intermédiaire (conversation de base)', descNo: 'Mellomnivå (hverdagsspråk)' },
  { level: 'B2', descFr: 'Intermédiaire supérieur (fluide)', descNo: 'Selvstendig bruker' },
  { level: 'C1', descFr: 'Avancé (autonome)', descNo: 'Avansert nivå' },
  { level: 'C2', descFr: 'Bilingue / Maîtrise parfaite', descNo: 'Morsmålslik beherskelse' },
];

const DAYS_OF_WEEK: { id: DayOfWeek; labelFr: string; labelNo: string }[] = [
  { id: 'lundi', labelFr: 'Lun', labelNo: 'Man' },
  { id: 'mardi', labelFr: 'Mar', labelNo: 'Tir' },
  { id: 'mercredi', labelFr: 'Mer', labelNo: 'Ons' },
  { id: 'jeudi', labelFr: 'Jeu', labelNo: 'Tor' },
  { id: 'vendredi', labelFr: 'Ven', labelNo: 'Fre' },
  { id: 'samedi', labelFr: 'Sam', labelNo: 'Lør' },
  { id: 'dimanche', labelFr: 'Dim', labelNo: 'Søn' },
];

export const ProfileEditPage: React.FC<ProfileEditPageProps> = ({
  currentUser,
  onNavigate,
  onProfileUpdated,
}) => {
  const { t, locale } = useTranslation();
  const [prenom, setPrenom] = useState(currentUser.prenom || '');
  const [langueMaternelle, setLangueMaternelle] = useState<Language>(currentUser.langue_maternelle || 'français');
  const [langueApprise, setLangueApprise] = useState<Language>(currentUser.langue_apprise || 'norvégien');
  const [languesSecondaires, setLanguesSecondaires] = useState<Language[]>(currentUser.langues_secondaires || []);
  const [niveau, setNiveau] = useState<CEFRLevel>(currentUser.niveau || 'B1');
  const [quartier, setQuartier] = useState(currentUser.quartier || 'Grünerløkka, Oslo');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [envies, setEnvies] = useState(
    currentUser.envies || (locale === 'no' ? 'Uformell prat over en kaffe og kulturutveksling.' : "Conversation informelle autour d'un café, échanges culturels et correction bienveillante.")
  );
  const [photoUrl, setPhotoUrl] = useState(currentUser.photo_url || '');
  const [saveError, setSaveError] = useState('');
  const [lieux, setLieux] = useState<PreferredPlace[]>(currentUser.lieux_preferes || []);
  const [disponibilites, setDisponibilites] = useState(currentUser.disponibilites || []);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const SLOTS: { id: TimeSlot; label: string }[] = [
    { id: 'matin', label: locale === 'no' ? 'Morgen' : 'Matin' },
    { id: 'apres-midi', label: locale === 'no' ? 'Ettermiddag' : 'Après-midi' },
    { id: 'soir', label: locale === 'no' ? 'Kveld' : 'Soir' },
  ];

  const toggleSlot = (day: DayOfWeek, slot: TimeSlot) => {
    const existingDay = disponibilites.find((d) => d.day === day);
    if (!existingDay) {
      setDisponibilites([...disponibilites, { day, slots: [slot] }]);
    } else {
      const hasSlot = existingDay.slots.includes(slot);
      const newSlots = hasSlot
        ? existingDay.slots.filter((s) => s !== slot)
        : [...existingDay.slots, slot];

      if (newSlots.length === 0) {
        setDisponibilites(disponibilites.filter((d) => d.day !== day));
      } else {
        setDisponibilites(
          disponibilites.map((d) => (d.day === day ? { ...d, slots: newSlots } : d))
        );
      }
    }
  };

  const isSlotActive = (day: DayOfWeek, slot: TimeSlot): boolean => {
    const d = disponibilites.find((item) => item.day === day);
    return d ? d.slots.includes(slot) : false;
  };

  const toggleSecondaryLanguage = (langId: string) => {
    if (languesSecondaires.includes(langId)) {
      setLanguesSecondaires(languesSecondaires.filter((l) => l !== langId));
    } else {
      setLanguesSecondaires([...languesSecondaires, langId]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!photoUrl) {
      setSaveError(locale === 'no' ? 'Et profilbilde er obligatorisk.' : 'Une photo de profil est obligatoire.');
      return;
    }
    if (bio.trim().length < PROFILE_MIN_BIO) {
      setSaveError(
        locale === 'no'
          ? `Presenter deg selv med minst ${PROFILE_MIN_BIO} tegn.`
          : `Présentez-vous en au moins ${PROFILE_MIN_BIO} caractères.`
      );
      return;
    }
    setSaveError('');

    const updated = dataStore.updateCurrentUser({
      prenom,
      langue_maternelle: langueMaternelle,
      langue_apprise: langueApprise,
      langues_secondaires: languesSecondaires,
      niveau,
      quartier,
      bio,
      envies,
      photo_url: photoUrl,
      lieux_preferes: lieux,
      disponibilites,
      is_completed: true,
    });

    onProfileUpdated(updated);
    setSavedSuccess(true);

    setTimeout(() => {
      setSavedSuccess(false);
      onNavigate('discovery');
    }, 700);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white rounded-3xl border border-[#E5E1D8] shadow-xs p-6 sm:p-10 space-y-8">
        {/* Header */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-[#2E4A3D] uppercase tracking-wider block">
            Tandem Oslo
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-normal text-[#1F2421]">
            {t.editTitle}
          </h1>
          <p className="text-xs sm:text-sm text-[#525E56] leading-relaxed">
            {t.editSubtitle}
          </p>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-[#E8EDE6] text-[#2E4A3D] text-xs font-medium rounded-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2E4A3D]" />
            <span>{t.editSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Section 1: Informations de base & Photo */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#2E4A3D]">
              1. {t.authNameLabel} & {t.neighborhoodLabel}
            </h2>

            {!isProfileComplete(currentUser) && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                {locale === 'no'
                  ? 'For å fortsette må du legge til et profilbilde og en presentasjon (minst 30 tegn).'
                  : 'Pour continuer, ajoutez une photo de profil et une présentation (30 caractères minimum).'}
              </div>
            )}
            {saveError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">{saveError}</div>
            )}

            <PhotoUpload
              value={photoUrl}
              onChange={setPhotoUrl}
              prenom={prenom}
              uploadOnly
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#525E56]">
                  {t.authNameLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder={t.authNamePlaceholder}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#525E56]">
                  {t.neighborhoodLabel} *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-[#8C938E]" />
                  <input
                    type="text"
                    required
                    value={quartier}
                    onChange={(e) => setQuartier(e.target.value)}
                    placeholder={t.neighborhoodPlaceholder}
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D]"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-[#717A74]">
                  <span className="text-[10px] text-[#8C938E]">Exemples :</span>
                  {['Grünerløkka, Oslo', 'Majorstuen, Oslo', 'Frogner, Oslo', 'Sentrum, Bergen', 'Bakklandet, Trondheim'].map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setQuartier(sugg)}
                      className="text-[#2E4A3D] hover:underline cursor-pointer bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#E5E1D8] text-[11px]"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Langues & Niveaux (Extensible Phase 2) */}
          <div className="border-t border-[#E5E1D8] pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#2E4A3D]">
                2. {t.languagesSection}
              </h2>
              <span className="text-[10px] text-[#717A74] bg-[#F5F2EB] px-2 py-0.5 rounded-full flex items-center gap-1">
                <Globe className="w-3 h-3 text-[#2E4A3D]" />
                <span>Phase 1 : 🇫🇷 🇳🇴 · Phase 2 prévue</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#525E56]">{t.nativeLang}</label>
                <select
                  value={langueMaternelle}
                  onChange={(e) => {
                    const lm = e.target.value as Language;
                    setLangueMaternelle(lm);
                    if (lm === 'français') setLangueApprise('norvégien');
                    else if (lm === 'norvégien') setLangueApprise('français');
                  }}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D]"
                >
                  <optgroup label={t.primaryLanguagesGroup}>
                    <option value="français">🇫🇷 Français</option>
                    <option value="norvégien">🇳🇴 Norsk</option>
                  </optgroup>
                  <optgroup label={t.upcomingLanguagesGroup}>
                    {SUPPORTED_LANGUAGES.filter((l) => !l.isPrimary).map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.flag} {locale === 'no' ? l.labelNo : l.labelFr}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#525E56]">{t.targetLang}</label>
                <select
                  value={langueApprise}
                  onChange={(e) => setLangueApprise(e.target.value as Language)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D]"
                >
                  <optgroup label={t.primaryLanguagesGroup}>
                    <option value="norvégien">🇳🇴 Norsk</option>
                    <option value="français">🇫🇷 Français</option>
                  </optgroup>
                  <optgroup label={t.upcomingLanguagesGroup}>
                    {SUPPORTED_LANGUAGES.filter((l) => !l.isPrimary).map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.flag} {locale === 'no' ? l.labelNo : l.labelFr}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Phase 2: Secondary / other languages of interest */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] space-y-2">
              <div>
                <span className="text-xs font-semibold text-[#1F2421] block">
                  {t.secondaryLanguagesLabel}
                </span>
                <span className="text-[11px] text-[#717A74]">
                  {t.secondaryLanguagesDesc}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {SUPPORTED_LANGUAGES.map((l) => {
                  const isNative = l.id === langueMaternelle;
                  const isTarget = l.id === langueApprise;
                  if (isNative || isTarget) return null;

                  const isChecked = languesSecondaires.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => toggleSecondaryLanguage(l.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                        isChecked
                          ? 'bg-[#2E4A3D] text-white shadow-xs'
                          : 'bg-white border border-[#E5E1D8] text-[#525E56] hover:border-[#2E4A3D]'
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{locale === 'no' ? l.labelNo : l.labelFr}</span>
                      {isChecked && <span className="text-[10px]">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CEFR Level Selector */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-medium text-[#525E56] block">
                {t.targetLevel} ({langueApprise})
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {CEFR_LEVELS.map((lvl) => {
                  const isSelected = niveau === lvl.level;
                  return (
                    <button
                      key={lvl.level}
                      type="button"
                      onClick={() => setNiveau(lvl.level)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#2E4A3D] bg-[#F2F6F3] shadow-xs'
                          : 'border-[#E5E1D8] bg-white hover:border-[#D0C9BC]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-display font-semibold text-[#1F2421] text-base">
                          {lvl.level}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#2E4A3D]"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#717A74] leading-tight">
                        {locale === 'no' ? lvl.descNo : lvl.descFr}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 3: Carte interactive Mapbox */}
          <div className="border-t border-[#E5E1D8] pt-6 space-y-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#2E4A3D]">
                3. {t.favoritePlacesSection}
              </h2>
              <p className="text-xs text-[#525E56] mt-0.5">
                {t.favoritePlacesDesc}
              </p>
            </div>

            <MapboxPicker
              places={lieux}
              onChange={setLieux}
              maxPlaces={3}
            />
          </div>

          {/* Section 4: Disponibilités hebdomadaires */}
          <div className="border-t border-[#E5E1D8] pt-6 space-y-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#2E4A3D]">
                4. {t.availabilitySection}
              </h2>
              <p className="text-xs text-[#525E56] mt-0.5">
                {t.availabilityDesc}
              </p>
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="min-w-[500px] border border-[#E5E1D8] rounded-2xl overflow-hidden bg-white">
                <div className="grid grid-cols-8 bg-[#FAF8F5] border-b border-[#E5E1D8] text-[11px] font-semibold text-[#717A74] py-2.5 px-3">
                  <span className="text-left">{locale === 'no' ? 'Tid' : 'Créneau'}</span>
                  {DAYS_OF_WEEK.map((d) => (
                    <span key={d.id} className="text-center">
                      {locale === 'no' ? d.labelNo : d.labelFr}
                    </span>
                  ))}
                </div>

                {SLOTS.map((slot) => (
                  <div
                    key={slot.id}
                    className="grid grid-cols-8 border-b border-[#F0ECE1] last:border-b-0 py-2.5 px-3 items-center text-xs"
                  >
                    <span className="text-[#525E56] font-medium text-[11px]">
                      {slot.label}
                    </span>
                    {DAYS_OF_WEEK.map((day) => {
                      const active = isSlotActive(day.id, slot.id);
                      return (
                        <div key={day.id} className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => toggleSlot(day.id, slot.id)}
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                              active
                                ? 'bg-[#2E4A3D] text-white border-[#2E4A3D]'
                                : 'bg-[#FAF8F5] text-[#8C938E] border-[#E5E1D8] hover:border-[#2E4A3D]'
                            }`}
                            title={`${day.labelFr} - ${slot.label}`}
                          >
                            <Clock className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-[#8C938E]'}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5: Bio & Envies */}
          <div className="border-t border-[#E5E1D8] pt-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#2E4A3D]">
              5. {t.bioSection}
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#525E56]">
                {t.bioLabel}
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t.bioPlaceholder}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D] leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#525E56]">
                {t.desiresLabel}
              </label>
              <input
                type="text"
                value={envies}
                onChange={(e) => setEnvies(e.target.value)}
                placeholder={t.desiresPlaceholder}
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#E5E1D8] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate('discovery')}
              className="px-5 py-2.5 text-xs text-[#717A74] hover:text-[#1F2421] transition-colors cursor-pointer"
            >
              {t.cancelBtn}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#2E4A3D] text-white text-xs font-medium rounded-xl hover:bg-[#23382E] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span>{t.saveProfileBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
