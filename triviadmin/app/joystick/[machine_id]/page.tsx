'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { sendJoystickEvent, subscribeToJoystick, JoystickEvent } from '@/lib/realtime';
import { fetchMachineDetails } from '@/lib/actions';

export default function JoystickPage() {
    const params = useParams();
    const machineId = params.machine_id;
    const mid = Array.isArray(machineId) ? machineId[0] : machineId;

    const [status, setStatus] = useState<'READY' | 'PAYING' | 'PLAYING' | 'WAITING' | 'GAME_OVER' | 'TIMEOUT'>('WAITING');
    const [gameType, setGameType] = useState<'TRIVIA' | 'RULETA' | 'CHANGO' | 'MENU'>('MENU');
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [machineName, setMachineName] = useState<string>('');
    const [machineShortId, setMachineShortId] = useState<string>('');

    useEffect(() => {
        if (mid) {
            fetchMachineDetails(mid).then(details => {
                if (details) {
                    setMachineName(details.name);
                    setMachineShortId(details.short_id || '');
                }
            });
        }
    }, [mid]);

    useEffect(() => {
        // console.log("JoystickPage: Mounted. Params:", params);
        // console.log("JoystickPage: Resolved ID:", mid);

        if (!mid) {
            console.error("JoystickPage: No machineID found in params");
            return;
        }

        console.log("JoystickPage: Connecting to machine:", mid);
        const channel = subscribeToJoystick(mid, (payload) => {
            console.log("JoystickPage: Event received:", payload);
            if (payload.type === 'STATE_CHANGE') {
                setStatus(payload.state);
                if (payload.game) {
                    setGameType(payload.game);
                }
                if (payload.paymentUrl) {
                    setPaymentUrl(payload.paymentUrl);
                }
            } else if (payload.type === 'GAME_OVER') {
                setStatus('GAME_OVER');
                setTimeout(() => {
                    setIsConnected(false); // Disconnect logic visual only for now, forces user to leave or refresh
                    setStatus('WAITING'); // Or keep as GAME_OVER for a "Thank you" screen
                }, 2000);
            } else if (payload.type === 'TIMEOUT') {
                setStatus('TIMEOUT');
                setTimeout(() => {
                    setIsConnected(false);
                    setStatus('WAITING');
                }, 3000);
            }
        });

        setIsConnected(true);

        return () => {
            console.log("JoystickPage: Unsubscribing...");
            channel.unsubscribe();
        };
    }, [mid]);

    const handlePress = useCallback(async (key: string) => {
        if (!mid || status === 'GAME_OVER') return;

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        console.log("JoystickPage: Sending Keydown:", key);
        await sendJoystickEvent(mid, { type: 'KEYDOWN', key });
    }, [mid, status]);

    const handleStart = useCallback(async () => {
        if (!mid) return;
        console.log("JoystickPage: Sending START");
        await sendJoystickEvent(mid, { type: 'START' });
    }, [mid]);

    if (!mid) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4 text-center">
                <p className="text-red-500 font-bold mb-2">Error de Conexión</p>
                <p className="text-gray-400">No se encontró el ID de la máquina en la URL.</p>
                <pre className="bg-gray-800 p-2 rounded mt-4 text-xs text-left overflow-auto max-w-full">
                    {JSON.stringify(params, null, 2)}
                </pre>
            </div>
        )
    }

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white text-center p-8 space-y-6">
                {status === 'GAME_OVER' ? (
                    <>
                        <h1 className="text-3xl font-black text-yellow-500 uppercase tracking-widest">¡Juego Terminado!</h1>
                        <p className="text-gray-400">Gracias por jugar. La conexión ha finalizado.</p>
                        <p className="text-xs text-slate-600 uppercase tracking-wider mt-12">Escanea el QR nuevamente para jugar</p>
                    </>
                ) : (
                    <>
                        <div className="w-12 h-12 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin"></div>
                        <p className="animate-pulse">Sincronizando con terminal...</p>
                        <p className="text-xs text-gray-600 font-mono">ID: {mid.slice(0, 8)}...</p>
                    </>
                )}
            </div>
        );
    }

    if (status === 'GAME_OVER') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4 text-center animate-in fade-in duration-700">
                <div className="text-6xl mb-4">👋</div>
                <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-2">¡Partida Finalizada!</h1>
                <p className="text-gray-400">Gracias por participar.</p>
                <div className="mt-8 text-xs text-slate-700 uppercase tracking-[0.2em] font-bold">Desconectando joystick...</div>
            </div>
        )
    }

    if (status === 'TIMEOUT') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4 text-center animate-in fade-in duration-700">
                <div className="text-6xl mb-4">⏳</div>
                <h1 className="text-3xl font-black text-red-500 uppercase tracking-widest mb-2">¡Tiempo Agotado!</h1>
                <p className="text-gray-400">Se ha excedido el tiempo de espera para el pago.</p>
                <div className="mt-8 text-xs text-slate-700 uppercase tracking-[0.2em] font-bold">Desconectando...</div>
            </div>
        )
    }

    const renderControls = () => {
        // MENU CONTROLS
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

        // TRIVIA CONTROLS
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

        // RULETA CONTROLS
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

        // CHANGO CONTROLS
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

        // Default fallback
        return (
            <div className="text-center text-gray-500">
                Esperando configuración del juego...
            </div>
        );
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
                    <span className="text-slate-500 text-[10px]">ID TERMINAL</span>
                    <span className="text-cyan-400">{machineShortId || '...'}</span>
                </div>
            </div>

            {/* Main Interface Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
                {status === 'WAITING' || status === 'READY' ? (
                    <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
                        <div className="text-center">
                            <h1 className="text-3xl font-black text-yellow-500 mb-2">¡MÁQUINA LISTA!</h1>
                            <p className="text-gray-400">Toca el botón para empezar</p>
                        </div>
                        <button
                            onClick={handleStart}
                            className="w-48 h-48 rounded-full bg-yellow-500 text-black font-black text-xl leading-tight px-6 shadow-[0_0_50px_rgba(234,179,8,0.4)] active:scale-90 transition-transform flex items-center justify-center border-8 border-yellow-600/50 uppercase"
                        >
                            Comenzar a jugar ahora
                        </button>
                    </div>
                ) : status === 'PAYING' ? (
                    <div className="flex flex-col items-center gap-8 text-center animate-in fade-in slide-in-from-bottom duration-500">
                        <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                            <span className="text-4xl text-blue-500 animate-bounce">$</span>
                        </div>
                        <h1 className="text-3xl font-black text-blue-400">FASE DE PAGO</h1>
                        <p className="text-lg text-gray-300">
                            Por favor, usa tu app de <span className="font-bold text-white">Mercado Pago</span> para escanear el QR en la pantalla de la máquina.
                        </p>
                        {paymentUrl && (
                            <a
                                href={paymentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full mt-4 p-4 bg-blue-500 text-white rounded-xl font-bold text-lg shadow-[0_4px_0_rgb(30,58,138)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                            >
                                <span>📲</span>
                                <span>Pagar con Mercado Pago</span>
                            </a>
                        )}
                    </div>
                ) : (
                    // PLAYING STATE - Render specific controls
                    renderControls()
                )}
            </div>

            {/* Footer */}
            <div className="w-full text-center text-[10px] text-slate-700 font-bold uppercase tracking-[0.3em] pb-4">
                Sistema SABGAME La Rioja
            </div>
        </div>
    );
}
