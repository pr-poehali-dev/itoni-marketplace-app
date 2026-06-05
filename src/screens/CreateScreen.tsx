import { useState } from 'react';
import { api, CATEGORIES, FUEL_TYPES, TRANSMISSIONS } from '@/lib/api';
import RegionPicker from '@/components/RegionPicker';
import Icon from '@/components/ui/icon';

interface Props {
  onSuccess: (id: number) => void;
  onCancel: () => void;
}

const STEPS = ['Фото', 'Основное', 'Детали', 'Публикация'];

export default function CreateScreen({ onSuccess, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [rejected, setRejected] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const uploadingPhotos = uploadingCount > 0 || replacingIndex !== null;
  const [form, setForm] = useState({
    title: '', description: '', price: '',
    category: 'auto', brand: '', model: '',
    year: '', mileage: '', fuel_type: '', transmission: '',
    city: '', region: ''
  });

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  const MAX_PHOTOS = 10;
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  const MAX_SIZE = 5 * 1024 * 1024;

  // Проверка одного файла + загрузка. Возвращает url или бросает ошибку с понятным текстом.
  async function uploadOne(file: File): Promise<string> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Неподдерживаемый формат (только JPG/PNG)');
    }
    if (file.size > MAX_SIZE) {
      throw new Error('Фото слишком большое (макс. 5 МБ)');
    }
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = ev => resolve(ev.target?.result as string);
      reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
      reader.readAsDataURL(file);
    });
    const res = await api.uploadImage(base64, file.type);
    if (!res?.url) {
      throw new Error(res?.error || 'Сервер не принял фото, попробуйте ещё раз');
    }
    return res.url;
  }

  // Добавление новых фото
  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (!picked.length) return;
    setError('');

    const freeSlots = MAX_PHOTOS - images.length;
    if (freeSlots <= 0) {
      setError('Максимум 10 фото');
      return;
    }
    if (picked.length > freeSlots) {
      setError('Максимум 10 фото');
    }
    const files = picked.slice(0, freeSlots);

    setUploadingCount(c => c + files.length);
    let lastErr = '';
    for (const file of files) {
      try {
        const url = await uploadOne(file);
        setImages(prev => (prev.length < MAX_PHOTOS ? [...prev, url] : prev));
      } catch (err) {
        lastErr = (err as Error).message;
      } finally {
        setUploadingCount(c => c - 1);
      }
    }
    if (lastErr) setError(lastErr);
  }

  // Замена одного фото
  async function handleReplace(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setReplacingIndex(index);
    try {
      const url = await uploadOne(file);
      setImages(prev => prev.map((img, i) => (i === index ? url : img)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setReplacingIndex(null);
    }
  }

  async function handlePublish() {
    if (!form.title || !form.price) { setError('Заполните название и цену'); return; }
    setLoading(true);
    setError('');
    setRejected(false);
    const res = await api.createListing({
      title: form.title,
      description: form.description,
      price: parseInt(form.price),
      category: form.category,
      brand: form.brand || null,
      model: form.model || null,
      year: form.year ? parseInt(form.year) : null,
      mileage: form.mileage ? parseInt(form.mileage) : null,
      fuel_type: form.fuel_type || null,
      transmission: form.transmission || null,
      city: form.city || null,
      region: form.region || null,
      images: images,
    });
    setLoading(false);
    if (res.success) {
      onSuccess(res.id);
    } else {
      setRejected(!!res.moderation);
      setError(res.error || 'Ошибка публикации');
    }
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-itoni-blue transition-colors";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <div className="pb-nav bg-white min-h-screen">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Icon name="X" size={18} className="text-gray-600" />
          </button>
          <div>
            <h1 className="font-bold text-gray-900">Новое объявление</h1>
            <p className="text-xs text-gray-500">{STEPS[step]}</p>
          </div>
        </div>
        {/* Progress */}
        <div className="flex gap-1 mt-3">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= step ? 'bg-itoni-blue' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      <div className="px-4 py-5">

        {/* Step 0: Photos */}
        {step === 0 && (
          <div className="animate-fade-in">
            <h2 className="font-bold text-gray-900 mb-1">Фотографии</h2>
            <p className="text-sm text-gray-500 mb-4">Добавьте до 10 фото. Первое станет главным.</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  {replacingIndex === i && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Icon name="LoaderCircle" size={24} className="text-white animate-spin" />
                    </div>
                  )}
                  <button
                    onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    disabled={uploadingPhotos}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center disabled:opacity-50"
                  >
                    <Icon name="X" size={10} className="text-white" />
                  </button>
                  {/* Заменить это фото */}
                  <label className="absolute bottom-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center cursor-pointer">
                    <Icon name="RefreshCw" size={10} className="text-white" />
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      disabled={uploadingPhotos}
                      onChange={e => handleReplace(i, e)}
                    />
                  </label>
                  {i === 0 && <div className="absolute bottom-1 left-1 bg-itoni-blue text-white text-[9px] px-1.5 py-0.5 rounded-md font-medium">Главное</div>}
                </div>
              ))}
              {Array.from({ length: uploadingCount }).map((_, i) => (
                <div key={`up-${i}`} className="aspect-square rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                  <Icon name="LoaderCircle" size={22} className="text-itoni-blue animate-spin mb-1" />
                  <span className="text-xs text-gray-400">Загрузка...</span>
                </div>
              ))}
              {images.length + uploadingCount < MAX_PHOTOS && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer active:bg-gray-50">
                  <Icon name="Camera" size={24} className="text-gray-300 mb-1" />
                  <span className="text-xs text-gray-400">Добавить</span>
                  <input type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={handleImagePick} />
                </label>
              )}
            </div>
            {images.length > 0 && (
              <p className="text-xs text-gray-400 text-center mb-3">Загружено {images.length} фото на сервер ✓</p>
            )}
            {error && step === 0 && (
              <p className="text-xs text-red-500 text-center mb-3">{error}</p>
            )}
            <button
              onClick={() => setStep(1)}
              disabled={uploadingPhotos}
              className="w-full bg-itoni-blue text-white font-bold py-4 rounded-xl disabled:opacity-60"
            >
              {uploadingPhotos ? 'Загрузка фото...' : 'Далее'}
            </button>
          </div>
        )}

        {/* Step 1: Main info */}
        {step === 1 && (
          <div className="animate-fade-in space-y-4">
            <h2 className="font-bold text-gray-900 mb-1">Основная информация</h2>

            <div>
              <label className={labelCls}>Категория</label>
              <div className="grid grid-cols-5 gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => set('category', c.id)}
                    className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${form.category === c.id ? 'border-itoni-blue bg-blue-50' : 'border-gray-100'}`}
                  >
                    <span className="text-xl">{c.emoji}</span>
                    <span className="text-[9px] font-medium mt-0.5 text-gray-700">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Название объявления *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Например: BMW 3 серии 2020" className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Марка</label>
                <input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="BMW" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Модель</label>
                <input value={form.model} onChange={e => set('model', e.target.value)} placeholder="320i" className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Цена (₽) *</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="2 500 000" className={inputCls} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-4 rounded-xl">
                Назад
              </button>
              <button onClick={() => setStep(2)} className="flex-1 bg-itoni-blue text-white font-bold py-4 rounded-xl">
                Далее
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="animate-fade-in space-y-4">
            <h2 className="font-bold text-gray-900 mb-1">Технические детали</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Год</label>
                <input type="number" value={form.year} onChange={e => set('year', e.target.value)} placeholder="2020" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Пробег (км)</label>
                <input type="number" value={form.mileage} onChange={e => set('mileage', e.target.value)} placeholder="50 000" className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Топливо</label>
              <div className="flex flex-wrap gap-2">
                {FUEL_TYPES.map(f => (
                  <button key={f} onClick={() => set('fuel_type', f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.fuel_type === f ? 'bg-itoni-blue text-white border-itoni-blue' : 'border-gray-200 text-gray-600'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Коробка передач</label>
              <div className="flex flex-wrap gap-2">
                {TRANSMISSIONS.map(t => (
                  <button key={t} onClick={() => set('transmission', t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.transmission === t ? 'bg-itoni-blue text-white border-itoni-blue' : 'border-gray-200 text-gray-600'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Регион и город</label>
              <RegionPicker
                region={form.region}
                city={form.city}
                onChange={(r, c) => setForm(f => ({ ...f, region: r, city: c }))}
                label={false}
              />
            </div>

            <div>
              <label className={labelCls}>Описание</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Расскажите об автомобиле..." rows={4} className={inputCls + ' resize-none'} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-4 rounded-xl">
                Назад
              </button>
              <button onClick={() => setStep(3)} className="flex-1 bg-itoni-blue text-white font-bold py-4 rounded-xl">
                Далее
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Publish */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="font-bold text-gray-900 mb-4">Проверьте объявление</h2>

            {images.length > 0 && (
              <div className="rounded-2xl overflow-hidden mb-4 h-48">
                <img src={images[0]} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 mb-4">
              <p className="font-bold text-lg text-gray-900">{form.title || '—'}</p>
              <p className="text-2xl font-extrabold text-itoni-blue">{form.price ? new Intl.NumberFormat('ru-RU').format(parseInt(form.price)) + ' ₽' : '—'}</p>
              <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                {form.brand && <span className="bg-white px-2 py-1 rounded-lg">{form.brand} {form.model}</span>}
                {form.year && <span className="bg-white px-2 py-1 rounded-lg">{form.year}</span>}
                {form.city && <span className="bg-white px-2 py-1 rounded-lg">{form.city}</span>}
              </div>
              {form.description && <p className="text-sm text-gray-600 line-clamp-2">{form.description}</p>}
            </div>

            {error && (
              rejected ? (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                  <Icon name="ShieldAlert" size={22} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-600 text-sm mb-0.5">Объявление отклонено</p>
                    <p className="text-red-500 text-sm leading-snug">{error}</p>
                  </div>
                </div>
              ) : (
                <p className="text-red-500 text-sm mb-4">{error}</p>
              )
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-4 rounded-xl">
                Назад
              </button>
              <button onClick={handlePublish} disabled={loading || uploadingPhotos} className="flex-1 bg-itoni-orange text-white font-bold py-4 rounded-xl disabled:opacity-60">
                {loading ? 'Публикация...' : uploadingPhotos ? 'Загрузка фото...' : '🚀 Опубликовать'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}