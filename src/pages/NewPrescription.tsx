import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PrescriptionItem, type Medicine, type Patient } from '../db/db';
import { useStore } from '../store/useStore';
import { 
  User, 
  Stethoscope, 
  Pill, 
  Clock, 
  Printer, 
  Trash2, 
  Plus, 
  Search,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Download,
  Rotate3d,
  Layout
} from 'lucide-react';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import { downloadAsImage } from '../utils/download';
import PrintTemplate from '../components/PrintTemplate';
import { motion, AnimatePresence } from 'motion/react';
import ToothChart, { type SelectedTooth } from '../components/ToothChart';
import ToothChart3D, { type ToothChart3DHandle } from '../components/ToothChart3D';
import toast from 'react-hot-toast';

const TREATMENTS = [
  'Tooth Extraction',
  'Root Canal Treatment',
  'Implant',
  'Filling',
  'Cleaning',
  'Consultation',
  'Scaling & Polishing',
  'Orthodontic Checkup',
  'Denture Fitting',
  'Crown & Bridge',
];

const DURATIONS = ['1 day', '3 days', '5 days', '7 days', '10 days', '14 days', '1 month'];

export default function NewPrescription() {
  const { setCurrentTab, activePrescriptionId, setActivePrescriptionId } = useStore();
  const [step, setStep] = useState(1);
  
  // Form State
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'Male',
    weight: '',
  });
  
  const [treatment, setTreatment] = useState('Consultation');
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [selectedTeeth, setSelectedTeeth] = useState<SelectedTooth[]>([]);
  const [tempUpperSnapshot, setTempUpperSnapshot] = useState<string | undefined>(undefined);
  const [tempLowerSnapshot, setTempLowerSnapshot] = useState<string | undefined>(undefined);
  const [chartMode, setChartMode] = useState<'2d' | '3d'>('2d');
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  
  // UI State
  const [medicineSearch, setMedicineSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [savedPrescription, setSavedPrescription] = useState<any>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const chart3DRef = useRef<ToothChart3DHandle>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    onAfterPrint: () => setIsPrinting(false),
  });

  // Queries
  const medicines = useLiveQuery(() => 
    db.medicines.where('name').startsWithIgnoreCase(medicineSearch).limit(10).toArray()
  , [medicineSearch]) ?? [];

  const foundPatients = useLiveQuery(() =>
    db.patients.where('name').startsWithIgnoreCase(patientSearch).limit(5).toArray()
  , [patientSearch]) ?? [];

  const settings = useLiveQuery(() => db.settings.toCollection().first()) ?? null;

  // Load existing prescription if duplicating/viewing
  useEffect(() => {
    if (activePrescriptionId) {
      db.prescriptions.get(activePrescriptionId).then(px => {
        if (px) {
          setPatientInfo({
            name: px.patientName,
            phone: px.patientPhone,
            age: px.patientAge,
            gender: px.patientGender,
            weight: '',
          });
          setTreatment(px.treatment);
          setTreatmentNotes(px.treatmentNotes);
          setItems(px.items);
          setStep(1);
        }
      });
    }
  }, [activePrescriptionId]);

  const addMedicine = (med: Medicine) => {
    const newItem: PrescriptionItem = {
      medicineId: med.id!,
      name: med.name,
      dosage: med.dosage,
      type: med.type,
      timings: { morning: true, afternoon: false, evening: false, night: true },
      duration: '5 days',
      instructions: med.defaultInstructions || '',
    };
    setItems([...items, newItem]);
    setMedicineSearch('');
    toast.success(`${med.name} added`);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, updates: Partial<PrescriptionItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    setItems(newItems);
  };

  const selectPatient = (p: Patient) => {
    setPatientInfo({
      name: p.name,
      phone: p.phone,
      age: p.age,
      gender: p.gender,
      weight: p.weight || '',
    });
    setPatientSearch('');
    setShowPatientResults(false);
    toast.success(`Patient ${p.name} selected`);
  };

  const handleToothChange = (teeth: SelectedTooth[]) => {
    setSelectedTeeth(teeth);
    
    // Auto-generate notes based on teeth selection
    if (teeth.length > 0) {
      const toothNotes = teeth.map(t => `Tooth ${t.number} (${t.treatment})`).join(', ');
      // Only append if not already there or if notes are empty
      if (!treatmentNotes || treatmentNotes.startsWith('Teeth:')) {
        setTreatmentNotes(`Teeth: ${toothNotes}`);
      }
    } else if (treatmentNotes.startsWith('Teeth:')) {
      setTreatmentNotes('');
    }
  };

  const handleDownloadImage = async () => {
    if (printRef.current && savedPrescription) {
      toast.loading('Generating image...', { id: 'downloading' });
      const fileName = `Prescription_${savedPrescription.patientName}_${format(savedPrescription.date, 'yyyyMMdd')}`;
      
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
  };

  const savePrescription = async () => {
    if (!patientInfo.name || !patientInfo.phone) {
      toast.error("Patient name and phone are required");
      return;
    }

    try {
      // 1. Capture 3D Snapshots
      let upperSnapshot = tempUpperSnapshot;
      let lowerSnapshot = tempLowerSnapshot;

      if (chartMode === '3d' && chart3DRef.current) {
        // Capture Upper
        chart3DRef.current.setView('upper');
        await new Promise(resolve => setTimeout(resolve, 100));
        const upper = chart3DRef.current.capture();
        if (upper) upperSnapshot = upper;

        // Capture Lower
        chart3DRef.current.setView('lower');
        await new Promise(resolve => setTimeout(resolve, 100));
        const lower = chart3DRef.current.capture();
        if (lower) lowerSnapshot = lower;
      }

      // 2. Save/Update Patient
      let patientId: number;
      const existingPatient = await db.patients.where('phone').equals(patientInfo.phone).first();
      
      if (existingPatient) {
        patientId = existingPatient.id!;
        await db.patients.update(patientId, {
          name: patientInfo.name,
          age: patientInfo.age,
          gender: patientInfo.gender,
          weight: patientInfo.weight,
          lastVisit: new Date(),
        });
      } else {
        patientId = await db.patients.add({
          ...patientInfo,
          createdAt: new Date(),
          lastVisit: new Date(),
        });
      }

      // 2. Save Prescription
      const pxData = {
        patientId,
        patientName: patientInfo.name,
        patientAge: patientInfo.age,
        patientGender: patientInfo.gender,
        patientPhone: patientInfo.phone,
        treatment,
        treatmentNotes,
        selectedTeeth,
        upperSnapshot,
        lowerSnapshot,
        items,
        date: new Date(),
        doctorName: settings?.doctorName || 'Doctor',
        clinicName: settings?.clinicName || 'Clinic',
      };

      const id = await db.prescriptions.add(pxData);
      setSavedPrescription({ ...pxData, id });
      setStep(4); // Success/Print step
      setActivePrescriptionId(null);
      toast.success("Prescription saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save prescription");
    }
  };

  const resetForm = () => {
    setPatientInfo({ name: '', phone: '', age: '', gender: 'Male', weight: '' });
    setTreatment('Consultation');
    setTreatmentNotes('');
    setItems([]);
    setStep(1);
    setSavedPrescription(null);
    setActivePrescriptionId(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8 flex items-center justify-between px-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              step >= s ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-200 text-slate-500'
            }`}>
              {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
            </div>
            {s < 3 && (
              <div className={`h-1 flex-1 mx-4 rounded-full transition-all ${
                step > s ? 'bg-blue-600' : 'bg-slate-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <User className="text-blue-600 w-6 h-6" />
              <h2 className="text-2xl font-bold text-slate-900">Patient Information</h2>
            </div>

            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Search Existing Patient</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text"
                  placeholder="Start typing name..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all"
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setShowPatientResults(true);
                  }}
                  onFocus={() => setShowPatientResults(true)}
                />
              </div>
              {showPatientResults && foundPatients.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden">
                  {foundPatients.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => selectPatient(p)}
                      className="w-full text-left p-4 hover:bg-blue-50 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.phone}</p>
                      </div>
                      <ChevronRight className="text-slate-300 w-5 h-5" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                    value={patientInfo.name}
                    onChange={e => setPatientInfo({...patientInfo, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number *</label>
                  <input 
                    type="tel"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                    value={patientInfo.phone}
                    onChange={e => setPatientInfo({...patientInfo, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Age</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                    value={patientInfo.age}
                    onChange={e => setPatientInfo({...patientInfo, age: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                    value={patientInfo.gender}
                    onChange={e => setPatientInfo({...patientInfo, gender: e.target.value})}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Weight (kg)</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                    value={patientInfo.weight}
                    onChange={e => setPatientInfo({...patientInfo, weight: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button 
                onClick={() => setStep(2)}
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all"
              >
                Next Step <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8"
          >
            <div className="flex items-center gap-3">
              <Stethoscope className="text-blue-600 w-6 h-6" />
              <h2 className="text-2xl font-bold text-slate-900">Treatment Details</h2>
            </div>

            <div className="space-y-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-slate-900">Tooth Selection</h3>
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                  <button 
                    onClick={() => setChartMode('2d')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${chartMode === '2d' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Layout className="w-4 h-4" /> 2D Chart
                  </button>
                  <button 
                    onClick={() => setChartMode('3d')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${chartMode === '3d' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Rotate3d className="w-4 h-4" /> 3D Prototype
                  </button>
                </div>
              </div>

              {chartMode === '2d' ? (
                <ToothChart selectedTeeth={selectedTeeth} onChange={handleToothChange} />
              ) : (
                <div className="animate-in fade-in zoom-in duration-500">
                  <ToothChart3D 
                    ref={chart3DRef}
                    selectedTeeth={selectedTeeth} 
                    onChange={handleToothChange} 
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Select Primary Treatment</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {TREATMENTS.map(t => (
                    <button 
                      key={t}
                      onClick={() => setTreatment(t)}
                      className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all ${
                        treatment === t 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                          : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Treatment Notes / Diagnosis</label>
                <textarea 
                  rows={4}
                  placeholder="Add details about the condition..."
                  className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
                  value={treatmentNotes}
                  onChange={e => setTreatmentNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-6 flex justify-between gap-4">
              <button 
                onClick={() => setStep(1)}
                className="text-slate-500 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={savePrescription}
                  className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 transition-all"
                >
                  Save & Preview <ChevronRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={async () => {
                    if (chartMode === '3d' && chart3DRef.current) {
                      // Capture both before moving
                      chart3DRef.current.setView('upper');
                      await new Promise(r => setTimeout(r, 100));
                      setTempUpperSnapshot(chart3DRef.current.capture());
                      
                      chart3DRef.current.setView('lower');
                      await new Promise(r => setTimeout(r, 100));
                      setTempLowerSnapshot(chart3DRef.current.capture());
                    }
                    setStep(3);
                  }}
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all"
                >
                  Medicines <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <Pill className="text-blue-600 w-6 h-6" />
                <h2 className="text-2xl font-bold text-slate-900">Medicine Selection</h2>
              </div>

              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="text"
                    placeholder="Search medicines (e.g. Amoxicillin)..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
                    value={medicineSearch}
                    onChange={e => setMedicineSearch(e.target.value)}
                  />
                </div>
                {medicineSearch && medicines.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden">
                    {medicines.map(m => (
                      <button 
                        key={m.id}
                        onClick={() => addMedicine(m)}
                        className="w-full text-left p-4 hover:bg-blue-50 flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{m.name}</p>
                          <p className="text-xs text-slate-500">{m.type} • {m.dosage}</p>
                        </div>
                        <Plus className="text-blue-600 w-5 h-5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Access Medicines */}
              {!medicineSearch && (
                <div className="flex flex-wrap gap-2">
                  {medicines.slice(0, 8).map(m => (
                    <button 
                      key={m.id}
                      onClick={() => addMedicine(m)}
                      className="px-4 py-2 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 rounded-full text-sm font-semibold text-slate-600 transition-all"
                    >
                      + {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Medicines List */}
            <div className="space-y-4">
              {items.map((item, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                          <Pill className="text-blue-600 w-5 h-5" />
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-bold text-slate-900">{item.name}</h4>
                            <p className="text-xs text-slate-500">{item.type}</p>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dosage</label>
                            <input 
                              type="text"
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                              value={item.dosage}
                              onChange={e => updateItem(idx, { dosage: e.target.value })}
                              placeholder="e.g. 500mg"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 p-2">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dosage Timings</label>
                      <div className="flex gap-2">
                        {(['morning', 'afternoon', 'evening', 'night'] as const).map(t => (
                          <button 
                            key={t}
                            onClick={() => updateItem(idx, { timings: { ...item.timings, [t]: !item.timings[t] } })}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold capitalize transition-all ${
                              item.timings[t] 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-slate-50 text-slate-400'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Duration</label>
                      <div className="flex flex-wrap gap-2">
                        {DURATIONS.map(d => (
                          <button 
                            key={d}
                            onClick={() => updateItem(idx, { duration: d })}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                              item.duration === d 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Specific Instructions</label>
                    <input 
                      type="text"
                      placeholder="e.g. After food, avoid cold water..."
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                      value={item.instructions}
                      onChange={e => updateItem(idx, { instructions: e.target.value })}
                    />
                  </div>
                </motion.div>
              ))}

              {items.length === 0 && (
                <div className="bg-slate-100 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                  <Pill className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No medicines added yet.</p>
                  <p className="text-sm text-slate-400">Search and select medicines from above.</p>
                </div>
              )}
            </div>

            <div className="pt-6 flex justify-between">
              <button 
                onClick={() => setStep(2)}
                className="text-slate-500 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
              <button 
                onClick={savePrescription}
                disabled={items.length === 0}
                className="bg-emerald-600 disabled:opacity-50 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 transition-all"
              >
                Save & Preview <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && savedPrescription && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center space-y-8"
          >
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Prescription Ready!</h2>
              <p className="text-slate-500 mt-2">The prescription for {savedPrescription.patientName} has been saved.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => {
                  setIsPrinting(true);
                  setTimeout(handlePrint, 100);
                }}
                className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all"
              >
                <Printer className="w-5 h-5" /> Print Prescription
              </button>
              <button 
                onClick={handleDownloadImage}
                className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 transition-all"
              >
                <Download className="w-5 h-5" /> Download Image
              </button>
              <button 
                onClick={resetForm}
                className="w-full sm:w-auto bg-slate-100 text-slate-700 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 active:scale-95 transition-all"
              >
                Create Another
              </button>
            </div>

            <div className="pt-8 border-t border-slate-50">
              <button 
                onClick={() => setCurrentTab('dashboard')}
                className="text-blue-600 font-bold hover:underline"
              >
                Return to Dashboard
              </button>
            </div>

            {/* Hidden Print Template - Off-screen for capture */}
            <div className="fixed -left-[9999px] top-0">
              <div ref={printRef}>
                <PrintTemplate prescription={savedPrescription} settings={settings} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
