import { useEffect, useState } from 'react';
import { adminApi, AdminReport } from '@/lib/adminApi';
import Icon from '@/components/ui/icon';

interface Props {
  onOpenListing: (id: number) => void;
}

export default function AdminReports({ onOpenListing }: Props) {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await adminApi.reports();
    setReports(res.reports || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function blockOwner(userId?: number) {
    if (!userId) return;
    await adminApi.blockUser(userId, true);
    alert('Пользователь заблокирован');
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <p className="text-center text-gray-400 py-8 text-sm">Загрузка...</p>
      ) : reports.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">Жалоб нет</p>
      ) : (
        reports.map(r => {
          const targetUser = r.target_type === 'user' ? r.target_user_id : r.listing_owner_id;
          return (
            <div key={r.id} className="bg-white rounded-xl p-3 card-shadow">
              <div className="flex items-start gap-2">
                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <Icon name="Flag" size={16} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{r.reason}</p>
                  {r.comment && <p className="text-xs text-gray-500 mt-0.5">{r.comment}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    От: {r.reporter_name || `#${r.reporter_id}`} ·{' '}
                    {r.target_type === 'user'
                      ? `на пользователя ${r.target_user_name || '#' + r.target_user_id}`
                      : `на объявление «${r.listing_title || '#' + r.listing_id}»`}
                  </p>
                  <p className="text-[11px] text-gray-400">{r.created_at ? new Date(r.created_at).toLocaleString('ru-RU') : ''}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
                {r.listing_id && (
                  <button onClick={() => onOpenListing(r.listing_id!)} className="flex-1 text-xs font-medium text-gray-600 bg-gray-50 py-1.5 rounded-lg">
                    Посмотреть объявление
                  </button>
                )}
                {targetUser && (
                  <button onClick={() => blockOwner(targetUser)} className="flex-1 text-xs font-medium text-red-500 bg-red-50 py-1.5 rounded-lg">
                    Заблокировать пользователя
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
