import { useEffect, useState } from 'react';
import { api, Notification, formatDate } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Props {
  onBack: () => void;
  onOpenListing: (id: number) => void;
  onOpenChat: (n: Notification) => void;
  onRead: () => void;
}

const TYPE_META: Record<string, { icon: string; color: string; bg: string }> = {
  message: { icon: 'MessageCircle', color: 'text-itoni-blue', bg: 'bg-itoni-blue-light' },
  view: { icon: 'Eye', color: 'text-itoni-orange', bg: 'bg-itoni-orange-light' },
  system: { icon: 'Info', color: 'text-purple-600', bg: 'bg-purple-50' },
};

export default function NotificationsScreen({ onBack, onOpenListing, onOpenChat, onRead }: Props) {
  const [notes, setNotes] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNotifications().then(res => {
      setNotes(res.notifications || []);
      setLoading(false);
      api.markNotificationsRead().then(() => onRead());
    });
  }, []);

  function handleClick(n: Notification) {
    if (n.type === 'message') {
      onOpenChat(n);
    } else if (n.listing_id) {
      onOpenListing(n.listing_id);
    }
  }

  return (
    <div className="pb-nav bg-gray-50 min-h-screen">
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Icon name="ChevronLeft" size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-extrabold text-gray-900">Уведомления</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-2">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />)
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Icon name="Bell" size={36} className="text-gray-300" />
            </div>
            <p className="font-medium text-gray-600 mb-1">Пока нет уведомлений</p>
            <p className="text-sm text-center">Здесь появятся сообщения и просмотры ваших объявлений</p>
          </div>
        ) : (
          notes.map(n => {
            const meta = TYPE_META[n.type] || TYPE_META.system;
            const clickable = n.type === 'message' || !!n.listing_id;
            return (
              <button
                key={n.id}
                onClick={() => clickable && handleClick(n)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl text-left card-shadow transition-colors ${n.is_read ? 'bg-white' : 'bg-blue-50/60'} ${clickable ? 'active:bg-gray-50' : ''}`}
              >
                <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
                  <Icon name={meta.icon} size={20} className={meta.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm text-gray-900 ${n.is_read ? 'font-medium' : 'font-bold'}`}>{n.title}</p>
                  {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                  <p className="text-[11px] text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                </div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-itoni-blue shrink-0 mt-2" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
