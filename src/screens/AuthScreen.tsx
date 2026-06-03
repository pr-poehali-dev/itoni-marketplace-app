import { useState } from 'react';
import { api } from '@/lib/api';
import { saveUser } from '@/lib/auth';
import TermsAcceptScreen from '@/screens/TermsAcceptScreen';
import Icon from '@/components/ui/icon';

interface Props {
  onAuth: () => void;
  onAdmin?: () => void;
}

function formatPhone(digits: string): string {
  // digits — только цифры без кода страны (до 10 знаков)
  const d = digits.slice(0, 10);
  let out = '+7';
  if (d.length > 0) out += ' ' + d.slice(0, 3);
  if (d.length >= 4) out += ' ' + d.slice(3, 6);
  if (d.length >= 7) out += '-' + d.slice(6, 8);
  if (d.length >= 9) out += '-' + d.slice(8, 10);
  return out;
}

export default function AuthScreen({ onAuth, onAdmin }: Props) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [digits, setDigits] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [showTerms, setShowTerms] = useState(false);

  const fullPhone = '+7' + digits;

  function handlePhoneInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '');
    let d = raw;
    if (d.startsWith('7') || d.startsWith('8')) d = d.slice(1);
    setDigits(d.slice(0, 10));
  }

  async function handleSend() {
    if (digits.length !== 10) { setError('Введите корректный номер'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.sendSmsCode(fullPhone);
      setLoading(false);
      if (res.success) {
        setHint(res.message || '');
        setStep('code');
      } else setError(res.error || 'Не удалось отправить код');
    } catch {
      setLoading(false);
      setError('Ошибка соединения. Попробуйте снова.');
    }
  }

  async function handleVerify() {
    if (code.length < 4) { setError('Введите 4-значный код'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.verifySmsCode(fullPhone, code);
      setLoading(false);
      if (res.success && res.user) {
        saveUser(res.user);
        if (res.accepted_terms) onAuth();
        else setShowTerms(true);
      } else {
        setError(res.error || 'Неверный код');
      }
    } catch {
      setLoading(false);
      setError('Ошибка соединения. Попробуйте снова.');
    }
  }

  if (showTerms) return <TermsAcceptScreen onAccepted={onAuth} />;

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {onAdmin && (
        <button
          onClick={onAdmin}
          className="absolute top-4 right-4 z-20 flex items-center gap-1 text-gray-500 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white/5 active:bg-white/10"
        >
          <Icon name="ShieldCheck" size={13} />
          Админ
        </button>
      )}
      <div className="relative flex-1 flex flex-col items-center justify-center pt-14 px-6">
        <div className="text-center z-10 animate-fade-in">
          <span className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-clip-text text-transparent" style={{ fontFamily: 'Golos Text' }}>
            иТони
          </span>
          <div className="mx-auto mt-1 mb-1 w-40 h-[3px] rounded-full bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
          <p className="text-blue-300/80 text-sm font-medium tracking-wide">Продай быстро. Купи честно.</p>
        </div>

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

      <div className="relative z-10 px-6 pb-10">
        {step === 'phone' ? (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold text-white text-center mb-1">Вход</h2>
            <p className="text-gray-400 text-sm text-center mb-5">Мы позвоним — код это последние 4 цифры номера звонка</p>

            <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl px-4 py-4 mb-4 focus-within:border-blue-500 transition-colors">
              <Icon name="Phone" size={20} className="text-gray-400" />
              <input
                type="tel"
                inputMode="numeric"
                value={formatPhone(digits)}
                onChange={handlePhoneInput}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="+7 999 999-99-99"
                className="flex-1 bg-transparent text-base text-white placeholder-gray-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

            <button
              onClick={handleSend}
              disabled={loading}
              className="w-full bg-itoni-blue text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/30"
            >
              {loading ? 'Звоним...' : 'Получить код звонком'}
            </button>
          </div>
        ) : (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold text-white text-center mb-1">Введите код</h2>
            <p className="text-gray-400 text-sm text-center mb-5">{hint || `Сейчас поступит звонок на ${formatPhone(digits)}. Код — последние 4 цифры этого номера`}</p>

            <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl px-4 py-4 mb-4 focus-within:border-blue-500 transition-colors">
              <Icon name="KeyRound" size={20} className="text-gray-400" />
              <input
                type="tel"
                inputMode="numeric"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                placeholder="4-значный код"
                autoFocus
                className="flex-1 bg-transparent text-base text-white placeholder-gray-500 focus:outline-none tracking-[0.4em]"
              />
            </div>

            {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-itoni-blue text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/30"
            >
              {loading ? 'Проверяем...' : 'Войти'}
            </button>

            <button
              onClick={() => { setStep('phone'); setCode(''); setError(''); }}
              className="w-full text-gray-400 text-sm py-3"
            >
              Изменить номер
            </button>
          </div>
        )}
      </div>
    </div>
  );
}