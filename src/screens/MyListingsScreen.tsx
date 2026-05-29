import { useEffect, useState } from 'react';
import { api, Listing, formatPrice, formatDate } from '@/lib/api';
import { getUser } from '@/lib/auth';
import Icon from '@/components/ui/icon';

interface Props {
  onBack: () => void;
  onListingClick: (id: number) => void;
  onCreateNew: () => void;
}

const PLACEHOLDER = 'https://cdn.poehali.dev/projects/d65ee484-6681-47d8-a176-bbe2415ceef3/files/2291a7e5-3513-4003-9ec3-c753a61b4a28.jpg';

export default function MyListingsScreen({ onBack, onListingClick, onCreateNew }: Props) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    if (user) {
      api.getListings({ user_id: user.id }).then(res => {
        setListings(res.listings || []);
        setLoading(false);
      });
    }
  }, []);

  return (
    <div className="pb-nav bg-gray-50 min-h-screen">
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
          [1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)
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
            <button
              key={l.id}
              onClick={() => onListingClick(l.id)}
              className="w-full bg-white rounded-2xl p-3 card-shadow flex gap-3 active:scale-[0.99] transition-transform text-left"
            >
              <img
                src={l.images?.[0] || PLACEHOLDER}
                alt={l.title}
                className="w-20 h-20 rounded-xl object-cover shrink-0"
                onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">{l.title}</p>
                <p className="font-extrabold text-itoni-blue text-base">{formatPrice(l.price)}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <Icon name="Eye" size={11} />
                  <span>{l.views}</span>
                  <span>·</span>
                  <span>{formatDate(l.created_at)}</span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[9px] text-green-600 font-medium">Активно</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
