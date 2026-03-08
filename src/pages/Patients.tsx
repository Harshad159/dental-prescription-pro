import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Patient } from '../db/db';
import { useStore } from '../store/useStore';
import { 
  Search, 
  User, 
  Phone, 
  Calendar, 
  ChevronRight, 
  Plus,
  Trash2,
  Edit2,
  History
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Patients() {
  const { setCurrentTab, setActivePrescriptionId } = useStore();
  const [search, setSearch] = useState('');
  
  const patients = useLiveQuery(() => {
    if (!search) return db.patients.orderBy('name').toArray();
    return db.patients.where('name').startsWithIgnoreCase(search).toArray();
  }, [search]) ?? [];

  const deletePatient = async (id: number) => {
    if (confirm('Are you sure you want to delete this patient and all their history?')) {
      await db.patients.delete(id);
      await db.prescriptions.where('patientId').equals(id).delete();
      toast.success('Patient deleted');
    }
  };

  const startNewPrescription = (p: Patient) => {
    // We can't directly pass patient object, but we can set search or something
    // For now, let's just go to new prescription and let them search
    setCurrentTab('new-prescription');
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Patient Directory</h1>
          <p className="text-slate-500">Manage and view all your patient records.</p>
        </div>
        <button 
          onClick={() => setCurrentTab('new-prescription')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add Patient
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text"
          placeholder="Search patients by name..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Last Visit</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {patients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        {p.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{p.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{p.age}y • {p.gender}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">
                        {p.lastVisit ? format(p.lastVisit, 'MMM dd, yyyy') : 'Never'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startNewPrescription(p)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="New Prescription"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => deletePatient(p.id!)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Patient"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    No patients found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
