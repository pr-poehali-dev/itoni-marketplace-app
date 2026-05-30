import { useEffect, useState } from 'react';
import { adminApi, AdminListing } from '@/lib/adminApi';
import { CATEGORIES } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Props {
  onOpenListing: (id: number) => void;
}

const STATUSES = [
  { id: '', label: 'Все' },
  { id: 'active', label: 'Активные' },
  { id: 'rejected', label: 'Отклонённые' },
];

export default function AdminListings({ onOpenListing }: Props) {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number[] | null>(null);

  async function load() {
    setLoading(true);
    const res = await adminApi.listings({ category: category || undefined, status: status || undefined });
    setListings(res.listings || []);
    setSelected([]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [category, status]);

  function toggleSelect(id: number) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function doDelete(ids: number[]) {
    await adminApi.deleteListings(ids);
    setConfirmDelete(null);
    load();
  }

  async function doReject() {
    if (rejectId === null) return;
    await adminApi.rejectListing(rejectId, rejectReason);
    setRejectId(null);
    setRejectReason('');
    load();
  }

  async function doApprove(id: number) {
    await adminApi.approveListing(id);
    load();
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <select value={category} onChange={e => setCategory(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
          <option value="">Все категории</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        {STATUSES.map(s => (
          <button key={s.id} onClick={() => setStatus(s.id)} className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap ${status === s.id ? 'bg-itoni-blue text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <button onClick={() => setConfirmDelete(selected)} className="w-full bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm">
          Удалить выбранные ({selected.length})
        </button>
      )}

      {loading ? (
        <p className="text-center text-gray-400 py-8 text-sm">Загрузка...</p>
      ) : listings.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">Объявлений нет</p>
      ) : (
        listings.map(l => (
          <div key={l.id} className="bg-white rounded-xl p-3 card-shadow">
            <div className="flex items-start gap-2">
              <button onClick={() => toggleSelect(l.id)} className="mt-0.5 shrink-0">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${selected.includes(l.id) ? 'bg-itoni-blue border-itoni-blue' : 'border-gray-300'}`}>
                  {selected.includes(l.id) && <Icon name="Check" size={12} className="text-white" />}
                </div>
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm line-clamp-1">{l.title}</p>
                <p className="text-xs text-gray-500">{CATEGORIES.find(c => c.id === l.category)?.label || l.category} · {l.author || 'Аноним'}</p>
                <p className="text-[11px] text-gray-400">{l.created_at ? new Date(l.created_at).toLocaleDateString('ru-RU') : ''}</p>
                {l.status === 'rejected' && <p className="text-[11px] text-red-500 mt-0.5">Отклонено: {l.reject_reason || '—'}</p>}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${l.status === 'rejected' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                {l.status === 'rejected' ? 'Скрыто' : 'В ленте'}
              </span>
            </div>
            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
              <button onClick={() => onOpenListing(l.id)} className="flex-1 text-xs font-medium text-gray-600 bg-gray-50 py-1.5 rounded-lg">Открыть</button>
              {l.status === 'rejected' ? (
                <button onClick={() => doApprove(l.id)} className="flex-1 text-xs font-medium text-green-600 bg-green-50 py-1.5 rounded-lg">Вернуть</button>
              ) : (
                <button onClick={() => { setRejectId(l.id); setRejectReason(''); }} className="flex-1 text-xs font-medium text-itoni-orange bg-itoni-orange-light py-1.5 rounded-lg">Отклонить</button>
              )}
              <button onClick={() => setConfirmDelete([l.id])} className="flex-1 text-xs font-medium text-red-500 bg-red-50 py-1.5 rounded-lg">Удалить</button>
            </div>
          </div>
        ))
      )}

      {/* Reject modal */}
      {rejectId !== null && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-6" onClick={() => setRejectId(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-3">Причина отклонения</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Например: запрещённый товар" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none mb-3" />
            <div className="flex gap-2">
              <button onClick={() => setRejectId(null)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl text-sm">Отмена</button>
              <button onClick={doReject} className="flex-1 bg-itoni-orange text-white font-bold py-2.5 rounded-xl text-sm">Отклонить</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-6" onClick={() => setConfirmDelete(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl p-5 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-2">Удалить {confirmDelete.length > 1 ? `${confirmDelete.length} объявлений` : 'объявление'}?</h3>
            <p className="text-sm text-gray-500 mb-4">Действие необратимо.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl text-sm">Отмена</button>
              <button onClick={() => doDelete(confirmDelete)} className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm">Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
