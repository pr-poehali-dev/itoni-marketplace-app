const AUTH_URL = 'https://functions.poehali.dev/ef33d28f-af7b-409d-abbe-a48c5e7fee33';
const UPLOAD_URL = 'https://functions.poehali.dev/676c8ac5-82ee-46c2-b2e9-14337d9550f3';
const TOKEN_KEY = 'itoni_admin_token';

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function call(action: string, payload: Record<string, unknown> = {}) {
  const token = getAdminToken();
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Admin-Token': token } : {}),
    },
    body: JSON.stringify({ action, admin_token: token, ...payload }),
  });
  return res.json();
}

export const adminApi = {
  // Вход по email + паролю
  loginEmail: (email: string, password: string) => call('admin_login', { email, password }),

  // Данные
  stats: () => call('admin_stats'),
  users: (search = '') => call('admin_users', { search }),
  blockUser: (user_id: number, blocked: boolean) => call('admin_block_user', { user_id, blocked }),

  listings: (category = '', status = '') => call('admin_listings', { category, status }),
  deleteListings: (ids: number[]) => call('admin_delete_listings', { ids }),

  banners: () => call('admin_banners'),
  saveBanner: (b: { id?: number; title?: string; image_url?: string; link_url?: string; position?: number; is_active?: boolean }) =>
    call('admin_banner_save', b),
  toggleBanner: (id: number) => call('admin_banner_toggle', { id }),
  deleteBanner: (id: number) => call('admin_banner_delete', { id }),

  broadcast: (data: { title: string; body: string; sms?: boolean }) => call('admin_broadcast', data),
  broadcasts: () => call('admin_broadcasts'),

  // Загрузка картинки от имени админа (для баннеров)
  uploadImage: async (base64: string, contentType = 'image/jpeg') => {
    const token = getAdminToken();
    const res = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'X-Admin-Token': token } : {}),
      },
      body: JSON.stringify({ image: base64, content_type: contentType }),
    });
    return res.json();
  },
};