import { useState } from 'react';
import { adminApi, setAdminToken } from '@/lib/adminApi';
import Icon from '@/components/ui/icon';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

const ADMIN_PHONE = '+79249910611';

export default function AdminLoginScreen({ onBack, onSuccess }: Props) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState(ADMIN_PHONE);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendCode() {
    setLoading(true); setError('');
    try {
      const res = await adminApi.loginPhone(phone);
      setLoading(false);
      if (res.success) setStep('code');
      else setError(res.error || 'Не удалось отправить код');
    } catch {
      setLoading(false);
      setError('Ошибка соединения');
    }
  }

  async function verify() {
    if (code.length < 4) { setError('Введите 4-значный код'); return; }
    setLoading(true); setError('');
    try {
      const res = await adminApi.verifyPhone(phone, code);
      setLoading(false);
      if (res.success && res.token) {
        setAdminToken(res.token);
        onSuccess();
      } else setError(res.error || 'Неверный код');
    } catch {
      setLoading(false);
      setError('Ошибка соединения');
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center px-6">
      <button onClick={onBack} className="absolute top-12 left-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
        <Icon name="ChevronLeft" size={22} className="text-white" />
      </button>

      <div className="w-full max-w-sm bg-[#1E293B] border border-white/10 rounded-[24px] p-6 shadow-2xl animate-slide-up">
        <div className="w-14 h-14 rounded-2xl bg-itoni-blue flex items-center justify-center mx-auto mb-4">
          <Icon name="ShieldCheck" size={28} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-white text-center mb-1">Админ-панель иТони</h2>
        <p className="text-gray-400 text-sm text-center mb-5">
          {step === 'phone' ? 'Вход по номеру телефона администратора' : 'Введите код из SMS'}
        </p>

        {step === 'phone' ? (
          <>
            <div className="flex items-center gap-3 bg-white/5 border border-white/15 rounded-2xl px-4 py-4 mb-4">
              <Icon name="Phone" size={20} className="text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+7 999 999-99-99"
                className="flex-1 bg-transparent text-base text-white placeholder-gray-500 focus:outline-none"
              />
            </div>
            {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
            <button
              onClick={sendCode}
              disabled={loading}
              className="w-full bg-gradient-to-r from-itoni-blue to-blue-500 text-white font-bold py-4 rounded-2xl disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Icon name="LoaderCircle" size={18} className="animate-spin" />}
              {loading ? 'Отправка...' : 'Получить код'}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 bg-white/5 border border-white/15 rounded-2xl px-4 py-4 mb-4">
              <Icon name="KeyRound" size={20} className="text-gray-400" />
              <input
                type="tel"
                inputMode="numeric"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                onKeyDown={e => e.key === 'Enter' && verify()}
                placeholder="4-значный код"
                autoFocus
                className="flex-1 bg-transparent text-base text-white placeholder-gray-500 focus:outline-none tracking-[0.4em]"
              />
            </div>
            {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
            <button
              onClick={verify}
              disabled={loading}
              className="w-full bg-gradient-to-r from-itoni-blue to-blue-500 text-white font-bold py-4 rounded-2xl disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Icon name="LoaderCircle" size={18} className="animate-spin" />}
              {loading ? 'Проверка...' : 'Войти'}
            </button>
            <button onClick={() => { setStep('phone'); setCode(''); setError(''); }} className="w-full text-gray-400 text-sm py-3">
              Изменить номер
            </button>
          </>
        )}
      </div>
    </div>
  );
}
