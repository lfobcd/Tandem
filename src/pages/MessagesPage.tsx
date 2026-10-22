import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PageView, UserProfile, Conversation, Message } from '../types';
import { dataStore } from '../lib/supabase';
import { useTranslation } from '../lib/i18n';
import { MapboxViewer } from '../components/MapboxViewer';
import {
  Send,
  MessageSquare,
  ShieldAlert,
  MapPin,
  ArrowLeft,
  Plus,
  X,
  Coffee,
  Sparkles,
  Check,
  CheckCheck,
  Search,
} from 'lucide-react';

interface MessagesPageProps {
  currentUser: UserProfile;
  initialConversationId?: string | null;
  onNavigate: (page: PageView) => void;
}

// Subtle audio chime on incoming simulated messages
const playMessageChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio context may be restricted before user gesture
  }
};

// Generate contextual simulated responses for tandem partners
const getPartnerReply = (partner: UserProfile, userText: string): string => {
  const isNorwegian = partner.langue_maternelle?.toLowerCase() === 'norvégien';
  const place = partner.lieux_preferes?.[0]?.label || 'Café Fuglen';

  if (isNorwegian) {
    const norwegianReplies = [
      `Hei ! Takk for hyggelig melding ! Ja, jeg vil veldig gjerne møtes for en kaffe. Passer det for deg på ${place} torsdag ettermiddag ? Vi snakkes !`,
      `Hei ! Så kjekt å høre fra deg ! Oui, j'aimerais beaucoup pratiquer mon français avec toi. On pourrait faire 30 minutes en français et 30 minutes en norvégien, qu'en penses-tu ?`,
      `Hei ! Veldig gjerne. Hva med en prat over en god kopp kaffe på ${place} ? Ha en kjempefin dag videre !`,
      `Hei ! Kjempebra forslag. Jeg gleder meg til å bli kjent og øve sammen ! Passer torsdag eller lørdag best for deg ?`,
    ];
    return norwegianReplies[Math.floor(Math.random() * norwegianReplies.length)];
  } else {
    const frenchReplies = [
      `Salut ! Merci pour ton message, ça fait super plaisir ! Je serais ravi(e) de converser avec toi. Tu es plutôt dispo en semaine ou le weekend vers ${place} ?`,
      `Coucou ! Très partant(e) pour un café tandem. On pourrait se donner rendez-vous chez ${place} ou dans le centre. Tu as des créneaux de libre cette semaine ?`,
      `Salut ! Génial, exactement ce que je cherchais ! On se prend un café cette semaine pour tester notre tandem ? À très vite !`,
    ];
    return frenchReplies[Math.floor(Math.random() * frenchReplies.length)];
  }
};

export const MessagesPage: React.FC<MessagesPageProps> = ({
  currentUser,
  initialConversationId,
  onNavigate,
}) => {
  const { t, locale } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    dataStore.getConversations()
  );
  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    initialConversationId || conversations[0]?.id || null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showPartnerSpots, setShowPartnerSpots] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyTimeoutRef = useRef<any>(null);

  // Sync initial conversation from props
  useEffect(() => {
    if (initialConversationId) {
      setSelectedConvId(initialConversationId);
    } else if (!selectedConvId && conversations.length > 0) {
      setSelectedConvId(conversations[0].id);
    }
  }, [initialConversationId, conversations, selectedConvId]);

  // Load messages whenever selected conversation changes
  useEffect(() => {
    if (selectedConvId) {
      const msgs = dataStore.getMessages(selectedConvId);
      setMessages(msgs);
      setIsPartnerTyping(false);
    }
  }, [selectedConvId]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  // Listen to message updates from custom events or storage
  useEffect(() => {
    const handleUpdate = () => {
      setConversations(dataStore.getConversations());
      if (selectedConvId) {
        setMessages(dataStore.getMessages(selectedConvId));
      }
    };

    window.addEventListener('tandem_messages_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('tandem_messages_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current);
    };
  }, [selectedConvId]);

  const currentConv = conversations.find((c) => c.id === selectedConvId);
  const partner = currentConv?.other_user;

  // All community profiles available to start a conversation with
  const availableMembers = useMemo(() => {
    const all = dataStore.getProfiles();
    return all.filter((p) => p.id !== currentUser.id);
  }, [currentUser.id]);

  const filteredMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return availableMembers;
    const q = memberSearchQuery.toLowerCase();
    return availableMembers.filter(
      (m) =>
        m.prenom.toLowerCase().includes(q) ||
        m.quartier.toLowerCase().includes(q) ||
        m.langue_maternelle.toLowerCase().includes(q)
    );
  }, [availableMembers, memberSearchQuery]);

  // Quick message suggestions for easy testing
  const suggestions = useMemo(() => {
    if (locale === 'no') {
      return [
        '☕ Hei! Har du lyst til å ta en kaffe en dag?',
        '🇫🇷 Hei! Jeg vil gjerne øve på fransk.',
        '📅 Når passer det best for deg denne uken?',
        '📍 Har du en favorittkafé i Oslo?',
      ];
    }
    return [
      '☕ Bonjour ! Serais-tu partant(e) pour un café cette semaine ?',
      '🇳🇴 Hei ! J\'aimerais beaucoup pratiquer mon norvégien avec toi.',
      '📅 Quelles sont tes disponibilités ces jours-ci ?',
      '📍 Quel est ton café préféré à Oslo ?',
    ];
  }, [locale]);

  const handleSendMessage = (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (overrideText || inputValue).trim();
    if (!textToSend || !selectedConvId) return;

    // Send user message
    const newMsg = dataStore.sendMessage(selectedConvId, textToSend, currentUser.id);
    setMessages((prev) => [...prev, newMsg]);
    setInputValue('');
    setConversations(dataStore.getConversations());

    // Trigger simulated interactive response from partner
    if (partner) {
      if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current);

      // Show typing indicator after a slight pause
      setTimeout(() => {
        setIsPartnerTyping(true);
      }, 450);

      // Partner responds after realistic delay
      replyTimeoutRef.current = setTimeout(() => {
        setIsPartnerTyping(false);
        const replyText = getPartnerReply(partner, textToSend);
        const partnerMsg = dataStore.sendMessage(selectedConvId, replyText, partner.id);
        setMessages((prev) => [...prev, partnerMsg]);
        setConversations(dataStore.getConversations());
        playMessageChime();
      }, 1600);
    }
  };

  const handleStartNewChatWith = (member: UserProfile) => {
    const convId = dataStore.startConversation(member.id);
    setSelectedConvId(convId);
    setConversations(dataStore.getConversations());
    setShowNewChatModal(false);
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-5rem)] min-h-[580px] flex flex-col">
      {/* Safety Notice Banner */}
      <div className="mb-4 p-3 rounded-xl bg-[#F5F2EB] border border-[#E5E1D8] text-xs text-[#525E56] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#2E4A3D] shrink-0" />
          <span>{t.messagingSafetyTitle}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#717A74]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{locale === 'no' ? 'Aktiv samtale' : 'Messagerie active'}</span>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-[#E5E1D8] shadow-xs overflow-hidden flex flex-col md:flex-row">
        {/* Left Column: Conversations List */}
        <div
          className={`w-full md:w-80 border-r border-[#E5E1D8] flex flex-col bg-[#FAF8F5] ${
            selectedConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-[#E5E1D8] flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-normal text-[#1F2421]">
                {t.messagingConversationsTitle} ({conversations.length})
              </h2>
              <span className="text-[10px] text-[#717A74] block">
                {locale === 'no' ? 'Dine språktandems' : 'Vos tandems en cours'}
              </span>
            </div>

            <button
              onClick={() => setShowNewChatModal(true)}
              className="px-2.5 py-1.5 bg-[#2E4A3D] hover:bg-[#23382E] text-white rounded-xl text-xs font-medium transition-all shadow-2xs flex items-center gap-1 cursor-pointer shrink-0"
              title={locale === 'no' ? 'Start ny samtale' : 'Nouveau message'}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{locale === 'no' ? 'Ny' : 'Nouveau'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#F0ECE1]">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8C938E] space-y-3">
                <MessageSquare className="w-8 h-8 text-[#D0C9BC] mx-auto" />
                <p>{t.messagingNoConversations}</p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="px-4 py-2 bg-[#2E4A3D] text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {locale === 'no' ? 'Velg et medlem' : 'Choisir un membre'}
                </button>
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = c.id === selectedConvId;
                const other = c.other_user;
                const isFrench = other?.langue_maternelle?.toLowerCase() === 'français';

                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedConvId(c.id);
                      setShowPartnerSpots(false);
                    }}
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3 cursor-pointer ${
                      isSelected ? 'bg-white shadow-xs' : 'hover:bg-[#F2EFE9]'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full bg-[#EAE5DC] text-[#2E4A3D] font-display text-base font-semibold flex items-center justify-center overflow-hidden border border-[#E5E1D8] shrink-0">
                        {other?.photo_url ? (
                          <img
                            src={other.photo_url}
                            alt={other.prenom}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          other?.prenom?.charAt(0) || '?'
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 text-xs bg-white rounded-full p-0.5 border border-[#E5E1D8]">
                        {isFrench ? '🇫🇷' : '🇳🇴'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-display text-sm font-medium text-[#1F2421] truncate">
                          {other?.prenom || 'Partenaire'}
                        </span>
                        {c.last_message && (
                          <span className="text-[10px] text-[#8C938E] shrink-0">
                            {formatMessageTime(c.last_message.created_at)}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#525E56] truncate">
                        {c.last_message ? c.last_message.content : '...'}
                      </p>

                      <div className="flex items-center justify-between mt-1 text-[10px] text-[#717A74]">
                        <span className="truncate">{other?.quartier || 'Oslo'}</span>
                        <span className="font-semibold text-[#2E4A3D] shrink-0">
                          {isFrench ? 'Français' : 'Norsk'} ({other?.niveau || 'B1'})
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat thread */}
        <div
          className={`flex-1 flex flex-col bg-white ${
            !selectedConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedConvId && partner ? (
            <>
              {/* Chat Thread Header */}
              <div className="p-3.5 px-4 sm:px-6 border-b border-[#E5E1D8] flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConvId(null)}
                    className="md:hidden p-1 text-[#525E56] hover:text-[#1F2421] cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-[#EAE5DC] text-[#2E4A3D] font-display text-base font-semibold flex items-center justify-center overflow-hidden border border-[#E5E1D8]">
                      {partner.photo_url ? (
                        <img
                          src={partner.photo_url}
                          alt={partner.prenom}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        partner.prenom?.charAt(0) || '?'
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 text-xs">
                      {partner.langue_maternelle?.toLowerCase() === 'français' ? '🇫🇷' : '🇳🇴'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-display text-base font-normal text-[#1F2421]">
                        {partner.prenom}
                      </h3>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="En ligne"></span>
                    </div>
                    <p className="text-[11px] text-[#717A74]">
                      {partner.quartier} ·{' '}
                      <span className="capitalize">
                        {partner.langue_maternelle === 'norvégien' ? '🇳🇴 Norsk' : '🇫🇷 Français'}
                      </span>{' '}
                      (apprend {partner.langue_apprise || 'la langue'})
                    </p>
                  </div>
                </div>

                {partner.lieux_preferes && partner.lieux_preferes.length > 0 && (
                  <button
                    onClick={() => setShowPartnerSpots(!showPartnerSpots)}
                    className="px-3 py-1.5 rounded-lg border border-[#E5E1D8] text-xs text-[#2E4A3D] hover:bg-[#F5F2EB] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {showPartnerSpots ? t.messagingHideMap : t.messagingShowMap}
                    </span>
                  </button>
                )}
              </div>

              {showPartnerSpots && partner.lieux_preferes && (
                <div className="p-4 bg-[#FAF8F5] border-b border-[#E5E1D8]">
                  <MapboxViewer
                    places={partner.lieux_preferes}
                    userName={partner.prenom}
                    className="h-44"
                  />
                </div>
              )}

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FCFBF9]">
                <div className="text-center my-2">
                  <span className="text-[10px] text-[#8C938E] bg-[#EFECE6] px-3 py-1 rounded-full font-medium">
                    {t.messagingStartedWith} {partner.prenom} · Oslo
                  </span>
                </div>

                {messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#8C938E] space-y-2">
                    <p>{t.messagingEmptyHistory}</p>
                    <p className="text-[#525E56]">{t.messagingEmptyTip}</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === currentUser.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                            isMe
                              ? 'bg-[#2E4A3D] text-white rounded-br-xs'
                              : 'bg-white text-[#1F2421] border border-[#E5E1D8] rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[#8C938E] mt-1 px-1">
                          <span>{formatMessageTime(m.created_at)}</span>
                          {isMe && <CheckCheck className="w-3 h-3 text-emerald-600" />}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Animated Typing Indicator when partner is typing */}
                {isPartnerTyping && (
                  <div className="flex flex-col items-start animate-fade-in">
                    <div className="bg-white border border-[#E5E1D8] p-3 rounded-2xl rounded-bl-xs shadow-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2E4A3D] animate-bounce [animation-delay:0ms]"></span>
                      <span className="w-2 h-2 rounded-full bg-[#2E4A3D] animate-bounce [animation-delay:150ms]"></span>
                      <span className="w-2 h-2 rounded-full bg-[#2E4A3D] animate-bounce [animation-delay:300ms]"></span>
                    </div>
                    <span className="text-[10px] text-[#717A74] mt-1 px-1 italic">
                      {partner.prenom} {locale === 'no' ? 'skriver...' : 'est en train d\'écrire...'}
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestion chips */}
              <div className="px-3 sm:px-4 py-2 bg-[#F9F8F5] border-t border-[#E5E1D8] flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
                <span className="text-[10px] font-semibold text-[#8C938E] uppercase tracking-wider shrink-0 mr-1">
                  💡 Suggestions :
                </span>
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(undefined, s)}
                    className="px-2.5 py-1 rounded-full bg-white border border-[#E5E1D8] text-[11px] text-[#525E56] hover:text-[#2E4A3D] hover:border-[#2E4A3D] transition-colors shrink-0 cursor-pointer whitespace-nowrap shadow-2xs"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={(e) => handleSendMessage(e)}
                className="p-3 sm:p-4 bg-white border-t border-[#E5E1D8] flex gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`${t.messagingInputPlaceholder} (${partner.prenom})...`}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D] transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="px-4 py-2.5 bg-[#2E4A3D] text-white rounded-xl hover:bg-[#23382E] transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8C938E] space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#EAE5DC] text-[#2E4A3D] flex items-center justify-center mx-auto shadow-xs">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="font-display text-lg text-[#1F2421]">{t.messagingSelectPrompt}</p>
                <p className="text-xs text-[#717A74] max-w-sm">{t.messagingSelectDesc}</p>
              </div>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="mt-2 px-5 py-2.5 bg-[#2E4A3D] text-white text-xs font-semibold rounded-xl hover:bg-[#23382E] transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{locale === 'no' ? 'Start ny samtale' : 'Nouvelle conversation'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Start New Conversation with any community member */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#E5E1D8] shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0ECE1]">
              <div>
                <h3 className="font-display text-lg font-normal text-[#1F2421]">
                  {locale === 'no' ? 'Start samtale med et medlem' : 'Démarrer une conversation'}
                </h3>
                <p className="text-xs text-[#717A74]">
                  {locale === 'no' ? 'Velg en tandempartner i Oslo' : 'Sélectionnez un membre de la communauté'}
                </p>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1.5 text-[#717A74] hover:text-[#1F2421] rounded-full hover:bg-[#F2EFE9] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search filter input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#8C938E] absolute left-3 top-3" />
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder={locale === 'no' ? 'Søk etter navn eller bydel...' : 'Rechercher par prénom ou quartier...'}
                className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D]"
              />
            </div>

            {/* Members list */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#F0ECE1] space-y-1">
              {filteredMembers.length === 0 ? (
                <p className="text-center text-xs text-[#717A74] py-8">
                  {locale === 'no' ? 'Ingen medlemmer funnet' : 'Aucun membre correspondant'}
                </p>
              ) : (
                filteredMembers.map((member) => {
                  const isFr = member.langue_maternelle?.toLowerCase() === 'français';
                  return (
                    <button
                      key={member.id}
                      onClick={() => handleStartNewChatWith(member)}
                      className="w-full p-3 text-left hover:bg-[#FAF8F5] rounded-xl transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#EAE5DC] text-[#2E4A3D] font-display text-base font-semibold flex items-center justify-center overflow-hidden border border-[#E5E1D8] shrink-0">
                          {member.photo_url ? (
                            <img
                              src={member.photo_url}
                              alt={member.prenom}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            member.prenom?.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-display text-sm font-medium text-[#1F2421] group-hover:text-[#2E4A3D] transition-colors truncate">
                              {member.prenom}
                            </span>
                            <span className="text-xs">{isFr ? '🇫🇷' : '🇳🇴'}</span>
                          </div>
                          <p className="text-[11px] text-[#717A74] truncate">
                            {member.quartier} · {isFr ? 'Français natif' : 'Norsk morsmål'}
                          </p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 bg-[#F5F2EB] group-hover:bg-[#2E4A3D] group-hover:text-white text-[#2E4A3D] text-[11px] font-semibold rounded-lg transition-colors shrink-0">
                        {locale === 'no' ? 'Send melding' : 'Contacter'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
