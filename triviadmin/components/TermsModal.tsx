'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
    // Prevent scrolling background when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">Términos y Condiciones</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 overflow-y-auto text-slate-300 space-y-4 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                    <p className="font-bold text-white">1. Aceptación de las Bases</p>
                    <p>La participación en los juegos de SABGAME implica el conocimiento y aceptación de las presentes bases y condiciones.</p>

                    <p className="font-bold text-white">2. Mecánica de Participación</p>
                    <p>El usuario debe abonar el crédito correspondiente mediante Mercado Pago para habilitar la partida. Una vez acreditado el pago, el sistema permitirá el acceso a los juegos disponibles.</p>

                    <p className="font-bold text-white">3. Responsabilidad</p>
                    <p>SABGAME no se responsabiliza por cortes de energía, fallas en la conexión a internet del usuario o problemas con la plataforma de pagos de terceros (Mercado Pago).</p>

                    <p className="font-bold text-white">4. Reembolsos</p>
                    <p>En caso de error técnico comprobable de la máquina (ej. se traga el crédito y no habilita el juego), el usuario deberá contactar al soporte técnico mediante el canal oficial (WhatsApp) para gestionar la devolución o acreditación manual.</p>

                    <p className="font-bold text-white">5. Privacidad</p>
                    <p>No almacenamos datos sensibles de tarjetas de crédito o débito. Todas las transacciones son procesadas de forma segura por Mercado Pago.</p>

                    <p className="font-bold text-white">6. Prohibiciones</p>
                    <p>Queda prohibido el uso indebido de la máquina, golpes, o intentos de manipulación del software.</p>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-700 bg-slate-800/50 rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
}
