import { useState } from 'react';
import { api } from '@/lib/api';
import { saveUser } from '@/lib/auth';

interface Props {
  onAuth: () => void;
}

export default function AuthScreen({ onAuth }: Props) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
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
        onAuth();
      } else {
        setError(res.error || 'Неверный код');
      }
    } catch {
      setLoading(false);
      setError('Ошибка соединения. Попробуйте снова.');
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-itoni-blue rounded-3xl mb-4 shadow-lg">
            <span className="text-4xl">🚗</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">ИТОНИ</h1>
          <p className="text-gray-500 mt-1">Маркетплейс авто и техники</p>
        </div>

        {step === 'phone' ? (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Вход</h2>
            <p className="text-gray-500 text-sm mb-6">Введите номер телефона для входа или регистрации</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Номер телефона</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                onKeyDown={e => e.key === 'Enter' && handleSendCode()}
                placeholder="+7 (___) ___-__-__"
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-lg focus:outline-none focus:border-itoni-blue transition-colors"
              />
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              onClick={handleSendCode}
              disabled={loading}
              className="w-full bg-itoni-blue text-white font-bold py-4 rounded-xl text-base disabled:opacity-60 transition-all active:scale-[0.98]"
            >
              {loading ? 'Отправка...' : 'Получить код'}
            </button>
          </div>
        ) : (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Введите код</h2>
            <p className="text-gray-500 text-sm mb-6">Код отправлен на {phone}</p>
            {demoCode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-sm text-yellow-800">
                <strong>Демо-режим.</strong> Ваш код: <span className="font-mono font-bold text-lg">{demoCode}</span>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">SMS-код</label>
              <input
                type="number"
                value={code}
                onChange={e => setCode(e.target.value.slice(0, 4))}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                placeholder="1234"
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-2xl text-center tracking-widest focus:outline-none focus:border-itoni-blue transition-colors"
                autoFocus
              />
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-itoni-blue text-white font-bold py-4 rounded-xl text-base disabled:opacity-60 transition-all active:scale-[0.98] mb-3"
            >
              {loading ? 'Проверка...' : 'Войти'}
            </button>
            <button onClick={() => { setStep('phone'); setError(''); setCode(''); }} className="w-full text-gray-500 text-sm py-2">
              Изменить номер
            </button>
          </div>
        )}
      </div>

      <div className="px-6 pb-8 text-center text-xs text-gray-400">
        Нажимая «Войти», вы принимаете условия использования
      </div>
    </div>
  );
}