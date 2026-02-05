'use client';

import { useState } from 'react';
import { QrCode, FileText, MessageCircle } from 'lucide-react';
import { TermsModal } from './TermsModal';

export function LegalFooter() {
    const [showTerms, setShowTerms] = useState(false);

    return (
        <>
            <div className="w-full bg-black/60 backdrop-blur-md border-t border-white/10 p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 absolute bottom-0 left-0 z-20">

                {/* Left: Data Fiscal (Placeholder) */}
                <div className="flex items-center gap-4">
                    <div className="bg-white p-1 rounded">
                        {/* Placeholder for AFIP QR */}
                        <QrCode className="w-8 h-8 text-black" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-300 uppercase tracking-wider">Data Fiscal</span>
                        <span>Escanee este código QR</span>
                        <span>para verificar la inscripción.</span>
                    </div>
                </div>

                {/* Center: Legal Links */}
                <div className="flex gap-6">
                    <button
                        onClick={() => setShowTerms(true)}
                        className="flex items-center gap-2 hover:text-white transition-colors uppercase tracking-widest font-bold"
                    >
                        <FileText className="w-4 h-4" />
                        Términos y Condiciones
                    </button>

                    <div className="h-4 w-px bg-white/10" />

                    <a
                        href="#"
                        className="flex items-center gap-2 hover:text-white transition-colors uppercase tracking-widest font-bold"
                    >
                        <span className="text-slate-500">v1.0.0</span>
                    </a>
                </div>

                {/* Right: Support */}
                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                    <MessageCircle className="w-5 h-5 text-green-500" />
                    <div className="flex flex-col">
                        <span className="font-bold text-white uppercase">¿Necesitas ayuda?</span>
                        <span className="text-[10px] tracking-wide">Soporte: +54 9 11 1234-5678</span>
                    </div>
                </div>
            </div>

            <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
        </>
    );
}
