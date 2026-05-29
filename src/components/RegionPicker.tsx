import { useState } from 'react';
import { REGIONS, getCitiesByRegion } from '@/lib/regions';
import Icon from '@/components/ui/icon';

interface Props {
  region: string;
  city: string;
  onChange: (region: string, city: string) => void;
  dark?: boolean;
  label?: boolean;
}

export default function RegionPicker({ region, city, onChange, dark, label = true }: Props) {
  const [open, setOpen] = useState<'region' | 'city' | null>(null);
  const [query, setQuery] = useState('');

  const cities = region ? getCitiesByRegion(region) : [];

  const filteredRegions = REGIONS.filter(r => r.name.toLowerCase().includes(query.toLowerCase()));
  const filteredCities = cities.filter(c => c.toLowerCase().includes(query.toLowerCase()));

  const triggerCls = dark
    ? 'w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-left text-sm text-white flex items-center justify-between'
    : 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-left text-sm text-gray-900 flex items-center justify-between';

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        {label && <label className={`block text-xs font-medium mb-1.5 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Регион</label>}
        <button type="button" onClick={() => { setOpen('region'); setQuery(''); }} className={triggerCls}>
          <span className={region ? '' : (dark ? 'text-gray-400' : 'text-gray-400')}>
            {region ? (region.length > 16 ? region.slice(0, 15) + '…' : region) : 'Выбрать'}
          </span>
          <Icon name="ChevronDown" size={16} className={dark ? 'text-gray-400' : 'text-gray-400'} />
        </button>
      </div>
      <div>
        {label && <label className={`block text-xs font-medium mb-1.5 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Город</label>}
        <button
          type="button"
          onClick={() => { if (region) { setOpen('city'); setQuery(''); } }}
          disabled={!region}
          className={`${triggerCls} ${!region ? 'opacity-50' : ''}`}
        >
          <span className={city ? '' : 'text-gray-400'}>{city || 'Выбрать'}</span>
          <Icon name="ChevronDown" size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={() => setOpen(null)}>
          <div className="absolute inset-0 bg-black/50 animate-fade-in" />
          <div
            className="relative bg-white w-full max-w-lg rounded-t-3xl max-h-[75vh] flex flex-col animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">{open === 'region' ? 'Выберите регион' : 'Выберите город'}</h3>
                <button onClick={() => setOpen(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Icon name="X" size={16} className="text-gray-600" />
                </button>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
                <Icon name="Search" size={16} className="text-gray-400" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Поиск..."
                  className="bg-transparent flex-1 text-sm focus:outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {open === 'region'
                ? filteredRegions.map(r => (
                    <button
                      key={r.name}
                      onClick={() => { onChange(r.name, ''); setOpen('city'); setQuery(''); }}
                      className={`w-full text-left px-3 py-3 rounded-xl text-sm active:bg-gray-50 flex items-center justify-between ${region === r.name ? 'text-itoni-blue font-semibold' : 'text-gray-800'}`}
                    >
                      {r.name}
                      {region === r.name && <Icon name="Check" size={16} className="text-itoni-blue" />}
                    </button>
                  ))
                : filteredCities.map(c => (
                    <button
                      key={c}
                      onClick={() => { onChange(region, c); setOpen(null); }}
                      className={`w-full text-left px-3 py-3 rounded-xl text-sm active:bg-gray-50 flex items-center justify-between ${city === c ? 'text-itoni-blue font-semibold' : 'text-gray-800'}`}
                    >
                      {c}
                      {city === c && <Icon name="Check" size={16} className="text-itoni-blue" />}
                    </button>
                  ))}
              {((open === 'region' && filteredRegions.length === 0) || (open === 'city' && filteredCities.length === 0)) && (
                <p className="text-center text-gray-400 text-sm py-8">Ничего не найдено</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
