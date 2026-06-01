import { AUTH_URL } from './api';

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
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAdminToken();
  if (token) {
    headers['X-Admin-Token'] = token;
    headers['x-admin-token'] = token;
  }
  try {
    const r = await fetch(AUTH_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, admin_token: token, ...payload }),
    });
    const text = await r.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error('[adminApi] not JSON:', action, r.status, text);
      return { error: `Ошибка сервера (${r.status})` };
    }
  } catch (e) {
    console.error('[adminApi] network error:', action, e);
    return { error: 'Нет связи с сервером' };
  }
}

export const adminApi = {
  login: (email: string, password: string) => call('admin_login', { email, password }),

  // Users
  users: (search?: string) => call('admin_users', { search }),
  blockUser: (user_id: number, blocked: boolean) => call('admin_block_user', { user_id, blocked }),

  // Listings
  listings: (filter?: { category?: string; status?: string }) => call('admin_listings', filter || {}),
  deleteListings: (ids: number[]) => call('admin_delete_listings', { ids }),
  rejectListing: (listing_id: number, reason: string) => call('admin_reject_listing', { listing_id, reason }),
  approveListing: (listing_id: number) => call('admin_approve_listing', { listing_id }),

  // Reports
  reports: () => call('admin_reports'),

  // Stats
  stats: () => call('admin_stats'),

  // Installs
  installs: () => call('admin_installs'),
  installsCsv: () => call('admin_installs_csv'),

  // Banners
  banners: () => call('admin_banners'),
  saveBanner: (b: { id?: number; title?: string; image_url?: string; link_url?: string; position?: number; is_active?: boolean }) => call('admin_banner_save', b),
  toggleBanner: (id: number) => call('admin_banner_toggle', { id }),
  deleteBanner: (id: number) => call('admin_banner_delete', { id }),

  // Home content
  homeContent: () => call('admin_home_content'),
  saveHomeContent: (c: { id?: number; section?: string; content?: string; is_active?: boolean }) => call('admin_home_content_save', c),

  // Broadcast
  broadcast: (data: { title: string; body: string; kind: string }) => call('admin_broadcast', data),
  broadcasts: () => call('admin_broadcasts'),

  // Categories
  categories: () => call('admin_categories'),
  saveCategory: (c: { id?: number; slug?: string; name?: string; icon?: string; sort_order?: number; is_active?: boolean }) => call('admin_category_save', c),
  toggleCategory: (id: number) => call('admin_category_toggle', { id }),

  // Brands
  brands: (category_id?: number) => call('admin_brands', { category_id }),
  addBrand: (category_id: number, name: string) => call('admin_brand_add', { category_id, name }),
  deleteBrand: (id: number) => call('admin_brand_delete', { id }),

  // Logs
  logs: (date_from?: string) => call('admin_logs', { date_from }),
};

export type AdminUser = { id: number; name?: string; phone: string; city?: string; region?: string; created_at?: string; is_blocked: boolean };
export type AdminListing = { id: number; title: string; category: string; created_at?: string; status: string; reject_reason?: string; author?: string; author_phone?: string; user_id: number; price: number };
export type AdminReport = { id: number; reporter_id: number; listing_id?: number; reason: string; comment?: string; created_at?: string; target_type: string; target_user_id?: number; reporter_name?: string; listing_title?: string; listing_owner_id?: number; target_user_name?: string };
export type AdminInstall = { id: number; user_id?: number; device_info?: string; city?: string; region?: string; installed_at?: string; user_name?: string };
export type AdminBanner = { id: number; title?: string; image_url?: string; link_url?: string; is_active: boolean; position: number; created_at?: string };
export type AdminHomeItem = { id: number; section: string; content?: string; is_active: boolean };
export type AdminCategory = { id: number; slug: string; name: string; icon?: string; sort_order: number; is_active: boolean };
export type AdminBrand = { id: number; category_id: number; name: string; is_active: boolean };
export type AdminLog = { id: number; admin_email: string; action: string; created_at?: string };
export type AdminBroadcast = { id: number; title: string; body: string; kind: string; created_at?: string };