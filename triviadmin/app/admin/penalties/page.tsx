'use client';

import { useState, useEffect } from 'react';
import { Save, Trophy, Music } from 'lucide-react';
import { fetchChangoConfig, updateChangoConfigAction } from '@/lib/actions';
import { ChangoConfig } from '@/lib/types';
import { toast } from 'sonner';

export default function PenaltiesAdminPage() {
    const [difficulty, setDifficulty] = useState(5); // 1-10
    const [maxShots, setMaxShots] = useState(5);
    const [isSaving, setIsSaving] = useState(false);
    const [config, setConfig] = useState<ChangoConfig | null>(null);

    useEffect(() => {
        const loadConfig = async () => {
            const data = await fetchChangoConfig();
            if (data) {
                setConfig(data);
                setDifficulty(data.penalties_difficulty || 5);
                setMaxShots(data.penalties_max_shots || 5);
            }
        };
        loadConfig();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateChangoConfigAction({
                penalties_difficulty: difficulty,
                penalties_max_shots: maxShots
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
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-green-600/20">
                    <Trophy className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Penales</h1>
                    <p className="text-slate-400 font-medium">Configuración del juego de fútbol</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Difficulty */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Dificultad (Velocidad)</label>
                        <span className="text-2xl font-black text-green-600">{difficulty}</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={difficulty}
                        onChange={(e) => setDifficulty(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-green-600"
                    />
                    <p className="text-xs text-slate-400">
                        Aumenta la velocidad del cursor y reduce el tamaño del arco.
                    </p>
                </div>

                {/* Max Shots */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Intentos por Juego</label>
                        <span className="text-2xl font-black text-emerald-600">{maxShots}</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={maxShots}
                        onChange={(e) => setMaxShots(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <p className="text-xs text-slate-400">
                        Cantidad de tiros que tiene el jugador para ganar premios.
                    </p>
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
