'use client';

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useConnectivity } from './ConnectivityProvider';

export default function OfflineOverlay() {
    const { isOnline } = useConnectivity();

    if (isOnline) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center text-white px-6 text-center animate-in fade-in duration-500">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="relative bg-zinc-900 border border-white/10 p-8 rounded-3xl shadow-2xl">
                    <WifiOff size={64} className="text-red-500 animate-bounce" />
                </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
                Sin Conexión
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 max-w-md font-medium leading-relaxed mb-10">
                La conexión a Internet se ha perdido. El juego se reanudará automáticamente cuando vuelva la señal.
            </p>

            <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-3 px-6 py-3 bg-zinc-900/50 border border-white/5 rounded-full">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
                    <span className="text-sm font-mono uppercase tracking-widest text-zinc-300">
                        Esperando señal...
                    </span>
                </div>

                <button
                    onClick={() => window.location.reload()}
                    className="group flex items-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-all active:scale-95"
                >
                    <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                    Reintentar ahora
                </button>
            </div>

            <div className="absolute bottom-10 left-0 right-0">
                <p className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20">
                    SAB GAME • KIOSK MODE
                </p>
            </div>
        </div>
    );
}
