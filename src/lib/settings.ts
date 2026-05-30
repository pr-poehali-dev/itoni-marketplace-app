export type NotificationSettings = {
  messages: boolean;
  views: boolean;
  promo: boolean;
};

const KEY = 'itoni_notification_settings';

const DEFAULTS: NotificationSettings = {
  messages: true,
  views: false,
  promo: false,
};

export function getNotificationSettings(): NotificationSettings {
  try {
    const s = localStorage.getItem(KEY);
    return s ? { ...DEFAULTS, ...JSON.parse(s) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function saveNotificationSettings(settings: NotificationSettings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
}
