import { useState } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Props {
  listingId: number;
  onClose: () => void;
}

const REASONS = [
  'Мошенничество',
  'Товар уже продан',
  'Неверная цена',
  'Запрещённый товар',
  'Спам или реклама',
  'Оскорбительный контент',
  'Другое',
];

export default function ReportModal({ listingId, onClose }: Props) {
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!reason) return;
    setLoading(true);
    const res = await api.reportListing(listingId, reason, comment);
    setLoading(false);
    if (res.success) setSent(true);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={() => !loading && onClose()}>
      <div className="absolute inset-0 bg-black/50 animate-fade-in" />
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl max-h-[80vh] flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
        {sent ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <Icon name="CircleCheck" size={32} className="text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Жалоба отправлена</h3>
            <p className="text-sm text-gray-500 mb-6">Спасибо! Модерация иТони рассмотрит ваше обращение.</p>
            <button onClick={onClose} className="w-full bg-itoni-blue text-white font-bold py-3 rounded-xl">Готово</button>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Пожаловаться</h3>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Icon name="X" size={16} className="text-gray-600" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              <p className="text-sm text-gray-500 mb-1">Выберите причину:</p>
              {REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-left border transition-colors ${reason === r ? 'border-itoni-blue bg-itoni-blue-light text-itoni-blue font-semibold' : 'border-gray-200 text-gray-700'}`}
                >
                  {r}
                  {reason === r && <Icon name="Check" size={16} className="text-itoni-blue" />}
                </button>
              ))}
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Комментарий (необязательно)"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-itoni-blue resize-none mt-2"
              />
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleSend}
                disabled={!reason || loading}
                className="w-full bg-red-500 text-white font-bold py-3.5 rounded-xl disabled:opacity-50"
              >
                {loading ? 'Отправка...' : 'Отправить жалобу'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
