import { useEffect, useState } from 'react';
import { adminApi, AdminBrand, AdminCategory } from '@/lib/adminApi';

export default function AdminBrands() {
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.categories().then(res => {
      const list: AdminCategory[] = res.categories || [];
      setCats(list);
      if (list.length) setCategoryId(list[0].id);
    });
  }, []);

  async function loadBrands(cid: number) {
    setLoading(true);
    const res = await adminApi.brands(cid);
    setBrands(res.brands || []);
    setLoading(false);
  }

  useEffect(() => {
    if (categoryId !== null) loadBrands(categoryId);
  }, [categoryId]);

  async function add() {
    if (!newName.trim() || categoryId === null) return;
    setError('');
    const res = await adminApi.addBrand(categoryId, newName.trim());
    if (res.success) {
      setNewName('');
      loadBrands(categoryId);
    } else {
      setError(res.error || 'Ошибка');
    }
  }

  async function remove(id: number) {
    const res = await adminApi.deleteBrand(id);
    if (res.success) {
      if (categoryId !== null) loadBrands(categoryId);
    } else {
      setError(res.error || 'Нельзя удалить');
    }
  }

  return (
    <div className="space-y-3">
      <select value={categoryId ?? ''} onChange={e => setCategoryId(Number(e.target.value))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white">
        {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
      </select>

      <div className="flex gap-2">
        <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Название марки" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
        <button onClick={add} className="bg-itoni-blue text-white font-bold px-4 rounded-xl text-sm">Добавить</button>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}

      {loading ? (
        <p className="text-center text-gray-400 py-8 text-sm">Загрузка...</p>
      ) : brands.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">Марок нет</p>
      ) : (
        brands.map(b => (
          <div key={b.id} className="bg-white rounded-xl p-3 card-shadow flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">{b.name}</p>
            <button onClick={() => remove(b.id)} className="text-xs font-medium text-red-500 bg-red-50 px-3 py-1.5 rounded-lg">Удалить</button>
          </div>
        ))
      )}
    </div>
  );
}
