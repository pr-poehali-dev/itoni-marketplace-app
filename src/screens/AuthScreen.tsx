import { useState } from 'react';
import { api } from '@/lib/api';
import { saveUser } from '@/lib/auth';
import TermsAcceptScreen from '@/screens/TermsAcceptScreen';
import Icon from '@/components/ui/icon';

interface Props {
  onAuth: () => void;
}

type Method = 'password' | 'email';
type PwMode = 'login' | 'register';

export default function AuthScreen({ onAuth }: Props) {
  const [method, setMethod] = useState<Method>('password');
  const [pwMode, setPwMode] = useState<PwMode>('login');

  const [login, setLogin] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [emailStep, setEmailStep] = useState<'email' | 'code'>('email');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTerms, setShowTerms] = useState(false);

  function finish(res: { success?: boolean; user?: unknown; accepted_terms?: boolean; error?: string }) {
    setLoading(false);
    if (res.success && res.user) {
      saveUser(res.user as Parameters<typeof saveUser>[0]);
      if (res.accepted_terms) onAuth();
      else setShowTerms(true);
    } else {
      setError(res.error || 'Что-то пошло не так');
    }
  }

  async function handlePassword() {
    if (login.trim().length < 3) { setError('Логин минимум 3 символа'); return; }
    if (password.length < 6) { setError('Пароль минимум 6 символов'); return; }
    setLoading(true); setError('');
    try {
      const res = pwMode === 'register'
        ? await api.register(login.trim(), password, name.trim())
        : await api.loginPassword(login.trim(), password);
      finish(res);
    } catch {
      setLoading(false);
      setError('Ошибка соединения. Попробуйте снова.');
    }
  }

  async function handleEmailSend() {
    if (!email.includes('@') || !email.includes('.')) { setError('Введите корректный email'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.sendEmailCode(email.trim());
      setLoading(false);
      if (res.success) setEmailStep('code');
      else setError(res.error || 'Не удалось отправить код');
    } catch {
      setLoading(false);
      setError('Ошибка соединения. Попробуйте снова.');
    }
  }

  async function handleEmailVerify() {
    if (code.length < 4) { setError('Введите 4-значный код'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.verifyEmailCode(email.trim(), code);
      finish(res);
    } catch {
      setLoading(false);
      setError('Ошибка соединения. Попробуйте снова.');
    }
  }

  if (showTerms) return <TermsAcceptScreen onAccepted={onAuth} />;

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      <div className="relative flex-1 flex flex-col items-center justify-center pt-14 px-6">
        <div className="text-center z-10 animate-fade-in">
          <div className="flex items-center justify-center">
            <span className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-clip-text text-transparent" style={{ fontFamily: 'Golos Text' }}>
              иТони
            </span>
          </div>
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
        {/* Переключатель способа входа */}
        <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 mb-5">
          <button
            onClick={() => { setMethod('password'); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${method === 'password' ? 'bg-itoni-blue text-white' : 'text-gray-400'}`}
          >
            Логин и пароль
          </button>
          <button
            onClick={() => { setMethod('email'); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${method === 'email' ? 'bg-itoni-blue text-white' : 'text-gray-400'}`}
          >
            По Email
          </button>
        </div>

        {method === 'password' ? (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold text-white text-center mb-1">
              {pwMode === 'register' ? 'Регистрация' : 'Вход'}
            </h2>
            <p className="text-gray-400 text-sm text-center mb-5">
              {pwMode === 'register' ? 'Придумайте логин и пароль' : 'Введите логин и пароль'}
            </p>

            {pwMode === 'register' && (
              <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl px-4 py-4 mb-3 focus-within:border-blue-500 transition-colors">
                <Icon name="User" size={20} className="text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ваше имя"
                  className="flex-1 bg-transparent text-base text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl px-4 py-4 mb-3 focus-within:border-blue-500 transition-colors">
              <Icon name="AtSign" size={20} className="text-gray-400" />
              <input
                type="text"
                value={login}
                onChange={e => setLogin(e.target.value)}
                placeholder="Логин"
                autoCapitalize="none"
                className="flex-1 bg-transparent text-base text-white placeholder-gray-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl px-4 py-4 mb-4 focus-within:border-blue-500 transition-colors">
              <Icon name="Lock" size={20} className="text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePassword()}
                placeholder="Пароль"
                className="flex-1 bg-transparent text-base text-white placeholder-gray-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

            <button
              onClick={handlePassword}
              disabled={loading}
              className="w-full bg-itoni-blue text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/30"
            >
              {loading ? 'Подождите...' : pwMode === 'register' ? 'Зарегистрироваться' : 'Войти'}
            </button>

            <button
              onClick={() => { setPwMode(pwMode === 'register' ? 'login' : 'register'); setError(''); }}
              className="w-full text-gray-400 text-sm py-3"
            >
              {pwMode === 'register' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
            </button>
          </div>
        ) : (
          <div className="animate-slide-up">
            {emailStep === 'email' ? (
              <>
                <h2 className="text-2xl font-bold text-white text-center mb-1">Вход по Email</h2>
                <p className="text-gray-400 text-sm text-center mb-5">Мы отправим код на вашу почту</p>
                <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl px-4 py-4 mb-4 focus-within:border-blue-500 transition-colors">
                  <Icon name="Mail" size={20} className="text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEmailSend()}
                    placeholder="example@mail.ru"
                    autoCapitalize="none"
                    className="flex-1 bg-transparent text-base text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>
                {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
                <button
                  onClick={handleEmailSend}
                  disabled={loading}
                  className="w-full bg-itoni-blue text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/30"
                >
                  {loading ? 'Отправка...' : 'Получить код'}
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white text-center mb-1">Введите код</h2>
                <p className="text-gray-400 text-sm text-center mb-5">Код отправлен на {email}</p>
                <input
                  type="number"
                  value={code}
                  onChange={e => setCode(e.target.value.slice(0, 4))}
                  onKeyDown={e => e.key === 'Enter' && handleEmailVerify()}
                  placeholder="••••"
                  className="w-full bg-white/10 border border-white/15 rounded-2xl px-4 py-4 text-3xl text-center tracking-[0.5em] text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors mb-4"
                  autoFocus
                />
                {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
                <button
                  onClick={handleEmailVerify}
                  disabled={loading}
                  className="w-full bg-itoni-blue text-white font-bold py-4 rounded-2xl text-base disabled:opacity-60 transition-all active:scale-[0.98] mb-3 shadow-lg shadow-blue-500/30"
                >
                  {loading ? 'Проверка...' : 'Войти'}
                </button>
                <button onClick={() => { setEmailStep('email'); setError(''); setCode(''); }} className="w-full text-gray-400 text-sm py-2">
                  Изменить email
                </button>
              </>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-500 mt-5">
          Продолжая, вы принимаете условия использования
        </p>
      </div>
    </div>
  );
}
