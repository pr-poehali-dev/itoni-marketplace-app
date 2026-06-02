import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Props {
  listingId: number;
  onSaved: () => void;
  onCancel: () => void;
}

export default function EditScreen({ listingId, onSaved, onCancel }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    api.getListing(listingId).then(res => {
      if (!res.error) {
        setTitle(res.title || '');
        setPrice(res.price != null ? String(res.price) : '');
        setDescription(res.description || '');
      } else {
        setError('Объявление не найдено');
      }
      setLoading(false);
    });
  }, [listingId]);

  async function handleSave() {
    if (!title.trim()) { setError('Укажите название'); return; }
    if (!price || parseInt(price) <= 0) { setError('Укажите корректную цену'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await api.updateListing(listingId, {
        title: title.trim(),
        price: parseInt(price),
        description: description.trim(),
      });
      if (res.success) {
        onSaved();
      } else {
        setError(res.error || 'Ошибка при сохранении');
      }
    } catch {
      setError('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-itoni-blue transition-colors";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <div className="pb-nav bg-white min-h-screen">
      <div className="px-4 pt-12 pb-4 bg-white border-b border-gray-100 flex items-center gap-3">
        <button onClick={onCancel} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
          <Icon name="X" size={18} className="text-gray-600" />
        </button>
        <h1 className="font-bold text-gray-900">Редактировать объявление</h1>
      </div>

      <div className="px-4 py-5 space-y-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="bg-gray-100 rounded-xl h-12 animate-pulse" />)
        ) : (
          <>
            <div>
              <label className={labelCls}>Название *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Название объявления" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Цена (₽) *</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="2 500 000" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Описание</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Расскажите подробнее о товаре"
                rows={5}
                className={inputCls + ' resize-none'}
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-itoni-blue text-white font-bold py-4 rounded-xl disabled:opacity-60"
            >
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
