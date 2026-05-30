import { useEffect, useState } from 'react';
import { adminApi, AdminCategory } from '@/lib/adminApi';

const EMPTY = { name: '', icon: '', slug: '', sort_order: 0, is_active: true };

export default function AdminCategories() {
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(typeof EMPTY & { id?: number }) | null>(null);

  async function load() {
    setLoading(true);
    const res = await adminApi.categories();
    setCats(res.categories || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    await adminApi.saveCategory(editing);
    setEditing(null);
    load();
  }

  async function toggle(id: number) {
    await adminApi.toggleCategory(id);
    load();
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setEditing({ ...EMPTY })} className="w-full bg-itoni-blue text-white font-bold py-2.5 rounded-xl text-sm">
        + Добавить категорию
      </button>

      {loading ? (
        <p className="text-center text-gray-400 py-8 text-sm">Загрузка...</p>
      ) : (
        cats.map(c => (
          <div key={c.id} className="bg-white rounded-xl p-3 card-shadow flex items-center gap-3">
            <span className="text-2xl">{c.icon || '📦'}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
              <p className="text-[11px] text-gray-400">slug: {c.slug} · позиция {c.sort_order}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{c.is_active ? 'Вкл' : 'Выкл'}</span>
              <div className="flex gap-1">
                <button onClick={() => setEditing({ id: c.id, name: c.name, icon: c.icon || '', slug: c.slug, sort_order: c.sort_order, is_active: c.is_active })} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-lg">Изм.</button>
                <button onClick={() => toggle(c.id)} className="text-xs text-itoni-blue bg-itoni-blue-light px-2 py-1 rounded-lg">{c.is_active ? 'Выкл' : 'Вкл'}</button>
              </div>
            </div>
          </div>
        ))
      )}

      {editing && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-6" onClick={() => setEditing(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-3">{editing.id ? 'Изменить категорию' : 'Новая категория'}</h3>
            <div className="space-y-2.5">
              <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Название" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
              <input value={editing.icon} onChange={e => setEditing({ ...editing, icon: e.target.value })} placeholder="Эмодзи (например 🚗)" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
              <input type="number" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} placeholder="Позиция" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} /> Активна
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
