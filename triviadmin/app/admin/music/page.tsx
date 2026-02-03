'use client';

import { useState, useEffect } from 'react';
import { fetchChangoConfig, updateChangoConfigAction } from '@/lib/actions';
import { ChangoConfig } from '@/lib/types';
import MusicUploadButton from '@/components/admin/MusicUploadButton';
import { Music, CheckCircle2 } from 'lucide-react';

export default function MusicAdminPage() {
    const [config, setConfig] = useState<ChangoConfig | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        const data = await fetchChangoConfig();
        setConfig(data);
    };

    const handleUpdateMusic = async (key: keyof ChangoConfig, url: string, gameName: string) => {
        if (!config) return;

        const newData = { [key]: url };
        // Optimistic update
        setConfig(prev => prev ? { ...prev, ...newData } : null);

        await updateChangoConfigAction(newData);

        setSuccessMsg(`Música de ${gameName} actualizada`);
        setTimeout(() => setSuccessMsg(null), 3000);
    };

    if (!config) return (
        <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-slate-500/20 border-t-slate-500 rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando...</p>
        </div>
    );

    return (
        <div className="space-y-10 pb-20 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 gap-6 md:gap-0">
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg shadow-purple-600/20 shrink-0">
                        <Music className="text-white w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Gestión de Música</h3>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configura la música de fondo para cada juego</p>
                    </div>
                </div>

                {successMsg && (
                    <div className="bg-green-100 border border-green-200 text-green-700 px-6 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-right-10">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">{successMsg}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Trivia Music */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-bold shadow-sm">
                            <span className="text-xl">?</span>
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Trivia</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Música de fondo</p>
                        </div>
                    </div>
                    <div className="pt-2">
                        <MusicUploadButton
                            onUpload={(url) => handleUpdateMusic('trivia_music_url', url, 'Trivia')}
                            currentUrl={config.trivia_music_url}
                            label="Subir Música Trivia"
                        />
                    </div>
                </div>

                {/* Ruleta Music */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 font-bold shadow-sm">
                            <span className="text-xl">R</span>
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Ruleta</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Música de fondo</p>
                        </div>
                    </div>
                    <div className="pt-2">
                        <MusicUploadButton
                            onUpload={(url) => handleUpdateMusic('ruleta_music_url', url, 'Ruleta')}
                            currentUrl={config.ruleta_music_url}
                            label="Subir Música Ruleta"
                        />
                    </div>
                </div>

                {/* Globo Music */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 font-bold shadow-sm">
                            <span className="text-xl">G</span>
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Globo</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Música de fondo</p>
                        </div>
                    </div>
                    <div className="pt-2">
                        <MusicUploadButton
                            onUpload={(url) => handleUpdateMusic('chango_music_url', url, 'Globo')}
                            currentUrl={config.chango_music_url}
                            label="Subir Música Globo"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
