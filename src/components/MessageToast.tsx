import { useEffect } from 'react';
import Icon from '@/components/ui/icon';

export interface ToastData {
  senderName: string;
  listingTitle: string;
}

interface Props {
  toast: ToastData;
  onClick: () => void;
  onClose: () => void;
}

export default function MessageToast({ toast, onClick, onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  return (
    <div className="fixed bottom-20 left-0 right-0 z-[120] px-4 flex justify-center animate-slide-up">
      <div
        onClick={onClick}
        className="w-full max-w-md bg-gray-900 text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 cursor-pointer"
      >
        <div className="w-9 h-9 rounded-full bg-itoni-blue flex items-center justify-center shrink-0">
          <Icon name="MessageCircle" size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">Новое сообщение от {toast.senderName}</p>
          <p className="text-xs text-gray-300 truncate">в чате «{toast.listingTitle}»</p>
        </div>
        <button onClick={e => { e.stopPropagation(); onClose(); }} className="shrink-0">
          <Icon name="X" size={16} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
}
