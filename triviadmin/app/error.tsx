'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Fatal Application Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-yellow-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="relative bg-zinc-900 border border-white/10 p-8 rounded-3xl shadow-2xl">
                    <AlertTriangle size={64} className="text-yellow-500" />
                </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">
                Algo salió mal
            </h1>

            <p className="text-lg text-zinc-400 max-w-md font-medium leading-relaxed mb-10">
                La aplicación encontró un error inesperado. Esto puede deberse a un fallo en la conexión o en el servidor.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                    onClick={() => reset()}
                    className="group flex items-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 w-full sm:w-auto"
                >
                    <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                    Reintentar
                </button>

                <Link
                    href="/"
                    className="flex items-center gap-3 px-8 py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 border border-white/10 transition-all active:scale-95 w-full sm:w-auto"
                >
                    <Home size={20} />
                    Ir al Inicio
                </Link>
            </div>

            <div className="mt-12 p-4 bg-zinc-900/30 rounded-xl border border-white/5 max-w-2xl w-full">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">Detalles del Error</p>
                <div className="text-xs font-mono text-zinc-500 break-all bg-black/50 p-3 rounded border border-white/5 text-left max-h-32 overflow-y-auto">
                    {error.message || 'Error desconocido'}
                    {error.digest && <div className="mt-1 opacity-50">Digest: {error.digest}</div>}
                </div>
            </div>

            <div className="absolute bottom-10 left-0 right-0">
                <p className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20">
                    SAB GAME • SYSTEM ERROR
                </p>
            </div>
        </div>
    );
}
