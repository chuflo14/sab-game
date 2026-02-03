'use client';

import { useState } from 'react';
import { uploadMusic } from '@/lib/actions';
import { Loader2, Music, Upload } from 'lucide-react';

interface MusicUploadButtonProps {
    onUpload: (url: string) => void;
    currentUrl?: string;
    label?: string;
}

export default function MusicUploadButton({ onUpload, currentUrl, label = "Subir Audio" }: MusicUploadButtonProps) {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await uploadMusic(formData);
            if (res.success && res.url) {
                onUpload(res.url);
            } else {
                console.error(res.error);
                alert('Error al subir el archivo: ' + res.error);
            }
        } catch (error) {
            console.error(error);
            alert('Error inesperado al subir');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            {currentUrl && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                        <Music className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Audio Actual</p>
                        <audio controls className="w-full h-8" src={currentUrl} />
                    </div>
                </div>
            )}

            <div className="relative group">
                <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                    disabled={isUploading}
                />
                <div className={`w-full py-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 transition-all ${currentUrl ? 'border-green-200 bg-green-50/50 text-green-700' : 'border-slate-200 bg-slate-50 text-slate-400'} group-hover:border-purple-400 group-hover:text-purple-600 group-hover:bg-purple-50/50`}>
                    {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Upload className="w-5 h-5" />
                    )}
                    <span className="text-xs font-black uppercase tracking-widest">
                        {isUploading ? 'Subiendo...' : currentUrl ? 'Cambiar Archivo' : label}
                    </span>
                </div>
            </div>
        </div>
    );
}
