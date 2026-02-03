'use client';

import { useState, useEffect } from 'react';
import { Save, Monitor } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
    const [machineId, setMachineId] = useState('');
    const [savedId, setSavedId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const current = localStorage.getItem('MACHINE_ID');
        if (current) {
            setSavedId(current);
            setMachineId(current);
        }
    }, []);

    const handleSave = () => {
        if (!machineId.trim()) return;
        localStorage.setItem('MACHINE_ID', machineId.trim());
        setSavedId(machineId.trim());
        alert('Identificador de Máquina Guardado: ' + machineId.trim());
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
            <div className="bg-white max-w-md w-full rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/30">
                        <Monitor className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight pt-4">Configurar Kiosco</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Identificación única del dispositivo</p>
                </div>

                <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">ID de la Máquina</label>
                    <input
                        type="text"
                        value={machineId}
                        onChange={(e) => setMachineId(e.target.value)}
                        placeholder="Ej: KIOSK-01"
                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-lg font-black text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all uppercase text-center"
                    />
                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed text-center">
                        Este identificador se usará para el registro de jugadas y la segmentación de publicidad.
                    </p>
                </div>

                {savedId && (
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
                        <Monitor className="w-5 h-5 text-green-600" />
                        <div>
                            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Configuración Actual</p>
                            <p className="text-sm font-bold text-green-700">{savedId}</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleSave}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-3"
                >
                    <Save className="w-4 h-4" />
                    Guardar y Continuar
                </button>
            </div>
        </div>
    );
}
