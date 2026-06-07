import { useState } from 'react';
import { api } from '@/lib/api';
import { saveUser } from '@/lib/auth';
import TermsAcceptScreen from '@/screens/TermsAcceptScreen';
import PhoneEntryScreen from '@/screens/PhoneEntryScreen';
import Icon from '@/components/ui/icon';

interface Props {
  onAdmin?: () => void;
  onAuthed: () => void;
}

export default function AuthScreen({ onAdmin, onAuthed }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [postStep, setPostStep] = useState<'none' | 'phone' | 'terms'>('none');

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleSubmit() {
    if (!validEmail) { setError('Введите корректный email'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.magicRequest(email.trim().toLowerCase());
      setLoading(false);
      if (res.success) setSent(true);
      else setError(res.error || 'Не удалось отправить письмо');
    } catch {
      setLoading(false);
      setError('Ошибка соединения. Попробуйте снова.');
    }
  }

  async function handleVerifyCode() {
    if (code.length !== 6) { setCodeError('Введите код из 6 цифр'); return; }
    setCodeLoading(true); setCodeError('');
    try {
      const res = await api.magicVerifyCode(email.trim().toLowerCase(), code);
      setCodeLoading(false);
      if (res.success && res.user) {
        saveUser(res.user);
        if (res.needs_phone) setPostStep('phone');
        else if (!res.accepted_terms) setPostStep('terms');
        else onAuthed();
      } else {
        setCodeError(res.error || 'Неверный код');
      }
    } catch {
      setCodeLoading(false);
      setCodeError('Ошибка соединения. Попробуйте снова.');
    }
  }

  if (postStep === 'phone') {
    return <PhoneEntryScreen onDone={(acceptedTerms) => {
      if (acceptedTerms) onAuthed();
      else setPostStep('terms');
    }} />;
  }
  if (postStep === 'terms') return <TermsAcceptScreen onAccepted={onAuthed} />;

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col relative overflow-hidden">
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
        <div className="w-full max-w-sm mx-auto bg-[#1E293B] border border-white/10 rounded-[24px] p-6 shadow-2xl animate-slide-up">
          {sent ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-itoni-blue/20 rounded-3xl mb-4">
                <Icon name="MailCheck" size={32} className="text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Проверьте почту</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Мы отправили письмо на <span className="text-blue-300 font-semibold">{email.trim().toLowerCase()}</span>.
                Введите код из письма ниже или нажмите кнопку «Войти в иТони».
              </p>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setCodeError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
                placeholder="000000"
                className="mt-5 w-full bg-[#0F172A] border border-white/10 rounded-2xl px-4 py-4 text-white text-center text-2xl font-bold tracking-[0.5em] placeholder-gray-600 focus:outline-none focus:border-itoni-blue transition-colors"
              />

              {codeError && <p className="text-red-400 text-sm mt-3">{codeError}</p>}

              <button
                onClick={handleVerifyCode}
                disabled={code.length !== 6 || codeLoading}
                className={`mt-4 w-full font-bold py-4 rounded-2xl text-base transition-all flex items-center justify-center gap-2 ${code.length === 6 && !codeLoading ? 'bg-itoni-blue text-white active:scale-[0.98] shadow-lg shadow-blue-500/20' : 'bg-white/10 text-gray-500 cursor-not-allowed'}`}
              >
                {codeLoading ? <Icon name="LoaderCircle" size={18} className="animate-spin" /> : null}
                {codeLoading ? 'Входим...' : 'Войти по коду'}
              </button>

              <button
                onClick={() => { setSent(false); setError(''); setCode(''); setCodeError(''); }}
                className="mt-5 text-blue-400 text-sm font-semibold active:opacity-70"
              >
                Указать другой email
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white text-center mb-1">Вход</h2>
              <p className="text-gray-400 text-sm text-center mb-5">Введите email — пришлём ссылку и код для входа</p>

              <input
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="you@mail.ru"
                className="w-full bg-[#0F172A] border border-white/10 rounded-2xl px-4 py-4 text-white placeholder-gray-500 text-base focus:outline-none focus:border-itoni-blue transition-colors"
              />

              {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={!validEmail || loading}
                className={`mt-4 w-full font-bold py-4 rounded-2xl text-base transition-all flex items-center justify-center gap-2 ${validEmail && !loading ? 'bg-itoni-blue text-white active:scale-[0.98] shadow-lg shadow-blue-500/20' : 'bg-white/10 text-gray-500 cursor-not-allowed'}`}
              >
                {loading ? <Icon name="LoaderCircle" size={18} className="animate-spin" /> : null}
                {loading ? 'Отправляем...' : 'Войти'}
              </button>

              <p className="text-gray-500 text-xs text-center mt-5 leading-relaxed">
                Нажимая «Войти», вы продолжите регистрацию в иТони.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}