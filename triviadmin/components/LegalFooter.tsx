'use client';

import { useState } from 'react';
import { QrCode, FileText, MessageCircle } from 'lucide-react';
import { TermsModal } from './TermsModal';

export function LegalFooter() {
    const [showTerms, setShowTerms] = useState(false);

    return (
        <>
            <div className="w-full bg-black/60 backdrop-blur-md border-t border-white/10 p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 absolute bottom-0 left-0 z-20">

                {/* Left: Data Fiscal (Real AFIP Link) */}
                <a
                    href="http://qr.afip.gob.ar/?qr=tzZrNBbhtKhWJjq8BkAznw,,"
                    target="_F960AFIPInfo"
                    className="flex items-center gap-4 hover:bg-white/5 p-1 rounded transition-colors"
                >
                    <div className="bg-white p-1 rounded">
                        {/* Using actual AFIP Image from their servers as requested in script */}
                        <img
                            src="http://www.afip.gob.ar/images/f960/DATAWEB.jpg"
                            alt="Data Fiscal"
                            className="w-10 h-14 object-contain"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Data Fiscal</span>
                        <span>Verifique la inscripción</span>
                        <span>de SABGAME</span>
                    </div>
                </a>

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

                    <div className="flex items-center gap-2 uppercase tracking-widest font-bold">
                        <span className="text-slate-500">v1.1.0</span>
                    </div>
                </div>

                {/* Right: Support */}
                <a
                    href="https://wa.me/5493804533112"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-green-500/10 hover:bg-green-500/20 px-4 py-2 rounded-lg border border-green-500/20 transition-all group"
                >
                    <MessageCircle className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col">
                        <span className="font-bold text-white uppercase text-[10px]">¿Necesitas ayuda?</span>
                        <span className="text-xs tracking-wide group-hover:text-green-400 transition-colors">WhatsApp Soporte</span>
                    </div>
                </a>
            </div>

            <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
        </>
    );
}
