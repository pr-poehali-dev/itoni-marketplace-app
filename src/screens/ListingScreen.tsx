import { useEffect, useState } from 'react';
import { api, Listing, CATEGORIES, formatPrice, formatDate } from '@/lib/api';
import { getUser } from '@/lib/auth';
import Icon from '@/components/ui/icon';

interface Props {
  listingId: number;
  onBack: () => void;
  onChat: (listing: Listing) => void;
  favorites: number[];
  onFavoriteToggle: (id: number) => void;
}

const PLACEHOLDER = 'https://cdn.poehali.dev/projects/d65ee484-6681-47d8-a176-bbe2415ceef3/files/2291a7e5-3513-4003-9ec3-c753a61b4a28.jpg';

export default function ListingScreen({ listingId, onBack, onChat, favorites, onFavoriteToggle }: Props) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const user = getUser();

  useEffect(() => {
    api.getListing(listingId).then(res => {
      if (!res.error) setListing(res);
      setLoading(false);
    });
  }, [listingId]);

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
        <p>Объявление не найдено</p>
        <button onClick={onBack} className="mt-4 text-itoni-blue text-sm">Назад</button>
      </div>
    </div>
  );

  const images = listing.images?.length ? listing.images : [PLACEHOLDER];
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

        <img
          src={images[imgIndex]}
          alt={listing.title}
          className="w-full h-72 object-cover"
          onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
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
              <img src={img} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
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
          <p className="text-xs text-gray-400 mt-1">{formatDate(listing.created_at)}</p>
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
            <div>
              <p className="font-semibold text-gray-900">{listing.seller_name || 'Пользователь'}</p>
              <p className="text-xs text-gray-500">{listing.seller_phone}</p>
            </div>
          </div>
        </div>

        {/* Spacing for bottom buttons */}
        <div className="h-4" />
      </div>

      {/* Bottom action bar */}
      {!isOwner && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-3">
          <a
            href={`tel:${listing.seller_phone}`}
            className="flex-1 flex items-center justify-center gap-2 border border-itoni-blue text-itoni-blue font-bold py-3.5 rounded-xl"
          >
            <Icon name="Phone" size={18} />
            Позвонить
          </a>
          <button
            onClick={() => onChat(listing)}
            className="flex-1 flex items-center justify-center gap-2 bg-itoni-blue text-white font-bold py-3.5 rounded-xl"
          >
            <Icon name="MessageCircle" size={18} />
            Написать
          </button>
        </div>
      )}
    </div>
  );
}
