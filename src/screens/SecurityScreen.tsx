import { useState } from 'react';
import { api } from '@/lib/api';
import { getUser, clearUser, saveUser } from '@/lib/auth';
import { TERMS_TEXT, PRIVACY_TEXT, CONSENT_TEXT } from '@/lib/legal';
import LegalScreen from '@/screens/LegalScreen';
import Icon from '@/components/ui/icon';

interface Props {
  onBack: () => void;
  onChangePhone: () => void;
  onDeleted: () => void;
}

type Doc = { title: string; text: string } | null;

function maskPhone(phone?: string): string {
  if (!phone) return '+7 *** *** ** **';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone;
  const last4 = digits.slice(-4);
  return `+7 *** *** ${last4.slice(0, 2)} ${last4.slice(2)}`;
}

export default function SecurityScreen({ onBack, onChangePhone, onDeleted }: Props) {
  const [user, setUser] = useState(getUser());
  const [doc, setDoc] = useState<Doc>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPhone, setShowPhone] = useState(user?.show_phone !== false);
  const [savingShow, setSavingShow] = useState(false);

  async function toggleShowPhone() {
    const next = !showPhone;
    setShowPhone(next);
    setSavingShow(true);
    const res = await api.setShowPhone(next);
    setSavingShow(false);
    if (res.success && res.user) {
      saveUser(res.user);
      setUser(res.user);
    } else {
      setShowPhone(!next);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await api.deleteAccount();
    setDeleting(false);
    if (res.success) {
      clearUser();
      onDeleted();
    }
  }

  if (doc) {
    return <LegalScreen title={doc.title} text={doc.text} onBack={() => setDoc(null)} />;
  }

  const docs = [
    { label: 'Пользовательское соглашение', icon: 'FileText', doc: { title: 'Пользовательское соглашение', text: TERMS_TEXT } },
    { label: 'Политика конфиденциальности', icon: 'Lock', doc: { title: 'Политика конфиденциальности', text: PRIVACY_TEXT } },
    { label: 'Согласие на обработку ПД', icon: 'ShieldCheck', doc: { title: 'Согласие на обработку ПД', text: CONSENT_TEXT } },
  ];

  return (
    <div className="pb-nav bg-gray-50 min-h-screen">
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Icon name="ChevronLeft" size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-extrabold text-gray-900">Безопасность</h1>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Доступ */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Доступ</p>
          <div className="bg-white rounded-2xl card-shadow overflow-hidden">
            <div className="px-4 py-4 flex items-center gap-3 border-b border-gray-50">
              <div className="w-10 h-10 rounded-xl bg-itoni-blue-light flex items-center justify-center">
                <Icon name="Phone" size={18} className="text-itoni-blue" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Номер телефона</p>
                <p className="font-semibold text-gray-900">{maskPhone(user?.phone)}</p>
              </div>
            </div>
            <button onClick={onChangePhone} className="w-full px-4 py-4 flex items-center gap-3 active:bg-gray-50 transition-colors border-b border-gray-50">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <Icon name="RefreshCw" size={18} className="text-gray-600" />
              </div>
              <p className="flex-1 text-left font-semibold text-gray-900 text-sm">Сменить номер телефона</p>
              <Icon name="ChevronRight" size={18} className="text-gray-300" />
            </button>
            <button onClick={toggleShowPhone} disabled={savingShow} className="w-full px-4 py-4 flex items-center gap-3 active:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-itoni-blue-light flex items-center justify-center">
                <Icon name="Eye" size={18} className="text-itoni-blue" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-900 text-sm">Показывать мой номер</p>
                <p className="text-xs text-gray-500">В объявлениях покупатели увидят телефон</p>
              </div>
              <div className={`w-12 h-7 rounded-full transition-colors flex items-center px-0.5 ${showPhone ? 'bg-itoni-blue justify-end' : 'bg-gray-300 justify-start'}`}>
                <div className="w-6 h-6 rounded-full bg-white shadow-sm" />
              </div>
            </button>
          </div>
        </div>

        {/* Документы */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Документы</p>
          <div className="bg-white rounded-2xl card-shadow overflow-hidden">
            {docs.map((d, i) => (
              <button
                key={i}
                onClick={() => setDoc(d.doc)}
                className="w-full px-4 py-4 flex items-center gap-3 active:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
              >
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <Icon name={d.icon} size={18} className="text-green-600" />
                </div>
                <p className="flex-1 text-left font-semibold text-gray-900 text-sm">{d.label}</p>
                <Icon name="ChevronRight" size={18} className="text-gray-300" />
              </button>
            ))}
          </div>
        </div>

        {/* Управление аккаунтом */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Управление аккаунтом</p>
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full bg-white border border-red-100 text-red-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 card-shadow"
          >
            <Icon name="Trash2" size={18} />
            Удалить аккаунт
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 pt-2">ИТОНИ v1.0</p>
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6" onClick={() => !deleting && setConfirmDelete(false)}>
          <div className="absolute inset-0 bg-black/50 animate-fade-in" />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Icon name="TriangleAlert" size={28} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Удалить аккаунт?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Все ваши объявления, сообщения и данные будут безвозвратно удалены. Это действие нельзя отменить.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-xl"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl disabled:opacity-60"
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}