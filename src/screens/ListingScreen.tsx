import { useEffect, useState } from 'react';
import { api, Listing, CATEGORIES, formatPrice, formatDateTime } from '@/lib/api';
import { getUser } from '@/lib/auth';
import ReportModal from '@/components/ReportModal';
import ListingImage from '@/components/ListingImage';
import Icon from '@/components/ui/icon';

interface Props {
  listingId: number;
  onBack: () => void;
  onChat: (listing: Listing) => void;
  favorites: number[];
  onFavoriteToggle: (id: number) => void;
}

export default function ListingScreen({ listingId, onBack, onChat, favorites, onFavoriteToggle }: Props) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState('');
  const [phoneShown, setPhoneShown] = useState(false);
  const user = getUser();

  useEffect(() => {
    api.getListing(listingId).then(res => {
      if (!res.error) setListing(res);
      setLoading(false);
    });
  }, [listingId]);

  function buildShareUrl(): string {
    const origin = window.location.origin;
    return `${origin}/listing?id=${listingId}`;
  }

  async function handleShare() {
    setShareError('');
    if (!listing) {
      setShareError('Не удалось поделиться, попробуйте позже');
      return;
    }
    const url = buildShareUrl();
    const parts: string[] = [`Цена: ${formatPrice(listing.price)}.`];
    const yearMileage: string[] = [];
    if (listing.year) yearMileage.push(`${listing.year} г.`);
    if (listing.mileage) yearMileage.push(`${new Intl.NumberFormat('ru-RU').format(listing.mileage)} км`);
    if (yearMileage.length) parts.push(yearMileage.join(', ') + '.');
    parts.push('Смотри на иТони!');
    const text = parts.join(' ');
    const title = `${listing.title} — иТони`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    // Фолбэк: попап со ссылкой
    setShareUrl(url);
    setCopied(false);
  }

  async function copyShareLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareError('Не удалось скопировать');
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center text-gray-400">
        <div className="text-4xl mb-2 animate-pulse">🚗</div>
        <p className="text-sm">Загрузка...</p>
      </div>
    </div>
  );

  if (!listing) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center text-gray-400">
        <div className="text-4xl mb-2">😕</div>
        <p>Объявление удалено</p>
        <button onClick={onBack} className="mt-4 text-itoni-blue text-sm">Назад</button>
      </div>
    </div>
  );

  const images = listing.images?.length ? listing.images : [];
  const cat = CATEGORIES.find(c => c.id === listing.category);
  const isFav = favorites.includes(listing.id);
  const isOwner = user?.id === listing.user_id;

  const specs = [
    { label: 'Год выпуска', value: listing.year },
    { label: 'Пробег', value: listing.mileage ? new Intl.NumberFormat('ru-RU').format(listing.mileage) + ' км' : null },
    { label: 'Топливо', value: listing.fuel_type },
    { label: 'КПП', value: listing.transmission },
    { label: 'Город', value: listing.city },
    { label: 'Регион', value: listing.region },
  ].filter(s => s.value);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Image gallery */}
      <div className="relative bg-black">
        <button
          onClick={onBack}
          className="absolute top-12 left-4 z-20 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center"
        >
          <Icon name="ChevronLeft" size={22} className="text-white" />
        </button>
        <button
          onClick={() => onFavoriteToggle(listing.id)}
          className={`absolute top-12 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center ${isFav ? 'bg-red-500' : 'bg-black/50'}`}
        >
          <Icon name="Heart" size={18} className="text-white" />
        </button>

        <ListingImage
          src={images[imgIndex]}
          alt={listing.title}
          className="w-full h-72 object-cover"
          iconSize={48}
        />

        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIndex ? 'bg-white w-4' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-3 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
            {imgIndex + 1}/{images.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="bg-white px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {images.map((img, i) => (
            <button key={i} onClick={() => setImgIndex(i)} className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === imgIndex ? 'border-itoni-blue' : 'border-transparent'}`}>
              <ListingImage src={img} alt="" className="w-full h-full object-cover" iconSize={18} />
            </button>
          ))}
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        {/* Price & Title */}
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs bg-itoni-blue-light text-itoni-blue font-medium px-2 py-1 rounded-lg">
              {cat?.emoji} {cat?.label}
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Icon name="Eye" size={12} />
              <span>{listing.views} просм.</span>
            </div>
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">{listing.title}</h1>
          <p className="text-3xl font-extrabold text-itoni-blue">{formatPrice(listing.price)}</p>
          <p className="text-xs text-gray-400 mt-1">Опубликовано: {formatDateTime(listing.created_at)}</p>
        </div>

        {/* Specs */}
        {specs.length > 0 && (
          <div className="bg-white rounded-2xl p-4 card-shadow">
            <h2 className="font-bold text-gray-900 mb-3">Характеристики</h2>
            <div className="grid grid-cols-2 gap-y-3">
              {specs.map(s => (
                <div key={s.label}>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-sm font-semibold text-gray-900">{String(s.value)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {listing.description && (
          <div className="bg-white rounded-2xl p-4 card-shadow">
            <h2 className="font-bold text-gray-900 mb-2">Описание</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
          </div>
        )}

        {/* Seller */}
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <h2 className="font-bold text-gray-900 mb-3">Продавец</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-itoni-blue-light flex items-center justify-center overflow-hidden">
              {listing.seller_photo ? (
                <img src={listing.seller_photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <Icon name="User" size={22} className="text-itoni-blue" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{listing.seller_name || 'Пользователь'}</p>
              {phoneShown && listing.seller_show_phone !== false ? (
                <a href={`tel:${listing.seller_phone}`} className="text-sm font-semibold text-itoni-blue">{listing.seller_phone}</a>
              ) : (
                <p className="text-xs text-gray-500">Номер скрыт</p>
              )}
            </div>
          </div>

          {!isOwner && listing.seller_show_phone !== false && !phoneShown && (
            <button
              onClick={() => setPhoneShown(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 border border-itoni-blue text-itoni-blue font-semibold py-2.5 rounded-xl active:scale-[0.98] transition-all"
            >
              <Icon name="Eye" size={16} />
              Показать номер
            </button>
          )}
        </div>

        {/* Actions: favorite / share / report */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onFavoriteToggle(listing.id)}
            className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl card-shadow bg-white active:scale-[0.97] transition-all ${isFav ? 'text-red-500' : 'text-gray-500'}`}
          >
            <Icon name="Heart" size={20} className={isFav ? 'fill-red-500' : ''} />
            <span className="text-xs font-medium">{isFav ? 'В избранном' : 'В избранное'}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl card-shadow bg-white text-itoni-blue active:scale-[0.97] transition-all"
          >
            <Icon name="Share2" size={20} />
            <span className="text-xs font-medium">Поделиться</span>
          </button>

          <button
            onClick={() => setShowReport(true)}
            disabled={isOwner}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl card-shadow bg-white text-gray-500 active:scale-[0.97] transition-all disabled:opacity-40"
          >
            <Icon name="Flag" size={20} />
            <span className="text-xs font-medium">Пожаловаться</span>
          </button>
        </div>

        {shareError && <p className="text-red-500 text-sm text-center">{shareError}</p>}

        {/* Spacing for bottom buttons */}
        <div className="h-4" />
      </div>

      {/* Bottom action bar */}
      {!isOwner && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-3">
          {listing.seller_show_phone !== false && (
            <a
              href={`tel:${listing.seller_phone}`}
              className="flex-1 flex items-center justify-center gap-2 border border-itoni-blue text-itoni-blue font-bold py-3.5 rounded-xl"
            >
              <Icon name="Phone" size={18} />
              Позвонить
            </a>
          )}
          <button
            onClick={() => onChat(listing)}
            className="flex-1 flex items-center justify-center gap-2 bg-itoni-blue text-white font-bold py-3.5 rounded-xl"
          >
            <Icon name="MessageCircle" size={18} />
            Написать
          </button>
        </div>
      )}

      {showReport && <ReportModal listingId={listing.id} onClose={() => setShowReport(false)} />}

      {/* Share fallback popup */}
      {shareUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6" onClick={() => setShareUrl(null)}>
          <div className="absolute inset-0 bg-black/50 animate-fade-in" />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Поделиться</h3>
              <button onClick={() => setShareUrl(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Icon name="X" size={16} className="text-gray-600" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">Скопируйте ссылку на объявление:</p>
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5 mb-4">
              <p className="text-sm text-gray-700 truncate flex-1">{shareUrl}</p>
            </div>
            <button
              onClick={copyShareLink}
              className="w-full bg-itoni-blue text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
            >
              <Icon name={copied ? 'Check' : 'Copy'} size={18} />
              {copied ? 'Скопировано!' : 'Скопировать ссылку'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}