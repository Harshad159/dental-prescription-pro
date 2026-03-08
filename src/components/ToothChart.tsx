import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';

export type ToothTreatment = 'Extraction' | 'RCT' | 'Implant' | 'Filling' | 'Crown' | 'Scaling';

export interface SelectedTooth {
  number: number;
  treatment: ToothTreatment;
}

interface ToothChartProps {
  selectedTeeth: SelectedTooth[];
  onChange: (teeth: SelectedTooth[]) => void;
}

const TREATMENTS: ToothTreatment[] = ['Extraction', 'RCT', 'Implant', 'Filling', 'Crown', 'Scaling'];

const QUADRANTS = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
  upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
  lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38],
};

export default function ToothChart({ selectedTeeth, onChange }: ToothChartProps) {
  const [activeTooth, setActiveTooth] = useState<number | null>(null);

  const handleToothClick = (num: number) => {
    setActiveTooth(num === activeTooth ? null : num);
  };

  const setTreatment = (num: number, treatment: ToothTreatment) => {
    const existing = selectedTeeth.find(t => t.number === num);
    if (existing && existing.treatment === treatment) {
      // Remove if same treatment selected again
      onChange(selectedTeeth.filter(t => t.number !== num));
    } else {
      // Update or add
      const filtered = selectedTeeth.filter(t => t.number !== num);
      onChange([...filtered, { number: num, treatment }]);
    }
    setActiveTooth(null);
  };

  const getToothStatus = (num: number) => {
    return selectedTeeth.find(t => t.number === num);
  };

  const renderQuadrant = (numbers: number[]) => (
    <div className="flex flex-wrap gap-1 justify-center">
      {numbers.map(num => {
        const status = getToothStatus(num);
        const isActive = activeTooth === num;
        
        return (
          <div key={num} className="relative">
            <button
              type="button"
              onClick={() => handleToothClick(num)}
              className={`
                w-10 h-12 md:w-12 md:h-14 rounded-lg flex flex-col items-center justify-center transition-all border-2
                ${status 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                  : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-600'}
                ${isActive ? 'ring-4 ring-blue-100 scale-110 z-10' : ''}
              `}
            >
              <span className="text-[10px] font-bold uppercase opacity-60 mb-1">FDI</span>
              <span className="text-sm font-bold">{num}</span>
              {status && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                  <Check className="w-2 h-2 text-white" />
                </div>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Interactive Tooth Chart (FDI)</h3>
        <button 
          type="button"
          onClick={() => onChange([])}
          className="text-xs font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        {/* Upper Row */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase text-center">Upper Right</p>
          {renderQuadrant(QUADRANTS.upperRight)}
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase text-center">Upper Left</p>
          {renderQuadrant(QUADRANTS.upperLeft)}
        </div>

        {/* Divider */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-slate-200 -translate-y-1/2" />
        <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px bg-slate-200 -translate-x-1/2" />

        {/* Lower Row */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase text-center">Lower Right</p>
          {renderQuadrant(QUADRANTS.lowerRight)}
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase text-center">Lower Left</p>
          {renderQuadrant(QUADRANTS.lowerLeft)}
        </div>
      </div>

      {/* Treatment Selector Modal/Popover */}
      <AnimatePresence>
        {activeTooth && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-white p-4 rounded-2xl shadow-xl border border-blue-100 mt-4"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-slate-900">Select Treatment for Tooth {activeTooth}</p>
              <button onClick={() => setActiveTooth(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TREATMENTS.map(t => {
                const isSelected = getToothStatus(activeTooth)?.treatment === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTreatment(activeTooth, t)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border-2 ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'bg-slate-50 border-slate-50 text-slate-600 hover:border-blue-200'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Summary */}
      {selectedTeeth.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
          {selectedTeeth.map(t => (
            <div key={t.number} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
              <span>Tooth {t.number}: {t.treatment}</span>
              <button onClick={() => onChange(selectedTeeth.filter(st => st.number !== t.number))}>
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
