import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';

interface MessagesPageProps {
  currentUser: UserProfile;
  initialConversationId?: string | null;
  onNavigate: (page: PageView) => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  currentUser,
  initialConversationId,
  onNavigate,
}) => {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    dataStore.getConversations()
  );
  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    initialConversationId || conversations[0]?.id || null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showPartnerSpots, setShowPartnerSpots] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialConversationId) {
      setSelectedConvId(initialConversationId);
    }
  }, [initialConversationId]);

  useEffect(() => {
    if (selectedConvId) {
      const msgs = dataStore.getMessages(selectedConvId);
      setMessages(msgs);
    }
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentConv = conversations.find((c) => c.id === selectedConvId);
  const partner = currentConv?.other_user;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedConvId) return;

    const newMsg = dataStore.sendMessage(selectedConvId, inputValue.trim(), currentUser.id);
    setMessages((prev) => [...prev, newMsg]);
    setInputValue('');
    setConversations(dataStore.getConversations());
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
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-[#E5E1D8] shadow-xs overflow-hidden flex flex-col md:flex-row">
        {/* Left Column: Conversations List */}
        <div
          className={`w-full md:w-80 border-r border-[#E5E1D8] flex flex-col bg-[#FAF8F5] ${
            selectedConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-[#E5E1D8] flex items-center justify-between">
            <h2 className="font-display text-lg font-normal text-[#1F2421]">
              {t.messagingConversationsTitle} ({conversations.length})
            </h2>
            <button
              onClick={() => onNavigate('discovery')}
              className="text-xs text-[#2E4A3D] hover:underline"
            >
              {t.messagingNewTandem}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#F0ECE1]">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8C938E] space-y-2">
                <p>{t.messagingNoConversations}</p>
                <button
                  onClick={() => onNavigate('discovery')}
                  className="text-[#2E4A3D] underline font-medium"
                >
                  {t.messagingBrowseLink}
                </button>
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = c.id === selectedConvId;
                const other = c.other_user;
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
                    <div className="w-11 h-11 rounded-full bg-[#EAE5DC] text-[#2E4A3D] font-display text-base font-semibold flex items-center justify-center overflow-hidden border border-[#E5E1D8] shrink-0">
                      {other?.photo_url ? (
                        <img
                          src={other.photo_url}
                          alt={other.prenom}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        other?.prenom.charAt(0) || '?'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-display text-sm font-normal text-[#1F2421] truncate">
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
                      <span className="text-[10px] text-[#717A74] block mt-1">
                        {other?.quartier || 'Oslo'} ·{' '}
                        {other?.langue_maternelle === 'norvégien' ? '🇳🇴 Norsk' : '🇫🇷 Français'}
                      </span>
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
                    className="md:hidden p-1 text-[#525E56] hover:text-[#1F2421]"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-[#EAE5DC] text-[#2E4A3D] font-display text-base font-semibold flex items-center justify-center overflow-hidden border border-[#E5E1D8]">
                    {partner.photo_url ? (
                      <img
                        src={partner.photo_url}
                        alt={partner.prenom}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      partner.prenom.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-base font-normal text-[#1F2421]">
                      {partner.prenom}
                    </h3>
                    <p className="text-[11px] text-[#717A74]">
                      {partner.quartier} ·{' '}
                      {partner.langue_maternelle === 'norvégien' ? '🇳🇴 Norsk' : '🇫🇷 Français'}
                    </p>
                  </div>
                </div>

                {partner.lieux_preferes && partner.lieux_preferes.length > 0 && (
                  <button
                    onClick={() => setShowPartnerSpots(!showPartnerSpots)}
                    className="px-3 py-1.5 rounded-lg border border-[#E5E1D8] text-xs text-[#2E4A3D] hover:bg-[#F5F2EB] transition-colors flex items-center gap-1.5 cursor-pointer"
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
                  <span className="text-[10px] text-[#8C938E] bg-[#EFECE6] px-2.5 py-1 rounded-full">
                    {t.messagingStartedWith} {partner.prenom}
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
                          className={`max-w-[80%] sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                            isMe
                              ? 'bg-[#2E4A3D] text-white rounded-br-xs'
                              : 'bg-white text-[#1F2421] border border-[#E5E1D8] rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        </div>
                        <span className="text-[10px] text-[#8C938E] mt-1 px-1">
                          {formatMessageTime(m.created_at)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 bg-white border-t border-[#E5E1D8] flex gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`${t.messagingInputPlaceholder} (${partner.prenom})`}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#2E4A3D]"
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
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8C938E] space-y-3">
              <MessageSquare className="w-10 h-10 text-[#D0C9BC]" />
              <p className="font-display text-base text-[#1F2421]">{t.messagingSelectPrompt}</p>
              <p className="text-xs max-w-xs">{t.messagingSelectDesc}</p>
              <button
                onClick={() => onNavigate('discovery')}
                className="mt-2 px-4 py-2 bg-[#2E4A3D] text-white text-xs font-medium rounded-lg hover:bg-[#23382E] transition-colors cursor-pointer"
              >
                {t.navFindTandem}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
