import { Heart } from 'lucide-react';
import { Listing, formatPrice, CATEGORIES } from '@/lib/api';

interface Props {
  listing: Listing | {
    id: number; title: string; price: number; category: string;
    brand?: string; model?: string; year?: number; mileage?: number;
    city?: string; images?: string[]; views?: number; created_at?: string;
    seller_name?: string; seller_photo?: string;
  };
  isFavorite?: boolean;
  onFavoriteToggle?: (id: number) => void;
  onClick?: () => void;
  compact?: boolean;
}

const PLACEHOLDER = 'https://cdn.poehali.dev/projects/d65ee484-6681-47d8-a176-bbe2415ceef3/files/2291a7e5-3513-4003-9ec3-c753a61b4a28.jpg';

export default function ListingCard({ listing, isFavorite, onFavoriteToggle, onClick, compact }: Props) {
  const cat = CATEGORIES.find(c => c.id === listing.category);
  const img = listing.images?.[0] || PLACEHOLDER;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl card-shadow overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-150"
    >
      <div className="relative">
        <img
          src={img}
          alt={listing.title}
          className={`w-full object-cover ${compact ? 'h-36' : 'h-48'}`}
          onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
        />
        <div className="absolute top-2 left-2">
          <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-lg font-medium">
            {cat?.emoji} {cat?.label}
          </span>
        </div>
        {onFavoriteToggle && (
          <button
            onClick={e => { e.stopPropagation(); onFavoriteToggle(listing.id); }}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-400'
            }`}
          >
            <Heart size={15} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      <div className="p-3">
        <p className="font-bold text-base text-gray-900 leading-tight line-clamp-2 mb-1">{listing.title}</p>
        <p className="text-lg font-extrabold text-itoni-blue">{formatPrice(listing.price)}</p>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 flex-wrap">
          {listing.year && <span>{listing.year}</span>}
          {listing.mileage !== undefined && listing.mileage > 0 && <span>· {new Intl.NumberFormat('ru-RU').format(listing.mileage)} км</span>}
          {listing.city && <span>· {listing.city}</span>}
        </div>
      </div>
    </div>
  );
}
