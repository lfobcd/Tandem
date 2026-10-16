import React, { useState, useMemo } from 'react';
import { useTranslation } from '../lib/i18n';
import { FAQ_ITEMS, FAQ_GOLDEN_RULES, FaqCategory } from '../data/faqData';
import { PageView, UserProfile } from '../types';
import {
  ChevronDown,
  Search,
  X,
  HelpCircle,
  Clock,
  HeartHandshake,
  Coffee,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';

interface FaqSectionProps {
  onNavigate: (page: PageView) => void;
  currentUser: UserProfile | null;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ onNavigate, currentUser }) => {
  const { t, locale } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    'how-tandem-works': true, // Open the first item by default for immediate clarity
    'language-level': true, // And level question
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    FAQ_ITEMS.forEach((item) => {
      all[item.id] = true;
    });
    setExpandedIds(all);
  };

  const collapseAll = () => {
    setExpandedIds({});
  };

  // Filter questions based on category and search query
  const filteredFaq = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      // Category check
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Search query check
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const question = (locale === 'no' ? item.questionNo : item.questionFr).toLowerCase();
      const answer = (locale === 'no' ? item.answerNo : item.answerFr).toLowerCase();
      const badge = ((locale === 'no' ? item.badgeNo : item.badgeFr) || '').toLowerCase();
      const matchKeywords = item.keywords.some((k) => k.toLowerCase().includes(q));

      return question.includes(q) || answer.includes(q) || badge.includes(q) || matchKeywords;
    });
  }, [selectedCategory, searchQuery, locale]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    return {
      all: FAQ_ITEMS.length,
      basics: FAQ_ITEMS.filter((i) => i.category === 'basics').length,
      practical: FAQ_ITEMS.filter((i) => i.category === 'practical').length,
      pricing: FAQ_ITEMS.filter((i) => i.category === 'pricing').length,
    };
  }, []);

  return (
    <section id="faq" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16">
      {/* 1. Header with Badge & Lead */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAE5DC] text-[#2E4A3D] text-xs font-medium tracking-wide">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{t.faqBadge}</span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-normal text-[#1F2421] tracking-tight">
          {t.faqTitle}
        </h2>
        <p className="text-xs sm:text-sm text-[#525E56] leading-relaxed">
          {t.faqSubtitle}
        </p>
      </div>

      {/* 2. Three Golden Rules for Tandem Success */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF8F5] border border-[#E5E1D8] space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAE5DC] pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#2E4A3D] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2E4A3D]" />
              {t.faqGoldenRulesBadge}
            </span>
            <h3 className="font-display text-xl sm:text-2xl font-normal text-[#1F2421]">
              {t.faqGoldenRulesTitle}
            </h3>
          </div>
          <p className="text-xs text-[#717A74] max-w-md">
            {t.faqGoldenRulesSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FAQ_GOLDEN_RULES.map((rule, idx) => {
            const icons = [
              <Clock key="clock" className="w-4 h-4 text-[#2E4A3D]" />,
              <HeartHandshake key="heart" className="w-4 h-4 text-[#2E4A3D]" />,
              <Coffee key="coffee" className="w-4 h-4 text-[#2E4A3D]" />,
            ];

            return (
              <div
                key={rule.step}
                className="p-5 rounded-2xl bg-white border border-[#E5E1D8] flex flex-col justify-between space-y-3 relative hover:border-[#2E4A3D] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F2EFE9] text-[#2E4A3D]">
                    {rule.step}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-[#EAE5DC] flex items-center justify-center">
                    {icons[idx]}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-display text-base font-normal text-[#1F2421]">
                    {locale === 'no' ? rule.titleNo : rule.titleFr}
                  </h4>
                  <p className="text-xs text-[#525E56] leading-relaxed">
                    {locale === 'no' ? rule.descNo : rule.descFr}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#F5F2EB]">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#717A74]">
                    {locale === 'no' ? rule.tagNo : rule.tagFr}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Search Bar and Category Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: t.faqFilterAll, count: categoryCounts.all },
              { id: 'basics', label: t.faqFilterBasics, count: categoryCounts.basics },
              { id: 'practical', label: t.faqFilterPractical, count: categoryCounts.practical },
              { id: 'pricing', label: t.faqFilterPricing, count: categoryCounts.pricing },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as FaqCategory)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-[#2E4A3D] text-white shadow-xs'
                    : 'bg-white border border-[#E5E1D8] text-[#525E56] hover:text-[#1F2421] hover:bg-[#FAF8F5]'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-[#EAE5DC] text-[#717A74]'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Expand / Collapse all toggles */}
          <div className="flex items-center gap-2 text-xs text-[#717A74] self-end md:self-auto">
            <button
              onClick={expandAll}
              className="hover:text-[#2E4A3D] underline cursor-pointer text-[11px]"
            >
              {locale === 'no' ? 'Åpne alle' : 'Tout déplier'}
            </button>
            <span>·</span>
            <button
              onClick={collapseAll}
              className="hover:text-[#2E4A3D] underline cursor-pointer text-[11px]"
            >
              {locale === 'no' ? 'Lukk alle' : 'Tout replier'}
            </button>
          </div>
        </div>

        {/* Live Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8C938E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.faqSearchPlaceholder}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E5E1D8] rounded-xl text-xs sm:text-sm text-[#1F2421] placeholder-[#8C938E] focus:outline-none focus:border-[#2E4A3D] transition-colors shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8C938E] hover:text-[#1F2421] cursor-pointer"
              title="Effacer le filtre"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Accordion List */}
      <div className="space-y-3">
        {filteredFaq.length > 0 ? (
          filteredFaq.map((item) => {
            const isExpanded = !!expandedIds[item.id];
            const question = locale === 'no' ? item.questionNo : item.questionFr;
            const answer = locale === 'no' ? item.answerNo : item.answerFr;
            const badge = locale === 'no' ? item.badgeNo : item.badgeFr;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-xs ${
                  isExpanded ? 'border-[#2E4A3D] ring-1 ring-[#2E4A3D]/10' : 'border-[#E5E1D8] hover:border-[#C4BCAB]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(item.id)}
                  aria-expanded={isExpanded}
                  className="w-full p-5 text-left flex items-start justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="space-y-1.5 pr-2">
                    {badge && (
                      <span className="inline-block text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#2E4A3D] border border-[#E5E1D8]">
                        {badge}
                      </span>
                    )}
                    <h3 className="font-display text-base sm:text-lg font-normal text-[#1F2421] leading-snug">
                      {question}
                    </h3>
                  </div>

                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 mt-1 ${
                      isExpanded ? 'bg-[#2E4A3D] text-white rotate-180' : 'bg-[#F2EFE9] text-[#717A74]'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#525E56] leading-relaxed border-t border-[#F5F2EB]/80 animate-in fade-in-50 duration-150">
                    <p>{answer}</p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 p-6 rounded-2xl bg-[#FAF8F5] border border-dashed border-[#E5E1D8] space-y-3">
            <HelpCircle className="w-8 h-8 text-[#8C938E] mx-auto" />
            <p className="text-sm font-medium text-[#1F2421]">{t.faqNoResults}</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-white border border-[#E5E1D8] rounded-xl text-xs font-medium text-[#2E4A3D] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
            >
              {t.faqResetSearch}
            </button>
          </div>
        )}
      </div>

      {/* 5. Pre-Registration Trust Reassurance Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-full bg-[#EAE5DC] text-[#2E4A3D] flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1F2421]">
              {locale === 'no' ? '100% trygt & fordomsfritt' : '100% bienveillant & sans jugement'}
            </h4>
            <p className="text-xs text-[#525E56] leading-relaxed">
              {locale === 'no'
                ? 'Ingen tester, ingen evaluering. Våre medlemmer er her for å hjelpe hverandre over en uformell prat.'
                : 'Pas de contrôle, pas d’évaluation. Tous les membres sont ici dans le même but : s’entraider avec le sourire.'}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-full bg-[#EAE5DC] text-[#2E4A3D] flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1F2421]">
              {locale === 'no' ? 'Gratis utforsking & ingen binding' : 'Gratuit à l’inscription & sans abonnement'}
            </h4>
            <p className="text-xs text-[#525E56] leading-relaxed">
              {locale === 'no'
                ? 'Opprett profilen din, se hvem som er tilgjengelige i bydelen din og ta initiativ i ditt eget tempo.'
                : 'Créez votre profil, explorez les membres disponibles dans votre quartier et démarrez à votre rythme.'}
            </p>
          </div>
        </div>
      </div>

      {/* 6. Pre-Registration Conversion CTA */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#FAF8F5] to-[#F2EFE9] border border-[#E5E1D8] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5 text-center sm:text-left max-w-lg">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[#2E4A3D]">
            {locale === 'no' ? 'Bli med i dag' : 'Rejoignez la communauté'}
          </span>
          <h3 className="font-display text-xl sm:text-2xl font-normal text-[#1F2421]">
            {t.faqCtaTitle}
          </h3>
          <p className="text-xs text-[#525E56] leading-relaxed">
            {t.faqCtaSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate(currentUser ? 'discovery' : 'auth')}
            className="px-6 py-3 bg-[#2E4A3D] text-white text-xs sm:text-sm font-medium rounded-xl hover:bg-[#23382E] transition-all flex items-center gap-2 shadow-xs cursor-pointer group"
          >
            <span>{t.faqCtaBtn}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* 7. Still Have Questions Support Line */}
      <div className="text-center pt-2 text-xs text-[#717A74] space-y-1">
        <p className="font-medium text-[#1F2421]">{t.faqStillHaveQuestions}</p>
        <p>{t.faqContactSupport}</p>
      </div>
    </section>
  );
};
