import { useEffect, useState, useCallback } from 'react';
import { api, Listing, CATEGORIES, FUEL_TYPES, TRANSMISSIONS } from '@/lib/api';
import ListingCard from '@/components/ListingCard';
import RegionPicker from '@/components/RegionPicker';
import Icon from '@/components/ui/icon';

interface Props {
  initialCategory?: string;
  onListingClick: (id: number) => void;
  favorites: number[];
  onFavoriteToggle: (id: number) => void;
}

export default function SearchScreen({ initialCategory, onListingClick, favorites, onFavoriteToggle }: Props) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory || '');
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Черновик фильтров — меняются пока пользователь выбирает
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minYear, setMinYear] = useState('');
  const [minMileage, setMinMileage] = useState('');
  const [maxMileage, setMaxMileage] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [transmission, setTransmission] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');

  // Применённые фильтры — используются при запросе
  const [applied, setApplied] = useState({
    minPrice: '', maxPrice: '', minYear: '',
    minMileage: '', maxMileage: '', fuelType: '',
    transmission: '', region: '', city: ''
  });

  const activeFiltersCount = Object.values(applied).filter(Boolean).length;

  function applyFilters() {
    setApplied({ minPrice, maxPrice, minYear, minMileage, maxMileage, fuelType, transmission, region, city });
    setShowFilters(false);
  }

  function resetFilters() {
    setMinPrice(''); setMaxPrice(''); setMinYear('');
    setMinMileage(''); setMaxMileage(''); setFuelType('');
    setTransmission(''); setRegion(''); setCity('');
    setApplied({ minPrice: '', maxPrice: '', minYear: '', minMileage: '', maxMileage: '', fuelType: '', transmission: '', region: '', city: '' });
  }

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = { limit: 20 };
    if (search) params.search = search;
    if (category) params.category = category;
    if (applied.minPrice) params.min_price = applied.minPrice;
    if (applied.maxPrice) params.max_price = applied.maxPrice;
    if (applied.minYear) params.min_year = applied.minYear;
    if (applied.minMileage) params.min_mileage = applied.minMileage;
    if (applied.maxMileage) params.max_mileage = applied.maxMileage;
    if (applied.fuelType) params.fuel_type = applied.fuelType;
    if (applied.transmission) params.transmission = applied.transmission;
    if (applied.region) params.region = applied.region;
    if (applied.city) params.city = applied.city;
    const res = await api.getListings(params);
    setListings(res.listings || []);
    setTotal(res.total || 0);
    setLoading(false);
  }, [search, category, applied]);

  useEffect(() => {
    if (initialCategory) setCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="pb-nav bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
            <Icon name="Search" size={16} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по марке, модели..."
              className="bg-transparent flex-1 text-sm focus:outline-none"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <Icon name="X" size={14} className="text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center ${showFilters || activeFiltersCount > 0 ? 'bg-itoni-blue text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            <Icon name="SlidersHorizontal" size={18} />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-itoni-orange text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setCategory('')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!category ? 'bg-itoni-blue text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Все
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(category === c.id ? '' : c.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${category === c.id ? 'bg-itoni-blue text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white px-4 py-4 border-b border-gray-100 animate-slide-up space-y-4">
          {/* Price */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1.5 block">Цена, ₽</label>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="от" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-itoni-blue" />
              <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="до" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-itoni-blue" />
            </div>
          </div>

          {/* Year + Mileage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1.5 block">Год от</label>
              <input type="number" value={minYear} onChange={e => setMinYear(e.target.value)} placeholder="2000" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-itoni-blue" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1.5 block">Пробег, км</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={minMileage} onChange={e => setMinMileage(e.target.value)} placeholder="от" className="w-full border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-itoni-blue" />
                <input type="number" value={maxMileage} onChange={e => setMaxMileage(e.target.value)} placeholder="до" className="w-full border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-itoni-blue" />
              </div>
            </div>
          </div>

          {/* Fuel type */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1.5 block">Тип топлива</label>
            <div className="flex flex-wrap gap-2">
              {FUEL_TYPES.map(f => (
                <button
                  key={f}
                  onClick={() => setFuelType(fuelType === f ? '' : f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${fuelType === f ? 'bg-itoni-blue text-white border-itoni-blue' : 'border-gray-200 text-gray-600'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Transmission */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1.5 block">Коробка передач</label>
            <div className="flex flex-wrap gap-2">
              {TRANSMISSIONS.map(t => (
                <button
                  key={t}
                  onClick={() => setTransmission(transmission === t ? '' : t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${transmission === t ? 'bg-itoni-blue text-white border-itoni-blue' : 'border-gray-200 text-gray-600'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Region / City */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1.5 block">Регион и город</label>
            <RegionPicker
              region={region}
              city={city}
              onChange={(r, c) => { setRegion(r); setCity(c); }}
              label={false}
            />
          </div>

          <div className="flex gap-2 pt-1">
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex-none border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 font-medium whitespace-nowrap"
              >
                Сбросить
              </button>
            )}
            <button
              onClick={applyFilters}
              className="flex-1 bg-itoni-blue text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm"
            >
              <Icon name="Search" size={16} />
              Найти
            </button>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        <span className="text-sm text-gray-500">{loading ? 'Поиск...' : `Найдено: ${total}`}</span>
      </div>

      {/* Listings */}
      <div className="px-4 pb-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-2xl h-52 animate-pulse" />)}
          </div>
        ) : listings.length > 0 ? (
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
        ) : (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-medium">Ничего не найдено</p>
            <p className="text-sm mt-1">Попробуйте изменить запрос или фильтры</p>
          </div>
        )}
      </div>
    </div>
  );
}