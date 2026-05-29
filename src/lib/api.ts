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
  // Auth
  sendCode: (phone: string) =>
    fetch(URLS.auth, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', phone }) }).then(r => r.json()),

  verifyCode: (phone: string, code: string) =>
    fetch(URLS.auth, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify', phone, code }) }).then(r => r.json()),

  updateProfile: (data: { name?: string; city?: string; region?: string; photo?: string }) =>
    fetch(URLS.auth, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(r => r.json()),

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
};

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
};

export type User = {
  id: number;
  phone: string;
  name?: string;
  city?: string;
  region?: string;
  photo?: string;
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