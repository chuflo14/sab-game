'use client';

import { useState, useEffect } from 'react';
import { fetchChangoConfig, updateChangoConfigAction } from '@/lib/actions';
import { ChangoConfig } from '@/lib/types';
import {
    Settings,
    Zap,
    Save,
    Flame,
    Timer,
    Sparkles,
    CheckCircle2,
    Settings2
} from 'lucide-react';

export default function ChangoAdminPage() {
    const [config, setConfig] = useState<ChangoConfig | null>(null);
    const [difficulty, setDifficulty] = useState(5);
    const [timeLimit, setTimeLimit] = useState(10);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        const data = await fetchChangoConfig();
        setConfig(data);
        setDifficulty(data.difficulty);
        setTimeLimit(data.timeLimit || 10);
    };

    const handleSave = async () => {
        setIsSaving(true);
        await updateChangoConfigAction({ difficulty, timeLimit });
        setIsSaving(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        loadConfig();
    };

    if (!config) return (
        <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando...</p>
        </div>
    );

    return (
        <div className="space-y-10 pb-20 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 gap-6 md:gap-0">
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-500 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                        <Flame className="text-white w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Dedo de Chango</h3>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configuración técnica de dificultad</p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`w-full md:w-auto px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 ${showSuccess ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-black text-white shadow-black/20 hover:bg-slate-800'}`}
                >
                    {isSaving ? <Settings className="w-4 h-4 animate-spin" /> : showSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Guardando...' : showSuccess ? '¡Guardado!' : 'Guardar Cambios'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Difficulty Slider Card */}
                <div className="space-y-10">
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10 group">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-2">Umbral de Explosión</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Define cuánta presión requiere el globo para reventar.</p>
                            </div>
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors">
                                <Zap className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between text-2xl font-black text-slate-900 tracking-tighter">
                                <span>{difficulty}</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] self-end mb-1">Dificultad (1-10)</span>
                            </div>
                            <div className="relative pt-6">
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    step="1"
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(parseInt(e.target.value))}
                                    className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-orange-500"
                                />
                                <div className="flex justify-between mt-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Muy Fácil</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Imposible</span>
                                </div>
                            </div>
                        </div>

                        <div className={`p-6 bg-slate-50 rounded-3xl border border-slate-100 border-l-4 ${difficulty > 7 ? 'border-l-red-500' : 'border-l-orange-500'} transition-all`}>
                            <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-wide">
                                {difficulty <= 4 && "El globo explotará con muy pocos toques. Ideal para eventos rápidos."}
                                {difficulty > 4 && difficulty <= 7 && "Dificultad balanceada. Requiere un esfuerzo moderado del jugador."}
                                {difficulty > 7 && "Nivel extremo. Solo los más rápidos podrán ganar el premio."}
                            </p>
                        </div>
                    </div>

                    {/* Time Limit Card */}
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10 group">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-2">Tiempo de Juego</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Segundos disponibles para completar el desafío.</p>
                            </div>
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                <Timer className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                            <div className="flex-1 space-y-6">
                                <input
                                    type="range"
                                    min="5"
                                    max="60"
                                    step="1"
                                    value={timeLimit}
                                    onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                                    className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-500"
                                />
                                <div className="flex justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">5s (Rápido)</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">60s (Lento)</span>
                                </div>
                            </div>
                            <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex flex-col items-center justify-center text-white shadow-xl">
                                <span className="text-3xl font-black">{timeLimit}</span>
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Segundos</span>
                            </div>
                        </div>
                    </div>


                </div>

                {/* Info Card */}
                <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <Sparkles className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 group-hover:scale-110 transition-transform duration-700" />

                    <h4 className="text-xl font-black uppercase tracking-tight mb-8 relative z-10">Mecánica del Juego</h4>

                    <div className="space-y-8 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                                <Timer className="text-orange-400 w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-sm font-black uppercase tracking-widest">Ritmo de Juego</p>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">El globo mantiene su tamaño si el usuario descansa</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                                <Settings2 className="text-blue-400 w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-sm font-black uppercase tracking-widest">Calibración en Tiempo Real</p>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Cambios aplicados instantáneamente</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-10 border-t border-white/10">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Última actualización</p>
                        <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-1">
                            {new Date(config.updatedAt).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
