import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { saveUser } from '@/lib/auth';
import TermsAcceptScreen from '@/screens/TermsAcceptScreen';
import PhoneEntryScreen from '@/screens/PhoneEntryScreen';
import Icon from '@/components/ui/icon';

interface Props {
  token: string;
  onDone: () => void;
}

type Step = 'loading' | 'error' | 'phone' | 'terms';

export default function VerifyScreen({ token, onDone }: Props) {
  const [step, setStep] = useState<Step>('loading');
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const res = await api.magicVerify(token);
        if (res.success && res.user) {
          saveUser(res.user);
          if (res.needs_phone) setStep('phone');
          else if (!res.accepted_terms) setStep('terms');
          else onDone();
        } else {
          setError(res.error || 'Ссылка недействительна.');
          setStep('error');
        }
      } catch {
        setError('Ошибка соединения. Попробуйте снова.');
        setStep('error');
      }
    })();
  }, [token, onDone]);

  if (step === 'phone') {
    return <PhoneEntryScreen onDone={(acceptedTerms) => {
      if (acceptedTerms) onDone();
      else setStep('terms');
    }} />;
  }
  if (step === 'terms') return <TermsAcceptScreen onAccepted={onDone} />;

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center px-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/15 rounded-3xl mb-4">
          <Icon name="TriangleAlert" size={32} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Не удалось войти</h1>
        <p className="text-gray-400 text-sm mb-6 max-w-xs">{error}</p>
        <button
          onClick={onDone}
          className="bg-itoni-blue text-white font-bold px-8 py-3.5 rounded-2xl active:scale-[0.98] transition-all"
        >
          На главную
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-3">
      <Icon name="LoaderCircle" size={40} className="text-blue-400 animate-spin" />
      <p className="text-gray-400 text-sm">Входим в иТони...</p>
    </div>
  );
}
