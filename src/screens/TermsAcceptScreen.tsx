import { useState } from 'react';
import { api } from '@/lib/api';
import { saveUser } from '@/lib/auth';
import { TERMS_TEXT, PRIVACY_TEXT, CONSENT_TEXT } from '@/lib/legal';
import LegalScreen from '@/screens/LegalScreen';
import Icon from '@/components/ui/icon';

interface Props {
  onAccepted: () => void;
}

type Doc = { title: string; text: string } | null;

export default function TermsAcceptScreen({ onAccepted }: Props) {
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [doc, setDoc] = useState<Doc>(null);

  const allChecked = terms && privacy && consent;

  async function handleRegister() {
    if (!allChecked) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.acceptTerms();
      setLoading(false);
      if (res.success) {
        saveUser(res.user);
        onAccepted();
      } else {
        setError(res.error || 'Не удалось завершить регистрацию');
      }
    } catch {
      setLoading(false);
      setError('Ошибка соединения. Попробуйте снова.');
    }
  }

  if (doc) {
    return <LegalScreen title={doc.title} text={doc.text} onBack={() => setDoc(null)} />;
  }

  const Check = ({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-start gap-3 text-left p-3 rounded-2xl active:bg-gray-50 transition-colors"
    >
      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${checked ? 'bg-itoni-blue border-itoni-blue' : 'border-gray-300'}`}>
        {checked && <Icon name="Check" size={14} className="text-white" />}
      </div>
      <span className="text-sm text-gray-700 leading-snug">{children}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 px-6 pt-16 pb-6 flex flex-col">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-itoni-blue-light rounded-3xl mb-4">
            <Icon name="ShieldCheck" size={32} className="text-itoni-blue" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Почти готово!</h1>
          <p className="text-gray-500 mt-1">Для продолжения примите условия:</p>
        </div>

        <div className="mt-6 space-y-1">
          <Check checked={terms} onToggle={() => setTerms(!terms)}>
            Я принимаю{' '}
            <span
              className="text-itoni-blue font-semibold underline"
              onClick={e => { e.stopPropagation(); setDoc({ title: 'Пользовательское соглашение', text: TERMS_TEXT }); }}
            >
              Пользовательское соглашение
            </span>
          </Check>

          <Check checked={privacy} onToggle={() => setPrivacy(!privacy)}>
            Я принимаю{' '}
            <span
              className="text-itoni-blue font-semibold underline"
              onClick={e => { e.stopPropagation(); setDoc({ title: 'Политика конфиденциальности', text: PRIVACY_TEXT }); }}
            >
              Политику конфиденциальности
            </span>
          </Check>

          <Check checked={consent} onToggle={() => setConsent(!consent)}>
            Я даю{' '}
            <span
              className="text-itoni-blue font-semibold underline"
              onClick={e => { e.stopPropagation(); setDoc({ title: 'Согласие на обработку ПД', text: CONSENT_TEXT }); }}
            >
              согласие на обработку персональных данных
            </span>{' '}
            в соответствии с 152-ФЗ
          </Check>
        </div>

        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

        <div className="flex-1" />

        <button
          onClick={handleRegister}
          disabled={!allChecked || loading}
          className={`w-full font-bold py-4 rounded-2xl text-base transition-all ${allChecked ? 'bg-itoni-blue text-white active:scale-[0.98] shadow-lg shadow-blue-500/20' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          Кнопка станет активной после принятия всех условий
        </p>
      </div>
    </div>
  );
}
