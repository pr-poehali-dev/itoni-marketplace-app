import { useState, useEffect, useRef } from 'react';
import { getUser } from '@/lib/auth';
import { api, Listing, Chat, Notification } from '@/lib/api';
import { getNotificationSettings } from '@/lib/settings';

import AuthScreen from '@/screens/AuthScreen';
import HomeScreen from '@/screens/HomeScreen';
import SearchScreen from '@/screens/SearchScreen';
import CreateScreen from '@/screens/CreateScreen';
import ListingScreen from '@/screens/ListingScreen';
import MessagesScreen from '@/screens/MessagesScreen';
import ChatScreen from '@/screens/ChatScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import FavoritesScreen from '@/screens/FavoritesScreen';
import MyListingsScreen from '@/screens/MyListingsScreen';
import SecurityScreen from '@/screens/SecurityScreen';
import SupportScreen from '@/screens/SupportScreen';
import NotificationSettingsScreen from '@/screens/NotificationSettingsScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import AdminLoginScreen from '@/screens/AdminLoginScreen';
import AdminPanelScreen from '@/screens/AdminPanelScreen';
import BottomNav, { Tab } from '@/components/BottomNav';
import MessageToast, { ToastData } from '@/components/MessageToast';
import { clearUser } from '@/lib/auth';
import { getAdminToken } from '@/lib/adminApi';

type Screen =
  | { name: 'home' }
  | { name: 'search'; category?: string }
  | { name: 'create' }
  | { name: 'listing'; id: number }
  | { name: 'chat'; otherId: number; listingId: number; listingTitle: string; listingImage?: string; otherName?: string }
  | { name: 'messages' }
  | { name: 'profile' }
  | { name: 'favorites' }
  | { name: 'mylistings' }
  | { name: 'security' }
  | { name: 'support' }
  | { name: 'notification-settings' }
  | { name: 'notifications' }
  | { name: 'admin-login' }
  | { name: 'admin-panel' };

const tabToScreen: Record<Tab, Screen> = {
  home: { name: 'home' },
  search: { name: 'search' },
  create: { name: 'create' },
  messages: { name: 'messages' },
  profile: { name: 'profile' },
};

function getInitialScreen(): Screen {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (window.location.pathname === '/listing' && id && !isNaN(Number(id))) {
    return { name: 'listing', id: Number(id) };
  }
  return { name: 'home' };
}

export default function Index() {
  const [authed, setAuthed] = useState(!!getUser());
  const [screen, setScreen] = useState<Screen>(getInitialScreen);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);
  const [toast, setToast] = useState<ToastData | null>(null);
  const lastNotifId = useRef<number | null>(null);
  const firstNotifLoad = useRef(true);

  // Запись установки приложения один раз
  useEffect(() => {
    if (localStorage.getItem('itoni_install_tracked')) return;
    const u = getUser();
    api.trackInstall({
      device_info: navigator.userAgent,
      city: u?.city,
      region: u?.region,
    }).then(() => localStorage.setItem('itoni_install_tracked', '1')).catch(() => {});
  }, []);

  useEffect(() => {
    if (!authed) return;
    api.getFavorites().then(res => {
      if (res.favorites) setFavorites(res.favorites.map((f: { id: number }) => Number(f.id)));
    });

    const poll = () => {
      api.getChats().then(res => {
        if (res.chats) setUnreadCount(res.chats.filter((c: { is_read: boolean }) => !c.is_read).length);
      });
      api.getNotifications().then(res => {
        const notes: Notification[] = res.notifications || [];
        setNotifUnread(res.unread || 0);

        // Детекция новых уведомлений для тоста о сообщениях
        const newest = notes[0];
        if (newest) {
          if (firstNotifLoad.current) {
            lastNotifId.current = newest.id;
            firstNotifLoad.current = false;
          } else if (lastNotifId.current !== null && newest.id > lastNotifId.current) {
            const fresh = notes.filter(n => n.id > (lastNotifId.current as number));
            const msgNote = fresh.find(n => n.type === 'message');
            const settings = getNotificationSettings();
            if (msgNote && settings.messages) {
              setToast({
                senderName: msgNote.title.replace('Новое сообщение от ', '') || 'Пользователь',
                listingTitle: (msgNote.body || '').replace('В чате по объявлению «', '').replace('»', '') || 'объявление',
              });
            }
            lastNotifId.current = newest.id;
          }
        }
      });
    };
    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [authed]);

  async function handleFavoriteToggle(listingId: number) {
    const isFav = favorites.includes(listingId);
    if (isFav) {
      setFavorites(prev => prev.filter(id => id !== listingId));
      await api.removeFavorite(listingId);
    } else {
      setFavorites(prev => [...prev, listingId]);
      await api.addFavorite(listingId);
    }
  }

  function navigate(s: Screen) {
    setScreen(s);
    const tabMap: Partial<Record<Screen['name'], Tab>> = {
      home: 'home', search: 'search', messages: 'messages', profile: 'profile',
    };
    if (tabMap[s.name]) setActiveTab(tabMap[s.name]!);
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    navigate(tabToScreen[tab]);
  }

  function handleListingClick(id: number) {
    navigate({ name: 'listing', id });
  }

  function handleChat(listing: Listing) {
    navigate({
      name: 'chat',
      otherId: listing.user_id,
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: listing.images?.[0],
      otherName: listing.seller_name,
    });
  }

  function handleChatOpen(chat: Chat) {
    navigate({
      name: 'chat',
      otherId: chat.other_user_id,
      listingId: chat.listing_id,
      listingTitle: chat.listing_title,
      listingImage: chat.listing_image,
      otherName: chat.other_name,
    });
  }

  if (!authed) {
    return <AuthScreen onAuth={() => setAuthed(true)} />;
  }

  function handleAccountGone() {
    clearUser();
    setAuthed(false);
    setScreen({ name: 'home' });
  }

  const showBottomNav = !['listing', 'chat', 'create', 'favorites', 'mylistings', 'security', 'support', 'notification-settings', 'notifications', 'admin-login', 'admin-panel'].includes(screen.name);

  function handleNotifChat(n: Notification) {
    navigate({
      name: 'chat',
      otherId: n.sender_id || 0,
      listingId: n.listing_id || 0,
      listingTitle: (n.body || '').replace('В чате по объявлению «', '').replace('»', '') || 'Объявление',
    });
  }

  return (
    <div className="max-w-lg mx-auto relative">
      {screen.name === 'home' && (
        <HomeScreen
          onListingClick={handleListingClick}
          onCategorySelect={cat => navigate({ name: 'search', category: cat })}
          onSearch={() => navigate({ name: 'search' })}
          onNotifications={() => navigate({ name: 'notifications' })}
          notifUnread={notifUnread}
          favorites={favorites}
          onFavoriteToggle={handleFavoriteToggle}
        />
      )}

      {screen.name === 'search' && (
        <SearchScreen
          initialCategory={screen.category}
          onListingClick={handleListingClick}
          favorites={favorites}
          onFavoriteToggle={handleFavoriteToggle}
        />
      )}

      {screen.name === 'create' && (
        <CreateScreen
          onSuccess={id => navigate({ name: 'listing', id })}
          onCancel={() => navigate({ name: 'home' })}
        />
      )}

      {screen.name === 'listing' && (
        <ListingScreen
          listingId={screen.id}
          onBack={() => window.history.length > 1 ? navigate({ name: 'search' }) : navigate({ name: 'home' })}
          onChat={handleChat}
          favorites={favorites}
          onFavoriteToggle={handleFavoriteToggle}
        />
      )}

      {screen.name === 'messages' && (
        <MessagesScreen onChatOpen={handleChatOpen} />
      )}

      {screen.name === 'chat' && (
        <ChatScreen
          otherId={screen.otherId}
          listingId={screen.listingId}
          listingTitle={screen.listingTitle}
          listingImage={screen.listingImage}
          otherName={screen.otherName}
          onBack={() => navigate({ name: 'messages' })}
        />
      )}

      {screen.name === 'profile' && (
        <ProfileScreen
          onLogout={() => setAuthed(false)}
          onMyListings={() => navigate({ name: 'mylistings' })}
          onFavorites={() => navigate({ name: 'favorites' })}
          onSecurity={() => navigate({ name: 'security' })}
          onSupport={() => navigate({ name: 'support' })}
          onNotificationSettings={() => navigate({ name: 'notification-settings' })}
          onAdmin={() => navigate({ name: getAdminToken() ? 'admin-panel' : 'admin-login' })}
        />
      )}

      {screen.name === 'admin-login' && (
        <AdminLoginScreen
          onBack={() => navigate({ name: 'profile' })}
          onSuccess={() => navigate({ name: 'admin-panel' })}
        />
      )}

      {screen.name === 'admin-panel' && (
        <AdminPanelScreen
          onExit={() => navigate({ name: 'profile' })}
          onOpenListing={handleListingClick}
        />
      )}

      {screen.name === 'notification-settings' && (
        <NotificationSettingsScreen onBack={() => navigate({ name: 'profile' })} />
      )}

      {screen.name === 'notifications' && (
        <NotificationsScreen
          onBack={() => navigate({ name: 'home' })}
          onOpenListing={handleListingClick}
          onOpenChat={handleNotifChat}
          onRead={() => setNotifUnread(0)}
        />
      )}

      {screen.name === 'security' && (
        <SecurityScreen
          onBack={() => navigate({ name: 'profile' })}
          onChangePhone={handleAccountGone}
          onDeleted={handleAccountGone}
        />
      )}

      {screen.name === 'support' && (
        <SupportScreen onBack={() => navigate({ name: 'profile' })} />
      )}

      {screen.name === 'favorites' && (
        <FavoritesScreen
          onBack={() => navigate({ name: 'profile' })}
          onListingClick={handleListingClick}
          favorites={favorites}
          onFavoriteToggle={handleFavoriteToggle}
        />
      )}

      {screen.name === 'mylistings' && (
        <MyListingsScreen
          onBack={() => navigate({ name: 'profile' })}
          onListingClick={handleListingClick}
          onCreateNew={() => navigate({ name: 'create' })}
        />
      )}

      {toast && (
        <MessageToast
          toast={toast}
          onClick={() => { setToast(null); navigate({ name: 'messages' }); }}
          onClose={() => setToast(null)}
        />
      )}

      {showBottomNav && (
        <BottomNav
          active={activeTab}
          onChange={handleTabChange}
          unreadCount={unreadCount}
        />
      )}
    </div>
  );
}