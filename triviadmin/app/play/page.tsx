'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';


import { sendJoystickEvent, subscribeToJoystick } from '@/lib/realtime';

export default function InstructionsPage() {
    const router = useRouter();
    const [paymentsEnabled, setPaymentsEnabled] = useState<boolean | null>(null);
    const [enabledSlugs, setEnabledSlugs] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadConfig = async () => {
            // Default to true (payments enabled) unless explicitly disabled by machine
            let qrEnabled = true;
            let loadedSlugs = ['trivia', 'ruleta', 'chango']; // Default all

            const machineId = localStorage.getItem('MACHINE_ID');
            if (machineId) {
                try {
                    const { getMachineById, getGames } = await import('@/lib/dal');
                    const [m, allGames] = await Promise.all([
                        getMachineById(machineId),
                        getGames()
                    ]);

                    if (m) {
                        if (m.qr_enabled === false) qrEnabled = false;

                        if (m.enabledGames && m.enabledGames.length > 0) {
                            loadedSlugs = allGames
                                ? allGames.filter((g: any) => m.enabledGames!.includes(g.id)).map((g: any) => g.slug)
                                : loadedSlugs;
                        }
                    }
                } catch (e) {
                    console.error("Error loading config", e);
                }
            }
            setPaymentsEnabled(qrEnabled);
            setEnabledSlugs(loadedSlugs);
            setIsLoading(false);
        };
        loadConfig();
    }, []);

    const handleGameSelect = useCallback((nextRoute: string) => {
        // Penalties Removedf unsure, or block. 
        // If null, we might want to block interaction or default to true.
        const enabled = paymentsEnabled !== false; // Default true if null/undefined

        console.log(`Game Select: ${nextRoute}, Payment Enabled: ${enabled}`);

        if (enabled) {
            router.push(`/play/payment?next=${encodeURIComponent(nextRoute)}`);
        } else {
            router.push(nextRoute);
        }
    }, [paymentsEnabled, router]);

    useEffect(() => {
        // Timeout to return to home if inactive
        const timeout = setTimeout(() => {
            const mid = localStorage.getItem('MACHINE_ID');
            if (mid) {
                sendJoystickEvent(mid, { type: 'GAME_OVER' });
            }
            router.push('/');
        }, 20000); // 20 seconds

        const handleInput = (key: string) => {
            const upKey = key.toUpperCase();
            console.log("InstructionsPage: Input detected:", upKey);
            if (upKey === 'S') handleGameSelect('/play/pre-game?next=/play/trivia');
            else if (upKey === 'A') handleGameSelect('/play/pre-game?next=/play/azar');
            else if (upKey === 'B') handleGameSelect('/play/pre-game?next=/play/suerte');
            else if (upKey === 'C') handleGameSelect('/play/pre-game?next=/play/simon');
            else if (upKey === 'E') handleGameSelect('/play/pre-game?next=/play/taprace');
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            handleInput(e.key);
        };

        window.addEventListener('keydown', handleKeyDown);

        const machineId = localStorage.getItem('MACHINE_ID');
        let sub: any;

        if (machineId) {
            // Report state to joystick - Force MENU state
            sendJoystickEvent(machineId, { type: 'STATE_CHANGE', state: 'PLAYING', game: 'MENU' });

            // Listen for new connections (JOIN) and resend state
            sub = subscribeToJoystick(machineId, (event) => {
                if (event.type === 'JOIN') {
                    console.log(`InstructionsPage: Player ${event.playerId} joined, resending MENU state`);
                    sendJoystickEvent(machineId, { type: 'STATE_CHANGE', state: 'PLAYING', game: 'MENU' });
                } else if (event.type === 'KEYDOWN' && event.key) {
                    console.log(`InstructionsPage: Joystick keydown: ${event.key}`);
                    handleInput(event.key);
                }
            });
        }

        return () => {
            clearTimeout(timeout);
            window.removeEventListener('keydown', handleKeyDown);
            if (sub) sub.unsubscribe();
        };
    }, [router, paymentsEnabled, handleGameSelect]); // Add handleGameSelect dependency

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 md:p-8 text-center space-y-8 md:space-y-12">
            <h1 className="text-4xl md:text-6xl font-black text-yellow-500 uppercase tracking-wider mb-4 md:mb-8 mt-4">
                ¡Bienvenido a SAB GAME LR!
            </h1>

            <div className="flex-1 flex flex-col justify-center w-full max-w-4xl space-y-8 md:space-y-12">
                <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-8 drop-shadow-lg">Elige tu modo de juego:</h2>

                <div className="flex flex-col gap-6 md:gap-8 text-xl md:text-2xl">
                    {isLoading ? (
                        <div className="text-center text-yellow-500 animate-pulse">Cargando juegos...</div>
                    ) : (
                        <>
                            {enabledSlugs.includes('trivia') && (
                                <button
                                    onClick={() => handleGameSelect('/play/pre-game?next=/play/trivia')}
                                    className="w-full p-6 md:p-10 border border-white/20 rounded-[2rem] bg-white/10 flex items-center justify-between text-left group hover:bg-white/20 transition-all transform hover:scale-[1.02] cursor-pointer shadow-lg active:scale-95"
                                >
                                    <div className="min-w-0 pr-4">
                                        <span className="block text-3xl md:text-5xl font-black text-blue-400 mb-2 truncate drop-shadow-md">Trivia Riojana</span>
                                        <span className="text-sm md:text-xl text-gray-300 font-medium">El desafío mental con identidad local</span>
                                    </div>
                                    <div className="bg-blue-400 text-black w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center font-black text-3xl md:text-5xl shadow-[0_0_30px_rgba(59,130,246,0.4)] shrink-0">S</div>
                                </button>
                            )}

                            {enabledSlugs.includes('ruleta') && (
                                <button
                                    onClick={() => handleGameSelect('/play/pre-game?next=/play/azar')}
                                    className="w-full p-6 md:p-10 border border-white/20 rounded-[2rem] bg-white/10 flex items-center justify-between text-left group hover:bg-white/20 transition-all transform hover:scale-[1.02] cursor-pointer shadow-lg active:scale-95"
                                >
                                    <div className="min-w-0 pr-4">
                                        <span className="block text-3xl md:text-5xl font-black text-red-500 mb-2 truncate drop-shadow-md">La Ruleta</span>
                                        <span className="text-sm md:text-xl text-gray-300 font-medium">El azar puro con un toque divertido</span>
                                    </div>
                                    <div className="bg-red-500 text-white w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center font-black text-3xl md:text-5xl shadow-[0_0_30px_rgba(239,68,68,0.4)] shrink-0">A</div>
                                </button>
                            )}

                            {enabledSlugs.includes('chango') && (
                                <button
                                    onClick={() => handleGameSelect('/play/pre-game?next=/play/suerte')}
                                    className="w-full p-6 md:p-10 border border-white/20 rounded-[2rem] bg-white/10 flex items-center justify-between text-left group hover:bg-white/20 transition-all transform hover:scale-[1.02] cursor-pointer shadow-lg active:scale-95"
                                >
                                    <div className="min-w-0 pr-4">
                                        <span className="block text-3xl md:text-5xl font-black text-orange-500 mb-2 truncate drop-shadow-md">Dedo de Chango</span>
                                        <span className="text-sm md:text-xl text-gray-300 font-medium">¡Inflá el globo lo más rápido posible!</span>
                                    </div>
                                    <div className="bg-orange-500 text-white w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center font-black text-3xl md:text-5xl shadow-[0_0_30px_rgba(249,115,22,0.4)] shrink-0">B</div>
                                </button>
                            )}

                            {enabledSlugs.includes('simon') && (
                                <button
                                    onClick={() => handleGameSelect('/play/pre-game?next=/play/simon')}
                                    className="w-full p-6 md:p-10 border border-white/20 rounded-[2rem] bg-white/10 flex items-center justify-between text-left group hover:bg-white/20 transition-all transform hover:scale-[1.02] cursor-pointer shadow-lg active:scale-95"
                                >
                                    <div className="min-w-0 pr-4">
                                        <span className="block text-3xl md:text-5xl font-black text-green-500 mb-2 truncate drop-shadow-md">Simón Dice</span>
                                        <span className="text-sm md:text-xl text-gray-300 font-medium">¡Sigue la secuencia de colores!</span>
                                    </div>
                                    <div className="bg-green-500 text-white w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center font-black text-3xl md:text-5xl shadow-[0_0_30px_rgba(34,197,94,0.4)] shrink-0">S</div>
                                </button>
                            )}



                            {enabledSlugs.includes('taprace') && (
                                <button
                                    onClick={() => handleGameSelect('/play/pre-game?next=/play/taprace')}
                                    className="w-full p-6 md:p-10 border border-white/20 rounded-[2rem] bg-white/10 flex items-center justify-between text-left group hover:bg-white/20 transition-all transform hover:scale-[1.02] cursor-pointer shadow-lg active:scale-95"
                                >
                                    <div className="min-w-0 pr-4">
                                        <span className="block text-3xl md:text-5xl font-black text-orange-500 mb-2 truncate drop-shadow-md">Carrera</span>
                                        <span className="text-sm md:text-xl text-gray-300 font-medium">¡Toca rápido para ganar!</span>
                                    </div>
                                    <div className="bg-orange-600 text-white w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center font-black text-3xl md:text-5xl shadow-[0_0_30px_rgba(234,88,12,0.4)] shrink-0">C</div>
                                </button>
                            )}
                        </>
                    )}
                </div>

                <div className="mt-8 md:mt-12 p-6 md:p-8 bg-yellow-900/30 border border-yellow-600/50 rounded-2xl md:rounded-3xl max-w-3xl w-full text-center">
                    <h3 className="text-2xl md:text-4xl font-bold text-yellow-400 mb-4 md:mb-6 uppercase tracking-wider">¡Importante!</h3>
                    <p className="text-xl md:text-3xl leading-relaxed font-medium">
                        Si ganas: Aparecerá un código QR durante 20 segundos.
                        <br className="my-2" />
                        <span className="font-bold text-white underline decoration-yellow-500 underline-offset-8">¡Tómale una foto rápido!</span>
                        <br className="my-2" />
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
        </div>
    );
}
