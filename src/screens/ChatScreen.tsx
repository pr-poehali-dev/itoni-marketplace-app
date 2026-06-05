import { useEffect, useState, useRef } from 'react';
import { api, Message, formatDate, formatOnlineStatus } from '@/lib/api';
import { getUser } from '@/lib/auth';
import ListingImage from '@/components/ListingImage';
import Icon from '@/components/ui/icon';

interface Props {
  otherId: number;
  listingId: number;
  listingTitle: string;
  listingImage?: string;
  otherName?: string;
  onBack: () => void;
  onOpenSeller?: (name?: string, photo?: string, phone?: string) => void;
  onChatDeleted?: () => void;
}

export default function ChatScreen({ otherId, listingId, listingTitle, listingImage, otherName, onBack, onOpenSeller, onChatDeleted }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<{ name?: string; photo?: string; phone?: string; last_activity?: string | null } | null>(null);
  const [, setTick] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionMsg, setActionMsg] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const user = getUser();

  async function handleDeleteChat() {
    setMenuOpen(false);
    if (!confirm('Удалить весь чат? Это действие необратимо.')) return;
    await api.deleteChat(otherId, listingId);
    onChatDeleted?.();
  }

  async function handleDeleteMessage(msg: Message) {
    setActionMsg(null);
    setMessages(prev => prev.filter(m => m.id !== msg.id));
    await api.deleteMessage(msg.id);
  }

  const loadMessages = async () => {
    const res = await api.getMessages(otherId, listingId);
    if (res.messages) setMessages(res.messages);
    if (res.other_user) setOtherUser(res.other_user);
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [otherId, listingId]);

  // Перерисовка онлайн-статуса каждые 30 секунд
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setText('');
    const res = await api.sendMessage(otherId, listingId, t);
    if (res.success) {
      setMessages(prev => [...prev, {
        id: res.id,
        sender_id: user!.id,
        receiver_id: otherId,
        text: t,
        created_at: res.created_at,
        is_read: false,
        sender_name: user?.name || 'Вы',
        sender_photo: user?.photo,
      }]);
    }
    setSending(false);
  }

  const displayName = otherUser?.name || otherName || 'Пользователь';

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-3 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <Icon name="ChevronLeft" size={20} className="text-gray-600" />
          </button>
          <button
            onClick={() => onOpenSeller?.(displayName, otherUser?.photo, otherUser?.phone)}
            className="flex items-center gap-3 flex-1 min-w-0 text-left active:opacity-70"
          >
            <div className="w-10 h-10 rounded-full bg-itoni-blue-light flex items-center justify-center overflow-hidden shrink-0">
              {otherUser?.photo ? (
                <img src={otherUser.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <Icon name="User" size={18} className="text-itoni-blue" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate flex items-center gap-1">
                {displayName}
                <Icon name="ChevronRight" size={14} className="text-gray-400 shrink-0" />
              </p>
              {(() => {
                const st = formatOnlineStatus(otherUser?.last_activity);
                return (
                  <p className={`text-xs truncate flex items-center gap-1 ${st.online ? 'text-green-600' : 'text-gray-500'}`}>
                    {st.online && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />}
                    {st.text}
                  </p>
                );
              })()}
            </div>
          </button>
          <div className="relative shrink-0">
            <button onClick={() => setMenuOpen(v => !v)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <Icon name="MoreVertical" size={18} className="text-gray-600" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-11 z-30 bg-white rounded-xl card-shadow border border-gray-100 overflow-hidden min-w-[180px]">
                  <button onClick={handleDeleteChat} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 active:bg-gray-50">
                    <Icon name="Trash2" size={16} />
                    Удалить чат
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Listing preview */}
        <div className="mt-2 flex items-center gap-3 bg-gray-50 rounded-xl p-2">
          <ListingImage src={listingImage} alt="" className="w-12 h-10 rounded-lg object-cover" iconSize={16} />
          <p className="text-xs text-gray-600 font-medium flex-1 line-clamp-2">{listingTitle}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center text-gray-400 py-8 text-sm">Загрузка...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-sm">Начните диалог с продавцом</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-itoni-blue-light flex items-center justify-center mr-2 mt-auto mb-1 shrink-0">
                    <Icon name="User" size={13} className="text-itoni-blue" />
                  </div>
                )}
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  <div
                    onClick={() => isMe && setActionMsg(msg)}
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'cursor-pointer' : ''} ${
                      isMe
                        ? 'bg-itoni-blue text-white rounded-br-sm'
                        : 'bg-white text-gray-900 card-shadow rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-gray-400 px-1">{formatDate(msg.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 pb-safe">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 max-h-32 overflow-y-auto">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Написать сообщение..."
              rows={1}
              className="w-full bg-transparent text-sm focus:outline-none resize-none"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-11 h-11 bg-itoni-blue rounded-2xl flex items-center justify-center disabled:opacity-40 transition-all active:scale-95"
          >
            <Icon name="Send" size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* Delete message sheet */}
      {actionMsg && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center" onClick={() => setActionMsg(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-t-3xl w-full max-w-lg p-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="bg-gray-50 rounded-xl px-4 py-3 mb-3 text-sm text-gray-600 line-clamp-2">{actionMsg.text}</div>
            <button
              onClick={() => handleDeleteMessage(actionMsg)}
              className="w-full flex items-center justify-center gap-2 text-red-500 font-semibold py-3.5 rounded-2xl bg-red-50 active:scale-[0.98] transition-transform"
            >
              <Icon name="Trash2" size={18} />
              Удалить сообщение
            </button>
            <button onClick={() => setActionMsg(null)} className="w-full text-gray-500 font-medium py-3 mt-1">
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}