import { useEffect, useState } from 'react';
import { api, Listing, formatPrice, formatDate } from '@/lib/api';
import { getUser } from '@/lib/auth';
import Icon from '@/components/ui/icon';

interface Props {
  onBack: () => void;
  onListingClick: (id: number) => void;
  onCreateNew: () => void;
  onEdit: (id: number) => void;
}

const PLACEHOLDER = 'https://cdn.poehali.dev/projects/d65ee484-6681-47d8-a176-bbe2415ceef3/files/2291a7e5-3513-4003-9ec3-c753a61b4a28.jpg';

export default function MyListingsScreen({ onBack, onListingClick, onCreateNew, onEdit }: Props) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const user = getUser();

  function showNotice(type: 'success' | 'error', text: string) {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 2500);
  }

  useEffect(() => {
    if (user) {
      api.getListings({ user_id: user.id }).then(res => {
        setListings(res.listings || []);
        setLoading(false);
      });
    }
  }, []);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await api.deleteListing(id);
      if (res.success) {
        setListings(prev => prev.filter(l => l.id !== id));
        setConfirmId(null);
        showNotice('success', 'Объявление удалено');
      } else {
        showNotice('error', res.error || 'Ошибка при удалении');
      }
    } catch {
      showNotice('error', 'Ошибка при удалении');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="pb-nav bg-gray-50 min-h-screen">
      {notice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] animate-fade-in">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg ${notice.type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}>
            <Icon name={notice.type === 'success' ? 'CheckCircle2' : 'AlertCircle'} size={16} />
            {notice.text}
          </div>
        </div>
      )}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Icon name="ChevronLeft" size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-extrabold text-gray-900">Мои объявления</h1>
          <button onClick={onCreateNew} className="ml-auto bg-itoni-blue text-white text-sm font-bold px-3 py-1.5 rounded-xl">
            + Создать
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Icon name="FileText" size={36} className="text-gray-300" />
            </div>
            <p className="font-medium text-gray-600 mb-1">Нет объявлений</p>
            <p className="text-sm text-center mb-5">Создайте первое объявление, чтобы начать продавать</p>
            <button onClick={onCreateNew} className="bg-itoni-blue text-white font-bold px-6 py-3 rounded-xl">
              Создать объявление
            </button>
          </div>
        ) : (
          listings.map(l => (
            <div key={l.id} className="bg-white rounded-2xl p-3 card-shadow">
              <div className="flex gap-3">
                <button onClick={() => onListingClick(l.id)} className="shrink-0">
                  <img
                    src={l.images?.[0] || PLACEHOLDER}
                    alt={l.title}
                    className="w-20 h-20 rounded-xl object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                  />
                </button>
                <button onClick={() => onListingClick(l.id)} className="flex-1 min-w-0 text-left">
                  <p className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">{l.title}</p>
                  <p className="font-extrabold text-itoni-blue text-base">{formatPrice(l.price)}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <Icon name="Eye" size={11} />
                    <span>{l.views}</span>
                    <span>·</span>
                    <span>{formatDate(l.created_at)}</span>
                  </div>
                </button>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                <button
                  onClick={() => onEdit(l.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-itoni-blue text-sm font-medium py-2 rounded-xl bg-blue-50 active:bg-blue-100"
                >
                  <Icon name="Pencil" size={15} />
                  Изменить
                </button>
                <button
                  onClick={() => onListingClick(l.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-gray-600 text-sm font-medium py-2 rounded-xl bg-gray-50 active:bg-gray-100"
                >
                  <Icon name="Eye" size={15} />
                  Открыть
                </button>
                <button
                  onClick={() => setConfirmId(l.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-red-500 text-sm font-medium py-2 rounded-xl bg-red-50 active:bg-red-100"
                >
                  <Icon name="Trash2" size={15} />
                  Удалить
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirm delete modal */}
      {confirmId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6" onClick={() => deletingId === null && setConfirmId(null)}>
          <div className="absolute inset-0 bg-black/50 animate-fade-in" />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Icon name="Trash2" size={26} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Удалить объявление?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">Отменить будет нельзя.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                disabled={deletingId !== null}
                className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-xl"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                disabled={deletingId !== null}
                className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl disabled:opacity-60"
              >
                {deletingId !== null ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}