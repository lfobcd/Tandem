import React from 'react';
import { useTranslation } from '../lib/i18n';
import {
  GraduationCap,
  Sparkles,
  ExternalLink,
  BookOpen,
  Users,
  MapPin,
  CheckCircle2,
  Globe,
  Award,
} from 'lucide-react';

interface Atelier24PromoProps {
  variant?: 'full' | 'compact';
}

export const Atelier24Promo: React.FC<Atelier24PromoProps> = ({ variant = 'full' }) => {
  const { locale } = useTranslation();

  if (variant === 'compact') {
    return (
      <aside aria-label="Partenaire Atelier 24" className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF8F5] via-white to-blue-50/40 border border-[#E5E1D8] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="h-11 px-3 rounded-xl bg-white border border-[#E5E1D8] flex items-center justify-center shrink-0 shadow-2xs">
            <img
              src="/images/atelier24_logo.svg"
              alt="Atelier 24"
              className="h-7 w-auto object-contain"
            />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {locale === 'no' ? 'Anbefalt franskskole' : 'École partenaire à Oslo'}
              </span>
              <span className="text-xs font-semibold text-[#1F2421]">Bogstadveien / Online</span>
            </div>
            <p className="text-xs text-[#525E56]">
              {locale === 'no'
                ? 'Vil du lære fransk? Små grupper, samtale og nettkurs i Oslo siden 2008.'
                : 'Voulez-vous apprendre le français ? Cours en petits groupes, ateliers et cours en ligne à Oslo.'}
            </p>
          </div>
        </div>

        <a
          href="http://atelier24.no/nb"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-xs font-medium rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
        >
          <span>atelier24.no</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </aside>
    );
  }

  return (
    <section aria-labelledby="atelier24-heading" className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FAFBFD] via-white to-[#EFF6FF] text-[#1F2421] p-6 sm:p-10 lg:p-12 shadow-sm border-2 border-blue-200/80">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Info Column */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* Atelier 24 Logo Badge */}
              <div className="bg-white px-3.5 py-1.5 rounded-xl border border-blue-200 shadow-2xs inline-flex items-center">
                <img
                  src="/images/atelier24_logo.svg"
                  alt="Atelier 24"
                  className="h-7 w-auto object-contain"
                />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#1E3A8A] text-xs font-bold border border-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-[#1E40AF]" />
                <span>
                  {locale === 'no'
                    ? 'Anbefalt franskopplæring i Oslo'
                    : 'Formation recommandée de français à Oslo'}
                </span>
              </span>
              <span className="text-xs font-semibold text-[#64748B] bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                {locale === 'no' ? 'Siden 2008' : 'Depuis 2008'}
              </span>
            </div>

            <div className="space-y-2">
              <h2 id="atelier24-heading" className="font-display text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-[#0F172A] leading-tight">
                {locale === 'no' ? (
                  <>
                    Vil du lære fransk? <br />
                    <span className="italic font-normal text-[#1E40AF]">
                      Oppdag franskkursene hos Atelier 24
                    </span>
                  </>
                ) : (
                  <>
                    Voulez-vous apprendre le français ? <br />
                    <span className="italic font-normal text-[#1E40AF]">
                      Découvrez les cours de français chez Atelier 24
                    </span>
                  </>
                )}
              </h2>

              <p className="text-sm sm:text-base text-[#334155] leading-relaxed max-w-2xl font-normal">
                {locale === 'no' ? (
                  <>
                    Ønsker du en solid og personlig franskopplæring som supplement til
                    språktandemet ditt? <strong>Atelier 24</strong> har tilbudt franskkurs for voksne i
                    små, inkluderende grupper siden 2008. Med fokus på muntlig mestring,
                    dyktige fransklærere med morsmålskompetanse og tilpasset oppfølging,
                    hjelper de deg å snakke flytende fransk med glede og selvtillit.
                  </>
                ) : (
                  <>
                    Vous cherchez une formation de français structurée et bienveillante en
                    complément de vos échanges tandems ? <strong>Atelier 24</strong> forme
                    les adultes à la langue française depuis 2008 à Oslo. Grâce à des
                    cours en petits groupes stimulants, des professeurs natifs expérimentés
                    et un suivi individuel personnalisé, vous progressez rapidement à l'oral
                    en toute convivialité.
                  </>
                )}
              </p>
            </div>

            {/* Key benefits list with high-contrast cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-2 text-xs text-[#1E293B]">
              <div className="p-3 rounded-xl bg-white border border-blue-100/90 shadow-2xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#1E40AF] shrink-0 mt-0.5" />
                <span className="font-medium">
                  {locale === 'no'
                    ? 'Nivå A1 til C1: Grunnkurs, hverdagsspråk og viderekomne'
                    : 'Niveaux A1 à C1 : Débutant complet, intermédiaire et perfectionnement'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-blue-100/90 shadow-2xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#1E40AF] shrink-0 mt-0.5" />
                <span className="font-medium">
                  {locale === 'no'
                    ? 'Små grupper i Oslo (Bogstadveien) & nettkurs i hele Norge'
                    : 'Petits groupes à Oslo (Bogstadveien) & cours en ligne partout en Norvège'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-blue-100/90 shadow-2xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#1E40AF] shrink-0 mt-0.5" />
                <span className="font-medium">
                  {locale === 'no'
                    ? 'Eget uttalekurs og tematiske samtaleworkshops'
                    : 'Cours de prononciation / phonétique et ateliers de conversation'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-blue-100/90 shadow-2xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#1E40AF] shrink-0 mt-0.5" />
                <span className="font-medium">
                  {locale === 'no'
                    ? 'Individuell veiledningstime for å finne riktig nivå'
                    : 'Séance d\'orientation personnalisée pour évaluer votre niveau'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Card Column */}
          <div className="lg:col-span-4 flex flex-col justify-center">
            <div className="p-6 rounded-2xl bg-white border-2 border-blue-200/90 text-center space-y-4 shadow-sm">
              {/* Official Atelier 24 Logo Card */}
              <div className="bg-[#FAFBFD] p-3.5 rounded-2xl border border-blue-100 inline-flex items-center justify-center max-w-[200px] mx-auto w-full">
                <img
                  src="/images/atelier24_logo.svg"
                  alt="Atelier 24 Logo"
                  className="w-full h-auto max-h-12 object-contain"
                />
              </div>

              <div>
                <span className="text-xs text-[#1E3A8A] font-bold block">
                  {locale === 'no' ? 'Franskkurs i Oslo & Online' : 'Cours de français à Oslo & En ligne'}
                </span>
                <span className="text-xs text-[#64748B] block mt-1 font-medium">
                  Holtegata / Bogstadveien · Oslo
                </span>
              </div>

              <div className="pt-1">
                <a
                  href="http://atelier24.no/nb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-[#1E40AF] hover:bg-[#1D4ED8] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>
                    {locale === 'no'
                      ? 'Besøk atelier24.no'
                      : 'Découvrir atelier24.no'}
                  </span>
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <span className="text-[11px] font-mono text-[#64748B] block mt-2">
                  http://atelier24.no/nb
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-[#64748B] flex items-center justify-center gap-1.5">
                <span>🇫🇷</span>
                <span>{locale === 'no' ? 'Morsmålslærere · Små grupper' : 'Professeurs natifs · Petits groupes'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
