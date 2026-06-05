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
  const [confirmClear, setConfirmClear] = useState(false);

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

  function handleDelete(id: number) {
    setNotes(prev => prev.filter(n => n.id !== id));
    api.deleteNotification(id);
  }

  function handleClearAll() {
    setNotes([]);
    setConfirmClear(false);
    api.clearNotifications();
  }

  return (
    <div className="pb-nav bg-gray-50 min-h-screen">
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Icon name="ChevronLeft" size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-extrabold text-gray-900 flex-1">Уведомления</h1>
          {notes.length > 0 && (
            <button onClick={() => setConfirmClear(true)} className="text-sm text-red-500 font-medium flex items-center gap-1">
              <Icon name="Trash2" size={15} /> Очистить
            </button>
          )}
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
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl card-shadow ${n.is_read ? 'bg-white' : 'bg-blue-50/60'}`}
              >
                <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
                  <Icon name={meta.icon} size={20} className={meta.color} />
                </div>
                <button
                  onClick={() => clickable && handleClick(n)}
                  disabled={!clickable}
                  className={`flex-1 min-w-0 text-left ${clickable ? 'active:opacity-70' : ''}`}
                >
                  <p className={`text-sm text-gray-900 ${n.is_read ? 'font-medium' : 'font-bold'}`}>{n.title}</p>
                  {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                  <p className="text-[11px] text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                </button>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 active:bg-red-50 active:text-red-500"
                  aria-label="Удалить уведомление"
                >
                  <Icon name="X" size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {confirmClear && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => setConfirmClear(false)}>
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-gray-900 text-base mb-1">Очистить все уведомления?</p>
            <p className="text-sm text-gray-500 mb-4">Это действие нельзя отменить.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmClear(false)} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-sm">Отмена</button>
              <button onClick={handleClearAll} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold text-sm">Очистить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
