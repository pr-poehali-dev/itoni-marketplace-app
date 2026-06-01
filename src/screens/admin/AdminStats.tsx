import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { CATEGORIES } from '@/lib/api';
import Icon from '@/components/ui/icon';

type Stats = {
  users: number; listings: number; messages: number; reports: number;
  views_total: number; new_users_today: number; new_users_week: number; new_users_month: number;
  by_category: Record<string, number>;
};

export default function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.stats().then(res => {
      if (res?.stats) setStats(res.stats);
      else setError(res?.error || 'Не удалось загрузить статистику');
    });
  }, []);

  if (error) return <p className="text-center text-red-500 py-8 text-sm">{error}</p>;
  if (!stats) return <p className="text-center text-gray-400 py-8 text-sm">Загрузка...</p>;

  const cards = [
    { icon: 'Users', label: 'Пользователей', value: stats.users, color: 'text-itoni-blue', bg: 'bg-itoni-blue-light' },
    { icon: 'FileText', label: 'Объявлений', value: stats.listings, color: 'text-green-600', bg: 'bg-green-50' },
    { icon: 'MessageCircle', label: 'Сообщений', value: stats.messages, color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: 'Flag', label: 'Жалоб', value: stats.reports, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  const maxCat = Math.max(1, ...Object.values(stats.by_category));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl p-3 card-shadow">
            <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-2`}>
              <Icon name={c.icon} size={18} className={c.color} />
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 card-shadow">
        <p className="font-bold text-gray-900 text-sm mb-3">Новые пользователи</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><p className="text-xl font-extrabold text-gray-900">{stats.new_users_today}</p><p className="text-[11px] text-gray-500">Сегодня</p></div>
          <div><p className="text-xl font-extrabold text-gray-900">{stats.new_users_week}</p><p className="text-[11px] text-gray-500">Неделя</p></div>
          <div><p className="text-xl font-extrabold text-gray-900">{stats.new_users_month}</p><p className="text-[11px] text-gray-500">Месяц</p></div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 card-shadow">
        <p className="font-bold text-gray-900 text-sm mb-2">Просмотры объявлений</p>
        <p className="text-2xl font-extrabold text-itoni-blue">{stats.views_total}</p>
        <p className="text-xs text-gray-500">всего просмотров</p>
      </div>

      <div className="bg-white rounded-xl p-4 card-shadow">
        <p className="font-bold text-gray-900 text-sm mb-3">Объявления по категориям</p>
        <div className="space-y-2">
          {CATEGORIES.map(c => {
            const v = stats.by_category[c.id] || 0;
            return (
              <div key={c.id}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-700">{c.emoji} {c.label}</span>
                  <span className="font-semibold text-gray-900">{v}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-itoni-blue rounded-full" style={{ width: `${(v / maxCat) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}