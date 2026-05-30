import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Listing, formatPrice, CATEGORIES } from '@/lib/api';
import Icon from '@/components/ui/icon';

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
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = `${window.location.origin}/listing?id=${listing.id}`;
  const shareText = `${listing.title} — иТони. Цена: ${formatPrice(listing.price)}. Смотри на иТони!`;

  function openShare(e: React.MouseEvent) {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: `${listing.title} — иТони`, text: shareText, url }).catch(() => {});
    } else {
      setShareOpen(true);
    }
  }

  function copyLink(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => { setCopied(false); setShareOpen(false); }, 1200);
    });
  }

  const enc = encodeURIComponent;
  const links = {
    whatsapp: `https://wa.me/?text=${enc(shareText + ' ' + url)}`,
    telegram: `https://t.me/share/url?url=${enc(url)}&text=${enc(shareText)}`,
    vk: `https://vk.com/share.php?url=${enc(url)}&title=${enc(shareText)}`,
  };

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

        {/* Share */}
        <button
          onClick={openShare}
          className="mt-2.5 w-full flex items-center justify-center gap-1.5 text-itoni-blue bg-itoni-blue-light font-semibold text-sm py-2 rounded-xl"
        >
          <Icon name="Share2" size={15} />
          Поделиться
        </button>
      </div>

      {/* Share sheet (fallback) */}
      {shareOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center" onClick={e => { e.stopPropagation(); setShareOpen(false); }}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-t-3xl w-full max-w-md p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Поделиться</h3>
              <button onClick={() => setShareOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Icon name="X" size={16} className="text-gray-600" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-2xl bg-green-500 flex items-center justify-center"><Icon name="MessageCircle" size={24} className="text-white" /></div>
                <span className="text-[11px] text-gray-600">WhatsApp</span>
              </a>
              <a href={links.telegram} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-2xl bg-sky-500 flex items-center justify-center"><Icon name="Send" size={22} className="text-white" /></div>
                <span className="text-[11px] text-gray-600">Telegram</span>
              </a>
              <a href={links.vk} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center"><span className="text-white font-extrabold text-lg">VK</span></div>
                <span className="text-[11px] text-gray-600">ВКонтакте</span>
              </a>
              <button onClick={copyLink} className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center"><Icon name={copied ? 'Check' : 'Copy'} size={22} className="text-gray-700" /></div>
                <span className="text-[11px] text-gray-600">{copied ? 'Готово' : 'Копировать'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
