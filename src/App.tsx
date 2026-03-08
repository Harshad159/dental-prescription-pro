import React, { useState, useEffect } from 'react';
import { db, seedDatabase } from './db/db';
import { useStore } from './store/useStore';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import NewPrescription from './pages/NewPrescription';
import Patients from './pages/Patients';
import Medicines from './pages/Medicines';
import History from './pages/History';
import Settings from './pages/Settings';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const { currentTab } = useStore();
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    seedDatabase().then(() => setIsDbReady(true));
  }, []);

  if (!isDbReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Initializing Dental Pro...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard />;
      case 'new-prescription': return <NewPrescription />;
      case 'patients': return <Patients />;
      case 'medicines': return <Medicines />;
      case 'history': return <History />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {renderContent()}
        </div>
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}
