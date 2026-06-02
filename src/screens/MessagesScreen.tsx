import { useEffect, useState } from 'react';
import { api, Chat, formatDate, formatOnlineStatus } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Props {
  onChatOpen: (chat: Chat) => void;
}

const PLACEHOLDER = 'https://cdn.poehali.dev/projects/d65ee484-6681-47d8-a176-bbe2415ceef3/files/2291a7e5-3513-4003-9ec3-c753a61b4a28.jpg';

export default function MessagesScreen({ onChatOpen }: Props) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getChats().then(res => {
      setChats(res.chats || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="pb-nav bg-gray-50 min-h-screen">
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <h1 className="text-xl font-extrabold text-gray-900">Сообщения</h1>
      </div>

      {loading ? (
        <div className="space-y-1 mt-2 px-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse flex gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-2.5 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-gray-400">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Icon name="MessageCircle" size={36} className="text-gray-300" />
          </div>
          <p className="font-medium text-gray-600 mb-1">Нет сообщений</p>
          <p className="text-sm text-center">Напишите продавцу с понравившегося объявления</p>
        </div>
      ) : (
        <div className="py-2 space-y-px">
          {chats.map(chat => {
            const status = formatOnlineStatus(chat.other_last_activity);
            return (
            <button
              key={`${chat.other_user_id}-${chat.listing_id}`}
              onClick={() => onChatOpen(chat)}
              className="w-full bg-white px-4 py-3.5 flex items-center gap-3 active:bg-gray-50 transition-colors"
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-13 h-13 w-[52px] h-[52px] rounded-full bg-itoni-blue-light flex items-center justify-center overflow-hidden">
                  {chat.other_photo ? (
                    <img src={chat.other_photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="User" size={22} className="text-itoni-blue" />
                  )}
                </div>
                {status.online && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                )}
                {!chat.is_read && (
                  <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-0.5">
                  <p className={`text-sm truncate ${!chat.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>
                    {chat.other_name}
                  </p>
                  <span className="text-[11px] text-gray-400 shrink-0 ml-2">{formatDate(chat.created_at)}</span>
                </div>
                <p className={`text-[11px] truncate mb-0.5 ${status.online ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                  {status.text}
                </p>
                <p className="text-xs text-gray-500 truncate mb-0.5">{chat.listing_title}</p>
                <p className={`text-sm truncate ${!chat.is_read ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                  {chat.last_message}
                </p>
              </div>

              {/* Listing thumb */}
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                <img
                  src={chat.listing_image || PLACEHOLDER}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                />
              </div>
            </button>
            );
          })}
        </div>
      )}
    </div>
  );
}