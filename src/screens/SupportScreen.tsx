import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { getUser } from '@/lib/auth';
import Icon from '@/components/ui/icon';

interface Props {
  onBack: () => void;
  onAdmin: () => void;
}

export default function SupportScreen({ onBack, onAdmin }: Props) {
  const user = getUser();
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  function startPress() {
    longPressed.current = false;
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      if (navigator.vibrate) navigator.vibrate(20);
      onAdmin();
    }, 1500);
  }

  function endPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }

  async function handleSend() {
    if (!message.trim()) {
      setError('Напишите ваш вопрос или проблему');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.sendSupport({ message, contact, phone: user?.phone });
      setLoading(false);
      if (res.success) {
        setSent(true);
      } else {
        setError(res.error || 'Не удалось отправить. Попробуйте позже.');
      }
    } catch {
      setLoading(false);
      setError('Ошибка соединения. Попробуйте снова.');
    }
  }

  return (
    <div className="pb-nav bg-gray-50 min-h-screen">
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Icon name="ChevronLeft" size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-extrabold text-gray-900">Поддержка</h1>
        </div>
      </div>

      {sent ? (
        <div className="px-6 py-16 flex flex-col items-center text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5">
            <Icon name="CircleCheck" size={40} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Сообщение отправлено!</h2>
          <p className="text-gray-500 mb-8">Мы получили ваше обращение и ответим в ближайшее время.</p>
          <button onClick={onBack} className="bg-itoni-blue text-white font-bold px-8 py-3 rounded-xl">
            Готово
          </button>
        </div>
      ) : (
        <div className="px-4 py-5 space-y-4">
          <div className="bg-itoni-blue-light rounded-2xl p-4 flex gap-3">
            <Icon name="Headset" size={22} className="text-itoni-blue shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              Опишите ваш вопрос или проблему — служба поддержки иТони ответит вам как можно скорее.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 card-shadow space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Ваш вопрос или проблема</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Расскажите, что случилось..."
                rows={5}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-itoni-blue transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Контакт для ответа (необязательно)</label>
              <input
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder="Email или телефон для связи"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-itoni-blue transition-colors"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            onClick={() => { if (!longPressed.current) handleSend(); }}
            onMouseDown={startPress}
            onMouseUp={endPress}
            onMouseLeave={endPress}
            onTouchStart={startPress}
            onTouchEnd={endPress}
            disabled={loading}
            className="w-full bg-itoni-blue text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 flex items-center justify-center gap-2 select-none"
          >
            <Icon name="Send" size={18} />
            {loading ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      )}
    </div>
  );
}