'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeToJoystick, sendJoystickEvent } from '@/lib/realtime';
import { fetchChangoConfig } from '@/lib/actions';
import { ChangoConfig } from '@/lib/types';
import { Trophy } from 'lucide-react';
import QRCode from 'react-qr-code';

export default function TapRaceGame() {
    const router = useRouter();
    const [gameState, setGameState] = useState<'SETUP' | 'LOBBY' | 'RACING' | 'RESULT'>('SETUP');
    const [players, setPlayers] = useState<{ id: number, connected: boolean, progress: number, name: string, type: 'human' | 'bot' }[]>([]);
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
                    // Only humans tap
                    if (p.id !== playerId || p.type === 'bot') return p;

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

    // Bot Logic
    useEffect(() => {
        if (gameState !== 'RACING') return;

        const botSpeed = config?.taprace_bot_speed || 5;
        // Map 1-10 to duration in seconds (1=40s, 10=10s)
        const targetDuration = 45 - (botSpeed * 3.5);
        const fps = 30;
        const progressPerFrame = (100 / targetDuration) / fps;

        const interval = setInterval(() => {
            setPlayers(prev => prev.map(p => {
                if (p.type !== 'bot') return p;
                return { ...p, progress: Math.min(100, p.progress + progressPerFrame) };
            }));
        }, 1000 / fps);

        return () => clearInterval(interval);
    }, [gameState, config]);

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
                setPlayers(prev => prev.map(p => p.id === event.playerId && p.type === 'human' ? { ...p, connected: true } : p));

                // Re-broadcast state for the new joiner
                if (currentGameState === 'SETUP') {
                    sendJoystickEvent(machineId, { type: 'STATE_CHANGE', state: 'PLAYING', game: 'TAPRACE_SETUP' });
                } else if (currentGameState === 'LOBBY') {
                    sendJoystickEvent(machineId, { type: 'STATE_CHANGE', state: 'READY', game: 'TAPRACE' });
                } else if (currentGameState === 'RACING') {
                    sendJoystickEvent(machineId, { type: 'STATE_CHANGE', state: 'PLAYING', game: 'TAPRACE' });
                }

            } else if (event.type === 'TAP') {
                if (currentGameState === 'RACING') {
                    if (handleTapRef.current) handleTapRef.current(event.playerId);
                } else if (currentGameState === 'LOBBY') {
                    if (startGameRef.current) startGameRef.current();
                }
            } else if (event.type === 'KEYDOWN') {
                const key = event.key ? event.key.toUpperCase() : '';

                if (currentGameState === 'SETUP') {
                    if (key === 'S') setupGame('1P');
                    if (key === 'A') setupGame('2P');
                }

                if (['S', 'A', 'B'].includes(key)) {
                    if (currentGameState === 'RACING') {
                        let pid = 1;
                        if (key === 'A') pid = 2;
                        if (key === 'B') pid = 3;

                        if (handleTapRef.current) handleTapRef.current(pid);
                    } else if (currentGameState === 'LOBBY') {
                        if (startGameRef.current) startGameRef.current();
                    }
                }
            } else if (event.type === 'START' && currentGameState === 'LOBBY') {
                if (startGameRef.current) startGameRef.current();
            }
        });

        // Broadcast Initial State based on current GameState
        // This is important when switching states (e.g. SETUP -> LOBBY)
        const currentGameState = gameStateRef.current;
        const broadcastState = () => {
            const gs = gameStateRef.current;
            if (gs === 'SETUP') {
                sendJoystickEvent(machineId, { type: 'STATE_CHANGE', state: 'PLAYING', game: 'TAPRACE_SETUP' });
            } else if (gs === 'LOBBY') {
                sendJoystickEvent(machineId, { type: 'STATE_CHANGE', state: 'READY', game: 'TAPRACE' });
            } else if (gs === 'RACING') {
                sendJoystickEvent(machineId, { type: 'STATE_CHANGE', state: 'PLAYING', game: 'TAPRACE' });
            }
        };

        // Initial broadcast
        broadcastState();

        // Heartbeat (every 3s)
        const interval = setInterval(() => {
            broadcastState();
        }, 3000);

        return () => {
            sub.unsubscribe();
            clearInterval(interval);
        };
    }, [machineId, gameState]); // Add gameState dependency to re-broadcast on change

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

    const setupGame = (mode: '1P' | '2P') => {
        if (mode === '1P') {
            setPlayers([
                { id: 1, connected: true, progress: 0, name: 'TÚ', type: 'human' },
                { id: 99, connected: true, progress: 0, name: 'Psab (CPU)', type: 'bot' }
            ]);
        } else {
            setPlayers([
                { id: 1, connected: true, progress: 0, name: 'JUGADOR 1', type: 'human' },
                { id: 2, connected: false, progress: 0, name: 'JUGADOR 2', type: 'human' },
                { id: 99, connected: true, progress: 0, name: 'Psab (CPU)', type: 'bot' }
            ]);
        }
        setGameState('LOBBY');
    };

    return (
        <div className="w-full h-screen flex flex-col bg-slate-900 text-white p-4 overflow-hidden">
            {gameState === 'SETUP' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-12 animate-in fade-in">
                    <h1 className="text-6xl font-black text-orange-500 uppercase italic tracking-tighter">CONFIGURAR CARRERA</h1>
                    <div className="flex gap-8">
                        <button
                            onClick={() => setupGame('1P')}
                            className="bg-blue-600 hover:bg-blue-500 text-white p-12 rounded-3xl text-4xl font-black shadow-lg hover:scale-105 transition-all w-96"
                        >
                            1 JUGADOR
                            <div className="text-base font-normal opacity-70 mt-4">Vs Psab Bot</div>
                        </button>
                        <button
                            onClick={() => setupGame('2P')}
                            className="bg-purple-600 hover:bg-purple-500 text-white p-12 rounded-3xl text-4xl font-black shadow-lg hover:scale-105 transition-all w-96"
                        >
                            2 JUGADORES
                            <div className="text-base font-normal opacity-70 mt-4">P1 vs P2 vs Psab Bot</div>
                        </button>
                    </div>
                </div>
            )}

            {gameState === 'LOBBY' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-in fade-in">
                    <h1 className="text-6xl font-black text-orange-500 uppercase italic tracking-tighter">Carrera de Dedos</h1>
                    <p className="text-xl text-slate-400">Escaneen para unirse. Presiona START cuando estén listos.</p>

                    <div className="flex gap-8 items-center justify-center w-full">
                        {players.map(p => (
                            <div key={p.id} className={`flex flex-col items-center gap-4 transition-all duration-500 ${p.connected ? 'scale-110' : 'opacity-50'}`}>
                                <div className={`p-4 bg-white rounded-3xl ${p.connected ? 'shadow-[0_0_50px_rgba(249,115,22,0.6)]' : ''}`}>
                                    <div className="w-48 h-48 flex items-center justify-center">
                                        {p.type === 'human' && !p.connected ? (
                                            <QRCode
                                                value={getJoinUrl(p.id)}
                                                size={256}
                                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                viewBox={`0 0 256 256`}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={p.type === 'bot' ? '/media/car-red.png' : '/media/car-blue.png'}
                                                    alt="Avatar"
                                                    className="w-24 h-24 object-contain"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className={`px-6 py-2 rounded-full font-black text-xl uppercase ${p.connected ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                    {p.connected ? (p.type === 'bot' ? 'LISTO (CPU)' : 'LISTO') : p.name}
                                </div>
                            </div>
                        ))}
                    </div>

                    {players.filter(p => p.type === 'human').some(p => p.connected) && (
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

                    <div className="flex-1 flex flex-row items-end px-8 pb-8 h-full w-full">
                        {players.map(p => (
                            <div key={p.id} className="relative h-full flex-1 group border-r border-white/10 last:border-r-0">
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
                                    <div className={`filter drop-shadow-2xl transition-transform ${p.progress > 95 ? 'scale-125 animate-bounce' : ''}`}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={p.type === 'bot' ? '/media/car-red.png' : '/media/car-blue.png'}
                                            alt={p.name}
                                            className="w-24 h-auto transform -rotate-90 object-contain"
                                        />
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-0.5 rounded mt-2 border-2 border-white/50 shadow-lg ${p.type === 'bot' ? 'bg-purple-500' : (p.id === 1 ? 'bg-orange-500' : 'bg-blue-500')
                                        }`}>
                                        {p.name}
                                    </div>
                                </div>

                                <div
                                    className={`absolute bottom-0 left-0 w-2 h-full bg-slate-900 rounded-full overflow-hidden ml-[-1rem] hidden md:block`}
                                >
                                    <div
                                        className={`w-full transition-all duration-100 ${p.type === 'bot' ? 'bg-purple-500' : (p.id === 1 ? 'bg-orange-500' : 'bg-blue-500')
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
                            <h1 className="text-8xl font-black text-white mb-4">
                                {players.find(p => p.id === winner)?.name} GANA!
                            </h1>
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
