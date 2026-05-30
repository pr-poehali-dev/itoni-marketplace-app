import { useEffect, useState } from 'react';
import { api, Listing, CATEGORIES, formatPrice } from '@/lib/api';
import { getUser } from '@/lib/auth';
import ListingCard from '@/components/ListingCard';
import Icon from '@/components/ui/icon';
import { getTheme, toggleTheme } from '@/lib/theme';

interface Props {
  onListingClick: (id: number) => void;
  onCategorySelect: (cat: string) => void;
  onSearch: () => void;
  onNotifications: () => void;
  notifUnread: number;
  favorites: number[];
  onFavoriteToggle: (id: number) => void;
}

type Banner = { id: number; title?: string; image_url?: string; link_url?: string };

export default function HomeScreen({ onListingClick, onCategorySelect, onSearch, onNotifications, notifUnread, favorites, onFavoriteToggle }: Props) {
  const [newListings, setNewListings] = useState<Listing[]>([]);
  const [popularListings, setPopularListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [homeText, setHomeText] = useState<Record<string, string>>({});
  const [theme, setTheme] = useState(getTheme());
  const user = getUser();

  useEffect(() => {
    Promise.all([
      api.getListings({ limit: 6 }),
      api.getListings({ limit: 4 }),
    ]).then(([newRes, popRes]) => {
      setNewListings(newRes.listings || []);
      setPopularListings(popRes.listings || []);
      setLoading(false);
    });
    api.getBanners().then(res => setBanners(res.banners || []));
    api.getHome().then(res => setHomeText(res.content || {}));
  }, []);

  return (
    <div className="pb-nav bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-extrabold text-itoni-blue">иТони</h1>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Icon name="MapPin" size={11} />
              <span>{user?.city || user?.region || 'Россия'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setTheme(toggleTheme())} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={18} className="text-gray-600" />
            </button>
            <button onClick={onNotifications} className="relative w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <Icon name="Bell" size={18} className="text-gray-600" />
              {notifUnread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                  {notifUnread > 9 ? '9+' : notifUnread}
                </span>
              )}
            </button>
          </div>
        </div>
        {/* Search bar */}
        <button
          onClick={onSearch}
          className="w-full bg-gray-100 rounded-xl px-4 py-3 flex items-center gap-2 text-gray-400 text-sm"
        >
          <Icon name="Search" size={16} />
          <span>Поиск авто, мото, лодок...</span>
        </button>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Banner */}
        <div className="bg-itoni-blue rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 flex items-center opacity-20 text-8xl">🚗</div>
          <p className="text-xs font-medium opacity-80 mb-1">{homeText.promo || 'Маркетплейс техники'}</p>
          <h2 className="text-xl font-extrabold mb-3">{homeText.greeting || 'Продай или купи за пару минут'}</h2>
          <div className="flex gap-2">
            <button onClick={() => onCategorySelect('auto')} className="bg-white text-itoni-blue text-sm font-bold px-4 py-2 rounded-xl">
              Купить
            </button>
          </div>
        </div>

        {/* Ad banners from admin */}
        {banners.map(b => (
          <a
            key={b.id}
            href={b.link_url || '#'}
            target={b.link_url ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="block rounded-2xl overflow-hidden card-shadow"
          >
            {b.image_url ? (
              <img src={b.image_url} alt={b.title || ''} className="w-full h-32 object-cover" />
            ) : (
              <div className="bg-itoni-orange-light p-4 text-center font-bold text-itoni-orange">{b.title}</div>
            )}
          </a>
        ))}

        {/* Categories */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Категории</h3>
          <div className="grid grid-cols-5 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => onCategorySelect(cat.id)}
                className="flex flex-col items-center gap-1.5 bg-white rounded-2xl p-3 card-shadow active:scale-95 transition-transform"
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-[10px] font-medium text-gray-700 text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* New listings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Новые объявления</h3>
            <button onClick={onSearch} className="text-itoni-blue text-sm font-medium">Все</button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-2xl h-52 animate-pulse" />
              ))}
            </div>
          ) : newListings.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {newListings.map(l => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  isFavorite={favorites.includes(l.id)}
                  onFavoriteToggle={onFavoriteToggle}
                  onClick={() => onListingClick(l.id)}
                  compact
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🚗</div>
              <p className="text-sm">Пока нет объявлений. Станьте первым!</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Объявлений', value: '12 000+', icon: '📋' },
            { label: 'Городов', value: '800+', icon: '🏙️' },
            { label: 'Сделок', value: '5 000+', icon: '🤝' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-3 card-shadow text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="font-extrabold text-sm text-gray-900">{stat.value}</div>
              <div className="text-[10px] text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}