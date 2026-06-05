import { useState } from 'react';
import { getNotificationSettings, saveNotificationSettings, NotificationSettings } from '@/lib/settings';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Props {
  onBack: () => void;
}

const PUSH_KEY = 'itoni_push_enabled';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(os: unknown) => void>;
    __syncPushId?: () => void;
  }
}

function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${on ? 'bg-itoni-blue' : 'bg-gray-300'} ${disabled ? 'opacity-50' : ''}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  );
}

export default function NotificationSettingsScreen({ onBack }: Props) {
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [pushOn, setPushOn] = useState<boolean>(localStorage.getItem(PUSH_KEY) !== 'false');

  function update(key: keyof NotificationSettings) {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    saveNotificationSettings(next);
  }

  function togglePush() {
    const next = !pushOn;
    setPushOn(next);
    localStorage.setItem(PUSH_KEY, String(next));
    api.setPushEnabled(next);
    if (next) {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (os) => {
        const OneSignal = os as { Notifications?: { requestPermission?: () => Promise<void> } };
        try { await OneSignal.Notifications?.requestPermission?.(); } catch { /* noop */ }
        window.__syncPushId?.();
      });
    }
  }

  const items: { key: keyof NotificationSettings; icon: string; label: string; desc: string; disabled?: boolean }[] = [
    { key: 'messages', icon: 'MessageCircle', label: 'Новые сообщения', desc: 'Уведомлять о сообщениях от покупателей' },
    { key: 'views', icon: 'Eye', label: 'Просмотры объявлений', desc: 'Уведомлять, когда смотрят ваши объявления' },
    { key: 'promo', icon: 'Megaphone', label: 'Рекламные рассылки', desc: 'Акции и новости иТони (скоро)', disabled: true },
  ];

  return (
    <div className="pb-nav bg-gray-50 min-h-screen">
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Icon name="ChevronLeft" size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-extrabold text-gray-900">Уведомления</h1>
        </div>
      </div>

      <div className="px-4 py-5">
        <div className="bg-white rounded-2xl card-shadow overflow-hidden mb-4">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-10 h-10 rounded-xl bg-itoni-orange-light flex items-center justify-center shrink-0">
              <Icon name="BellRing" size={20} className="text-itoni-orange" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">Push-уведомления</p>
              <p className="text-xs text-gray-500">Получать уведомления, даже когда приложение закрыто</p>
            </div>
            <Toggle on={pushOn} onToggle={togglePush} />
          </div>
        </div>

        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          {items.map((item, i) => (
            <div
              key={item.key}
              className={`flex items-center gap-3 px-4 py-4 ${i < items.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <div className="w-10 h-10 rounded-xl bg-itoni-blue-light flex items-center justify-center shrink-0">
                <Icon name={item.icon} size={20} className="text-itoni-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <Toggle on={settings[item.key]} onToggle={() => update(item.key)} disabled={item.disabled} />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mt-4 px-4">
          Настройки сохраняются на вашем устройстве. Уведомления показываются внутри приложения.
        </p>
      </div>
    </div>
  );
}