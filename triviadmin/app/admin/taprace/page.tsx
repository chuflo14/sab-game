'use client';

import { useState, useEffect } from 'react';
import { Save, Timer, Gauge } from 'lucide-react';
import { fetchChangoConfig, updateChangoConfigAction } from '@/lib/actions';
import { toast } from 'sonner';

export default function TapRaceAdminPage() {
    const [duration, setDuration] = useState(30);
    const [difficulty, setDifficulty] = useState(100);
    const [botSpeed, setBotSpeed] = useState(5);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadConfig = async () => {
            const data = await fetchChangoConfig();
            if (data) {
                setDuration(data.taprace_duration || 30);
                setDifficulty(data.taprace_difficulty || 100);
                setBotSpeed(data.taprace_bot_speed || 5);
            }
        };
        loadConfig();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateChangoConfigAction({
                taprace_duration: duration,
                taprace_difficulty: difficulty,
                taprace_bot_speed: botSpeed
            });
            toast.success('Configuración guardada');
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                    <Gauge className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Carrera</h1>
                    <p className="text-slate-400 font-medium">Configuración del juego de velocidad</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Duration */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tiempo Límite (Seg)</label>
                        <span className="text-2xl font-black text-orange-600">{duration}s</span>
                    </div>
                    <input
                        type="range"
                        min="10"
                        max="120"
                        step="5"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-600"
                    />
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Timer className="w-3 h-3" />
                        <span>Tiempo que tienen para terminar la carrera.</span>
                    </div>
                </div>

                {/* Difficulty */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Distancia (Clicks)</label>
                        <span className="text-2xl font-black text-red-600">{difficulty}</span>
                    </div>
                    <input
                        type="range"
                        min="20"
                        max="500"
                        step="10"
                        value={difficulty}
                        onChange={(e) => setDifficulty(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-600"
                    />
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Gauge className="w-3 h-3" />
                        <span>Cantidad de clicks para ganar. Mayor número = más difícil.</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-8">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-900/20 active:scale-95 flex items-center gap-3 disabled:opacity-50"
                >
                    {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Guardar Cambios
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
