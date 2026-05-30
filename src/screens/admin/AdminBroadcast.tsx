import { useEffect, useState } from 'react';
import { adminApi, AdminBroadcast } from '@/lib/adminApi';

const KINDS = [
  { id: 'info', label: 'Информация' },
  { id: 'important', label: 'Важное' },
  { id: 'update', label: 'Обновление' },
  { id: 'maintenance', label: 'Техработы' },
];

export default function AdminBroadcastTab() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [kind, setKind] = useState('info');
  const [sending, setSending] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [history, setHistory] = useState<AdminBroadcast[]>([]);

  async function loadHistory() {
    const res = await adminApi.broadcasts();
    setHistory(res.broadcasts || []);
  }

  useEffect(() => { loadHistory(); }, []);

  async function send() {
    setSending(true);
    const res = await adminApi.broadcast({ title, body, kind });
    setSending(false);
    setConfirm(false);
    if (res.success) {
      alert(`Рассылка отправлена ${res.sent} пользователям`);
      setTitle(''); setBody('');
      loadHistory();
    } else {
      alert(res.error || 'Ошибка');
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 card-shadow space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Заголовок ({title.length}/60)</label>
          <input value={title} maxLength={60} onChange={e => setTitle(e.target.value)} placeholder="Заголовок" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Текст ({body.length}/200)</label>
          <textarea value={body} maxLength={200} onChange={e => setBody(e.target.value)} rows={3} placeholder="Текст уведомления" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Тип</label>
          <div className="flex flex-wrap gap-2">
            {KINDS.map(k => (
              <button key={k.id} onClick={() => setKind(k.id)} className={`text-xs px-3 py-1.5 rounded-lg ${kind === k.id ? 'bg-itoni-blue text-white' : 'bg-gray-100 text-gray-600'}`}>{k.label}</button>
            ))}
          </div>
        </div>
        <button onClick={() => setConfirm(true)} disabled={!title.trim() || !body.trim()} className="w-full bg-itoni-blue text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
          Отправить всем пользователям
        </button>
      </div>

      <div>
        <p className="font-bold text-gray-900 text-sm mb-2 px-1">История рассылок</p>
        {history.length === 0 ? (
          <p className="text-center text-gray-400 py-6 text-sm">Рассылок ещё не было</p>
        ) : (
          <div className="space-y-2">
            {history.map(h => (
              <div key={h.id} className="bg-white rounded-xl p-3 card-shadow">
                <div className="flex justify-between items-start gap-2">
                  <p className="font-semibold text-gray-900 text-sm">{h.title}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-itoni-blue-light text-itoni-blue shrink-0">{KINDS.find(k => k.id === h.kind)?.label || h.kind}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{h.body}</p>
                <p className="text-[11px] text-gray-400 mt-1">{h.created_at ? new Date(h.created_at).toLocaleString('ru-RU') : ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-6" onClick={() => setConfirm(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl p-5 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-2">Отправить всем?</h3>
            <p className="text-sm text-gray-500 mb-4">Уведомление получат все зарегистрированные пользователи.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(false)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl text-sm">Отмена</button>
              <button onClick={send} disabled={sending} className="flex-1 bg-itoni-blue text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-60">{sending ? 'Отправка...' : 'Отправить'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
