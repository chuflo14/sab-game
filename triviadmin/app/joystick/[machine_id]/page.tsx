'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { subscribeToJoystick, sendJoystickEvent } from '@/lib/realtime';
import { fetchMachineDetails } from '@/lib/actions';

export default function JoystickPage() {
    const params = useParams();
    const rawMachineId = Array.isArray(params.machine_id) ? params.machine_id[0] : params.machine_id;

    // Parse Player and Real Machine ID
    const [machineId, setMachineId] = useState<string | null>(null);
    const [playerId, setPlayerId] = useState<number>(1);

    const [gameState, setGameState] = useState<'INITIALIZING' | 'WAITING' | 'READY' | 'PLAYING' | 'PAYING' | 'PAYMENT_APPROVED'>('INITIALIZING');
    const [gameType, setGameType] = useState<'MENU' | 'TRIVIA' | 'RULETA' | 'CHANGO' | 'SIMON' | 'PENALTIES' | 'TAPRACE' | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [machineName, setMachineName] = useState<string>('');

    // Tap Race State - direct event sending
    // const [tapCount, setTapCount] = useState(0);

    useEffect(() => {
        if (rawMachineId) {
            let realId = rawMachineId;
            let pId = 1;

            if (rawMachineId.endsWith('-P2')) {
                realId = rawMachineId.replace('-P2', '');
                pId = 2;
            } else if (rawMachineId.endsWith('-P3')) {
                realId = rawMachineId.replace('-P3', '');
                pId = 3;
            } else if (rawMachineId.endsWith('-P1')) {
                realId = rawMachineId.replace('-P1', '');
                pId = 1;
            }

            setMachineId(realId);
            setPlayerId(pId);

            fetchMachineDetails(realId).then(details => {
                if (details) {
                    setMachineName(details.name);
                }
            });
        }
    }, [rawMachineId]);


    useEffect(() => {
        if (!machineId) return;

        console.log("JoystickPage: Connecting to machine:", machineId, "Player:", playerId);

        // Fallback: If connection takes too long, force READY state (Optimistic UI)
        const fallbackTimer = setTimeout(() => {
            setGameState(current => current === 'INITIALIZING' ? 'READY' : current);
        }, 3000);

        // Create subscription first
        const channel = subscribeToJoystick(machineId, (payload) => {
            console.log("JoystickPage: Event received:", payload);
            if (payload.type === 'STATE_CHANGE') {
                setGameState(payload.state);
                if (payload.game) {
                    setGameType(payload.game as any);
                }
                if (payload.paymentUrl) {
                    window.location.href = payload.paymentUrl;
                }
            } else if (payload.type === 'GAME_OVER') {
                setGameState('WAITING');
                setTimeout(() => {
                    setIsConnected(false);
                    setGameState('WAITING');
                }, 2000);
            } else if (payload.type === 'TIMEOUT') {
                setGameState('WAITING'); // Was TIMEOUT state?
                setTimeout(() => {
                    setIsConnected(false);
                    setGameState('WAITING');
                }, 3000);
            }
        }, (status) => {
            if (status === 'SUBSCRIBED') {
                console.log("JoystickPage: Subscribed! Sending JOIN...");
                // Notify Join ONLY after we are listening
                sendJoystickEvent(machineId, { type: 'JOIN', playerId });
                setIsConnected(true);
            }
        });

        return () => {
            console.log("JoystickPage: Unsubscribing...");
            clearTimeout(fallbackTimer);
            channel.unsubscribe();
        };
    }, [machineId, playerId]);

    const handlePress = useCallback(async (key: string) => {
        if (!machineId || gameState === 'WAITING') return; // approximate check

        // One-way vibration
        if (navigator.vibrate) navigator.vibrate(50);

        if (gameType === 'TAPRACE' && key === 'TAP') {
            await sendJoystickEvent(machineId, { type: 'TAP', playerId });
        } else {
            await sendJoystickEvent(machineId, { type: 'KEYDOWN', key }); // Key can be color
        }

    }, [machineId, gameState, gameType, playerId]);

    if (!machineId) return <div className="bg-black text-white p-4">Error: Sin ID</div>;

    if (!isConnected || gameState === 'INITIALIZING') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white text-center p-8 space-y-6">
                <div className="w-12 h-12 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin"></div>
                <p className="animate-pulse">CONECTANDO...</p>
                <p className="text-xs text-gray-600 font-mono">ID: {machineId.slice(0, 8)}</p>
            </div>
        );
    }

    if (gameState === 'WAITING') return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
            <h1 className="text-3xl font-black mb-2">¡FIN!</h1>
            <p>Gracias por jugar</p>
        </div>
    );

    // ... Copy the rest of existing renderControls logic and append TapRace ...
    const renderControls = () => {
        if (!gameType) return <div>Esperando juego...</div>;

        if (gameType === 'MENU') {
            return (
                <div className="grid grid-cols-1 gap-4 w-full animate-in fade-in zoom-in duration-500">
                    <h2 className="text-center text-slate-500 uppercase font-black tracking-widest mb-2">Menú Principal</h2>
                    <button onClick={() => handlePress('S')} className="w-full p-6 bg-blue-600/90 text-white rounded-2xl font-black text-2xl shadow-[0_8px_0_rgb(30,58,138)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-between">
                        <span>TRIVIA</span>
                        <span className="bg-black/20 px-3 py-1 rounded-lg text-lg">S</span>
                    </button>
                    <button onClick={() => handlePress('A')} className="w-full p-6 bg-red-600/90 text-white rounded-2xl font-black text-2xl shadow-[0_8px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-between">
                        <span>RULETA</span>
                        <span className="bg-black/20 px-3 py-1 rounded-lg text-lg">A</span>
                    </button>
                    <button onClick={() => handlePress('B')} className="w-full p-6 bg-orange-600/90 text-white rounded-2xl font-black text-2xl shadow-[0_8px_0_rgb(154,52,18)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-between">
                        <span>CHANGO</span>
                        <span className="bg-black/20 px-3 py-1 rounded-lg text-lg">B</span>
                    </button>
                </div>
            );
        }

        if (gameType === 'TRIVIA') {
            return (
                <div className="grid grid-cols-1 gap-4 w-full animate-in fade-in zoom-in duration-500">
                    <h2 className="text-center text-yellow-500/50 uppercase font-black tracking-widest mb-2">Trivia Riojana</h2>
                    <button onClick={() => handlePress('S')} className="w-full p-8 bg-blue-500 text-black rounded-3xl font-black text-3xl shadow-[0_10px_0_rgb(30,58,138)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-4">
                        <span className="bg-white/20 px-4 py-2 rounded-xl">S</span>
                        <span>OPCIÓN 1</span>
                    </button>
                    <button onClick={() => handlePress('A')} className="w-full p-8 bg-red-500 text-white rounded-3xl font-black text-3xl shadow-[0_10px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-4">
                        <span className="bg-black/20 px-4 py-2 rounded-xl">A</span>
                        <span>OPCIÓN 2</span>
                    </button>
                    <button onClick={() => handlePress('B')} className="w-full p-8 bg-orange-500 text-white rounded-3xl font-black text-3xl shadow-[0_10px_0_rgb(154,52,18)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-4">
                        <span className="bg-black/20 px-4 py-2 rounded-xl">B</span>
                        <span>OPCIÓN 3</span>
                    </button>
                </div>
            );
        }

        if (gameType === 'RULETA') {
            return (
                <div className="flex flex-col items-center justify-center w-full animate-in fade-in zoom-in duration-500">
                    <h2 className="text-center text-yellow-500/50 uppercase font-black tracking-widest mb-8">La Ruleta</h2>
                    <button
                        onClick={() => handlePress('S')}
                        className="w-56 h-56 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white font-black text-3xl shadow-[0_0_60px_rgba(239,68,68,0.5)] active:scale-95 transition-transform flex flex-col items-center justify-center border-8 border-red-800/50 uppercase tracking-widest gap-2"
                    >
                        <span className="text-5xl">🔄</span>
                        <span>GIRAR</span>
                    </button>
                </div>
            );
        }

        if (gameType === 'CHANGO') {
            return (
                <div className="grid grid-cols-2 gap-4 w-full animate-in fade-in zoom-in duration-500">
                    <h2 className="col-span-2 text-center text-yellow-500/50 uppercase font-black tracking-widest mb-2">¡INFLÁ EL GLOBO!</h2>
                    <button onClick={() => handlePress('S')} className="col-span-2 p-6 bg-yellow-500 text-black rounded-2xl font-black text-2xl shadow-[0_6px_0_rgb(161,98,7)] active:translate-y-1 active:shadow-none transition-all uppercase">
                        💨 INFLAR (S)
                    </button>
                    <button onClick={() => handlePress('A')} className="p-8 bg-yellow-600 text-black rounded-2xl font-black text-2xl shadow-[0_6px_0_rgb(161,98,7)] active:translate-y-1 active:shadow-none transition-all uppercase">
                        (A)
                    </button>
                    <button onClick={() => handlePress('B')} className="p-8 bg-yellow-600 text-black rounded-2xl font-black text-2xl shadow-[0_6px_0_rgb(161,98,7)] active:translate-y-1 active:shadow-none transition-all uppercase">
                        (B)
                    </button>
                </div>
            );
        }

        if (gameType === 'SIMON') {
            return (
                <div className="grid grid-cols-2 gap-4 w-full animate-in fade-in zoom-in duration-500 p-2">
                    <h2 className="col-span-2 text-center text-yellow-500/50 uppercase font-black tracking-widest mb-2 font-mono">SIMÓN DICE</h2>
                    {/* GREEN (Top Left) */}
                    <button onClick={() => handlePress('GREEN')} className="aspect-square bg-green-500 rounded-tl-[3rem] rounded-br-[1rem] shadow-[0_6px_0_rgb(21,128,61)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center">
                    </button>
                    {/* RED (Top Right) */}
                    <button onClick={() => handlePress('RED')} className="aspect-square bg-red-500 rounded-tr-[3rem] rounded-bl-[1rem] shadow-[0_6px_0_rgb(185,28,28)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center">
                    </button>
                    {/* YELLOW (Bottom Left) */}
                    <button onClick={() => handlePress('YELLOW')} className="aspect-square bg-yellow-400 rounded-bl-[3rem] rounded-tr-[1rem] shadow-[0_6px_0_rgb(161,98,7)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center">
                    </button>
                    {/* BLUE (Bottom Right) */}
                    <button onClick={() => handlePress('BLUE')} className="aspect-square bg-blue-500 rounded-br-[3rem] rounded-tl-[1rem] shadow-[0_6px_0_rgb(29,78,216)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center">
                    </button>
                </div>
            );
        }

        if (gameType === 'PENALTIES') {
            return (
                <div className="flex flex-col items-center justify-center w-full h-[60vh] animate-in fade-in zoom-in duration-500 p-4">
                    <h2 className="text-center text-emerald-500/50 uppercase font-black tracking-widest mb-8 animate-pulse">¡Momento de Patear!</h2>
                    <button
                        onClick={() => handlePress('SHOOT')}
                        className="w-full max-w-sm aspect-square bg-white rounded-full border-[1.5rem] border-black shadow-[0_10px_0_rgb(0,0,0)] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center group"
                    >
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-6xl group-active:scale-125 transition-transform">⚽</span>
                            <span className="font-black text-2xl text-slate-900 uppercase tracking-widest">PATEAR</span>
                        </div>
                    </button>
                </div>
            );
        }

        if (gameType === 'TAPRACE') {
            return (
                <div className="flex flex-col items-center justify-center w-full h-[60vh] animate-in fade-in zoom-in duration-500 p-4">
                    <h2 className="text-center text-orange-500 uppercase font-black tracking-widest mb-4 animate-pulse">
                        JUGADOR {playerId}
                    </h2>
                    <p className="text-xs text-slate-500 mb-8 uppercase tracking-widest">Presiona rápido para correr</p>

                    <button
                        onClick={() => handlePress('TAP')}
                        className="w-full max-w-sm aspect-square bg-orange-500 rounded-3xl border-b-[1.5rem] border-orange-700 shadow-2xl active:border-b-0 active:translate-y-4 transition-all flex items-center justify-center group"
                    >
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-6xl group-active:scale-125 transition-transform">🚀</span>
                            <span className="font-black text-3xl text-white uppercase tracking-widest">TURBO</span>
                        </div>
                    </button>
                </div>
            );
        }

        return <div>Juego desconocido</div>;
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between p-8 font-sans overflow-hidden">
            {/* Header */}
            <div className="w-full flex justify-between items-center text-xs font-black uppercase tracking-widest border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <div className="flex flex-col">
                        <span className="text-slate-400 text-[10px]">Conectado a</span>
                        <span className="text-white text-sm">{machineName || 'Terminal'}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-slate-500 text-[10px]">JUGADOR {playerId}</span>
                    <span className="text-orange-500 text-lg">P{playerId}</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
                {gameState === 'READY' ? (
                    <div className="text-center">
                        <h1 className="text-3xl font-black text-yellow-500 mb-2">¡LISTO!</h1>
                        <button
                            onClick={() => handlePress('S')}
                            className="w-full px-8 py-4 bg-green-500 text-white rounded-full font-black text-2xl uppercase tracking-widest shadow-lg animate-bounce"
                        >
                            COMENZAR
                        </button>
                    </div>
                ) : gameState === 'PAYING' ? (
                    <div className="text-center">
                        <h1 className="text-3xl font-black text-blue-500">PAGANDO...</h1>
                    </div>
                ) : (
                    renderControls()
                )}
            </div>

            <div className="w-full text-center text-[10px] text-slate-700 font-bold uppercase tracking-[0.3em] pb-4">
                SABGAME P{playerId}
            </div>
        </div>
    );
}
