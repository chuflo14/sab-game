'use client';

import { useState, useEffect } from 'react';
import { fetchWheelSegments, bulkUpdateWheelSegmentsAction, fetchPrizes, fetchStores, fetchChangoConfig, updateChangoConfigAction } from '@/lib/actions';
import { WheelSegment, Prize, Store, ChangoConfig } from '@/lib/types';
import MusicUploadButton from '@/components/admin/MusicUploadButton';
import {
    CircleEllipsis,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Trophy,
    Palette,
    Check,
    Store as StoreIcon,
    Music
} from 'lucide-react';

const MINIMALIST_PALETTE = [
    '#FF6B6B', '#FF9F43', '#FECA57', '#1DD1A1',
    '#48DBFB', '#54A0FF', '#5F27CD', '#FF9FF3',
    '#C8D6E5', '#222F3E', '#F368E0', '#FF3838'
];

export default function WheelAdminPage() {
    const [segments, setSegments] = useState<WheelSegment[]>([]);
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [config, setConfig] = useState<ChangoConfig | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [segData, prizeData, storeData, configData] = await Promise.all([
            fetchWheelSegments(),
            fetchPrizes(),
            fetchStores(),
            fetchChangoConfig()
        ]);
        const segmentsTyped = (segData as WheelSegment[]).sort((a, b) => a.slotIndex - b.slotIndex);
        setSegments(segmentsTyped);
        setPrizes(prizeData);
        setStores(storeData);
        setConfig(configData);
        setIsLoading(false);
    };

    const updateConfig = async (key: keyof ChangoConfig, value: any) => {
        const newData = { [key]: value };
        setConfig(prev => prev ? { ...prev, ...newData } : null);
        await updateChangoConfigAction(newData);
    };

    const handleUpdateSegment = async (id: string, updates: Partial<WheelSegment>) => {
        // Optimistic update for simple fields
        if (updates.probability === undefined) {
            setSegments(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
            await bulkUpdateWheelSegmentsAction([{ id, updates }]);
        } else {
            // Probability needs balance
            handleAutoBalance(id, updates.probability);
        }
    };

    const handleAutoBalance = async (changedId: string, newValue: number) => {
        const otherSegments = segments.filter(s => s.id !== changedId);
        const remainingProb = Math.max(0, 1 - newValue);
        const probPerSegment = parseFloat((remainingProb / otherSegments.length).toFixed(4));

        const updates = [
            { id: changedId, updates: { probability: newValue } },
            ...otherSegments.map(s => ({ id: s.id, updates: { probability: probPerSegment } }))
        ];

        // Optimistic update
        const updated = segments.map(s => {
            const up = updates.find(u => u.id === s.id);
            return up ? { ...s, ...up.updates } : s;
        });
        setSegments(updated);

        await bulkUpdateWheelSegmentsAction(updates);
    };

    const totalProbability = segments.reduce((acc, curr) => acc + curr.probability, 0);
    const isProbValid = Math.abs(totalProbability - 1) < 0.01;

    return (
        <div className="space-y-8 pb-20 font-sans max-w-7xl mx-auto">
            {/* Header / Summary Card */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-black shadow-lg shadow-yellow-400/20">
                            <CircleEllipsis className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Ruleta del Chacho</h3>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Configuración técnica de probabilidades y premios</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={loadData}
                        className="p-4 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors text-slate-600"
                        title="Recargar datos"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className={`flex-1 md:flex-none px-8 py-4 rounded-[1.5rem] border-2 flex items-center gap-4 transition-all ${isProbValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className={`p-2 rounded-xl ${isProbValid ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                            {isProbValid ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest leading-none text-slate-400 mb-1">Sumatoria Total</p>
                            <p className={`text-xl font-black ${isProbValid ? 'text-green-700' : 'text-red-700'}`}>
                                {(totalProbability * 100).toFixed(1)}% / 100%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* List of Slots */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {isLoading ? (
                    <div className="p-40 flex flex-col items-center justify-center space-y-4 bg-white rounded-[3rem] col-span-full border border-slate-200">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-yellow-500 rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Calibrando Mecanismo...</p>
                    </div>
                ) : (
                    segments.map((seg) => (
                        <div key={seg.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
                            {/* Accent line based on segment color */}
                            <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: seg.color }} />

                            <div className="p-8 space-y-8">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex flex-col items-center justify-center text-white shadow-xl shadow-black/10 transition-transform group-hover:scale-105 duration-300">
                                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Slot</span>
                                            <span className="text-3xl font-black leading-none">{seg.slotIndex}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <input
                                                type="text"
                                                defaultValue={seg.label}
                                                onBlur={(e) => handleUpdateSegment(seg.id, { label: e.target.value })}
                                                placeholder="Nombre del premio..."
                                                className="bg-transparent border-none p-0 text-xl font-black text-slate-800 uppercase tracking-tight outline-none w-full focus:text-yellow-600 transition-colors"
                                            />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificador del Segmento</p>
                                        </div>
                                    </div>

                                    {/* Small Probability display */}
                                    <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 flex flex-col items-center">
                                        <span className="text-[18px] font-black text-slate-900 tracking-tighter">{(seg.probability * 100).toFixed(1)}%</span>
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Peso</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left Column: Data */}
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2 text-slate-400">
                                                <Trophy className="w-3 h-3 text-yellow-500" /> Canje de Premio
                                            </label>
                                            <select
                                                value={seg.prizeId || ''}
                                                onChange={(e) => handleUpdateSegment(seg.id, { prizeId: e.target.value || undefined })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-black text-slate-700 uppercase focus:bg-white focus:ring-4 focus:ring-yellow-500/10 outline-none transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="">SIN PREMIO (INFORMATIVO)</option>
                                                {prizes.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2 text-slate-400">
                                                <StoreIcon className="w-3 h-3 text-purple-500" /> Tienda Asignada (Opcional)
                                            </label>
                                            <select
                                                value={seg.storeId || ''}
                                                onChange={(e) => handleUpdateSegment(seg.id, { storeId: e.target.value || undefined })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-black text-slate-700 uppercase focus:bg-white focus:ring-4 focus:ring-purple-500/10 outline-none transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="">Aleatoria (Por defecto)</option>
                                                {stores.filter(s => s.active).map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2 text-slate-400">
                                                <Palette className="w-3 h-3 text-blue-500" /> Paleta de Color
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {MINIMALIST_PALETTE.map((color) => (
                                                    <button
                                                        key={color}
                                                        onClick={() => handleUpdateSegment(seg.id, { color })}
                                                        className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-125 flex items-center justify-center ${seg.color === color ? 'border-slate-900 scale-110 shadow-lg' : 'border-slate-100'}`}
                                                        style={{ backgroundColor: color }}
                                                    >
                                                        {seg.color === color && <Check className="w-3 h-3 text-white mix-blend-difference" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Prob Slider / Manual Input */}
                                    <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-5">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manual (%)</label>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    value={Math.round(seg.probability * 100)}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (isNaN(val)) return;
                                                        handleUpdateSegment(seg.id, { probability: val / 100 });
                                                    }}
                                                    className="w-12 bg-transparent text-right font-black text-slate-800 outline-none border-b border-slate-300 focus:border-yellow-500 transition-colors"
                                                />
                                                <span className="text-xs font-black text-slate-800">%</span>
                                            </div>
                                        </div>

                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="1"
                                            value={Math.round(seg.probability * 100)}
                                            onChange={(e) => handleUpdateSegment(seg.id, { probability: parseFloat(e.target.value) / 100 })}
                                            className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                        />

                                        <div className="bg-yellow-100/30 p-4 rounded-2xl border border-yellow-200/50">
                                            <p className="text-[9px] font-bold text-yellow-800 leading-tight uppercase opacity-60">
                                                Al modificar este valor, el resto de los segmentos se ajustarán automáticamente para mantener el balance.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {!isProbValid && (
                <div className="bg-red-900 text-white p-10 rounded-[3rem] flex items-center gap-10 animate-bounce shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <AlertCircle className="w-32 h-32" />
                    </div>
                    <AlertCircle className="w-12 h-12 shrink-0 text-red-400" />
                    <div className="relative z-10">
                        <h4 className="text-2xl font-black uppercase tracking-tight">Probabilidades Desbalanceadas</h4>
                        <p className="text-xs font-bold opacity-70 uppercase tracking-widest mt-1 max-w-xl leading-relaxed">
                            La suma total debe ser 100%. Actualmente es {(totalProbability * 100).toFixed(1)}%.
                            Use los controles para equilibrar el azar del sistema.
                        </p>
                    </div>
                </div>
            )}

            {/* Music Configuration */}
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                        <Music className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">Música de Fondo</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ambienta el juego de Ruleta</p>
                    </div>
                </div>

                <div className="max-w-md">
                    <MusicUploadButton
                        currentUrl={config?.ruleta_music_url}
                        onUpload={(url) => updateConfig('ruleta_music_url', url)}
                        label="Subir Música Ruleta"
                    />
                </div>
            </div>
        </div>
    );
}
