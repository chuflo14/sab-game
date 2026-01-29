'use client';

import { useState, useEffect } from 'react';
import { fetchChangoConfig, updateChangoConfigAction } from '@/lib/actions';
import { ChangoConfig } from '@/lib/types';
import {
    Clock,
    Save,
    CheckCircle2,
    Hourglass,
    Timer,
    Zap,
    QrCode
} from 'lucide-react';

export default function TimesAdminPage() {
    const [config, setConfig] = useState<ChangoConfig | null>(null);
    const [cooldown, setCooldown] = useState(10);
    const [resultDuration, setResultDuration] = useState(1.5);
    const [priorityAdDuration, setPriorityAdDuration] = useState(5);
    const [qrDuration, setQrDuration] = useState(20);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        const data = await fetchChangoConfig();
        setConfig(data);
        setCooldown(data.gameCooldownSeconds ?? 10);
        setResultDuration(data.resultDurationSeconds ?? 1.5);
        setPriorityAdDuration(data.priorityAdDurationSeconds ?? 5);
        setQrDuration(data.qrDisplaySeconds ?? 20);
    };

    const handleSave = async () => {
        if (!config) return;
        setIsSaving(true);
        // Preserve existing values, only update times
        await updateChangoConfigAction({
            difficulty: config.difficulty,
            timeLimit: config.timeLimit,
            gameCooldownSeconds: cooldown,
            resultDurationSeconds: resultDuration,
            priorityAdDurationSeconds: priorityAdDuration,
            qrDisplaySeconds: qrDuration
        });
        setIsSaving(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        loadConfig();
    };

    if (!config) return (
        <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando...</p>
        </div>
    );

    return (
        <div className="space-y-10 pb-20 max-w-5xl mx-auto">
            <div className="flex justify-between items-center bg-white p-10 rounded-[2.5rem] border border-slate-200">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-500 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Clock className="text-white w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Tiempos del Sistema</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configuración global de duraciones y pausas</p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 transition-all shadow-xl active:scale-95 ${showSuccess ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-black text-white shadow-black/20 hover:bg-slate-800'}`}
                >
                    {isSaving ? <Clock className="w-4 h-4 animate-spin" /> : showSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Guardando...' : showSuccess ? '¡Guardado!' : 'Guardar Cambios'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Cooldown Card */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10 group">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-2">Pausa entre Juegos</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Tiempo de espera obligatorio antes de permitir jugar nuevamente.</p>
                        </div>
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-purple-500 transition-colors">
                            <Hourglass className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-8">
                            <div className="flex-1 space-y-6">
                                <input
                                    type="range"
                                    min="0"
                                    max="120"
                                    step="5"
                                    value={cooldown}
                                    onChange={(e) => setCooldown(parseInt(e.target.value))}
                                    className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-purple-500"
                                />
                                <div className="flex justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">0s (Sin espera)</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">120s (2 min)</span>
                                </div>
                            </div>
                            <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex flex-col items-center justify-center text-white shadow-xl">
                                <span className="text-3xl font-black">{cooldown}</span>
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Segundos</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Result Display Duration Card */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10 group">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-2">Pantalla de Resultado</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Duración de la animación de &quot;Ganaste/Perdiste&quot; (Ticks).</p>
                        </div>
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-green-500 transition-colors">
                            <Timer className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-8">
                            <div className="flex-1 space-y-6">
                                <input
                                    type="range"
                                    min="0.5"
                                    max="5.0"
                                    step="0.5"
                                    value={resultDuration}
                                    onChange={(e) => setResultDuration(parseFloat(e.target.value))}
                                    className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-green-500"
                                />
                                <div className="flex justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">0.5s (Rápido)</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">5.0s (Lento)</span>
                                </div>
                            </div>
                            <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex flex-col items-center justify-center text-white shadow-xl">
                                <span className="text-3xl font-black">{resultDuration}</span>
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Segundos</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Priority Ad Duration Card */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10 group col-span-1 md:col-span-2">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-2">Publicidad Prioritaria</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Duración de la publicidad mostrada al seleccionar un juego.</p>
                        </div>
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-yellow-500 transition-colors">
                            <Zap className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-8">
                            <div className="flex-1 space-y-6">
                                <input
                                    type="range"
                                    min="3"
                                    max="30"
                                    step="1"
                                    value={priorityAdDuration}
                                    onChange={(e) => setPriorityAdDuration(parseInt(e.target.value))}
                                    className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-yellow-500"
                                />
                                <div className="flex justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3s (Rápido)</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">30s (Lento)</span>
                                </div>
                            </div>
                            <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex flex-col items-center justify-center text-white shadow-xl">
                                <span className="text-3xl font-black">{priorityAdDuration}</span>
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Segundos</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* QR Display Duration Card */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10 group col-span-1 md:col-span-2">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-2">Tiempo de QR</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Tiempo que se muestra el código QR ganador.</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors">
                        <QrCode className="w-6 h-6" />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-8">
                        <div className="flex-1 space-y-6">
                            <input
                                type="range"
                                min="10"
                                max="60"
                                step="5"
                                value={qrDuration}
                                onChange={(e) => setQrDuration(parseInt(e.target.value))}
                                className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-amber-500"
                            />
                            <div className="flex justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">10s (Rápido)</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">60s (Lento)</span>
                            </div>
                        </div>
                        <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex flex-col items-center justify-center text-white shadow-xl">
                            <span className="text-3xl font-black">{qrDuration}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Segundos</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
