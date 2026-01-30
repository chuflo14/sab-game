'use client';

import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Scan, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RedeemPage() {
    const [token, setToken] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

    const handleScan = (result: any) => {
        if (result) {
            const value = result?.[0]?.rawValue || result?.text || result;
            if (value) {
                setToken(value);
                setShowScanner(false);
                // Optional: Auto verify on scan? Maybe better to let user confirm.
            }
        }
    };

    const handleVerify = async () => {
        if (!token.trim()) return;

        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                setResult({ success: true, message: data.message || 'Canje exitoso', data: data.ticket });
                toast.success('¡Premio canjeado correctamente!');
            } else {
                setResult({ success: false, message: data.error || 'Error al verificar' });
                if (data.error === 'QR ya fue utilizado.') {
                    toast.error('Este QR ya fue utilizado anteriormente.');
                } else {
                    toast.error(data.error || 'Error al canjear.');
                }
            }
        } catch (err) {
            console.error(err);
            setResult({ success: false, message: 'Error de conexión. Intente nuevamente.' });
            toast.error('Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setToken('');
        setResult(null);
        setShowScanner(false);
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

            <div className="relative z-10 w-full max-w-md bg-white/[0.03] backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden min-h-[500px] flex flex-col justify-center">
                {/* Decorative Shine */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl" />

                <div className="flex flex-col items-center mb-10">
                    <span className="text-yellow-500 font-black text-xs uppercase tracking-[0.5em] mb-4">SAB Game LR</span>
                    <h1 className="text-4xl font-black text-center uppercase tracking-tight">Canje de <span className="text-yellow-500">Premios</span></h1>
                    <div className="h-1 w-20 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent mt-4" />
                </div>

                {showScanner ? (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
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
                ) : result ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
                        {result.success ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                                    <CheckCircle className="w-12 h-12 text-green-500" />
                                </div>
                                <h2 className="text-2xl font-black text-green-400 uppercase">¡Canje Exitoso!</h2>
                                <p className="text-white/70">El premio ha sido registrado como entregado.</p>
                                {result.data && (
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 w-full mt-2">
                                        <p className="text-xs text-white/40 uppercase tracking-widest mb-1">ID Ticket</p>
                                        <p className="font-mono text-sm">{result.data.token}</p>
                                        <p className="text-xs text-white/40 uppercase tracking-widest mb-1 mt-3">Juego</p>
                                        <p className="font-bold capitalize">{result.data.game_type}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-2 text-red-500">
                                    <AlertCircle className="w-12 h-12" />
                                </div>
                                <h2 className="text-2xl font-black text-red-400 uppercase">Error de Canje</h2>
                                <p className="text-xl font-bold text-white">{result.message}</p>
                                <p className="text-white/50 text-sm">Verifique el código e intente nuevamente.</p>
                            </div>
                        )}

                        <button
                            onClick={reset}
                            className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-widest mt-4"
                        >
                            Nuevo Canje
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-3">
                            <label className="block text-xs font-black text-white/40 uppercase tracking-[0.2em]">Ingresar Token de Premio</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="ABCD-1234"
                                    className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition-all text-2xl font-black tracking-widest text-center uppercase group-hover:bg-white/10"
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

                            <button
                                onClick={handleVerify}
                                disabled={loading || !token}
                                className="w-full py-5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-2xl font-black text-xl transition-all shadow-[0_10px_30px_rgba(234,179,8,0.3)] hover:shadow-[0_15px_40px_rgba(234,179,8,0.5)] hover:-translate-y-1 active:translate-y-0 uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        Verificando...
                                    </>
                                ) : (
                                    'Verificar Token'
                                )}
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
