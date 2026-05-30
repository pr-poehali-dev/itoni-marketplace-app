import { useEffect, useState } from 'react';
import { adminApi, AdminLog } from '@/lib/adminApi';

export default function AdminLogs() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');

  async function load(d?: string) {
    setLoading(true);
    const res = await adminApi.logs(d || undefined);
    setLogs(res.logs || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); load(e.target.value); }} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white" />
        {dateFrom && <button onClick={() => { setDateFrom(''); load(); }} className="text-xs text-gray-500 px-3 py-2">Сброс</button>}
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8 text-sm">Загрузка...</p>
      ) : logs.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">Записей нет</p>
      ) : (
        logs.map(l => (
          <div key={l.id} className="bg-white rounded-xl p-3 card-shadow">
            <p className="text-sm text-gray-900">{l.action}</p>
            <p className="text-[11px] text-gray-400 mt-1">{l.admin_email} · {l.created_at ? new Date(l.created_at).toLocaleString('ru-RU') : ''}</p>
          </div>
        ))
      )}
    </div>
  );
}
