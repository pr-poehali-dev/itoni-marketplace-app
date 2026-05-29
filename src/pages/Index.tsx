import { useState, useEffect } from 'react';
import { getUser } from '@/lib/auth';
import { api, Listing, Chat } from '@/lib/api';

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
import BottomNav, { Tab } from '@/components/BottomNav';

type Screen =
  | { name: 'home' }
  | { name: 'search'; category?: string }
  | { name: 'create' }
  | { name: 'listing'; id: number }
  | { name: 'chat'; otherId: number; listingId: number; listingTitle: string; listingImage?: string; otherName?: string }
  | { name: 'messages' }
  | { name: 'profile' }
  | { name: 'favorites' }
  | { name: 'mylistings' };

const tabToScreen: Record<Tab, Screen> = {
  home: { name: 'home' },
  search: { name: 'search' },
  create: { name: 'create' },
  messages: { name: 'messages' },
  profile: { name: 'profile' },
};

export default function Index() {
  const [authed, setAuthed] = useState(!!getUser());
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!authed) return;
    api.getFavorites().then(res => {
      if (res.favorites) setFavorites(res.favorites.map((f: { id: number }) => Number(f.id)));
    });
    const loadUnread = () => {
      api.getChats().then(res => {
        if (res.chats) setUnreadCount(res.chats.filter((c: { is_read: boolean }) => !c.is_read).length);
      });
    };
    loadUnread();
    const interval = setInterval(loadUnread, 15000);
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

  const showBottomNav = !['listing', 'chat', 'create', 'favorites', 'mylistings'].includes(screen.name);

  return (
    <div className="max-w-lg mx-auto relative">
      {screen.name === 'home' && (
        <HomeScreen
          onListingClick={handleListingClick}
          onCategorySelect={cat => navigate({ name: 'search', category: cat })}
          onSearch={() => navigate({ name: 'search' })}
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
        />
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