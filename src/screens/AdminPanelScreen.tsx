import { useState } from 'react';
import { clearAdminToken } from '@/lib/adminApi';
import Icon from '@/components/ui/icon';

import AdminUsers from '@/screens/admin/AdminUsers';
import AdminListings from '@/screens/admin/AdminListings';
import AdminReports from '@/screens/admin/AdminReports';
import AdminStats from '@/screens/admin/AdminStats';
import AdminInstalls from '@/screens/admin/AdminInstalls';
import AdminBanners from '@/screens/admin/AdminBanners';
import AdminHomeContent from '@/screens/admin/AdminHomeContent';
import AdminBroadcast from '@/screens/admin/AdminBroadcast';
import AdminCategories from '@/screens/admin/AdminCategories';
import AdminBrands from '@/screens/admin/AdminBrands';
import AdminLogs from '@/screens/admin/AdminLogs';

interface Props {
  onExit: () => void;
  onOpenListing: (id: number) => void;
}

type SectionId = 'stats' | 'users' | 'listings' | 'reports' | 'installs' | 'banners' | 'home' | 'broadcast' | 'categories' | 'brands' | 'logs';

const SECTIONS: { id: SectionId; label: string; icon: string }[] = [
  { id: 'stats', label: 'Статистика', icon: 'ChartBar' },
  { id: 'users', label: 'Пользователи', icon: 'Users' },
  { id: 'listings', label: 'Объявления', icon: 'FileText' },
  { id: 'reports', label: 'Жалобы', icon: 'Flag' },
  { id: 'installs', label: 'Установки', icon: 'Download' },
  { id: 'banners', label: 'Реклама', icon: 'Image' },
  { id: 'home', label: 'Тексты главной', icon: 'Type' },
  { id: 'broadcast', label: 'Рассылка', icon: 'Send' },
  { id: 'categories', label: 'Категории', icon: 'Grid3x3' },
  { id: 'brands', label: 'Марки', icon: 'Tag' },
  { id: 'logs', label: 'Логи админа', icon: 'ScrollText' },
];

export default function AdminPanelScreen({ onExit, onOpenListing }: Props) {
  const [section, setSection] = useState<SectionId>('stats');

  function logout() {
    clearAdminToken();
    onExit();
  }

  return (
    <div className="pb-nav bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gray-900 px-4 pt-12 pb-3 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon name="ShieldCheck" size={20} className="text-white" />
            <h1 className="text-lg font-extrabold text-white">Админ-панель</h1>
          </div>
          <button onClick={logout} className="text-xs text-gray-300 flex items-center gap-1">
            <Icon name="LogOut" size={14} /> Выйти
          </button>
        </div>
        {/* Section tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${section === s.id ? 'bg-itoni-blue text-white' : 'bg-white/10 text-gray-300'}`}
            >
              <Icon name={s.icon} size={13} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {section === 'stats' && <AdminStats />}
        {section === 'users' && <AdminUsers />}
        {section === 'listings' && <AdminListings onOpenListing={onOpenListing} />}
        {section === 'reports' && <AdminReports onOpenListing={onOpenListing} />}
        {section === 'installs' && <AdminInstalls />}
        {section === 'banners' && <AdminBanners />}
        {section === 'home' && <AdminHomeContent />}
        {section === 'broadcast' && <AdminBroadcast />}
        {section === 'categories' && <AdminCategories />}
        {section === 'brands' && <AdminBrands />}
        {section === 'logs' && <AdminLogs />}
      </div>
    </div>
  );
}
