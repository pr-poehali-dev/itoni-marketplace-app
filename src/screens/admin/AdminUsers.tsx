import { useEffect, useState } from 'react';
import { adminApi, AdminUser } from '@/lib/adminApi';
import Icon from '@/components/ui/icon';

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(q?: string) {
    setLoading(true);
    const res = await adminApi.users(q);
    setUsers(res.users || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  async function toggleBlock(u: AdminUser) {
    await adminApi.blockUser(u.id, !u.is_blocked);
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_blocked: !x.is_blocked } : x));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 card-shadow">
        <Icon name="Search" size={16} className="text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по имени или телефону"
          className="flex-1 text-sm focus:outline-none bg-transparent"
        />
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8 text-sm">Загрузка...</p>
      ) : users.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">Ничего не найдено</p>
      ) : (
        users.map(u => (
          <div key={u.id} className="bg-white rounded-xl p-3 card-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{u.name || 'Без имени'} <span className="text-gray-400 font-normal">#{u.id}</span></p>
                <p className="text-xs text-gray-500">{u.phone}</p>
                <p className="text-xs text-gray-400">{[u.city, u.region].filter(Boolean).join(', ') || '—'}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{u.created_at ? new Date(u.created_at).toLocaleDateString('ru-RU') : ''}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.is_blocked ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                  {u.is_blocked ? 'Заблокирован' : 'Активен'}
                </span>
                <button
                  onClick={() => toggleBlock(u)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg ${u.is_blocked ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                >
                  {u.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
