import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { saveUser } from '@/lib/auth';
import TermsAcceptScreen from '@/screens/TermsAcceptScreen';
import PhoneEntryScreen from '@/screens/PhoneEntryScreen';
import Icon from '@/components/ui/icon';

interface Props {
  onAuth: () => void;
  onAdmin?: () => void;
}

// Имя Telegram-бота (без @), к которому привязан Login Widget
const TELEGRAM_BOT_USERNAME = 'iToni_bot';

type TgUser = Record<string, unknown>;

declare global {
  interface Window {
    onTelegramAuth?: (user: TgUser) => void;
  }
}

export default function AuthScreen({ onAuth, onAdmin }: Props) {
  const [step, setStep] = useState<'login' | 'phone' | 'terms'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const widgetRef = useRef<HTMLDivElement>(null);

  async function handleTelegram(tgUser: TgUser) {
    setLoading(true); setError('');
    try {
      const res = await api.telegramLogin(tgUser);
      setLoading(false);
      if (res.success && res.user) {
        saveUser(res.user);
        if (res.needs_phone) setStep('phone');
        else if (!res.accepted_terms) setStep('terms');
        else onAuth();
      } else {
        setError(res.error || 'Не удалось войти через Telegram');
      }
    } catch {
      setLoading(false);
      setError('Ошибка соединения. Попробуйте снова.');
    }
  }

  useEffect(() => {
    window.onTelegramAuth = (user: TgUser) => handleTelegram(user);
    if (!widgetRef.current) return;
    widgetRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', TELEGRAM_BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '14');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    widgetRef.current.appendChild(script);
    return () => { window.onTelegramAuth = undefined; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (step === 'phone') {
    return <PhoneEntryScreen onDone={(acceptedTerms) => {
      // После номера: если условия уже приняты (старый пользователь) — входим, иначе документы
      if (acceptedTerms) onAuth();
      else setStep('terms');
    }} />;
  }
  if (step === 'terms') return <TermsAcceptScreen onAccepted={onAuth} />;

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
        <div className="w-full max-w-sm mx-auto bg-[#1E293B] border border-white/10 rounded-[24px] p-6 shadow-2xl animate-slide-up">
          <h2 className="text-2xl font-bold text-white text-center mb-1">Вход</h2>
          <p className="text-gray-400 text-sm text-center mb-5">Войдите через Telegram — быстро и безопасно</p>

          {/* Официальный виджет Telegram */}
          <div ref={widgetRef} className="flex justify-center min-h-[48px] items-center" />

          {loading && (
            <div className="flex items-center justify-center gap-2 text-blue-300 text-sm mt-4">
              <Icon name="LoaderCircle" size={18} className="animate-spin" />
              Входим...
            </div>
          )}
          {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}

          <p className="text-gray-500 text-xs text-center mt-5 leading-relaxed">
            Нажимая «Войти через Telegram», вы продолжите регистрацию в иТони.
          </p>
        </div>
      </div>
    </div>
  );
}