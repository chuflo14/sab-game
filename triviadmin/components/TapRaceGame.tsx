'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeToJoystick, sendJoystickEvent } from '@/lib/realtime';
import { fetchChangoConfig } from '@/lib/actions';
import { ChangoConfig } from '@/lib/types';
import { Trophy } from 'lucide-react';
import QRCode from 'react-qr-code';

export default function TapRaceGame() {
    const router = useRouter();
    const [gameState, setGameState] = useState<'LOBBY' | 'RACING' | 'RESULT'>('LOBBY');
    const [players, setPlayers] = useState<{ id: number, connected: boolean, progress: number, name: string }[]>([
        { id: 1, connected: false, progress: 0, name: 'JUGADOR 1' },
        { id: 2, connected: false, progress: 0, name: 'JUGADOR 2' },
        { id: 3, connected: false, progress: 0, name: 'JUGADOR 3' }
    ]);
    const [winner, setWinner] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const [config, setConfig] = useState<ChangoConfig | null>(null);
    const [machineId, setMachineId] = useState<string | null>(null);
    const [baseUrl, setBaseUrl] = useState('');

    const endGame = useCallback((winnerId: number | null) => {
        setWinner(winnerId);
        setGameState('RESULT');
        if (machineId) {
            sendJoystickEvent(machineId, { type: 'GAME_OVER' });
        }

        setTimeout(() => {
            router.push('/');
        }, 5000);
    }, [machineId, router]);

    const startGame = useCallback(() => {
        setGameState('RACING');
        if (machineId) {
            sendJoystickEvent(machineId, { type: 'STATE_CHANGE', state: 'PLAYING', game: 'TAPRACE' });
        }

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    endGame(null); // Timeout
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [machineId, endGame]);

    const handleTap = useCallback((playerId: number) => {
        setGameState(current => {
            if (current !== 'RACING') return current;

            setPlayers(prevPlayers => {
                const nextPlayers = prevPlayers.map(p => {
                    if (p.id !== playerId) return p;

                    const difficulty = config?.taprace_difficulty || 100;
                    const perClick = 100 / difficulty;
                    const nextProgress = Math.min(100, p.progress + perClick);

                    return { ...p, progress: nextProgress };
                });
                return nextPlayers;
            });

            return current;
        });
    }, [config]);

    // Hydration & Config
    useEffect(() => {
        setBaseUrl(window.location.origin);
        const mid = localStorage.getItem('MACHINE_ID');
        setMachineId(mid);

        const init = async () => {
            const configData = await fetchChangoConfig();
            setConfig(configData);
            setTimeLeft(configData?.taprace_duration || 30);
        };
        init();
    }, []);

    // Refs for handlers to avoid re-subscriptions
    const handleTapRef = useRef<(pid: number) => void>(() => { });
    const startGameRef = useRef<() => void>(() => { });

    // Update refs
    useEffect(() => {
        handleTapRef.current = handleTap;
        startGameRef.current = startGame;
    }, [handleTap, startGame]);


    // ... wait, I need to implement the replacement content fully.

    // Let's use a ref for gameState
    const gameStateRef = useRef(gameState);
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    useEffect(() => {
        if (!machineId) return;

        const sub = subscribeToJoystick(machineId, (event) => {
            const currentGameState = gameStateRef.current;

            if (event.type === 'JOIN') {
                setPlayers(prev => prev.map(p => p.id === event.playerId ? { ...p, connected: true } : p));
            } else if (event.type === 'TAP') {
                if (currentGameState === 'RACING') {
                    if (handleTapRef.current) handleTapRef.current(event.playerId);
                } else if (currentGameState === 'LOBBY') {
                    if (startGameRef.current) startGameRef.current();
                }
            } else if (event.type === 'KEYDOWN') {
                // Handle S, A, B as Taps or Start
                const key = event.key ? event.key.toUpperCase() : '';
                if (['S', 'A', 'B'].includes(key)) {
                    if (currentGameState === 'RACING') {
                        if (handleTapRef.current) handleTapRef.current(event.playerId || 1); // Default to 1 if missing, but usually present
                    } else if (currentGameState === 'LOBBY') {
                        if (startGameRef.current) startGameRef.current();
                    }
                }
            } else if (event.type === 'START' && currentGameState === 'LOBBY') {
                if (startGameRef.current) startGameRef.current();
            }
        });

        // Broadcast presence
        sendJoystickEvent(machineId, { type: 'STATE_CHANGE', state: 'PLAYING', game: 'TAPRACE' });

        return () => { sub.unsubscribe(); };
    }, [machineId]); // Only machineId dependency!

    // Watch for winner
    useEffect(() => {
        if (gameState !== 'RACING') return;
        const w = players.find(p => p.progress >= 100);
        if (w) {
            endGame(w.id);
        }
    }, [players, gameState, endGame]);


    if (!machineId) return <div>Cargando ID...</div>;

    const getJoinUrl = (pid: number) => `${baseUrl}/joystick/${machineId}${pid > 1 ? `-P${pid}` : ''}`;

    return (
        <div className="w-full h-screen flex flex-col bg-slate-900 text-white p-4 overflow-hidden">
            {gameState === 'LOBBY' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-in fade-in">
                    <h1 className="text-6xl font-black text-orange-500 uppercase italic tracking-tighter">Carrera de Dedos</h1>
                    <p className="text-xl text-slate-400">Escaneen para unirse. Presiona START cuando estén listos.</p>

                    <div className="flex gap-8 items-center justify-center w-full">
                        {players.map(p => (
                            <div key={p.id} className={`flex flex-col items-center gap-4 transition-all duration-500 ${p.connected ? 'scale-110' : 'opacity-50'}`}>
                                <div className={`p-4 bg-white rounded-3xl ${p.connected ? 'shadow-[0_0_50px_rgba(249,115,22,0.6)]' : ''}`}>
                                    <div className="w-48 h-48">
                                        <QRCode
                                            value={getJoinUrl(p.id)}
                                            size={256}
                                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                            viewBox={`0 0 256 256`}
                                        />
                                    </div>
                                </div>
                                <div className={`px-6 py-2 rounded-full font-black text-xl uppercase ${p.connected ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                    {p.connected ? 'LISTO' : p.name}
                                </div>
                            </div>
                        ))}
                    </div>

                    {players.some(p => p.connected) && (
                        <div className="animate-bounce mt-12 bg-white/10 px-8 py-4 rounded-full border border-white/20 backdrop-blur-md">
                            <p className="text-2xl font-bold uppercase tracking-widest">Presiona <span className="text-yellow-400">COMENZAR</span> (Joystick 1)</p>
                        </div>
                    )}
                </div>
            )}

            {gameState === 'RACING' && (
                <div className="flex-1 flex flex-col gap-4 py-8 h-full">
                    <div className="flex justify-between items-center px-8 flex-none">
                        <h2 className="text-4xl font-black italic uppercase text-white/50">EN CARRERA</h2>
                        <div className="text-6xl font-black font-mono text-yellow-400">{timeLeft}s</div>
                    </div>

                    <div className="flex-1 flex flex-row justify-between items-end gap-4 px-8 pb-8 h-full">
                        {players.map(p => (
                            <div key={p.id} className="relative h-full w-full max-w-[180px] group">
                                <div className="w-full h-full bg-slate-800 rounded-full relative overflow-hidden border-4 border-slate-700 mx-auto">
                                    <div className="absolute inset-0 flex flex-col items-center py-4 justify-between opacity-30">
                                        {[...Array(15)].map((_, i) => <div key={i} className="h-2 w-16 bg-slate-600" />)}
                                    </div>
                                    <div className="absolute bottom-4 w-full h-4 bg-white/20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#fff_10px,#fff_20px)] opacity-50" />
                                    <div className="absolute top-4 w-full h-8 bg-[repeating-linear-gradient(90deg,#000,#000_20px,#fff_20px,#fff_40px)]" />
                                </div>

                                <div
                                    className="absolute left-1/2 -translate-x-1/2 transition-all duration-100 ease-linear flex flex-col items-center z-10"
                                    style={{ bottom: `calc(${p.progress}% - 3rem + 1rem)` }}
                                >
                                    <div className={`text-6xl filter drop-shadow-2xl transition-transform ${p.progress > 95 ? 'scale-125 animate-bounce' : ''}`}>
                                        {p.id === 1 ? '🚀' : p.id === 2 ? '🛸' : '🚁'}
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-0.5 rounded mt-2 border-2 border-white/50 shadow-lg ${p.id === 1 ? 'bg-orange-500' : p.id === 2 ? 'bg-blue-500' : 'bg-green-500'
                                        }`}>
                                        P{p.id}
                                    </div>
                                </div>

                                <div
                                    className={`absolute bottom-0 left-0 w-2 h-full bg-slate-900 rounded-full overflow-hidden ml-[-1rem] hidden md:block`}
                                >
                                    <div
                                        className={`w-full transition-all duration-100 ${p.id === 1 ? 'bg-orange-500' : p.id === 2 ? 'bg-blue-500' : 'bg-green-500'
                                            }`}
                                        style={{ height: `${p.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {gameState === 'RESULT' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in">
                    {winner ? (
                        <>
                            <Trophy className="w-32 h-32 text-yellow-500 animate-bounce mb-8" />
                            <h1 className="text-8xl font-black text-white mb-4">¡JUGADOR {winner} GANA!</h1>
                            <p className="text-2xl text-slate-400">Increíble velocidad</p>
                        </>
                    ) : (
                        <h1 className="text-8xl font-black text-red-500">TIEMPO AGOTADO</h1>
                    )}
                </div>
            )}
        </div>
    );
}
