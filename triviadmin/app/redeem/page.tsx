'use client';

import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Scan, X } from 'lucide-react';

export default function RedeemPage() {
    const [token, setToken] = useState('');
    const [showScanner, setShowScanner] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleScan = (result: any) => {
        if (result) {
            // The library might return an array or object depending on version, 
            // but usually result[0].rawValue for newer versions or just the string.
            // Let's handle generic string or array structure lightly
            const value = result?.[0]?.rawValue || result?.text || result;
            if (value) {
                setToken(value);
                setShowScanner(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Premium Background Effects */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'radial-gradient(circle at center, #EAB308 0%, transparent 70%)' }}
                />
            </div>

            <div className="relative z-10 w-full max-w-md bg-white/[0.03] backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
                {/* Decorative Shine */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl" />

                <div className="flex flex-col items-center mb-10">
                    <span className="text-yellow-500 font-black text-xs uppercase tracking-[0.5em] mb-4">SAB Game LR</span>
                    <h1 className="text-4xl font-black text-center uppercase tracking-tight">Canje de <span className="text-yellow-500">Premios</span></h1>
                    <div className="h-1 w-20 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent mt-4" />
                </div>

                {showScanner ? (
                    <div className="space-y-6">
                        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                            <Scanner
                                onScan={handleScan}
                                styles={{
                                    container: { width: '100%', height: '100%' }
                                }}
                            />
                            <div className="absolute inset-0 pointer-events-none border-[30px] border-black/30"></div>
                        </div>
                        <button
                            onClick={() => setShowScanner(false)}
                            className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <X className="w-5 h-5" />
                            Cancelar Escaneo
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <label className="block text-xs font-black text-white/40 uppercase tracking-[0.2em]">Ingresar Token de Premio</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="ABCD-1234"
                                    className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition-all text-2xl font-black tracking-widest text-center uppercase"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => setShowScanner(true)}
                                className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-3 group"
                            >
                                <Scan className="w-6 h-6 text-yellow-500 group-hover:scale-110 transition-transform" />
                                <span className="uppercase tracking-wider text-sm">Escanear QR</span>
                            </button>

                            <button className="w-full py-5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl font-black text-xl transition-all shadow-[0_10px_30px_rgba(234,179,8,0.3)] hover:shadow-[0_15px_40px_rgba(234,179,8,0.5)] hover:-translate-y-1 active:translate-y-0 uppercase tracking-widest">
                                Verificar Token
                            </button>
                        </div>

                        <p className="text-center text-white/30 text-xs font-medium uppercase tracking-widest">
                            Válido solo en puntos autorizados
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
