import { useState } from 'react';
import { api } from '@/lib/api';
import { saveUser } from '@/lib/auth';
import Icon from '@/components/ui/icon';

interface Props {
  onAuth: () => void;
}

export default function AuthScreen({ onAuth }: Props) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoCode, setDemoCode] = useState('');

  function formatPhone(val: string) {
    let digits = val.replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (!digits.startsWith('7') && digits.length > 0) digits = '7' + digits;
    digits = digits.slice(0, 11);
    if (digits.length === 0) return '';
    let result = '+' + digits[0];
    if (digits.length > 1) result += ' (' + digits.slice(1, 4);
    if (digits.length >= 4) result += ') ' + digits.slice(4, 7);
    if (digits.length >= 7) result += '-' + digits.slice(7, 9);
    if (digits.length >= 9) result += '-' + digits.slice(9, 11);
    return result;
  }

  function getRawPhone(formatted: string) {
    return '+' + formatted.replace(/\D/g, '');
  }

  async function handleSendCode() {
    const raw = getRawPhone(phone);
    if (raw.replace(/\D/g, '').length < 11) {
      setError('Введите корректный номер телефона');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.sendCode(raw);
      setLoading(false);
      if (res.success) {
        setDemoCode(res.demo_code || '');
        setStep('code');
      } else {
        setError(res.error || 'Ошибка отправки кода');
      }
    } catch {
      setLoading(false);
      setError('Ошибка соединения. Попробуйте снова.');
    }
  }

  async function handleVerify() {
    if (code.length < 4) { setError('Введите 4-значный код'); return; }
    setLoading(true);
    setError('');
    const raw = getRawPhone(phone);
    try {
      const res = await api.verifyCode(raw, code);
      setLoading(false);
      if (res.success) {
        saveUser(res.user);
        onAuth();
      } else {
        setError(res.error || 'Неверный код');
      }
    } catch {
      setLoading(false);
      setError('Ошибка соединения. Попробуйте снова.');
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Top: logo + car */}
      <div className="relative flex-1 flex flex-col items-center justify-center pt-14 px-6">
        {/* Logo */}
        <div className="text-center z-10 animate-fade-in">
          <div className="flex items-center justify-center">
            <span className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-clip-text text-transparent" style={{ fontFamily: 'Golos Text' }}>
              иТони
            </span>
          </div>
          <div className="mx-auto mt-1 mb-1 w-40 h-[3px] rounded-full bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
          <p className="text-blue-300/80 text-sm font-medium tracking-wide">Продай быстро. Купи честно.</p>
        </div>

        {/* Car image with glow */}
        <div className="relative w-full max-w-sm mt-2">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
          <img
            src="https://cdn.poehali.dev/projects/d65ee484-6681-47d8-a176-bbe2415ceef3/files/3ac92b93-59b4-44c8-a735-c2fdfd95acdc.jpg"
            alt="иТони"
            className="relative w-full object-contain animate-scale-in"
            style={{ maskImage: 'radial-gradient(ellipse at center, black 55%, transparent 80%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 55%, transparent 80%)' }}
          />
        </div>
      </div>

      {/* Bottom: form */}
      <div className="relative z-10 px-6 pb-10">
        {step === 'phone' ? (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold text-white text-center mb-1">Вход по номеру телефона</h2>
            <p className="text-gray-400 text-sm text-center mb-6">Мы отправим вам код подтверждения</p>

            <div className="mb-4">
              <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl px-4 py-4 focus-within:border-blue-500 transition-colors">
                <Icon name="Phone" size={20} className="text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  onKeyDown={e => e.key === 'Enter' && handleSendCode()}
                  placeholder="+7 (___) ___-__-__"
                  className="flex-1 bg-transparent text-lg text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>
            {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
            <button
              onClick={handleSendCode}
              disabled={loading}
              className="w-full bg-itoni-blue text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/30"
            >
              {loading ? 'Отправка...' : 'Получить код'}
            </button>
          </div>
        ) : (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold text-white text-center mb-1">Введите код</h2>
            <p className="text-gray-400 text-sm text-center mb-5">Код отправлен на {phone}</p>
            {demoCode && (
              <div className="bg-blue-500/15 border border-blue-500/30 rounded-2xl p-3 mb-4 text-sm text-blue-200 text-center">
                Демо-режим. Ваш код: <span className="font-mono font-bold text-lg text-white">{demoCode}</span>
              </div>
            )}
            <div className="mb-4">
              <input
                type="number"
                value={code}
                onChange={e => setCode(e.target.value.slice(0, 4))}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                placeholder="••••"
                className="w-full bg-white/10 border border-white/15 rounded-2xl px-4 py-4 text-3xl text-center tracking-[0.5em] text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
            </div>
            {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-itoni-blue text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 transition-all active:scale-[0.98] mb-3 shadow-lg shadow-blue-500/30"
            >
              {loading ? 'Проверка...' : 'Войти'}
            </button>
            <button onClick={() => { setStep('phone'); setError(''); setCode(''); }} className="w-full text-gray-400 text-sm py-2">
              Изменить номер
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-500 mt-5">
          Нажимая «Войти», вы принимаете условия использования
        </p>
      </div>
    </div>
  );
}