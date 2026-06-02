const URLS = {
  auth: 'https://functions.poehali.dev/ef33d28f-af7b-409d-abbe-a48c5e7fee33',
  listings: 'https://functions.poehali.dev/0deef765-3164-4e05-869b-78d8f921093a',
  messages: 'https://functions.poehali.dev/2f5c87db-e9c8-4cfb-b254-c9af129d3f60',
  favorites: 'https://functions.poehali.dev/8a1695ea-2018-4b8b-ac83-74db930b9582',
  upload: 'https://functions.poehali.dev/676c8ac5-82ee-46c2-b2e9-14337d9550f3',
};

function getUserId(): string | null {
  const u = localStorage.getItem('itoni_user');
  if (!u) return null;
  return JSON.parse(u).id?.toString() || null;
}

function authHeaders(): Record<string, string> {
  const uid = getUserId();
  return uid ? { 'Content-Type': 'application/json', 'X-User-Id': uid } : { 'Content-Type': 'application/json' };
}

export const api = {
  // Auth: логин + пароль
  register: (login: string, password: string, name?: string) =>
    fetch(URLS.auth, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'register', login, password, name }) }).then(r => r.json()),

  loginPassword: (login: string, password: string) =>
    fetch(URLS.auth, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login', login, password }) }).then(r => r.json()),

  // Auth: SMS + код
  sendSmsCode: (phone: string) =>
    fetch(URLS.auth, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'sms_send', phone }) }).then(r => r.json()),

  verifySmsCode: (phone: string, code: string) =>
    fetch(URLS.auth, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'sms_verify', phone, code }) }).then(r => r.json()),

  updateProfile: (data: { name?: string; city?: string; region?: string; photo?: string; phone?: string }) =>
    fetch(URLS.auth, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(r => r.json()),

  setShowPhone: (show_phone: boolean) =>
    fetch(URLS.auth, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ show_phone }) }).then(r => r.json()),

  acceptTerms: () =>
    fetch(URLS.auth, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'accept' }) }).then(r => r.json()),

  deleteAccount: () =>
    fetch(URLS.auth, { method: 'DELETE', headers: authHeaders() }).then(r => r.json()),

  sendSupport: (data: { message: string; contact?: string; phone?: string }) =>
    fetch(URLS.auth, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'support', ...data }) }).then(r => r.json()),

  deleteListing: (id: number) =>
    fetch(URLS.listings, { method: 'DELETE', headers: authHeaders(), body: JSON.stringify({ id }) }).then(r => r.json()),

  updateListing: (id: number, data: { title: string; price: number; description?: string }) =>
    fetch(URLS.listings, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ id, ...data }) }).then(r => r.json()),

  // Listings
  getListings: (params: Record<string, string | number> = {}) => {
    const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
    return fetch(`${URLS.listings}${q ? '?' + q : ''}`, { headers: authHeaders() }).then(r => r.json());
  },

  getListing: (id: number) =>
    fetch(`${URLS.listings}?id=${id}`, { headers: authHeaders() }).then(r => r.json()),

  createListing: (data: Record<string, unknown>) =>
    fetch(URLS.listings, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(r => r.json()),

  // Messages
  getChats: () =>
    fetch(`${URLS.messages}?mode=chats`, { headers: authHeaders() }).then(r => r.json()),

  getMessages: (otherId: number, listingId: number) =>
    fetch(`${URLS.messages}?other_id=${otherId}&listing_id=${listingId}`, { headers: authHeaders() }).then(r => r.json()),

  sendMessage: (receiverId: number, listingId: number, text: string) =>
    fetch(URLS.messages, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ receiver_id: receiverId, listing_id: listingId, text }) }).then(r => r.json()),

  deleteMessage: (messageId: number) =>
    fetch(URLS.messages, { method: 'DELETE', headers: authHeaders(), body: JSON.stringify({ message_id: messageId }) }).then(r => r.json()),

  deleteChat: (otherId: number, listingId: number) =>
    fetch(URLS.messages, { method: 'DELETE', headers: authHeaders(), body: JSON.stringify({ other_id: otherId, listing_id: listingId }) }).then(r => r.json()),

  // Notifications
  getNotifications: () =>
    fetch(`${URLS.messages}?mode=notifications`, { headers: authHeaders() }).then(r => r.json()),

  markNotificationsRead: () =>
    fetch(`${URLS.messages}?mode=read_notifications`, { method: 'POST', headers: authHeaders(), body: '{}' }).then(r => r.json()),

  // Report
  reportListing: (listingId: number, reason: string, comment?: string) =>
    fetch(URLS.listings, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'report', listing_id: listingId, reason, comment }) }).then(r => r.json()),

  // Favorites
  getFavorites: () =>
    fetch(URLS.favorites, { headers: authHeaders() }).then(r => r.json()),

  addFavorite: (listingId: number) =>
    fetch(URLS.favorites, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ listing_id: listingId }) }).then(r => r.json()),

  removeFavorite: (listingId: number) =>
    fetch(URLS.favorites, { method: 'DELETE', headers: authHeaders(), body: JSON.stringify({ listing_id: listingId }) }).then(r => r.json()),

  // Upload
  uploadImage: (base64: string, contentType = 'image/jpeg') =>
    fetch(URLS.upload, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ image: base64, content_type: contentType }) }).then(r => r.json()),

  // Public: install tracking, banners, home content
  trackInstall: (data: { device_info?: string; city?: string; region?: string }) =>
    fetch(URLS.auth, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'track_install', ...data }) }).then(r => r.json()),

  getBanners: () =>
    fetch(URLS.auth, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get_banners' }) }).then(r => r.json()),

  getHome: () =>
    fetch(URLS.auth, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get_home' }) }).then(r => r.json()),
};

export const AUTH_URL = URLS.auth;

export type Listing = {
  id: number;
  user_id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  city: string;
  region: string;
  images: string[];
  views: number;
  created_at: string;
  seller_name: string;
  seller_phone: string;
  seller_photo: string;
  seller_show_phone?: boolean;
};

export type User = {
  id: number;
  phone: string;
  name?: string;
  city?: string;
  region?: string;
  photo?: string;
  accepted_terms?: boolean;
  login?: string;
  email?: string;
  show_phone?: boolean;
};

export type Message = {
  id: number;
  sender_id: number;
  receiver_id: number;
  text: string;
  created_at: string;
  is_read: boolean;
  sender_name: string;
  sender_photo?: string;
};

export type Notification = {
  id: number;
  type: 'message' | 'view' | 'system';
  title: string;
  body?: string;
  listing_id?: number;
  sender_id?: number;
  is_read: boolean;
  created_at: string;
};

export type Chat = {
  message_id: number;
  other_user_id: number;
  listing_id: number;
  last_message: string;
  created_at: string;
  is_read: boolean;
  other_name: string;
  other_photo?: string;
  listing_title: string;
  listing_image?: string;
};

export const CATEGORIES = [
  { id: 'auto', label: 'Авто', emoji: '🚗' },
  { id: 'moto', label: 'Мото', emoji: '🏍️' },
  { id: 'boats', label: 'Лодки', emoji: '⛵' },
  { id: 'parts', label: 'Запчасти', emoji: '🔧' },
  { id: 'special', label: 'Спецтехника', emoji: '🚜' },
];

export const FUEL_TYPES = ['Бензин', 'Дизель', 'Электро', 'Гибрид', 'Газ'];
export const TRANSMISSIONS = ['Автомат', 'Механика', 'Вариатор', 'Робот'];

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return 'только что';
  if (diffMin < 60) return `${diffMin} мин. назад`;
  if (diffH < 24) return `${diffH} ч. назад`;
  if (diffD < 7) return `${diffD} д. назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}