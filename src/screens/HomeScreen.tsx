import { useEffect, useState } from 'react';
import { api, Listing, CATEGORIES } from '@/lib/api';
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
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [homeText, setHomeText] = useState<Record<string, string>>({});
  const [theme, setTheme] = useState(getTheme());
  const user = getUser();

  useEffect(() => {
    api.getListings({ limit: 6 }).then(newRes => {
      setNewListings(newRes.listings || []);
      setLoading(false);
    });
    api.getBanners().then(res => setBanners(res.banners || []));
    api.getHome().then(res => setHomeText(res.content || {}));
  }, []);

  return (
    <div className="pb-nav min-h-screen relative bg-[#05080f] text-white overflow-hidden">
      {/* Ambient blue glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-72 bg-blue-600/25 blur-[90px] rounded-full" />
      <div className="pointer-events-none absolute top-40 -left-20 w-64 h-64 bg-blue-500/15 blur-[80px] rounded-full" />

      {/* Header */}
      <div className="relative px-4 pt-12 pb-4 sticky top-0 z-20 bg-[#05080f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-clip-text text-transparent" style={{ fontFamily: 'Golos Text' }}>
              иТони
            </h1>
            <div className="flex items-center gap-1 text-xs text-blue-200/70">
              <Icon name="MapPin" size={11} />
              <span>{user?.city || user?.region || 'Россия'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setTheme(toggleTheme())} className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
              <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={18} className="text-blue-100" />
            </button>
            <button onClick={onNotifications} className="relative w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
              <Icon name="Bell" size={18} className="text-blue-100" />
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
          className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 flex items-center gap-2 text-blue-200/60 text-sm"
        >
          <Icon name="Search" size={16} />
          <span>Поиск авто, мото, лодок...</span>
        </button>
      </div>

      <div className="relative px-4 py-4 space-y-5 z-10">
        {/* Hero banner */}
        <div className="relative rounded-3xl p-6 overflow-hidden border border-blue-500/30 bg-gradient-to-br from-blue-600/30 via-blue-700/10 to-transparent">
          <div className="absolute -right-6 -top-4 text-9xl opacity-20 select-none">🚗</div>
          <p className="text-xs font-semibold text-blue-300 tracking-wide mb-1">{homeText.promo || 'Маркетплейс техники'}</p>
          <h2 className="text-2xl font-extrabold leading-tight mb-1">Продай быстро.</h2>
          <h2 className="text-2xl font-extrabold leading-tight text-blue-400 mb-4">Купи честно.</h2>
          <p className="text-sm text-blue-100/70 mb-4 max-w-[75%]">{homeText.greeting || 'Покупка и продажа авто и запчастей без лишних переплат и рисков'}</p>
          <div className="flex gap-2">
            <button onClick={() => onCategorySelect('auto')} className="bg-itoni-blue text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-transform">
              Купить
            </button>
            <button onClick={onSearch} className="bg-white/10 border border-white/15 text-white text-sm font-bold px-5 py-2.5 rounded-xl active:scale-95 transition-transform">
              Все объявления
            </button>
          </div>
        </div>

        {/* Trust features */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: 'ShieldCheck', title: 'Безопасно', sub: 'Проверяем каждого' },
            { icon: 'Zap', title: 'Быстро', sub: 'Размещай и продавай' },
            { icon: 'BadgeCheck', title: 'Честно', sub: 'Реальные цены' },
          ].map(f => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <div className="w-9 h-9 mx-auto rounded-xl bg-blue-500/15 flex items-center justify-center mb-2">
                <Icon name={f.icon} size={18} className="text-blue-400" />
              </div>
              <p className="text-xs font-bold text-white">{f.title}</p>
              <p className="text-[10px] text-blue-100/50 leading-tight mt-0.5">{f.sub}</p>
            </div>
          ))}
        </div>

        {/* Ad banners from admin */}
        {banners.map(b => (
          <a
            key={b.id}
            href={b.link_url || '#'}
            target={b.link_url ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="block rounded-2xl overflow-hidden border border-white/10"
          >
            {b.image_url ? (
              <img src={b.image_url} alt={b.title || ''} className="w-full h-32 object-cover" />
            ) : (
              <div className="bg-blue-500/15 p-4 text-center font-bold text-blue-300">{b.title}</div>
            )}
          </a>
        ))}

        {/* Categories */}
        <div>
          <h3 className="font-bold text-white mb-3">Категории</h3>
          <div className="grid grid-cols-5 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => onCategorySelect(cat.id)}
                className="flex flex-col items-center gap-1.5 bg-white/5 border border-white/10 rounded-2xl p-3 active:scale-95 transition-transform"
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-[10px] font-medium text-blue-100/80 text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* New listings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white">Новые объявления</h3>
            <button onClick={onSearch} className="text-blue-400 text-sm font-medium">Все</button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl h-52 animate-pulse" />
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
            <div className="text-center py-10 text-blue-100/50 bg-white/5 border border-white/10 rounded-2xl">
              <div className="text-4xl mb-2">🚗</div>
              <p className="text-sm">Пока нет объявлений. Станьте первым!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
