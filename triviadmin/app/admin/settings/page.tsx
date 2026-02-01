'use client';

import { useState, useEffect } from 'react';
import { fetchChangoConfig, updateChangoConfigAction } from '@/lib/actions';
import { ChangoConfig } from '@/lib/types';
import {
    Settings,
    Save,
    CheckCircle2,
    DollarSign,
    CreditCard
} from 'lucide-react';

export default function SettingsAdminPage() {
    const [config, setConfig] = useState<ChangoConfig | null>(null);
    const [price, setPrice] = useState(1000);
    const [enablePayments, setEnablePayments] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        const data = await fetchChangoConfig();
        setConfig(data);
        if (data.game_price !== undefined) {
            setPrice(data.game_price);
        }
        if (data.enable_payments !== undefined) {
            setEnablePayments(data.enable_payments);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        await updateChangoConfigAction({
            game_price: price,
            enable_payments: enablePayments
        });
        setIsSaving(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        loadConfig();
    };

    if (!config) return (
        <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-slate-500/20 border-t-slate-500 rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando...</p>
        </div>
    );

    return (
        <div className="space-y-10 pb-20 max-w-5xl mx-auto">
            <div className="flex justify-between items-center bg-white p-10 rounded-[2.5rem] border border-slate-200">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center shadow-lg shadow-slate-800/20">
                        <Settings className="text-white w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Configuración Global</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Ajustes generales del sistema y pagos</p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 transition-all shadow-xl active:scale-95 ${showSuccess ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-black text-white shadow-black/20 hover:bg-slate-800'}`}
                >
                    {isSaving ? <Settings className="w-4 h-4 animate-spin" /> : showSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Guardando...' : showSuccess ? '¡Guardado!' : 'Guardar Cambios'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                {/* Payments Toggle Card */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8 md:col-span-2 flex items-center justify-between">
                    <div>
                        <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-2">Cobros con QR</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-md">
                            Si se desactiva, el kiosco omitirá la pantalla de pago y permitirá jugar gratis.
                        </p>
                    </div>

                    <button
                        onClick={() => setEnablePayments(!enablePayments)}
                        className={`w-20 h-10 rounded-full p-1 transition-all duration-300 ${enablePayments ? 'bg-green-500 shadow-lg shadow-green-500/20' : 'bg-slate-200 shadow-inner'}`}
                    >
                        <div className={`w-8 h-8 rounded-full bg-white shadow-sm transition-all duration-300 ${enablePayments ? 'translate-x-10' : 'translate-x-0'}`} />
                    </button>
                </div>

                {/* Price Card */}
                <div className={`bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10 group md:col-span-2 transition-opacity duration-300 ${enablePayments ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-2">Precio de la Ficha</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Valor monetario para habilitar una ronda de juego.</p>
                        </div>
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-green-600 transition-colors">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="flex-1 space-y-6">
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={price}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 pl-12 text-4xl font-black text-slate-800 tracking-tight focus:ring-4 focus:ring-green-500/10 outline-none transition-all"
                                />
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto enviado a Mercado Pago</span>
                            </div>
                        </div>

                        <div className="hidden md:flex flex-col items-center gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <CreditCard className="w-8 h-8 text-slate-300" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pagos<br />Habilitados</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
