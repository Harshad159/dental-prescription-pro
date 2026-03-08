import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useStore } from '../store/useStore';
import { 
  Plus, 
  Users, 
  FileText, 
  Pill, 
  ArrowRight,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { setCurrentTab } = useStore();
  
  const stats = {
    patients: useLiveQuery(() => db.patients.count()) ?? 0,
    prescriptions: useLiveQuery(() => db.prescriptions.count()) ?? 0,
    todayPrescriptions: useLiveQuery(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return db.prescriptions.where('date').aboveOrEqual(today).count();
    }) ?? 0,
    medicines: useLiveQuery(() => db.medicines.count()) ?? 0,
  };

  const recentPatients = useLiveQuery(() => 
    db.patients.orderBy('lastVisit').reverse().limit(5).toArray()
  ) ?? [];

  const recentPrescriptions = useLiveQuery(() =>
    db.prescriptions.orderBy('date').reverse().limit(5).toArray()
  ) ?? [];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clinical Dashboard</h1>
          <p className="text-slate-500">Welcome back, Doctor. Here's your practice overview.</p>
        </div>
        <button 
          onClick={() => setCurrentTab('new-prescription')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          New Prescription
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Today's Prescriptions", value: stats.todayPrescriptions, icon: FileText, color: "bg-blue-500" },
          { label: "Total Patients", value: stats.patients, icon: Users, color: "bg-purple-500" },
          { label: "Total Prescriptions", value: stats.prescriptions, icon: Clock, color: "bg-emerald-500" },
          { label: "Medicine Library", value: stats.medicines, icon: Pill, color: "bg-orange-500" },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-inner`}>
              <stat.icon className="text-white w-6 h-6" />
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Patients */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Recent Patients</h2>
            <button onClick={() => setCurrentTab('patients')} className="text-blue-600 font-semibold text-sm flex items-center gap-1 hover:underline">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentPatients.length > 0 ? recentPatients.map((patient) => (
              <div key={patient.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{patient.name}</h4>
                    <p className="text-xs text-slate-500">{patient.phone} • {patient.age}y • {patient.gender}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Last Visit</p>
                  <p className="text-sm font-medium text-slate-700">
                    {patient.lastVisit ? format(patient.lastVisit, 'MMM dd, yyyy') : 'Never'}
                  </p>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-400 italic">No patients recorded yet.</div>
            )}
          </div>
        </section>

        {/* Recent Prescriptions */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Recent Prescriptions</h2>
            <button onClick={() => setCurrentTab('history')} className="text-blue-600 font-semibold text-sm flex items-center gap-1 hover:underline">
              View History <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentPrescriptions.length > 0 ? recentPrescriptions.map((px) => (
              <div key={px.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">{px.patientName}</h4>
                  <p className="text-xs text-slate-500">{px.treatment} • {px.items.length} Medicines</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{format(px.date, 'hh:mm a')}</p>
                  <p className="text-sm font-medium text-slate-700">{format(px.date, 'MMM dd')}</p>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-400 italic">No prescriptions generated today.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
