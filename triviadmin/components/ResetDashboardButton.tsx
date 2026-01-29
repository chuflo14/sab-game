'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resetDashboardStats } from '@/lib/actions';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export default function ResetDashboardButton() {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const router = useRouter();

    const handleReset = async () => {
        setIsResetting(true);
        try {
            await resetDashboardStats();
            setIsConfirmOpen(false);
            router.refresh(); // Ensure UI updates immediately
        } catch (error) {
            console.error('Failed to reset stats:', error);
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsConfirmOpen(true)}
                className="group flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl transition-all text-xs font-bold uppercase tracking-wider"
                title="Reiniciar Contadores"
            >
                <Trash2 className="w-4 h-4" />
                <span className="group-hover:inline hidden md:inline">Reiniciar</span>
            </button>

            {/* Confirmation Modal */}
            {isConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden">

                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>

                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                ¿Reiniciar Contadores?
                            </h3>

                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                Esta acción eliminará <strong>permanentemente</strong> todo el historial de:
                                <br />
                                <span className="block mt-2 font-bold text-red-600">• Tickets Generados</span>
                                <span className="block font-bold text-red-600">• Registro de Eventos</span>
                            </p>

                            <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-xs text-red-700 font-bold w-full uppercase tracking-wide">
                                Los datos no se podrán recuperar.
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <button
                                onClick={() => setIsConfirmOpen(false)}
                                disabled={isResetting}
                                className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase tracking-wider transition-colors disabled:opacity-50"
                            >
                                <X className="w-5 h-5" />
                                Cancelar
                            </button>

                            <button
                                onClick={handleReset}
                                disabled={isResetting}
                                className="flex items-center justify-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-wider transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-red-600/30"
                            >
                                {isResetting ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Trash2 className="w-5 h-5" />
                                )}
                                {isResetting ? 'Borrando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
