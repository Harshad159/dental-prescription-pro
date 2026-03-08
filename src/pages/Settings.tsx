import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Settings } from '../db/db';
import { 
  User, 
  Building, 
  Phone, 
  MapPin, 
  Printer, 
  Save, 
  Upload,
  Trash2,
  MoveHorizontal,
  MoveVertical,
  Image
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const settings = useLiveQuery(() => db.settings.toCollection().first()) ?? null;
  const [formData, setFormData] = useState<Settings>({
    doctorName: '',
    clinicName: '',
    phone: '',
    address: '',
    signature: '',
    logo: '',
    horizontalOffset: 0,
    verticalOffset: 0
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (settings?.id) {
        await db.settings.update(settings.id, formData);
      } else {
        await db.settings.add(formData);
      }
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, signature: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Clinic Settings</h1>
        <p className="text-slate-500">Configure your professional profile and printing preferences.</p>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Section */}
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Building className="text-blue-600 w-6 h-6" />
            <h2 className="text-xl font-bold text-slate-900">Professional Profile</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Doctor Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                  value={formData.doctorName}
                  onChange={e => setFormData({...formData, doctorName: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Clinic Name</label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                  value={formData.clinicName}
                  onChange={e => setFormData({...formData, clinicName: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="tel"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Clinic Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Print Configuration */}
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Printer className="text-blue-600 w-6 h-6" />
            <h2 className="text-xl font-bold text-slate-900">Print Alignment</h2>
          </div>
          <p className="text-sm text-slate-500 bg-blue-50 p-4 rounded-2xl border border-blue-100">
            Adjust these offsets if you are printing on a pre-printed letterhead/pad to align the content perfectly.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">Horizontal Offset (mm)</label>
              <div className="flex items-center gap-4">
                <MoveHorizontal className="text-slate-400 w-5 h-5" />
                <input 
                  type="range" 
                  min="-50" max="50" 
                  className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  value={formData.horizontalOffset}
                  onChange={e => setFormData({...formData, horizontalOffset: parseInt(e.target.value)})}
                />
                <span className="w-12 text-center font-bold text-blue-600">{formData.horizontalOffset}</span>
              </div>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">Vertical Offset (mm)</label>
              <div className="flex items-center gap-4">
                <MoveVertical className="text-slate-400 w-5 h-5" />
                <input 
                  type="range" 
                  min="-50" max="100" 
                  className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  value={formData.verticalOffset}
                  onChange={e => setFormData({...formData, verticalOffset: parseInt(e.target.value)})}
                />
                <span className="w-12 text-center font-bold text-blue-600">{formData.verticalOffset}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Logo Section */}
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Image className="text-blue-600 w-6 h-6" />
            <h2 className="text-xl font-bold text-slate-900">Clinic Logo</h2>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-40 h-40 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center bg-slate-50 overflow-hidden relative group">
              {formData.logo ? (
                <>
                  <img src={formData.logo} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, logo: ''})}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="text-center p-4">
                  <Image className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">Upload clinic logo</p>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <p className="text-sm text-slate-500">
                Your clinic logo will appear at the top left of every prescription. For best results, use a PNG image with a transparent background.
              </p>
              <input 
                type="file" 
                accept="image/*" 
                id="logo-upload" 
                className="hidden" 
                onChange={handleLogoUpload}
              />
              <label 
                htmlFor="logo-upload"
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold cursor-pointer transition-all"
              >
                <Upload className="w-5 h-5" /> Choose File
              </label>
            </div>
          </div>
        </section>

        {/* Signature Section */}
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Upload className="text-blue-600 w-6 h-6" />
            <h2 className="text-xl font-bold text-slate-900">Digital Signature</h2>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-64 h-40 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center bg-slate-50 overflow-hidden relative group">
              {formData.signature ? (
                <>
                  <img src={formData.signature} alt="Signature" className="max-h-full object-contain" />
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, signature: ''})}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="text-center p-4">
                  <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">Upload signature image (PNG/JPG)</p>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <p className="text-sm text-slate-500">
                Your signature will appear at the bottom of every prescription. For best results, use a transparent PNG or a white background image.
              </p>
              <input 
                type="file" 
                accept="image/*" 
                id="sig-upload" 
                className="hidden" 
                onChange={handleSignatureUpload}
              />
              <label 
                htmlFor="sig-upload"
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold cursor-pointer transition-all"
              >
                <Upload className="w-5 h-5" /> Choose File
              </label>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button 
            type="submit"
            className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all"
          >
            <Save className="w-5 h-5" /> Save All Settings
          </button>
        </div>
      </form>
    </div>
  );
}
