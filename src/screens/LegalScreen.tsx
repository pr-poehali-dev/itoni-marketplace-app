import { LEGAL_UPDATED } from '@/lib/legal';
import Icon from '@/components/ui/icon';

interface Props {
  title: string;
  text: string;
  onBack: () => void;
}

export default function LegalScreen({ title, text, onBack }: Props) {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <Icon name="ChevronLeft" size={20} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-extrabold text-gray-900 leading-tight">{title}</h1>
        </div>
      </div>

      <div className="px-4 py-5 pb-12">
        <p className="text-xs text-gray-400 mb-4">Редакция от {LEGAL_UPDATED}</p>
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{text}</p>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">иТони · Документ носит юридический характер</p>
      </div>
    </div>
  );
}
