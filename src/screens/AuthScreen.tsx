import { useState } from 'react';
import { api } from '@/lib/api';
import { saveUser } from '@/lib/auth';
import TermsAcceptScreen from '@/screens/TermsAcceptScreen';
import Icon from '@/components/ui/icon';

interface Props {
  onAuth: () => void;
}

export default function AuthScreen({ onAuth }: Props) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code' | 'terms'>('phone');
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
        if (res.accepted_terms) {
          onAuth();
        } else {
          setStep('terms');
        }
      } else {
        setError(res.error || 'Неверный код');
      }
    } catch {
      setLoading(false);
      setError('Ошибка соединения. Попробуйте снова.');
    }
  }

  if (step === 'terms') {
    return <TermsAcceptScreen onAccepted={onAuth} />;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #dfe9f5 0%, #0a1730 38%, #050b18 100%)' }}>
      {/* Top: logo + car */}
      <div className="relative flex flex-col items-center pt-10 px-6">
        <img
          src="https://cdn.poehali.dev/projects/d65ee484-6681-47d8-a176-bbe2415ceef3/bucket/67306b7b-933c-4658-80b9-0d829aab5240.jpg"
          alt="иТони"
          className="relative w-full max-w-md object-contain animate-scale-in"
        />
      </div>

      {/* Bottom: form */}
      <div className="relative z-10 px-6 pb-8 -mt-4">
        {step === 'phone' ? (
          <div className="animate-slide-up">
            <label className="block text-white text-base font-medium mb-2.5 pl-1">Номер телефона</label>
            <div className="mb-5">
              <div className="flex items-center gap-3 bg-white/5 border border-white/15 rounded-2xl px-5 py-4 focus-within:border-blue-500 transition-colors">
                <Icon name="Phone" size={22} className="text-blue-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  onKeyDown={e => e.key === 'Enter' && handleSendCode()}
                  placeholder="+7 (___) __-__-__"
                  className="flex-1 bg-transparent text-xl text-white placeholder-gray-400 focus:outline-none"
                />
              </div>
            </div>
            {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
            <button
              onClick={handleSendCode}
              disabled={loading}
              className="w-full flex items-center justify-between bg-gradient-to-r from-[#4ba3ff] to-[#1f6feb] text-white font-bold py-5 px-6 rounded-2xl text-lg disabled:opacity-60 transition-all active:scale-[0.98] shadow-[0_0_40px_rgba(59,130,246,0.5)]"
            >
              <span className="flex-1 text-center">{loading ? 'Отправка...' : 'Получить код'}</span>
              <span className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center">
                <Icon name="ArrowRight" size={22} className="text-white" />
              </span>
            </button>

            {/* Divider */}
            <div className="flex items-center justify-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/15" />
              <div className="w-20 h-4 rounded bg-black/40" />
              <div className="flex-1 h-px bg-white/15" />
            </div>

            {/* Trust features */}
            <div className="grid grid-cols-3 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              {[
                { icon: 'ShieldCheck', title: 'Безопасно', sub: 'Проверяем\nкаждого' },
                { icon: 'Zap', title: 'Быстро', sub: 'Размещай\nи продавай' },
                { icon: 'BadgeCheck', title: 'Честно', sub: 'Реальные цены\nи продавцы' },
              ].map((f, i) => (
                <div key={f.title} className={`py-5 px-2 text-center ${i < 2 ? 'border-r border-white/10' : ''}`}>
                  <Icon name={f.icon} size={26} className="text-blue-400 mx-auto mb-2" />
                  <p className="text-white font-bold text-sm">{f.title}</p>
                  <p className="text-gray-400 text-[11px] leading-tight mt-1 whitespace-pre-line">{f.sub}</p>
                </div>
              ))}
            </div>
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

        <p className="text-center text-sm text-gray-400 mt-6">
          Нажимая «Войти», вы принимаете условия<br />
          <span className="text-blue-400 font-medium">пользовательского соглашения</span>
        </p>
      </div>
    </div>
  );
}