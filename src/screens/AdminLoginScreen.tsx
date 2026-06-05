import { useState } from 'react';
import { adminApi, setAdminToken } from '@/lib/adminApi';
import Icon from '@/components/ui/icon';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

export default function AdminLoginScreen({ onBack, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function login() {
    if (!email.trim() || !password.trim()) { setError('Введите почту и пароль'); return; }
    setLoading(true); setError('');
    try {
      const res = await adminApi.loginEmail(email.trim(), password);
      setLoading(false);
      if (res.success && res.token) {
        setAdminToken(res.token);
        onSuccess();
      } else {
        setError(res.error || 'Неверные данные');
      }
    } catch {
      setLoading(false);
      setError('Ошибка соединения');
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center px-6">
      <button onClick={onBack} className="absolute top-12 left-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
        <Icon name="ChevronLeft" size={22} className="text-white" />
      </button>

      <div className="w-full max-w-sm bg-[#1E293B] border border-white/10 rounded-[24px] p-6 shadow-2xl animate-slide-up">
        <div className="w-14 h-14 rounded-2xl bg-itoni-blue flex items-center justify-center mx-auto mb-4">
          <Icon name="ShieldCheck" size={28} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-white text-center mb-1">Админ-панель иТони</h2>
        <p className="text-gray-400 text-sm text-center mb-5">Вход для администратора</p>

        <div className="flex items-center gap-3 bg-white/5 border border-white/15 rounded-2xl px-4 py-4 mb-3">
          <Icon name="Mail" size={20} className="text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Электронная почта"
            autoComplete="off"
            className="flex-1 bg-transparent text-base text-white placeholder-gray-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 bg-white/5 border border-white/15 rounded-2xl px-4 py-4 mb-4">
          <Icon name="Lock" size={20} className="text-gray-400" />
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="Пароль"
            autoComplete="off"
            className="flex-1 bg-transparent text-base text-white placeholder-gray-500 focus:outline-none"
          />
          <button onClick={() => setShowPass(v => !v)} className="text-gray-400">
            <Icon name={showPass ? 'EyeOff' : 'Eye'} size={18} />
          </button>
        </div>

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        <button
          onClick={login}
          disabled={loading}
          className="w-full bg-gradient-to-r from-itoni-blue to-blue-500 text-white font-bold py-4 rounded-2xl disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Icon name="LoaderCircle" size={18} className="animate-spin" />}
          {loading ? 'Проверка...' : 'Войти'}
        </button>
      </div>
    </div>
  );
}
