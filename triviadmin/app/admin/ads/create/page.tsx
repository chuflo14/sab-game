'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createAd, uploadAdMedia } from '@/lib/actions';
import { AdMedia } from '@/lib/types';
import {
    ArrowLeft,
    Save,
    Star,
    UploadCloud,
    Clock
} from 'lucide-react';
import Link from 'next/link';

export default function CreateAdPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [name, setName] = useState('');
    const [type, setType] = useState<'image' | 'video'>('image');
    const [url, setUrl] = useState('');
    const [durationSec, setDurationSec] = useState(10);
    const [priority, setPriority] = useState(false);

    // File state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simple validation
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (!isVideo && !isImage) {
            alert('Por favor selecciona una imagen o video válido');
            return;
        }

        setSelectedFile(file);
        setType(isVideo ? 'video' : 'image');
        setDurationSec(isVideo ? 30 : 10);

        // Create local preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setUrl(''); // Clear manual URL if set
    };

    const handleUpload = async () => {
        if (!selectedFile) return null;

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            setUploading(true);
            const uploadedPath = await uploadAdMedia(formData);
            return uploadedPath;
        } catch (error) {
            console.error(error);
            alert('Error al subir el archivo');
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name) {
            alert('Por favor ingresa un nombre para el anuncio');
            return;
        }

        if (!selectedFile && !url) {
            alert('Por favor selecciona un archivo o ingresa una URL');
            return;
        }

        setIsLoading(true);

        try {
            let finalUrl = url;

            // Handle file upload if selected
            if (selectedFile) {
                const uploadedUrl = await handleUpload();
                if (!uploadedUrl) {
                    setIsLoading(false);
                    return;
                }
                finalUrl = uploadedUrl;
            }

            const newAd: AdMedia = {
                id: crypto.randomUUID(),
                name,
                type,
                url: finalUrl,
                durationSec,
                priority,
                active: true,
                createdAt: new Date()
            };

            await createAd(newAd);
            router.push('/admin/ads');
        } catch (error) {
            console.error(error);
            alert('Error al crear el anuncio');
            setIsLoading(false);
        }
    };

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
                    Nueva Publicidad
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload Area */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative aspect-video rounded-[2rem] border-4 border-dashed transition-all cursor-pointer overflow-hidden group ${previewUrl ? 'border-indigo-500/50 bg-black' : 'border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-slate-100'}`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                    />

                    {previewUrl ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                            {type === 'image' ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                            ) : (
                                <video src={previewUrl} className="w-full h-full" controls />
                            )}

                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <p className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                                    <UploadCloud className="w-5 h-5" />
                                    Cambiar Archivo
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-4">
                            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                <UploadCloud className="w-8 h-8" />
                            </div>
                            <div className="text-center px-8">
                                <p className="font-black uppercase tracking-tight text-slate-600">Toca para cargar</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest mt-1">Imágenes o Videos (Max 50MB)</p>
                            </div>
                        </div>
                    )}
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
                    disabled={isLoading || uploading}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-2xl py-6 font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-95 fixed bottom-6 left-4 right-4 md:static md:w-full z-50 md:z-0 max-w-[calc(100%-2rem)] md:max-w-none mx-auto"
                >
                    {isLoading || uploading ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Guardar Publicidad
                        </>
                    )}
                </button>

                {/* Spacer for fixed button on mobile */}
                <div className="h-20 md:hidden" />
            </form>
        </div>
    );
}
