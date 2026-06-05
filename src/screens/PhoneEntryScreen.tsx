import { useState } from 'react';
import { api } from '@/lib/api';
import { saveUser } from '@/lib/auth';
import Icon from '@/components/ui/icon';

interface Props {
  onDone: (acceptedTerms: boolean) => void;
}

function formatPhone(digits: string): string {
  const d = digits.slice(0, 10);
  let out = '';
  if (d.length > 0) out += d.slice(0, 3);
  if (d.length >= 4) out += ' ' + d.slice(3, 6);
  if (d.length >= 7) out += '-' + d.slice(6, 8);
  if (d.length >= 9) out += '-' + d.slice(8, 10);
  return out;
}

export default function PhoneEntryScreen({ onDone }: Props) {
  const [digits, setDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fullPhone = '+7' + digits;

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '');
    let d = raw;
    if (d.startsWith('7') || d.startsWith('8')) d = d.slice(1);
    setDigits(d.slice(0, 10));
  }

  async function handleContinue() {
    if (digits.length !== 10) { setError('Введите корректный номер'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.setPhone(fullPhone);
      setLoading(false);
      if (res.success && res.user) {
        saveUser(res.user);
        onDone(!!res.accepted_terms);
      } else {
        setError(res.error || 'Не удалось сохранить номер');
      }
    } catch {
      setLoading(false);
      setError('Ошибка соединения. Попробуйте снова.');
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 px-6 pt-16 pb-6 flex flex-col">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-itoni-blue-light rounded-3xl mb-4">
            <Icon name="Phone" size={32} className="text-itoni-blue" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Укажите номер телефона</h1>
          <p className="text-gray-500 mt-2 leading-snug">
            Для связи с покупателями и продавцами укажите ваш номер телефона. Он будет виден в ваших объявлениях.
          </p>
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 focus-within:border-itoni-blue transition-colors">
            <span className="text-gray-700 text-base font-semibold">+7</span>
            <div className="w-px h-5 bg-gray-200" />
            <input
              type="tel"
              inputMode="numeric"
              value={formatPhone(digits)}
              onChange={handleInput}
              onKeyDown={e => e.key === 'Enter' && handleContinue()}
              placeholder="999 999-99-99"
              autoFocus
              className="flex-1 bg-transparent text-base text-gray-900 placeholder-gray-400 focus:outline-none"
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
        </div>

        <div className="flex-1" />

        <button
          onClick={handleContinue}
          disabled={digits.length !== 10 || loading}
          className={`w-full font-bold py-4 rounded-2xl text-base transition-all ${digits.length === 10 ? 'bg-itoni-blue text-white active:scale-[0.98] shadow-lg shadow-blue-500/20' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          {loading ? 'Сохраняем...' : 'Продолжить'}
        </button>
      </div>
    </div>
  );
}