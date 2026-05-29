import { useEffect, useState } from 'react';
import { api, Listing } from '@/lib/api';
import ListingCard from '@/components/ListingCard';
import Icon from '@/components/ui/icon';

interface Props {
  onBack: () => void;
  onListingClick: (id: number) => void;
  favorites: number[];
  onFavoriteToggle: (id: number) => void;
}

export default function FavoritesScreen({ onBack, onListingClick, favorites, onFavoriteToggle }: Props) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFavorites().then(res => {
      setListings(res.favorites || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="pb-nav bg-gray-50 min-h-screen">
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Icon name="ChevronLeft" size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-extrabold text-gray-900">Избранное</h1>
        </div>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-52 animate-pulse" />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <Icon name="Heart" size={36} className="text-red-300" />
            </div>
            <p className="font-medium text-gray-600 mb-1">Список пуст</p>
            <p className="text-sm text-center">Нажмите ♡ на объявлении, чтобы добавить его сюда</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {listings.map(l => (
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
        )}
      </div>
    </div>
  );
}