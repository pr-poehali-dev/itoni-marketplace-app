import { useEffect, useState } from 'react';
import { api, Listing } from '@/lib/api';
import ListingCard from '@/components/ListingCard';
import Icon from '@/components/ui/icon';

interface Props {
  sellerId: number;
  sellerName?: string;
  sellerPhoto?: string;
  sellerPhone?: string;
  onBack: () => void;
  onListingClick: (id: number) => void;
  onChat: (listing: Listing) => void;
  favorites: number[];
  onFavoriteToggle: (id: number) => void;
}

export default function SellerScreen({
  sellerId, sellerName, sellerPhoto, sellerPhone,
  onBack, onListingClick, onChat, favorites, onFavoriteToggle,
}: Props) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const name = sellerName || 'Продавец';
  const showPhone = listings[0] ? listings[0].seller_show_phone !== false : true;
  const phone = showPhone ? (listings[0]?.seller_phone || sellerPhone) : undefined;
  const photo = listings[0]?.seller_photo || sellerPhoto;

  useEffect(() => {
    api.getListings({ user_id: sellerId, limit: 50 }).then(res => {
      setListings(res.listings || []);
      setLoading(false);
    });
  }, [sellerId]);

  function handleChat() {
    if (listings[0]) {
      onChat(listings[0]);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Icon name="ChevronLeft" size={20} className="text-gray-600" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-itoni-blue-light flex items-center justify-center overflow-hidden shrink-0">
            {photo ? (
              <img src={photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <Icon name="User" size={28} className="text-itoni-blue" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-gray-900 truncate">{name}</p>
            <p className="text-sm text-gray-500">
              {loading ? 'Загрузка...' : `${listings.length} ${plural(listings.length)}`}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex-1 flex items-center justify-center gap-2 bg-itoni-blue text-white font-semibold py-3 rounded-2xl active:scale-[0.98] transition-transform"
            >
              <Icon name="Phone" size={18} />
              Позвонить
            </a>
          )}
          <button
            onClick={handleChat}
            disabled={!listings.length}
            className="flex-1 flex items-center justify-center gap-2 bg-itoni-blue-light text-itoni-blue font-semibold py-3 rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            <Icon name="MessageCircle" size={18} />
            Написать
          </button>
        </div>
      </div>

      {/* Listings */}
      <div className="px-4 py-4">
        <h2 className="font-bold text-gray-900 mb-3">Объявления продавца</h2>
        {loading ? (
          <div className="text-center text-gray-400 py-10 text-sm">Загрузка...</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-sm">У продавца пока нет активных объявлений</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {listings.map(l => (
              <ListingCard
                key={l.id}
                listing={l}
                compact
                isFavorite={favorites.includes(l.id)}
                onFavoriteToggle={onFavoriteToggle}
                onClick={() => onListingClick(l.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function plural(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'объявление';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'объявления';
  return 'объявлений';
}