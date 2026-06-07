import { useEffect, useState } from 'react';
import { adminApi, clearAdminToken } from '@/lib/adminApi';
import ListingImage from '@/components/ListingImage';
import Icon from '@/components/ui/icon';

interface Props {
  onExit: () => void;
  onOpenListing: (id: number) => void;
}

type Tab = 'stats' | 'users' | 'listings' | 'banners' | 'broadcast';

interface Stats {
  users: number; listings: number; messages: number; reports: number;
  views_total: number; online: number; active_today: number; inactive: number;
  new_users_today: number; new_users_week: number; new_users_month: number;
}
interface AdminUser { id: number; name?: string; phone: string; city?: string; online: boolean; is_blocked: boolean; last_activity?: string; }
interface AdminListing { id: number; title: string; category: string; author?: string; author_phone?: string; price: number; status: string; images?: string[]; }
interface Banner { id: number; title?: string; image_url?: string; link_url?: string; is_active: boolean; position: number; }

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'stats', label: 'Статистика', icon: 'ChartColumn' },
  { id: 'users', label: 'Люди', icon: 'Users' },
  { id: 'listings', label: 'Объявления', icon: 'FileText' },
  { id: 'banners', label: 'Баннеры', icon: 'Image' },
  { id: 'broadcast', label: 'Рассылка', icon: 'Send' },
];

export default function AdminPanelScreen({ onExit, onOpenListing }: Props) {
  const [tab, setTab] = useState<Tab>('stats');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#0F172A] px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon name="ShieldCheck" size={20} className="text-itoni-orange" />
            <h1 className="text-lg font-extrabold text-white">Админ-панель</h1>
          </div>
          <button onClick={() => { clearAdminToken(); onExit(); }} className="text-sm text-gray-300 flex items-center gap-1">
            <Icon name="LogOut" size={15} /> Выйти
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${tab === t.id ? 'bg-itoni-blue text-white' : 'bg-white/10 text-gray-300'}`}
            >
              <Icon name={t.icon} size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {tab === 'stats' && <StatsTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'listings' && <ListingsTab onOpenListing={onOpenListing} />}
        {tab === 'banners' && <BannersTab />}
        {tab === 'broadcast' && <BroadcastTab />}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 card-shadow">
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function StatsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.stats().then(res => { setStats(res.stats || null); setLoading(false); });
  }, []);

  if (loading) return <div className="grid grid-cols-2 gap-3">{[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />)}</div>;
  if (!stats) return <p className="text-gray-500 text-sm text-center py-10">Не удалось загрузить</p>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Сейчас онлайн" value={stats.online} color="text-green-600" />
        <StatCard label="Активны за сутки" value={stats.active_today} color="text-itoni-blue" />
        <StatCard label="Всего пользователей" value={stats.users} color="text-gray-900" />
        <StatCard label="Неактивные (30+ дн.)" value={stats.inactive} color="text-gray-400" />
        <StatCard label="Объявлений" value={stats.listings} color="text-gray-900" />
        <StatCard label="Просмотров всего" value={stats.views_total} color="text-itoni-orange" />
        <StatCard label="Сообщений" value={stats.messages} color="text-gray-900" />
        <StatCard label="Жалоб" value={stats.reports} color="text-red-500" />
      </div>
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <p className="font-bold text-gray-900 text-sm mb-3">Новые пользователи</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="text-xl font-extrabold text-itoni-blue">{stats.new_users_today}</p><p className="text-[11px] text-gray-500">сегодня</p></div>
          <div><p className="text-xl font-extrabold text-itoni-blue">{stats.new_users_week}</p><p className="text-[11px] text-gray-500">за неделю</p></div>
          <div><p className="text-xl font-extrabold text-itoni-blue">{stats.new_users_month}</p><p className="text-[11px] text-gray-500">за месяц</p></div>
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function load(s = '') {
    setLoading(true);
    adminApi.users(s).then(res => { setUsers(res.users || []); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  async function toggleBlock(u: AdminUser) {
    await adminApi.blockUser(u.id, !u.is_blocked);
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_blocked: !x.is_blocked } : x));
  }

  async function deleteUser(u: AdminUser) {
    setDeletingId(u.id);
    await adminApi.deleteUser(u.id);
    setUsers(prev => prev.filter(x => x.id !== u.id));
    setDeletingId(null);
    setConfirmId(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load(search)}
          placeholder="Поиск по имени или номеру"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-itoni-blue"
        />
        <button onClick={() => load(search)} className="bg-itoni-blue text-white px-4 rounded-xl text-sm font-semibold">Найти</button>
      </div>
      {loading ? (
        [...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-16 animate-pulse" />)
      ) : (
        users.map(u => (
          <div key={u.id} className="bg-white rounded-2xl p-3 card-shadow flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full bg-itoni-blue-light flex items-center justify-center shrink-0">
              <span className="font-bold text-itoni-blue">{(u.name || 'П')[0].toUpperCase()}</span>
              {u.online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{u.name || 'Без имени'}</p>
              <p className="text-xs text-gray-500">{u.phone}{u.city ? ` · ${u.city}` : ''}</p>
              <p className={`text-[11px] ${u.online ? 'text-green-600 font-medium' : 'text-gray-400'}`}>{u.online ? 'Онлайн' : 'Не в сети'}</p>
            </div>
            {confirmId === u.id ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => deleteUser(u)}
                  disabled={deletingId === u.id}
                  className="text-xs font-semibold px-3 py-2 rounded-xl bg-red-500 text-white disabled:opacity-60"
                >
                  {deletingId === u.id ? '...' : 'Точно'}
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="text-xs font-semibold px-3 py-2 rounded-xl bg-gray-100 text-gray-600"
                >
                  Отмена
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => toggleBlock(u)}
                  className={`text-xs font-semibold px-3 py-2 rounded-xl ${u.is_blocked ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}
                >
                  {u.is_blocked ? 'Разблок.' : 'Блок'}
                </button>
                <button
                  onClick={() => setConfirmId(u.id)}
                  className="text-xs font-semibold px-3 py-2 rounded-xl bg-gray-100 text-gray-600"
                >
                  Удалить
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function ListingsTab({ onOpenListing }: { onOpenListing: (id: number) => void }) {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  function load() {
    setLoading(true);
    adminApi.listings().then(res => { setListings(res.listings || []); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  async function remove(id: number) {
    await adminApi.deleteListings([id]);
    setListings(prev => prev.filter(l => l.id !== id));
    setConfirmId(null);
  }

  if (loading) return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-16 animate-pulse" />)}</div>;

  return (
    <div className="space-y-3">
      {listings.map(l => (
        <div key={l.id} className="bg-white rounded-2xl p-3 card-shadow">
          <div className="flex items-start gap-2">
            <button onClick={() => onOpenListing(l.id)} className="shrink-0">
              <ListingImage src={l.images?.[0]} alt={l.title} className="w-14 h-14 rounded-xl object-cover" iconSize={20} />
            </button>
            <button onClick={() => onOpenListing(l.id)} className="flex-1 min-w-0 text-left">
              <p className="font-semibold text-gray-900 text-sm truncate">{l.title}</p>
              <p className="text-xs text-gray-500">{l.author || '—'} · {l.author_phone || ''}</p>
              <p className="text-xs text-itoni-blue font-semibold mt-0.5">{new Intl.NumberFormat('ru-RU').format(l.price)} ₽</p>
            </button>
            <button onClick={() => setConfirmId(l.id)} className="shrink-0 text-red-500 bg-red-50 p-2 rounded-xl">
              <Icon name="Trash2" size={16} />
            </button>
          </div>
          {confirmId === l.id && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">Удалить объявление?</span>
              <div className="flex gap-2">
                <button onClick={() => setConfirmId(null)} className="text-xs text-gray-500 px-3 py-1.5">Отмена</button>
                <button onClick={() => remove(l.id)} className="text-xs text-white bg-red-500 px-3 py-1.5 rounded-lg font-semibold">Удалить</button>
              </div>
            </div>
          )}
        </div>
      ))}
      {listings.length === 0 && <p className="text-gray-500 text-sm text-center py-10">Объявлений нет</p>}
    </div>
  );
}

function BannersTab() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bannerError, setBannerError] = useState('');

  function load() {
    setLoading(true);
    adminApi.banners().then(res => { setBanners(res.banners || []); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  async function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setBannerError('Только JPG или PNG');
      return;
    }
    setBannerError('');
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = ev => resolve(ev.target?.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const res = await adminApi.uploadImage(base64, file.type);
      if (res.url) setImageUrl(res.url);
      else setBannerError(res.error || 'Не удалось загрузить фото');
    } catch {
      setBannerError('Не удалось загрузить фото');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!title && !imageUrl) { setBannerError('Добавьте текст или картинку'); return; }
    setSaving(true);
    await adminApi.saveBanner({ title, image_url: imageUrl, link_url: link, is_active: true, position: 0 });
    setTitle(''); setLink(''); setImageUrl(''); setBannerError('');
    setSaving(false);
    load();
  }

  async function toggle(id: number) {
    await adminApi.toggleBanner(id);
    setBanners(prev => prev.map(b => b.id === id ? { ...b, is_active: !b.is_active } : b));
  }
  async function del(id: number) {
    await adminApi.deleteBanner(id);
    setBanners(prev => prev.filter(b => b.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl p-4 card-shadow space-y-3">
        <p className="font-bold text-gray-900 text-sm">Новый баннер</p>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Текст баннера" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-itoni-blue" />
        <input value={link} onChange={e => setLink(e.target.value)} placeholder="Ссылка (необязательно)" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-itoni-blue" />
        {imageUrl ? (
          <div className="relative h-28 rounded-xl overflow-hidden">
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            <button onClick={() => setImageUrl('')} className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"><Icon name="X" size={12} className="text-white" /></button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-4 cursor-pointer text-sm text-gray-500">
            {uploading ? <Icon name="LoaderCircle" size={18} className="animate-spin text-itoni-blue" /> : <Icon name="ImagePlus" size={18} />}
            {uploading ? 'Загрузка...' : 'Добавить картинку (необязательно)'}
            <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={pickImage} />
          </label>
        )}
        {bannerError && <p className="text-red-500 text-xs text-center">{bannerError}</p>}
        <button onClick={save} disabled={saving || uploading} className="w-full bg-itoni-blue text-white font-bold py-3 rounded-xl text-sm disabled:opacity-60">
          {saving ? 'Сохранение...' : 'Добавить баннер'}
        </button>
      </div>

      {loading ? (
        [...Array(2)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />)
      ) : (
        banners.map(b => (
          <div key={b.id} className="bg-white rounded-2xl p-3 card-shadow flex items-center gap-3">
            {b.image_url ? <img src={b.image_url} alt="" className="w-16 h-12 rounded-lg object-cover shrink-0" /> : <div className="w-16 h-12 rounded-lg bg-itoni-blue-light flex items-center justify-center shrink-0"><Icon name="Megaphone" size={18} className="text-itoni-blue" /></div>}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{b.title || 'Без текста'}</p>
              <p className={`text-[11px] ${b.is_active ? 'text-green-600' : 'text-gray-400'}`}>{b.is_active ? 'Показывается' : 'Скрыт'}</p>
            </div>
            <button onClick={() => toggle(b.id)} className="text-xs font-semibold px-3 py-2 rounded-xl bg-gray-100 text-gray-600">{b.is_active ? 'Скрыть' : 'Показать'}</button>
            <button onClick={() => del(b.id)} className="text-red-500 bg-red-50 p-2 rounded-xl"><Icon name="Trash2" size={16} /></button>
          </div>
        ))
      )}
    </div>
  );
}

function BroadcastTab() {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [sms, setSms] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');

  async function send() {
    if (!title.trim() || !text.trim()) { setResult('Заполните заголовок и текст'); return; }
    setSending(true); setResult('');
    const res = await adminApi.broadcast({ title, body: text, sms });
    setSending(false);
    if (res.success) {
      setResult(`Отправлено: ${res.sent} уведомлений${sms ? `, SMS: ${res.sms_sent}` : ''}`);
      setTitle(''); setText(''); setSms(false);
    } else {
      setResult(res.error || 'Ошибка отправки');
    }
  }

  return (
    <div className="bg-white rounded-2xl p-4 card-shadow space-y-3">
      <p className="font-bold text-gray-900 text-sm">Рассылка всем пользователям</p>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Заголовок" maxLength={60} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-itoni-blue" />
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Текст сообщения" rows={4} maxLength={200} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-itoni-blue resize-none" />
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={sms} onChange={e => setSms(e.target.checked)} className="w-4 h-4 accent-itoni-blue" />
        Дублировать в SMS (придёт всем на телефон)
      </label>
      {result && <p className="text-sm text-center text-itoni-blue font-medium">{result}</p>}
      <button onClick={send} disabled={sending} className="w-full bg-itoni-orange text-white font-bold py-3 rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2">
        {sending && <Icon name="LoaderCircle" size={16} className="animate-spin" />}
        {sending ? 'Отправка...' : 'Отправить'}
      </button>
      {sms && <p className="text-[11px] text-gray-400 text-center">SMS-рассылка может занять время и тарифицируется оператором.</p>}
    </div>
  );
}