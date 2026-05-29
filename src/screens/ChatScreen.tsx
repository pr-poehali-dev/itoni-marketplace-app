import { useEffect, useState, useRef } from 'react';
import { api, Message, formatDate } from '@/lib/api';
import { getUser } from '@/lib/auth';
import Icon from '@/components/ui/icon';

interface Props {
  otherId: number;
  listingId: number;
  listingTitle: string;
  listingImage?: string;
  otherName?: string;
  onBack: () => void;
}

const PLACEHOLDER = 'https://cdn.poehali.dev/projects/d65ee484-6681-47d8-a176-bbe2415ceef3/files/2291a7e5-3513-4003-9ec3-c753a61b4a28.jpg';

export default function ChatScreen({ otherId, listingId, listingTitle, listingImage, otherName, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<{ name?: string; photo?: string; phone?: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const user = getUser();

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
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Icon name="ChevronLeft" size={20} className="text-gray-600" />
          </button>
          <div className="w-10 h-10 rounded-full bg-itoni-blue-light flex items-center justify-center overflow-hidden">
            {otherUser?.photo ? (
              <img src={otherUser.photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <Icon name="User" size={18} className="text-itoni-blue" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{listingTitle}</p>
          </div>
        </div>

        {/* Listing preview */}
        <div className="mt-2 flex items-center gap-3 bg-gray-50 rounded-xl p-2">
          <img
            src={listingImage || PLACEHOLDER}
            alt=""
            className="w-12 h-10 rounded-lg object-cover"
            onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
          />
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
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-itoni-blue text-white rounded-br-sm'
                      : 'bg-white text-gray-900 card-shadow rounded-bl-sm'
                  }`}>
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
    </div>
  );
}
