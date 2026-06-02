import { useState, useRef } from 'react';
import { adminApi, setAdminToken } from '@/lib/adminApi';
import Icon from '@/components/ui/icon';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

export default function AdminLoginScreen({ onBack, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  async function handleLogin() {
    // Берём значения из DOM (важно для автозаполнения браузера)
    const emailVal = (emailRef.current?.value ?? email).trim();
    const passVal = (passRef.current?.value ?? password).trim();
    if (!emailVal || !passVal) {
      setError('Введите email и пароль');
      return;
    }
    setLoading(true);
    setError('');
    const res = await adminApi.login(emailVal, passVal);
    setLoading(false);
    if (res.success && res.token) {
      setAdminToken(res.token);
      onSuccess();
    } else {
      setError(res.error || 'Неверный email или пароль');
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="px-4 pt-12 pb-4">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <Icon name="ChevronLeft" size={20} className="text-white" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-3xl mb-4">
            <Icon name="ShieldCheck" size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Админ-панель иТони</h1>
          <p className="text-gray-400 mt-1 text-sm">Вход только для администратора</p>
        </div>

        <div className="space-y-3">
          <input
            ref={emailRef}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-itoni-blue"
          />
          <div className="relative">
            <input
              ref={passRef}
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Пароль"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-itoni-blue"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <Icon name={showPw ? 'EyeOff' : 'Eye'} size={18} />
            </button>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-itoni-blue text-white font-bold py-3.5 rounded-xl disabled:opacity-60"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </div>
      </div>
    </div>
  );
}