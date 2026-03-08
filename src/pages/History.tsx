import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Prescription } from '../db/db';
import { useStore } from '../store/useStore';
import { 
  Search, 
  FileText, 
  Printer, 
  Copy, 
  Trash2, 
  Eye,
  Calendar,
  User,
  X,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import { downloadAsImage } from '../utils/download';
import PrintTemplate from '../components/PrintTemplate';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function History() {
  const { setCurrentTab, setActivePrescriptionId } = useStore();
  const [search, setSearch] = useState('');
  const [viewingPx, setViewingPx] = useState<Prescription | null>(null);
  
  const prescriptions = useLiveQuery(() => {
    if (!search) return db.prescriptions.orderBy('date').reverse().toArray();
    return db.prescriptions.where('patientName').startsWithIgnoreCase(search).reverse().sortBy('date');
  }, [search]) ?? [];

  const settings = useLiveQuery(() => db.settings.toCollection().first()) ?? null;
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const duplicatePrescription = (px: Prescription) => {
    setActivePrescriptionId(px.id!);
    setCurrentTab('new-prescription');
    toast.success('Prescription details copied to new form');
  };

  const deletePrescription = async (id: number) => {
    if (confirm('Delete this prescription record?')) {
      await db.prescriptions.delete(id);
      toast.success('Prescription deleted');
    }
  };

  const printExisting = (px: Prescription) => {
    setViewingPx(px);
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const handleDownloadImage = async (px: Prescription) => {
    setViewingPx(px);
    // Wait for modal/hidden ref to be ready
    setTimeout(async () => {
      if (printRef.current) {
        toast.loading('Generating image...', { id: 'downloading' });
        const fileName = `Prescription_${px.patientName}_${format(px.date, 'yyyyMMdd')}`;
        
        // Temporarily make it visible for capture but off-screen
        const container = printRef.current.parentElement;
        if (container) {
          container.style.display = 'block';
          container.style.position = 'absolute';
          container.style.left = '-9999px';
          container.style.top = '0';
        }

        const success = await downloadAsImage(printRef.current, fileName);
        
        if (container) {
          container.style.display = 'none';
        }

        if (success) {
          toast.success('Downloaded successfully', { id: 'downloading' });
        } else {
          toast.error('Failed to download image', { id: 'downloading' });
        }
      }
    }, 200);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Prescription History</h1>
        <p className="text-slate-500">View, reprint, or duplicate past prescriptions.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text"
          placeholder="Search by patient name..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {prescriptions.map(px => (
          <motion.div 
            layout
            key={px.id} 
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                <span className="text-xs font-bold uppercase">{format(px.date, 'MMM')}</span>
                <span className="text-xl font-bold text-slate-900 leading-none">{format(px.date, 'dd')}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{px.patientName}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {px.patientAge}y • {px.patientGender}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {px.treatment}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => setViewingPx(px)}
                className="p-3 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all flex items-center gap-2 text-sm font-bold"
              >
                <Eye className="w-4 h-4" /> View
              </button>
              <button 
                onClick={() => printExisting(px)}
                className="p-3 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all flex items-center gap-2 text-sm font-bold"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button 
                onClick={() => handleDownloadImage(px)}
                className="p-3 bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all flex items-center gap-2 text-sm font-bold"
              >
                <Download className="w-4 h-4" /> Download
              </button>
              <button 
                onClick={() => duplicatePrescription(px)}
                className="p-3 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all flex items-center gap-2 text-sm font-bold"
              >
                <Copy className="w-4 h-4" /> Duplicate
              </button>
              <button 
                onClick={() => deletePrescription(px.id!)}
                className="p-3 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}

        {prescriptions.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium italic">No prescriptions found in history.</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      <AnimatePresence>
        {viewingPx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h2 className="text-xl font-bold text-slate-900">Prescription Preview</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => printExisting(viewingPx)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm shadow-lg shadow-blue-100"
                  >
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  <button 
                    onClick={() => handleDownloadImage(viewingPx)}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm shadow-lg shadow-emerald-100"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button onClick={() => setViewingPx(null)} className="p-2 text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
                <div className="bg-white shadow-lg mx-auto max-w-[210mm] min-h-[297mm]">
                   <PrintTemplate prescription={viewingPx} settings={settings} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Print Area */}
      <div className="hidden">
        <div ref={printRef}>
          {viewingPx && <PrintTemplate prescription={viewingPx} settings={settings} />}
        </div>
      </div>
    </div>
  );
}
