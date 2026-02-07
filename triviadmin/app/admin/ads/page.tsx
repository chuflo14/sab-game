'use client';

import { useState, useEffect } from 'react';
import { fetchAds, updateAdAction, deleteAdAction } from '@/lib/actions';
import { AdMedia } from '@/lib/types';
import Link from 'next/link';
import {
    MonitorPlay,
    Plus,
    Image as ImageIcon,
    Video,
    Star,
    Trash2,
    Clock,
    Edit2
} from 'lucide-react';

export default function AdsAdminPage() {
    const [ads, setAds] = useState<AdMedia[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadAds();
    }, []);

    const loadAds = async () => {
        setIsLoading(true);
        const data = await fetchAds();
        setAds(data);
        setIsLoading(false);
    };

    const togglePriority = async (ad: AdMedia) => {
        await updateAdAction(ad.id, { priority: !ad.priority });
        loadAds();
    };

    const toggleStatus = async (ad: AdMedia) => {
        await updateAdAction(ad.id, { active: !ad.active });
        loadAds();
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-200">
                <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Gestión de Publicidad</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Imágenes y Videos para el modo Kiosco</p>
                </div>
                <Link
                    href="/admin/ads/create"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Publicidad
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 animate-pulse space-y-4">
                            <div className="aspect-video bg-slate-100 rounded-3xl" />
                            <div className="h-4 bg-slate-100 rounded w-1/2" />
                            <div className="h-4 bg-slate-100 rounded w-1/3" />
                        </div>
                    ))
                ) : ads.length === 0 ? (
                    <div className="col-span-full p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                        No hay anuncios registrados
                    </div>
                ) : (
                    ads.map((ad) => (
                        <div key={ad.id} className="bg-white group rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300">
                            {/* Preview Tile */}
                            <div className="aspect-video relative overflow-hidden bg-slate-900 border-b border-slate-100">
                                {ad.type === 'video' ? (
                                    <video
                                        src={ad.url}
                                        className="w-full h-full object-cover"
                                        muted
                                        loop
                                        autoPlay
                                    />
                                ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={ad.url}
                                        alt="Preview"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        onError={(e: any) => e.target.src = 'https://placehold.co/1280x720/000/fff?text=Ad+Sin+Previsu'}
                                    />
                                )}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button
                                        onClick={() => togglePriority(ad)}
                                        className={`p-2 rounded-xl backdrop-blur-md transition-all ${ad.priority ? 'bg-yellow-500 text-black border-yellow-400 shadow-lg shadow-yellow-500/20' : 'bg-black/20 text-white border-white/20 hover:bg-black/40'}`}
                                        title={ad.priority ? "Es Prioritario" : "Hacer Prioritario"}
                                    >
                                        <Star className={`w-4 h-4 ${ad.priority ? 'fill-black' : ''}`} />
                                    </button>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                <div className="absolute bottom-4 left-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10 text-white">
                                        {ad.type === 'image' ? <ImageIcon className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 text-white text-[10px] font-black uppercase tracking-widest">
                                        <Clock className="w-3 h-3 text-yellow-500" />
                                        {ad.durationSec}s
                                    </div>
                                </div>
                            </div>

                            {/* Info & Actions */}
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate max-w-[180px]">
                                            {ad.name || ad.url.split('/').pop()?.substring(0, 20) || 'Publicidad'}
                                        </h4>
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Registrado el {new Date(ad.createdAt).toLocaleDateString()}
                                            </p>
                                            {ad.uploadedBy && (
                                                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest truncate max-w-[150px]">
                                                    Por: {ad.uploadedBy.substring(0, 8)}...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleStatus(ad)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${ad.active ? 'bg-green-500/10 text-green-600' : 'bg-slate-100 text-slate-400'}`}
                                    >
                                        {ad.active ? 'ACTIVO' : 'INACTIVO'}
                                    </button>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => window.open(ad.url, '_blank')}
                                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MonitorPlay className="w-3.5 h-3.5" />
                                        Previsualizar
                                    </button>
                                    <Link
                                        href={`/admin/ads/${ad.id}/edit`}
                                        className="p-3 text-slate-300 hover:text-yellow-600 hover:bg-yellow-500/5 rounded-xl transition-all"
                                        title="Editar Anuncio"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Link>
                                    <form action={async () => {
                                        if (confirm('¿Estás seguro de que deseas eliminar este anuncio?')) {
                                            await deleteAdAction(ad.id);
                                            loadAds();
                                        }
                                    }}>
                                        <button className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all" title="Eliminar Anuncio">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Stats / Priority Info */}
            <div className="bg-yellow-500 p-8 rounded-[2.5rem] flex items-center justify-between shadow-lg shadow-yellow-500/20">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center">
                        <Star className="text-yellow-500 w-8 h-8 fill-yellow-500" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-black uppercase tracking-tight">Publicidad de Alta Prioridad</h4>
                        <p className="text-xs font-bold text-black/60 uppercase tracking-widest mt-1">Los anuncios con estrella son los primeros en mostrarse al iniciar el sistema.</p>
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-4xl font-black text-black leading-none">{ads.filter(a => a.priority).length}</p>
                    <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mt-2">MARCADOS</p>
                </div>
            </div>
        </div>
    );
}
