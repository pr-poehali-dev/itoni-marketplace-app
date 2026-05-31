import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { getUser, saveUser, clearUser } from '@/lib/auth';
import RegionPicker from '@/components/RegionPicker';
import Icon from '@/components/ui/icon';

interface Props {
  onLogout: () => void;
  onMyListings: () => void;
  onFavorites: () => void;
  onSecurity: () => void;
  onSupport: () => void;
  onNotificationSettings: () => void;
  onAdmin: () => void;
}

export default function ProfileScreen({ onLogout, onMyListings, onFavorites, onSecurity, onSupport, onNotificationSettings, onAdmin }: Props) {
  const [user, setUser] = useState(getUser());
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [city, setCity] = useState(user?.city || '');
  const [region, setRegion] = useState(user?.region || '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSave() {
    setLoading(true);
    const res = await api.updateProfile({ name, city, region });
    setLoading(false);
    if (res.success) {
      saveUser(res.user);
      setUser(res.user);
      setNameValue(res.user.name || '');
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function handleSaveName() {
    if (!nameValue.trim()) return;
    setSavingName(true);
    const res = await api.updateProfile({ name: nameValue.trim(), city: user?.city, region: user?.region });
    setSavingName(false);
    if (res.success) {
      saveUser(res.user);
      setUser(res.user);
      setName(res.user.name || '');
      setEditingName(false);
    }
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoError('');

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setPhotoError('Поддерживаются только JPG и PNG');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Файл слишком большой. Максимум 5 МБ');
      return;
    }

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const up = await api.uploadImage(base64, file.type);
      if (up.success && up.url) {
        const res = await api.updateProfile({ name: user?.name, city: user?.city, region: user?.region, photo: up.url });
        if (res.success) {
          saveUser(res.user);
          setUser(res.user);
        }
      } else {
        setPhotoError('Не удалось загрузить фото');
      }
      setUploadingPhoto(false);
    };
    reader.onerror = () => { setPhotoError('Ошибка чтения файла'); setUploadingPhoto(false); };
    reader.readAsDataURL(file);
  }

  function handleLogout() {
    clearUser();
    onLogout();
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-itoni-blue transition-colors";

  return (
    <div className="pb-nav bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-gray-900">Профиль</h1>
          <button
            onClick={() => setEditing(!editing)}
            className={`text-sm font-medium ${editing ? 'text-gray-500' : 'text-itoni-blue'}`}
          >
            {editing ? 'Отмена' : 'Изменить'}
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Avatar & name */}
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <div className="flex items-center gap-4 mb-2">
            {/* Avatar with camera */}
            <div className="relative shrink-0">
              <div className="w-[72px] h-[72px] rounded-2xl bg-itoni-blue flex items-center justify-center overflow-hidden">
                {uploadingPhoto ? (
                  <Icon name="LoaderCircle" size={28} className="text-white animate-spin" />
                ) : user?.photo ? (
                  <img src={user.photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-white font-bold">
                    {user?.name ? user.name[0].toUpperCase() : '👤'}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-itoni-blue border-2 border-white flex items-center justify-center"
              >
                <Icon name="Camera" size={13} className="text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png" onChange={handlePhotoSelect} className="hidden" />
            </div>

            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nameValue}
                    onChange={e => setNameValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                    placeholder="Ваше имя"
                    className="flex-1 min-w-0 border border-itoni-blue rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                    autoFocus
                  />
                  <button onClick={handleSaveName} disabled={savingName} className="w-8 h-8 rounded-lg bg-itoni-blue flex items-center justify-center shrink-0">
                    <Icon name="Check" size={16} className="text-white" />
                  </button>
                  <button onClick={() => { setEditingName(false); setNameValue(user?.name || ''); }} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Icon name="X" size={16} className="text-gray-500" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-bold text-lg text-gray-900 truncate">{user?.name || 'Пользователь'}</p>
                  <button onClick={() => { setEditingName(true); setNameValue(user?.name || ''); }} className="shrink-0">
                    <Icon name="Pencil" size={15} className="text-gray-400" />
                  </button>
                </div>
              )}
              <p className="text-sm text-gray-500">{user?.phone}</p>
              {user?.city && <p className="text-xs text-gray-400 mt-0.5">{user.city}{user.region ? `, ${user.region}` : ''}</p>}
            </div>
          </div>

          {photoError && <p className="text-red-500 text-xs mb-2">{photoError}</p>}

          {editing && (
            <div className="space-y-3 border-t border-gray-100 pt-4 animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Имя</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Введите имя" className={inputCls} />
              </div>
              <RegionPicker
                region={region}
                city={city}
                onChange={(r, c) => { setRegion(r); setCity(c); }}
              />
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-itoni-blue text-white font-bold py-3 rounded-xl text-sm disabled:opacity-60"
              >
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>
              {saved && <p className="text-green-600 text-sm text-center font-medium">✓ Сохранено!</p>}
            </div>
          )}
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          {[
            { icon: 'FileText', label: 'Мои объявления', desc: 'Управляйте своими объявлениями', action: onMyListings, color: 'text-itoni-blue', bg: 'bg-itoni-blue-light' },
            { icon: 'Heart', label: 'Избранное', desc: 'Сохранённые объявления', action: onFavorites, color: 'text-red-500', bg: 'bg-red-50' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="w-full flex items-center gap-3 px-4 py-4 active:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                <Icon name={item.icon} size={20} className={item.color} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <Icon name="ChevronRight" size={18} className="text-gray-300" />
            </button>
          ))}
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          {[
            { icon: 'Bell', label: 'Уведомления', color: 'text-itoni-orange', bg: 'bg-itoni-orange-light', action: onNotificationSettings },
            { icon: 'Shield', label: 'Безопасность', color: 'text-green-600', bg: 'bg-green-50', action: onSecurity },
            { icon: 'HelpCircle', label: 'Поддержка', color: 'text-purple-600', bg: 'bg-purple-50', action: onSupport },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="w-full flex items-center gap-3 px-4 py-4 active:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                <Icon name={item.icon} size={20} className={item.color} />
              </div>
              <p className="flex-1 text-left font-semibold text-gray-900 text-sm">{item.label}</p>
              <Icon name="ChevronRight" size={18} className="text-gray-300" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-white border border-red-100 text-red-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 card-shadow"
        >
          <Icon name="LogOut" size={18} />
          Выйти из аккаунта
        </button>

        <div className="text-center pt-2">
          <button onClick={onAdmin} className="text-xs text-gray-400">Admin</button>
        </div>

      </div>
    </div>
  );
}