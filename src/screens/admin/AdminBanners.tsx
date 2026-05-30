import { useEffect, useState } from 'react';
import { adminApi, AdminBanner } from '@/lib/adminApi';
import Icon from '@/components/ui/icon';

const EMPTY = { title: '', image_url: '', link_url: '', position: 0, is_active: true };

export default function AdminBanners() {
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(typeof EMPTY & { id?: number }) | null>(null);

  async function load() {
    setLoading(true);
    const res = await adminApi.banners();
    setBanners(res.banners || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    await adminApi.saveBanner(editing);
    setEditing(null);
    load();
  }

  async function toggle(id: number) {
    await adminApi.toggleBanner(id);
    load();
  }

  async function remove(id: number) {
    if (!confirm('Удалить баннер?')) return;
    await adminApi.deleteBanner(id);
    load();
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setEditing({ ...EMPTY })} className="w-full bg-itoni-blue text-white font-bold py-2.5 rounded-xl text-sm">
        + Добавить баннер
      </button>

      {loading ? (
        <p className="text-center text-gray-400 py-8 text-sm">Загрузка...</p>
      ) : banners.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">Баннеров нет</p>
      ) : (
        banners.map(b => (
          <div key={b.id} className="bg-white rounded-xl p-3 card-shadow">
            <div className="flex gap-3">
              {b.image_url && <img src={b.image_url} alt="" className="w-20 h-14 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{b.title || 'Без названия'}</p>
                <p className="text-xs text-gray-500 truncate">{b.link_url || '—'}</p>
                <p className="text-[11px] text-gray-400">Позиция: {b.position}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full h-fit ${b.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {b.is_active ? 'Активен' : 'Выкл'}
              </span>
            </div>
            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
              <button onClick={() => setEditing({ id: b.id, title: b.title || '', image_url: b.image_url || '', link_url: b.link_url || '', position: b.position, is_active: b.is_active })} className="flex-1 text-xs font-medium text-gray-600 bg-gray-50 py-1.5 rounded-lg">Изменить</button>
              <button onClick={() => toggle(b.id)} className="flex-1 text-xs font-medium text-itoni-blue bg-itoni-blue-light py-1.5 rounded-lg">{b.is_active ? 'Выключить' : 'Включить'}</button>
              <button onClick={() => remove(b.id)} className="flex-1 text-xs font-medium text-red-500 bg-red-50 py-1.5 rounded-lg">Удалить</button>
            </div>
          </div>
        ))
      )}

      {editing && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-6" onClick={() => setEditing(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl p-5 w-full max-w-sm max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-3">{editing.id ? 'Изменить баннер' : 'Новый баннер'}</h3>
            <div className="space-y-2.5">
              <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder="Заголовок" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
              <input value={editing.image_url} onChange={e => setEditing({ ...editing, image_url: e.target.value })} placeholder="Ссылка на картинку (URL)" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
              <input value={editing.link_url} onChange={e => setEditing({ ...editing, link_url: e.target.value })} placeholder="Целевая ссылка" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
              <input type="number" value={editing.position} onChange={e => setEditing({ ...editing, position: parseInt(e.target.value) || 0 })} placeholder="Позиция" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} />
                Активен
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditing(null)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl text-sm">Отмена</button>
              <button onClick={save} className="flex-1 bg-itoni-blue text-white font-bold py-2.5 rounded-xl text-sm">Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
