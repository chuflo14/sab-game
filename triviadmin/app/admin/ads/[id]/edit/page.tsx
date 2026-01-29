'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAds, updateAdAction } from '@/lib/actions';
import { AdMedia } from '@/lib/types';
import {
    ArrowLeft,
    Save,
    Star,
    Image as ImageIcon,
    Video,
    Clock,
    X
} from 'lucide-react';
import Link from 'next/link';

export default function EditAdPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [ad, setAd] = useState<AdMedia | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [durationSec, setDurationSec] = useState(10);
    const [priority, setPriority] = useState(false);

    useEffect(() => {
        loadAd();
    }, [id]);

    const loadAd = async () => {
        setIsLoading(true);
        const ads = await fetchAds();
        const found = ads.find(a => a.id === id);

        if (found) {
            setAd(found);
            setName(found.name || '');
            setDurationSec(found.durationSec);
            setPriority(found.priority);
        } else {
            router.push('/admin/ads');
        }
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name) {
            alert('Por favor ingresa un nombre para el anuncio');
            return;
        }

        setIsSaving(true);

        try {
            await updateAdAction(id, {
                name,
                durationSec,
                priority
            });
            router.push('/admin/ads');
        } catch (error) {
            console.error(error);
            alert('Error al actualizar el anuncio');
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando Anuncio...</p>
        </div>
    );

    if (!ad) return null;

    return (
        <div className="max-w-md mx-auto pb-20 md:max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <Link
                    href="/admin/ads"
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-black text-xs uppercase tracking-widest transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Volver
                </Link>

                <div className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Editando Publicidad
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Preview Area (Read Only) */}
                <div className="relative aspect-video rounded-[2rem] border-4 border-slate-200 overflow-hidden bg-slate-900 group">
                    {ad.type === 'image' ? (
                        <img src={ad.url} className="w-full h-full object-contain" />
                    ) : (
                        <video src={ad.url} className="w-full h-full object-cover" controls />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                    <div className="absolute bottom-6 left-6 right-6">
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Archivo Actual</p>
                        <p className="text-white text-xs font-mono truncate">{ad.url.split('/').pop()}</p>
                    </div>
                </div>

                {/* Vertical Friendly Form Fields */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nombre de la Campaña</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Promo Verano 2026"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-lg font-black text-slate-800 tracking-tight focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Duración (seg)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={durationSec}
                                    onChange={(e) => setDurationSec(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-lg font-black text-slate-800 tracking-tight focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all pl-12"
                                />
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setPriority(!priority)}
                            className={`rounded-2xl border-2 transition-all p-4 flex flex-col items-center justify-center gap-2 ${priority ? 'border-yellow-500 bg-yellow-50' : 'border-slate-100 bg-slate-50'}`}
                        >
                            <Star className={`w-6 h-6 ${priority ? 'fill-yellow-500 text-yellow-500' : 'text-slate-300'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${priority ? 'text-yellow-600' : 'text-slate-400'}`}>Prioridad</span>
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-2xl py-6 font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-95 fixed bottom-6 left-4 right-4 md:static md:w-full z-50 md:z-0 max-w-[calc(100%-2rem)] md:max-w-none mx-auto"
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Guardar Cambios
                        </>
                    )}
                </button>

                {/* Spacer for fixed button on mobile */}
                <div className="h-20 md:hidden" />
            </form>
        </div>
    );
}
