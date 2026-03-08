import React from 'react';
import { format } from 'date-fns';
import type { Prescription, Settings } from '../db/db';

interface PrintTemplateProps {
  prescription: Prescription;
  settings: Settings | null;
}

export default function PrintTemplate({ prescription, settings }: PrintTemplateProps) {
  const horizontalOffset = settings?.horizontalOffset || 0;
  const verticalOffset = settings?.verticalOffset || 0;

  return (
    <div 
      className="print-container bg-white p-6 font-serif text-slate-900 box-border flex flex-col"
      style={{ 
        paddingLeft: `${6 + horizontalOffset}mm`, 
        paddingTop: `${6 + verticalOffset}mm`,
        height: '297mm',
        width: '210mm',
        overflow: 'hidden',
        position: 'relative',
        fontSize: '12pt'
      }}
    >
      {/* Clinic Letterhead */}
      <div className="text-center border-b-2 border-blue-600 pb-4 mb-6">
        {/* Logo and Clinic Name Row */}
        <div className="flex items-center justify-center gap-4 mb-2">
          {settings?.logo && (
            <div className="flex-shrink-0 h-16 w-16">
              <img src={settings.logo} alt="Clinic Logo" className="h-full w-full object-contain" />
            </div>
          )}
          <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tight leading-tight">
            {settings?.clinicName || 'Clinic Name'}
          </h1>
        </div>
        
        {/* Prescription Label */}
        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-2">Prescription</p>
        
        {/* Doctor Name */}
        <p className="text-lg font-bold text-slate-800 mb-2 leading-snug break-words">
          {settings?.doctorName || 'Doctor Name'}
        </p>
        
        {/* Address and Phone */}
        <div className="text-[10px] text-slate-500 flex flex-col items-center gap-0.5 uppercase tracking-wide">
          <p>{settings?.address}</p>
          <p className="font-semibold">Phone: {settings?.phone}</p>
        </div>
      </div>

      {/* Patient Info Bar */}
      <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center mb-4 border border-slate-100">
        <div className="flex-1 grid grid-cols-2 gap-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Patient:</span>
            <span className="text-base font-bold text-slate-900">{prescription.patientName}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Date:</span>
            <span className="text-base font-bold text-slate-900">{format(prescription.date, 'dd MMM yyyy')}</span>
          </div>
          <div className="flex items-baseline gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Age:</span>
              <span className="font-bold text-slate-800 text-sm">{prescription.patientAge}y</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sex:</span>
              <span className="font-bold text-slate-800 text-sm">{prescription.patientGender}</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ID:</span>
            <span className="font-bold text-slate-800 text-sm">PX-{prescription.id?.toString().padStart(4, '0')}</span>
          </div>
        </div>
      </div>

      {/* Treatment Section */}
      <div className="mb-4 text-center">
        <h2 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Diagnosis / Treatment</h2>
        <p className="text-xl font-bold text-slate-900">{prescription.treatment}</p>
        {prescription.selectedTeeth && prescription.selectedTeeth.length > 0 && (
          <p className="text-slate-500 text-[10px] italic mt-0.5">
            Teeth: {prescription.selectedTeeth.map(t => `Tooth ${t.number} (${t.treatment})`).join(', ')}
          </p>
        )}
      </div>

      {/* Rx Section */}
      <div className="mb-6 flex-1 flex flex-col">
        <div className="flex items-end gap-4 mb-4">
          <div className="text-5xl font-serif font-bold italic text-slate-800 leading-none">Rx</div>
          <div className="h-px bg-slate-200 flex-1 mb-2"></div>
        </div>
        
        <div className="space-y-6">
          {prescription.items.map((item, idx) => {
            const timingStr = [
              item.timings.morning ? 'Morning' : null,
              item.timings.afternoon ? 'Afternoon' : null,
              item.timings.evening ? 'Evening' : null,
              item.timings.night ? 'Night' : null,
            ].filter(Boolean).join(' — ');

            return (
              <div key={idx} className="border-l-2 border-blue-600/30 pl-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-lg font-bold text-slate-900">{item.type} {item.name}</span>
                  <span className="text-slate-500 text-sm font-medium">{item.dosage}</span>
                </div>
                <div className="flex items-center gap-3 text-base text-slate-700">
                  <span className="font-bold">{timingStr}</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-medium">For {item.duration}</span>
                </div>
                {item.instructions && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-slate-500 text-sm italic">
                    <span className="font-bold not-italic text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">Note:</span>
                    <span>{item.instructions}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4 my-4">
        {/* 3D Tooth Snapshots for Patient Education - Side by Side */}
        {(prescription.upperSnapshot || prescription.lowerSnapshot) && (
          <div className="flex gap-4 justify-center">
            {prescription.upperSnapshot && (
              <div className="flex-1 p-2 bg-slate-50 rounded-xl border border-slate-100 max-w-[40%]">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-white border border-slate-200 shadow-sm mb-1">
                  <img 
                    src={prescription.upperSnapshot} 
                    alt="Upper Jaw" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center">
                  Upper Jaw
                </p>
              </div>
            )}
            {prescription.lowerSnapshot && (
              <div className="flex-1 p-2 bg-slate-50 rounded-xl border border-slate-100 max-w-[40%]">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-white border border-slate-200 shadow-sm mb-1">
                  <img 
                    src={prescription.lowerSnapshot} 
                    alt="Lower Jaw" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center">
                  Lower Jaw
                </p>
              </div>
            )}
          </div>
        )}

        {/* Treatment Notes - Below Images */}
        {prescription.treatmentNotes && (
          <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 mt-2">
            <div className="flex items-center gap-2 mb-2 border-b border-slate-200 pb-1">
              <div className="w-1 h-3 bg-blue-600 rounded-full" />
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clinical Notes & Remarks</h3>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{prescription.treatmentNotes}</p>
          </div>
        )}
      </div>

      {/* Footer / Signature */}
      <div className="mt-auto pt-6 flex justify-between items-end border-t border-slate-100">
        <div className="flex-1">
          <div className="mb-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">General Instructions</h4>
            <div className="space-y-1">
              <div className="flex items-start gap-2 text-xs text-slate-600">
                <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <p>Take medicines exactly as prescribed by the doctor.</p>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-600">
                <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <p>In case of any allergy or discomfort, stop the medicine and contact the clinic immediately.</p>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-600">
                <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <p>Maintain proper oral hygiene and follow post-treatment care as advised.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          {settings?.signature ? (
            <img 
              src={settings.signature} 
              alt="Signature" 
              className="h-12 mx-auto mb-1 object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-12 w-32 border-b border-slate-300 mb-1" />
          )}
          <p className="font-bold text-base">{settings?.doctorName || 'Doctor Signature'}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">{settings?.clinicName}</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          body { 
            -webkit-print-color-adjust: exact; 
            margin: 0;
            padding: 0;
          }
          .print-container { 
            height: 297mm;
            width: 210mm;
            margin: 0;
            padding: 15mm !important; /* Standard print margin */
            page-break-after: always;
          }
        }
      `}} />
    </div>
  );
}
