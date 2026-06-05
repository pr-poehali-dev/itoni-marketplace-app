import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { saveUser } from '@/lib/auth';
import TermsAcceptScreen from '@/screens/TermsAcceptScreen';
import Icon from '@/components/ui/icon';

interface Props {
  onAuth: () => void;
  onAdmin?: () => void;
}

function formatPhone(digits: string): string {
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
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fullPhone = '+7' + digits;

  function startResendTimer() {
    setResendIn(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendIn(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

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
        startResendTimer();
      } else setError(res.error || 'Не удалось отправить код');
    } catch {
      setLoading(false);
      setError('Ошибка соединения. Попробуйте снова.');
    }
  }

  async function handleResend() {
    if (resendIn > 0 || resending) return;
    setResending(true); setError(''); setCode('');
    try {
      const res = await api.sendSmsCode(fullPhone);
      setResending(false);
      if (res.success) {
        setHint(res.message || '');
        startResendTimer();
      } else setError(res.error || 'Не удалось позвонить повторно');
    } catch {
      setResending(false);
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
    <div className="min-h-screen bg-[#0F172A] flex flex-col relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute -top-32 -left-24 w-80 h-80 bg-itoni-blue/30 blur-[120px] rounded-full" />
      <div className="absolute -bottom-32 -right-24 w-80 h-80 bg-itoni-orange/20 blur-[120px] rounded-full" />

      <div className="relative flex-1 flex flex-col items-center justify-center pt-14 px-6">
        <div className="text-center z-10 animate-fade-in">
          {onAdmin && (
            <button
              onClick={onAdmin}
              className="mb-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-blue-200 text-[11px] font-semibold active:scale-95 transition-transform"
            >
              <Icon name="ShieldCheck" size={12} className="text-itoni-orange" />
              Админ
            </button>
          )}
          <div />
          <span className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-clip-text text-transparent block" style={{ fontFamily: 'Golos Text' }}>
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

      <div className="relative z-10 px-5 pb-10">
        {/* Card */}
        <div className="w-full max-w-sm mx-auto bg-[#1E293B] border border-white/10 rounded-[24px] p-6 shadow-2xl animate-slide-up">
          {step === 'phone' ? (
            <>
              <h2 className="text-2xl font-bold text-white text-center mb-1">Вход</h2>
              <p className="text-gray-400 text-sm text-center mb-5">Введите номер телефона — мы позвоним и продиктуем код</p>

              <div className="flex items-center gap-3 bg-white/5 border border-white/15 rounded-2xl px-4 py-4 mb-4 focus-within:border-itoni-blue transition-colors">
                <span className="text-gray-300 text-base font-semibold">+7</span>
                <div className="w-px h-5 bg-white/15" />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={formatPhone(digits).replace(/^\+7\s?/, '')}
                  onChange={handlePhoneInput}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="999 999-99-99"
                  className="flex-1 bg-transparent text-base text-white placeholder-gray-500 focus:outline-none"
                />
              </div>

              {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

              <button
                onClick={handleSend}
                disabled={loading}
                className="w-full bg-gradient-to-r from-itoni-blue to-blue-500 text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 transition-all active:scale-[0.97] shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                {loading && <Icon name="LoaderCircle" size={18} className="animate-spin" />}
                {loading ? 'Звоним...' : 'Получить код'}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white text-center mb-1">Введите код</h2>

              {/* Инструкция */}
              <div className="flex items-start gap-2 bg-itoni-blue/10 border border-itoni-blue/20 rounded-2xl p-3 mb-4">
                <Icon name="PhoneCall" size={18} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-gray-300 text-xs leading-relaxed">
                  {hint || 'Сейчас вам позвонит робот. Ответьте и введите 4 цифры номера, с которого поступит звонок.'}
                </p>
              </div>

              <div className="flex items-center gap-3 bg-white/5 border border-white/15 rounded-2xl px-4 py-4 mb-4 focus-within:border-itoni-blue transition-colors">
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
                className="w-full bg-gradient-to-r from-itoni-blue to-blue-500 text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 transition-all active:scale-[0.97] shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                {loading && <Icon name="LoaderCircle" size={18} className="animate-spin" />}
                {loading ? 'Проверяем...' : 'Войти'}
              </button>

              {/* Позвонить ещё раз */}
              <button
                onClick={handleResend}
                disabled={resendIn > 0 || resending}
                className="w-full text-sm py-3 mt-1 flex items-center justify-center gap-2 disabled:text-gray-500 text-blue-400 font-medium"
              >
                {resending ? (
                  <><Icon name="LoaderCircle" size={15} className="animate-spin" /> Звоним...</>
                ) : resendIn > 0 ? (
                  `Позвонить ещё раз через ${resendIn} с`
                ) : (
                  <><Icon name="RefreshCw" size={15} /> Позвонить ещё раз</>
                )}
              </button>

              <button
                onClick={() => { setStep('phone'); setCode(''); setError(''); }}
                className="w-full text-gray-400 text-sm py-2"
              >
                Изменить номер
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}