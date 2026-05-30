import { useEffect, useState } from 'react';
import { adminApi, AdminHomeItem } from '@/lib/adminApi';

const SECTION_LABELS: Record<string, string> = {
  greeting: 'Приветствие',
  promo: 'Акция / промо',
  footer: 'Подвал',
};

export default function AdminHomeContent() {
  const [items, setItems] = useState<AdminHomeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminHomeItem | null>(null);

  async function load() {
    setLoading(true);
    const res = await adminApi.homeContent();
    setItems(res.content || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    await adminApi.saveHomeContent({ id: editing.id, content: editing.content, is_active: editing.is_active });
    setEditing(null);
    load();
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <p className="text-center text-gray-400 py-8 text-sm">Загрузка...</p>
      ) : (
        items.map(it => (
          <div key={it.id} className="bg-white rounded-xl p-3 card-shadow">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-400 uppercase">{SECTION_LABELS[it.section] || it.section}</p>
                <p className="text-sm text-gray-900 mt-0.5">{it.content || '—'}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${it.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {it.is_active ? 'Вкл' : 'Выкл'}
              </span>
            </div>
            <button onClick={() => setEditing(it)} className="w-full mt-2 text-xs font-medium text-gray-600 bg-gray-50 py-1.5 rounded-lg">Редактировать</button>
          </div>
        ))
      )}

      {editing && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-6" onClick={() => setEditing(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-3">{SECTION_LABELS[editing.section] || editing.section}</h3>
            <textarea value={editing.content || ''} onChange={e => setEditing({ ...editing, content: e.target.value })} rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none mb-3" />
            <label className="flex items-center gap-2 text-sm text-gray-700 mb-3">
              <input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} />
              Показывать на главной
            </label>
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl text-sm">Отмена</button>
              <button onClick={save} className="flex-1 bg-itoni-blue text-white font-bold py-2.5 rounded-xl text-sm">Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
