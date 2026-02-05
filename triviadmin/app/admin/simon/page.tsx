'use client';

import {
    Gamepad2,
    Music,
    Settings,
    Save,
    Zap,
    Timer,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import { useState } from 'react';

export default function SimonAdminPage() {
    const [difficulty, setDifficulty] = useState(5);
    const [speed, setSpeed] = useState(1000); // ms
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        // TODO: Implement save action (store in JSON config or dedicated table)
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    return (
        <div className="space-y-10 pb-20 max-w-5xl mx-auto">
            {/* Header Card */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 gap-6 md:gap-0">
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-500 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                        <Gamepad2 className="text-white w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Simón Dice</h3>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configuración de Memoria y Velocidad</p>
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
                {/* Speed Config */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10 group">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-2">Velocidad de Secuencia</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Tiempo entre colores (milisegundos).</p>
                        </div>
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                            <Timer className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between text-2xl font-black text-slate-900 tracking-tighter">
                            <span>{speed}ms</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] self-end mb-1">Velocidad</span>
                        </div>
                        <input
                            type="range"
                            min="200"
                            max="2000"
                            step="100"
                            value={speed}
                            onChange={(e) => setSpeed(Number(e.target.value))}
                            className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="flex justify-between mt-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rápido (200ms)</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lento (2s)</span>
                        </div>
                    </div>
                </div>

                {/* Difficulty Levels */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10 group">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-2">Niveles Máximos</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Cuántos pasos debe recordar para ganar.</p>
                        </div>
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-green-500 transition-colors">
                            <Zap className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="flex justify-between text-2xl font-black text-slate-900 tracking-tighter">
                            <span>{difficulty}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] self-end mb-1">Pasos</span>
                        </div>
                        <input
                            type="range"
                            min="3"
                            max="20"
                            step="1"
                            value={difficulty}
                            onChange={(e) => setDifficulty(Number(e.target.value))}
                            className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-green-500"
                        />
                        <div className="flex justify-between mt-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fácil (3)</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Experto (20)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Music/Audio Section Pointer */}
            <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                <Sparkles className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 group-hover:scale-110 transition-transform duration-700" />
                <h4 className="text-xl font-black uppercase tracking-tight mb-8 relative z-10">Música y Sonidos</h4>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                        <Music className="text-pink-400 w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm font-black uppercase tracking-widest">Gestión de Audio</p>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Configura los sonidos en la sección &quot;Música&quot;</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
