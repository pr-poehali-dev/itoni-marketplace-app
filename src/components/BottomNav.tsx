import Icon from '@/components/ui/icon';

type Tab = 'home' | 'search' | 'create' | 'messages' | 'profile';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  unreadCount?: number;
}

const tabs = [
  { id: 'home' as Tab, icon: 'Home', label: 'Главная' },
  { id: 'search' as Tab, icon: 'Search', label: 'Поиск' },
  { id: 'create' as Tab, icon: 'Plus', label: 'Создать' },
  { id: 'messages' as Tab, icon: 'MessageCircle', label: 'Сообщения' },
  { id: 'profile' as Tab, icon: 'User', label: 'Профиль' },
];

export default function BottomNav({ active, onChange, unreadCount = 0 }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-inset-bottom">
      <div className="flex items-stretch max-w-lg mx-auto">
        {tabs.map(tab => {
          const isActive = active === tab.id;
          const isCreate = tab.id === 'create';
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors relative ${
                isActive && !isCreate ? 'text-itoni-blue' : 'text-gray-400'
              }`}
            >
              {isCreate ? (
                <div className="w-12 h-12 rounded-2xl bg-itoni-blue flex items-center justify-center shadow-lg -mt-4">
                  <Icon name="Plus" size={24} className="text-white" />
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Icon name={tab.icon} size={22} />
                    {tab.id === 'messages' && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-itoni-blue' : 'text-gray-400'}`}>
                    {tab.label}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
      <div className="h-safe-bottom" />
    </nav>
  );
}

export type { Tab };
