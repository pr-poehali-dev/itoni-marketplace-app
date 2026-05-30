import { useEffect, useState } from 'react';
import { adminApi, AdminInstall } from '@/lib/adminApi';

export default function AdminInstalls() {
  const [installs, setInstalls] = useState<AdminInstall[]>([]);
  const [counts, setCounts] = useState({ total: 0, today: 0, week: 0, month: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.installs().then(res => {
      setInstalls(res.installs || []);
      setCounts(res.counts || { total: 0, today: 0, week: 0, month: 0 });
      setLoading(false);
    });
  }, []);

  async function exportCsv() {
    const res = await adminApi.installsCsv();
    if (!res.csv) return;
    const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `itoni_installs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Всего', value: counts.total },
          { label: 'Сегодня', value: counts.today },
          { label: 'Неделя', value: counts.week },
          { label: 'Месяц', value: counts.month },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl p-2 card-shadow text-center">
            <p className="text-lg font-extrabold text-gray-900">{c.value}</p>
            <p className="text-[10px] text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      <button onClick={exportCsv} className="w-full bg-itoni-blue text-white font-bold py-2.5 rounded-xl text-sm">
        Экспорт в CSV
      </button>

      {loading ? (
        <p className="text-center text-gray-400 py-8 text-sm">Загрузка...</p>
      ) : installs.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">Установок пока нет</p>
      ) : (
        installs.map(i => (
          <div key={i.id} className="bg-white rounded-xl p-3 card-shadow">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{[i.city, i.region].filter(Boolean).join(', ') || 'Город не указан'}</p>
                <p className="text-xs text-gray-500 truncate">{i.device_info || 'Устройство не определено'}</p>
                <p className="text-xs text-gray-400">{i.user_name ? `Пользователь: ${i.user_name}` : 'Гость'}</p>
              </div>
              <p className="text-[11px] text-gray-400 shrink-0">{i.installed_at ? new Date(i.installed_at).toLocaleString('ru-RU') : ''}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
