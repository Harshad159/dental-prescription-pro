import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Medicine } from '../db/db';
import { 
  Plus, 
  Search, 
  Pill, 
  Trash2, 
  Edit2, 
  X, 
  Check,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function Medicines() {
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [formData, setFormData] = useState<Omit<Medicine, 'id'>>({
    name: '',
    dosage: '',
    type: 'Tablet',
    defaultInstructions: ''
  });

  const medicines = useLiveQuery(() => {
    if (!search) return db.medicines.orderBy('name').toArray();
    return db.medicines.where('name').startsWithIgnoreCase(search).toArray();
  }, [search]) ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      if (editingId) {
        await db.medicines.update(editingId, formData);
        toast.success('Medicine updated');
      } else {
        await db.medicines.add(formData);
        toast.success('Medicine added to library');
      }
      resetForm();
    } catch (err) {
      toast.error('Failed to save medicine');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', dosage: '', type: 'Tablet', defaultInstructions: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (m: Medicine) => {
    setFormData({ 
      name: m.name, 
      dosage: m.dosage, 
      type: m.type, 
      defaultInstructions: m.defaultInstructions || '' 
    });
    setEditingId(m.id!);
    setIsAdding(true);
  };

  const deleteMedicine = async (id: number) => {
    if (confirm('Delete this medicine?')) {
      await db.medicines.delete(id);
      toast.success('Medicine removed');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Medicine Library</h1>
          <p className="text-slate-500">Manage your clinical medicine database for quick selection.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-100 rounded-xl p-1 flex shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}
            >
              <ListIcon className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add Medicine
          </button>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text"
          placeholder="Search medicines by name..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-8 rounded-3xl border-2 border-blue-100 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Medicine' : 'Add New Medicine'}</h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Medicine Name</label>
                <input 
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Default Dosage (e.g. 500mg)</label>
                <input 
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                  value={formData.dosage}
                  onChange={e => setFormData({...formData, dosage: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as any})}
                >
                  <option>Tablet</option>
                  <option>Capsule</option>
                  <option>Syrup</option>
                  <option>Injection</option>
                  <option>Drops</option>
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all"
                >
                  <Check className="w-5 h-5" /> {editingId ? 'Update' : 'Save Medicine'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {medicines.map(m => (
            <motion.div 
              layout
              key={m.id} 
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Pill className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(m)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteMedicine(m.id!)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{m.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{m.type} • {m.dosage || 'No dosage specified'}</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Default Dosage</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {medicines.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-900">{m.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{m.type}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{m.dosage || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(m)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => deleteMedicine(m.id!)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {medicines.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <Pill className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium italic">No medicines found in your library.</p>
        </div>
      )}
    </div>
  );
}
