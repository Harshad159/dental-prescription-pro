import React, { useState, useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Rotate3d, Layout } from 'lucide-react';

export type ToothTreatment = 'Extraction' | 'RCT' | 'Implant' | 'Filling' | 'Crown' | 'Scaling';

export interface SelectedTooth {
  number: number;
  treatment: ToothTreatment;
}

export interface ToothChart3DHandle {
  capture: () => string | undefined;
  setView: (view: 'upper' | 'lower') => void;
}

interface ToothChart3DProps {
  selectedTeeth: SelectedTooth[];
  onChange: (teeth: SelectedTooth[]) => void;
}

const TREATMENTS: ToothTreatment[] = ['Extraction', 'RCT', 'Implant', 'Filling', 'Crown', 'Scaling'];

// Tooth component
function ToothModel({ 
  number, 
  position, 
  rotation, 
  isSelected, 
  isActive, 
  onClick,
  treatment 
}: { 
  number: number; 
  position: [number, number, number]; 
  rotation: [number, number, number];
  isSelected: boolean;
  isActive: boolean;
  onClick: () => void;
  treatment?: ToothTreatment;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Simple "tooth" shape: a box with a rounded top
  // In a real app, we'd load a GLTF model here
  const color = isSelected ? '#1e293b' : isActive ? '#64748b' : '#f8fafc';
  const emissive = isSelected ? '#334155' : isActive ? '#94a3b8' : '#ffffff';

  return (
    <group position={position} rotation={rotation}>
      <mesh 
        ref={meshRef} 
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <boxGeometry args={[0.8, 1.2, 0.6]} />
        <meshStandardMaterial 
          color={color} 
          emissive={emissive}
          emissiveIntensity={isActive || isSelected ? 0.2 : 0.05}
          roughness={0.4}
          metalness={0.05}
        />
      </mesh>
      
      {/* FDI Number label */}
      <Text
        position={[0, -0.8, 0.4]}
        fontSize={0.3}
        color={isSelected ? "#0f172a" : "#64748b"}
        anchorX="center"
        anchorY="middle"
      >
        {number}
      </Text>

      {/* Treatment Indicator */}
      {isSelected && (
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#334155" emissive="#334155" />
        </mesh>
      )}
    </group>
  );
}

const ToothChart3D = forwardRef<ToothChart3DHandle, ToothChart3DProps>(({ selectedTeeth, onChange }, ref) => {
  const [activeTooth, setActiveTooth] = useState<number | null>(null);
  const [view, setView] = useState<'upper' | 'lower'>('upper');
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    capture: () => {
      if (glRef.current) {
        return glRef.current.domElement.toDataURL('image/png');
      }
      return undefined;
    },
    setView: (v) => {
      setView(v);
      if (controlsRef.current) {
        controlsRef.current.reset();
      }
    }
  }));

  // Reset controls when view changes manually
  const handleViewChange = (v: 'upper' | 'lower') => {
    setView(v);
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  // Helper component to grab the GL context
  const SceneContent = () => {
    const { gl } = useThree();
    glRef.current = gl;
    return null;
  };

  const getToothStatus = (num: number) => {
// ... rest of the component ...
    return selectedTeeth.find(t => t.number === num);
  };

  const setTreatment = (num: number, treatment: ToothTreatment) => {
    const existing = selectedTeeth.find(t => t.number === num);
    if (existing && existing.treatment === treatment) {
      onChange(selectedTeeth.filter(t => t.number !== num));
    } else {
      const filtered = selectedTeeth.filter(t => t.number !== num);
      onChange([...filtered, { number: num, treatment }]);
    }
    setActiveTooth(null);
  };

  // Generate tooth positions in an arch
  const teethData = useMemo(() => {
    const upper = [];
    const lower = [];
    
    // Upper Arch (18-11, 21-28)
    const upperNums = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
    upperNums.forEach((num, i) => {
      const angle = (i / (upperNums.length - 1)) * Math.PI;
      const radius = 5;
      upper.push({
        num,
        pos: [Math.cos(angle) * radius, 2, Math.sin(angle) * radius] as [number, number, number],
        rot: [0, -angle + Math.PI / 2, 0] as [number, number, number]
      });
    });

    // Lower Arch (48-41, 31-38)
    const lowerNums = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
    lowerNums.forEach((num, i) => {
      const angle = (i / (lowerNums.length - 1)) * Math.PI;
      const radius = 4.5;
      lower.push({
        num,
        pos: [Math.cos(angle) * radius, -2, Math.sin(angle) * radius] as [number, number, number],
        rot: [0, -angle + Math.PI / 2, 0] as [number, number, number]
      });
    });

    return { upper, lower };
  }, []);

  return (
    <div className="space-y-4 bg-white rounded-3xl border border-slate-200 shadow-xl relative">
      {/* 3D Canvas Area */}
      <div className="relative">
        <div className="h-[450px] w-full bg-white rounded-t-3xl overflow-hidden border-b border-slate-100">
          <Canvas 
            shadows 
            dpr={[1, 2]}
            gl={{ preserveDrawingBuffer: true }}
          >
            <color attach="background" args={['#ffffff']} />
            <SceneContent />
            <PerspectiveCamera makeDefault position={[0, 0, 18]} fov={40} />
            <OrbitControls 
              ref={controlsRef}
              enablePan={false} 
              minDistance={10} 
              maxDistance={25} 
              maxPolarAngle={Math.PI}
            />
            
            <ambientLight intensity={0.8} />
            <pointLight position={[10, 10, 10]} intensity={0.5} />
            <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={0.5} />

            <group position={[0, view === 'upper' ? -2 : 2, -2]}>
              {/* Upper Arch */}
              <group visible={view === 'upper'}>
                {teethData.upper.map(t => (
                  <ToothModel 
                    key={t.num}
                    number={t.num}
                    position={t.pos}
                    rotation={t.rot}
                    isSelected={!!getToothStatus(t.num)}
                    isActive={activeTooth === t.num}
                    onClick={() => setActiveTooth(t.num)}
                    treatment={getToothStatus(t.num)?.treatment}
                  />
                ))}
              </group>

              {/* Lower Arch */}
              <group visible={view === 'lower'}>
                {teethData.lower.map(t => (
                  <ToothModel 
                    key={t.num}
                    number={t.num}
                    position={t.pos}
                    rotation={t.rot}
                    isSelected={!!getToothStatus(t.num)}
                    isActive={activeTooth === t.num}
                    onClick={() => setActiveTooth(t.num)}
                    treatment={getToothStatus(t.num)?.treatment}
                  />
                ))}
              </group>
            </group>

            <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
          </Canvas>

          {/* UI Overlay */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
            <div className="pointer-events-auto bg-slate-100/80 backdrop-blur-md p-1 rounded-xl border border-slate-200 flex gap-1">
              <button 
                onClick={() => handleViewChange('upper')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'upper' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Upper Jaw
              </button>
              <button 
                onClick={() => handleViewChange('lower')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'lower' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Lower Jaw
              </button>
            </div>
            
            <div className="text-right">
              <h3 className="text-slate-800 font-bold text-lg">3D FDI Explorer</h3>
              <p className="text-slate-400 text-xs">Ink-Efficient Print Mode</p>
            </div>
          </div>
        </div>

        {/* Treatment Selector Overlay - Moved outside overflow-hidden */}
        <AnimatePresence>
          {activeTooth && (
            <motion.div
              initial={{ opacity: 0, y: 20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 20, x: '-50%' }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl w-[92%] max-w-sm z-30"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">FDI Number</p>
                  <p className="text-xl font-bold text-white">Tooth {activeTooth}</p>
                </div>
                <button 
                  onClick={() => setActiveTooth(null)} 
                  className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {TREATMENTS.map(t => {
                  const isSelected = getToothStatus(activeTooth)?.treatment === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setTreatment(activeTooth, t)}
                      className={`py-2.5 px-3 rounded-xl text-[11px] font-bold transition-all border-2 ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/20' 
                          : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10 hover:text-white'
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
      </div>

      {/* Selected Summary (Light Theme) */}
      {selectedTeeth.length > 0 && (
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2">
          {selectedTeeth.map(t => (
            <div key={t.number} className="bg-white text-slate-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-3 shadow-sm">
              <span>Tooth {t.number}: {t.treatment}</span>
              <button 
                onClick={() => onChange(selectedTeeth.filter(st => st.number !== t.number))}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default ToothChart3D;
