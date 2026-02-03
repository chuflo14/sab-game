'use client';


import { useState, useEffect } from 'react';
import { Save, Monitor, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getMachineByShortIdAction } from '@/lib/actions';
import { toast } from 'sonner';

export default function SetupPage() {
    const [inputCode, setInputCode] = useState('');
    const [savedId, setSavedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const current = localStorage.getItem('MACHINE_ID');
        if (current) {
            setSavedId(current);
        }
    }, []);

    const handleSave = async () => {
        if (!inputCode.trim()) return;
        setIsLoading(true);

        try {
            // Try to resolve short code first
            const machine = await getMachineByShortIdAction(inputCode.trim());

            if (machine) {
                // Found by short code, save the REAL UUID
                localStorage.setItem('MACHINE_ID', machine.id);
                setSavedId(machine.id); // Display UUID for debug or just confirm
                toast.success(`Kiosco vinculado: ${machine.name}`);
                setTimeout(() => router.push('/'), 1500);
            } else {
                // Fallback: Check if user entered a raw UUID (legacy support)
                if (inputCode.includes('-') && inputCode.length > 20) {
                    localStorage.setItem('MACHINE_ID', inputCode.trim());
                    setSavedId(inputCode.trim());
                    toast.success('ID vinculado manualmente');
                    setTimeout(() => router.push('/'), 1500);
                } else {
                    toast.error('Código de máquina no válido');
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al verificar código');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
            <div className="bg-white max-w-md w-full rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/30">
                        <Monitor className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight pt-4">Sistema SABGAME</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configuración de Kiosco</p>
                </div>

                <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Código de Máquina / ID</label>
                    <input
                        type="text"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                        placeholder="Ej: K01"
                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-lg font-black text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all uppercase text-center placeholder:text-slate-300"
                    />
                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed text-center">
                        Ingresa el código corto (ej: K01) o el ID completo de la máquina.
                    </p>
                </div>

                {savedId && (
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
                        <Monitor className="w-5 h-5 text-green-600" />
                        <div className="overflow-hidden">
                            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Vinculado Correctamente</p>
                            <p className="text-[10px] font-bold text-green-700 truncate font-mono opacity-60">{savedId}</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-3"
                >
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Guardar Configuración
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
