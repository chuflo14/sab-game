'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';


import { fetchChangoConfig } from '@/lib/actions';

export default function InstructionsPage() {
    const router = useRouter();
    const [paymentsEnabled, setPaymentsEnabled] = useState<boolean | null>(null);

    useEffect(() => {
        fetchChangoConfig().then(config => {
            setPaymentsEnabled(config?.enable_payments !== false);
        });
    }, []);

    const handleGameSelect = (nextRoute: string) => {
        // If loading, default to payment enabled for safety, or wait. 
        // Let's safe fail to payment flow if unsure, or block. 
        // If null, we might want to block interaction or default to true.
        const enabled = paymentsEnabled !== false; // Default true if null/undefined

        console.log(`Game Select: ${nextRoute}, Payment Enabled: ${enabled}`);

        if (enabled) {
            router.push(`/play/payment?next=${encodeURIComponent(nextRoute)}`);
        } else {
            router.push(nextRoute);
        }
    };

    useEffect(() => {
        // Timeout to return to home if inactive
        const timeout = setTimeout(() => {
            router.push('/');
        }, 20000); // 20 seconds

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toUpperCase();

            console.log("InstructionsPage: Key down detected:", key);
            if (key === 'S') {
                console.log("InstructionsPage: S key pressed");
                handleGameSelect('/play/pre-game?next=/play/trivia');
            } else if (key === 'A') {
                console.log("InstructionsPage: A key pressed");
                handleGameSelect('/play/pre-game?next=/play/azar');
            } else if (key === 'B') {
                console.log("InstructionsPage: B key pressed");
                handleGameSelect('/play/pre-game?next=/play/suerte');
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            clearTimeout(timeout);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [router, paymentsEnabled]); // Add paymentsEnabled dependency

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 md:p-8 text-center space-y-8 md:space-y-12">
            <h1 className="text-4xl md:text-6xl font-black text-yellow-500 uppercase tracking-wider mb-4 md:mb-8 mt-4">
                ¡Bienvenido a SAB GAME LR!
            </h1>

            <div className="space-y-4 md:space-y-6 max-w-4xl w-full">
                <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-8">Elige tu modo de juego:</h2>

                <div className="grid grid-cols-1 gap-4 md:gap-6 text-xl md:text-2xl">
                    <button
                        onClick={() => handleGameSelect('/play/pre-game?next=/play/trivia')}
                        className="w-full p-4 md:p-6 border border-white/20 rounded-2xl bg-white/5 flex items-center justify-between text-left group hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        <div className="min-w-0 pr-4">
                            <span className="block text-2xl md:text-4xl font-black text-blue-400 mb-1 truncate">Trivia Riojana</span>
                            <span className="text-xs md:text-gray-400 line-clamp-1 md:line-clamp-none">El desafío mental con identidad local</span>
                        </div>
                        <div className="bg-blue-400 text-black px-4 py-1 md:px-6 md:py-2 rounded-xl font-black text-2xl md:text-4xl shadow-[0_0_20px_rgba(59,130,246,0.3)] shrink-0">S</div>
                    </button>

                    <button
                        onClick={() => handleGameSelect('/play/pre-game?next=/play/azar')}
                        className="w-full p-4 md:p-6 border border-white/20 rounded-2xl bg-white/5 flex items-center justify-between text-left group hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        <div className="min-w-0 pr-4">
                            <span className="block text-2xl md:text-4xl font-black text-red-500 mb-1 truncate">La Ruleta del Chacho</span>
                            <span className="text-xs md:text-gray-400 line-clamp-1 md:line-clamp-none">El azar puro con un toque divertido y nuestro</span>
                        </div>
                        <div className="bg-red-500 text-white px-4 py-1 md:px-6 md:py-2 rounded-xl font-black text-2xl md:text-4xl shadow-[0_0_20px_rgba(239,68,68,0.3)] shrink-0">A</div>
                    </button>

                    <button
                        onClick={() => handleGameSelect('/play/pre-game?next=/play/suerte')}
                        className="w-full p-4 md:p-6 border border-white/20 rounded-2xl bg-white/5 flex items-center justify-between text-left group hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        <div className="min-w-0 pr-4">
                            <span className="block text-2xl md:text-4xl font-black text-orange-500 mb-1 truncate">Dedo de Chango</span>
                            <span className="text-xs md:text-gray-400 line-clamp-1 md:line-clamp-none">¡Inflá el globo lo más rápido posible!</span>
                        </div>
                        <div className="bg-orange-500 text-white px-4 py-1 md:px-6 md:py-2 rounded-xl font-black text-2xl md:text-4xl shadow-[0_0_20px_rgba(249,115,22,0.3)] shrink-0">B</div>
                    </button>
                </div>
            </div>

            <div className="mt-8 md:mt-12 p-4 md:p-6 bg-yellow-900/30 border border-yellow-600/50 rounded-xl max-w-3xl w-full">
                <h3 className="text-xl md:text-2xl font-bold text-yellow-400 mb-2 md:mb-4">¡Importante!</h3>
                <p className="text-sm md:text-xl leading-relaxed">
                    Si ganas: Aparecerá un código QR durante 20 segundos.
                    <br />
                    <span className="font-bold text-white underline decoration-yellow-500 underline-offset-4">¡Tómale una foto rápido!</span>
                    <br />
                    la necesitarás para reclamar tu premio.
                </p>
            </div>

            <div className="mt-auto pt-12 pb-4 flex gap-8 opacity-20 hover:opacity-100 transition-opacity duration-500">
                <button
                    onClick={() => router.push('/login')}
                    className="px-6 py-2 border border-white/10 rounded-full hover:bg-white/5 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2"
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    Acceso Restringido
                </button>
            </div>
        </div>
    );
}

