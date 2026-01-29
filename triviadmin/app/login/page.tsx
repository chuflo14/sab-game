'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { authenticateUser } from '@/lib/actions';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get('next') || '/admin';

    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await authenticateUser(username, pin);

            if (result.success) {
                // Intelligent redirect based on role
                if (result.role === 'ADMIN') {
                    window.location.href = '/admin';
                } else if (result.role === 'REDEEMER') {
                    window.location.href = '/redeem';
                } else {
                    window.location.href = next;
                }
            } else {
                setError(result.message || 'Error de acceso');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-600/20 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/[0.03] backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <div className="text-center mb-10">
                        <span className="text-yellow-500 font-black text-xs uppercase tracking-[0.5em] mb-4 block">Seguridad SAB</span>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tight">Acceso <span className="text-yellow-500">Restringido</span></h1>
                        <p className="text-white/40 text-xs md:text-sm mt-4 font-medium uppercase tracking-widest">Identifíquese para continuar</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Usuario</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="ej: canje1"
                                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition-all font-medium tracking-wide"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">PIN de Acceso</label>
                                <input
                                    type="password"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    placeholder="••••"
                                    className={`w-full p-4 bg-white/5 border ${error ? 'border-red-500' : 'border-white/10'} rounded-2xl text-white placeholder-white/20 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition-all text-center text-xl tracking-[0.5em]`}
                                />
                            </div>

                            {error && (
                                <p className="text-red-500 text-xs font-bold uppercase tracking-widest text-center animate-bounce pt-2">
                                    {error}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl font-black text-xl transition-all shadow-[0_10px_30px_rgba(234,179,8,0.3)] hover:shadow-[0_15px_40px_rgba(234,179,8,0.5)] hover:-translate-y-1 active:translate-y-0 uppercase tracking-widest flex items-center justify-center gap-3 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : (
                                'INGRESAR'
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => router.push('/')}
                            className="w-full py-2 text-white/20 hover:text-white/40 text-xs font-black uppercase tracking-[0.3em] transition-colors"
                        >
                            Cancelar y volver
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-center text-white/20 text-xs font-medium uppercase tracking-widest">
                    SAB GAME LR • SISTEMA DE GESTIÓN
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <LoginForm />
        </Suspense>
    );
}
