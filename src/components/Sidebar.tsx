import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Users, 
  Pill, 
  History as HistoryIcon, 
  Settings as SettingsIcon,
  Stethoscope
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar() {
  const { currentTab, setCurrentTab } = useStore();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-prescription', label: 'New Prescription', icon: PlusCircle },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'medicines', label: 'Medicine Library', icon: Pill },
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ] as const;

  return (
    <aside className="w-20 md:w-64 bg-white border-r border-slate-200 flex flex-col h-full transition-all duration-300">
      <div className="p-6 flex items-center gap-3 border-bottom border-slate-100">
        <div className="bg-blue-600 p-2 rounded-xl">
          <Stethoscope className="text-white w-6 h-6" />
        </div>
        <span className="font-bold text-xl hidden md:block tracking-tight text-blue-900">DentalPro</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-blue-50 text-blue-700 shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn(
                "w-6 h-6 transition-colors",
                isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
              )} />
              <span className="font-medium hidden md:block">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 hidden md:block" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 hidden md:block">
        <div className="bg-slate-50 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-slate-700">Offline Ready</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
