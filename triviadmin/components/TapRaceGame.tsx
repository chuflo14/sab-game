'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeToJoystick, sendJoystickEvent } from '@/lib/realtime';
import { fetchChangoConfig, generateWinningTicket, fetchPrizes, logGameEvent } from '@/lib/actions';
import { ChangoConfig, Prize } from '@/lib/types';
import { Trophy } from 'lucide-react';
import QRCode from 'react-qr-code';
import GameResultOverlay from './GameResultOverlay';

interface Player {
    id: number;
    connected: boolean;
    progress: number;
    name: string;
    type: 'human' | 'bot';
    sessionId?: string; // Locking ID
    winner?: boolean;
}

export default function TapRaceGame() {
    const router = useRouter();
    const [gameState, setGameState] = useState<'SETUP' | 'LOBBY' | 'RACING' | 'RESULT' | 'WON' | 'LOST'>('SETUP');
    const [players, setPlayers] = useState<Player[]>([]);
    const [winner, setWinner] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const [config, setConfig] = useState<ChangoConfig | null>(null);
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [machineId, setMachineId] = useState<string | null>(null);
    const [baseUrl, setBaseUrl] = useState('');
    const gameStartTime = useRef(new Date());

    // New state for timers and mode
    const [setupTimer, setSetupTimer] = useState(10);
    const [lobbyTimer, setLobbyTimer] = useState(45);
    const [mode, setMode] = useState<'1P' | '2P'>('1P'); // Track selected mode

    const endGame = useCallback(async (winnerId: number | null) => {
        setWinner(winnerId);
        const isWin = winnerId !== null && players.find(p => p.id === winnerId)?.type === 'human';

        setGameState(isWin ? 'WON' : 'LOST');

        if (machineId) {
            sendJoystickEvent(machineId, { type: 'GAME_OVER' });
        }

        // Generate Ticket if Human Won
        let ticketId: string | undefined;

        if (isWin) {
            try {
                const prize = prizes.length > 0 ? prizes[Math.floor(Math.random() * prizes.length)] : null;
                if (prize) {
                    const ticket = await generateWinningTicket(prize.id, 'taprace');
                    ticketId = ticket.id;
                }
            } catch (e) {
                console.error("Error generating ticket:", e);
            }
        }

        // Log Event
        await logGameEvent({
            gameType: 'taprace',
            startedAt: gameStartTime.current,
            finishedAt: new Date(),
            result: isWin ? 'WIN' : 'LOSE',
            ticketId: ticketId,
            machineId: machineId || undefined
        });

        // Redirect
        setTimeout(() => {
            if (ticketId) {
                router.push(`/result?ticketId=${ticketId}`);
            } else {
                router.push('/');
            }
        }, (config?.resultDurationSeconds || 5) * 1000);

    }, [machineId, router, players, prizes, config]);

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

    // Setup Timer (10s)
    useEffect(() => {
        if (gameState !== 'SETUP') return;

        const timer = setInterval(() => {
            setSetupTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setupGame('1P'); // Default to 1P if timeout
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState]);

    // Lobby Timer (45s) for 2P
    useEffect(() => {
        if (gameState !== 'LOBBY' || mode !== '2P') return;

        const timer = setInterval(() => {
            setLobbyTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Time out in lobby... what to do?
                    // Option 1: Start game anyway (if P1 ready)
                    // Option 2: Fallback to single player?
                    // User request: "si no se conecta empezar la partida" -> Start game
                    if (startGameRef.current) startGameRef.current();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState, mode]);

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

    // Local Keyboard Listener for Low Latency
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return; // Ignore hold-down

            const key = e.key.toUpperCase();
            const currentGameState = gameStateRef.current; // Use ref for current state

            if (currentGameState === 'SETUP') {
                if (key === 'S') setupGame('1P');
                if (key === 'A') setupGame('2P');
            } else if (currentGameState === 'LOBBY') {
                if (['S', 'A', 'B'].includes(key)) {
                    if (startGameRef.current) startGameRef.current();
                }
            } else if (currentGameState === 'RACING') {
                let pid = 0;
                if (key === 'S') pid = 1;
                if (key === 'A') pid = 2; // Assuming 'A' is P2
                if (key === 'B') pid = 3; // Assuming 'B' is P3/Bot/Extra

                if (pid > 0 && handleTapRef.current) {
                    handleTapRef.current(pid);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []); // Empty dependency array, relies on Refs

    useEffect(() => {
        if (!machineId) return;

        const sub = subscribeToJoystick(machineId, (event) => {
            const currentGameState = gameStateRef.current;
            const currentPlayers = playersRef.current; // Use ref for latest players

            if (event.type === 'JOIN') {
                setPlayers(prev => {
                    const targetP = prev.find(p => p.id === event.playerId);

                    // 1. If slot is empty or disconnected -> Accept & Lock
                    if (targetP && (!targetP.connected || !targetP.sessionId)) {
                        console.log(`TapRace: Locking Slot P${event.playerId} to Session ${event.sessionId}`);
                        // Send Success to this session
                        sendJoystickEvent(machineId, {
                            type: 'STATE_CHANGE',
                            state: 'CONNECTION_SUCCESS',
                            sessionId: event.sessionId
                        });

                        // Then update state for everyone
                        // If in SETUP, we might change state to PLAYING if needed? 
                        // Logic below handles re-broadcast.

                        return prev.map(p => p.id === event.playerId ? { ...p, connected: true, sessionId: event.sessionId } : p);
                    }

                    // 2. If slot is occupied
                    if (targetP && targetP.connected) {
                        // A. Same Session -> Re-confirm
                        if (targetP.sessionId === event.sessionId) {
                            console.log(`TapRace: Re-confirming Slot P${event.playerId} for Session ${event.sessionId}`);
                            sendJoystickEvent(machineId, {
                                type: 'STATE_CHANGE',
                                state: 'CONNECTION_SUCCESS',
                                sessionId: event.sessionId
                            });
                            return prev;
                        }
                        // B. Different Session -> REJECT (Busy)
                        else {
                            console.log(`TapRace: Rejecting hijack attempt on P${event.playerId} from ${event.sessionId}`);
                            sendJoystickEvent(machineId, {
                                type: 'STATE_CHANGE',
                                state: 'BUSY',
                                sessionId: event.sessionId
                            });
                            return prev;
                        }
                    }

                    return prev;
                });

                // Re-broadcast state for the new joiner (if accepted)
                // Note: The logic above handles the 'Reject' case by sending BUSY immediately.
                // The broadcast below might overlap, but that's okay.
                if (currentGameState === 'SETUP') {
                    sendJoystickEvent(machineId, { type: 'STATE_CHANGE', state: 'PLAYING', game: 'TAPRACE_SETUP' });
                } else if (currentGameState === 'LOBBY') {
                    sendJoystickEvent(machineId, { type: 'STATE_CHANGE', state: 'READY', game: 'TAPRACE' });
                } else if (currentGameState === 'RACING') {
                    sendJoystickEvent(machineId, { type: 'STATE_CHANGE', state: 'PLAYING', game: 'TAPRACE' });
                }

            } else if (event.type === 'TAP') {
                // LOCK CHECK
                const player = currentPlayers.find(p => p.id === event.playerId);
                if (player?.sessionId && player.sessionId !== event.sessionId) {
                    console.warn(`Ignored TAP from unauthorized session ${event.sessionId} on P${event.playerId}`);
                    return;
                }

                if (currentGameState === 'RACING') {
                    if (handleTapRef.current) handleTapRef.current(event.playerId);
                } else if (currentGameState === 'LOBBY') {
                    if (startGameRef.current) startGameRef.current();
                }
            } else if (event.type === 'KEYDOWN') {
                // LOCK CHECK ? 
                // KEYDOWN usually doesn't carry playerId unless we infer it. 
                // But in JoystickPage we send sessionId now.
                // We don't have a mapping of Key -> PlayerId easily here without logic.
                // 'S' = P1, 'A' = P2.
                // Let's protect P1/P2 if we can.

                const key = event.key ? event.key.toUpperCase() : '';
                let targetPid = 0;
                if (key === 'S') targetPid = 1;
                if (key === 'A') targetPid = 2;

                if (targetPid > 0) {
                    const player = currentPlayers.find(p => p.id === targetPid);
                    if (player?.sessionId && player.sessionId !== event.sessionId) {
                        console.warn(`Ignored KEYDOWN ${key} from unauthorized session ${event.sessionId}`);
                        return;
                    }
                }

                // ... Keep existing logic ...
                if (currentGameState === 'SETUP') {
                    if (key === 'S') setupGame('1P');
                    if (key === 'A') setupGame('2P');
                }

                if (['S', 'A', 'B'].includes(key)) {
                    // Check if this is coming from a remote source to avoid duplication if local?
                    // Realtime events are usually from other clients. 
                    // If local kiosk sends to itself via realtime, we might have duplication.
                    // But we want to prioritize the local listener.

                    // For now, let's allow both. If user uses QR to send 'S', it works.
                    // If user presses physical 'S', it works via local listener (faster).
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
                // Check if 2P mode and P2 is connected
                if (mode === '2P') {
                    const p2 = currentPlayers.find(p => p.id === 2);
                    if (!p2?.connected) {
                        return;
                    }
                }
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

    const setupGame = (selectedMode: '1P' | '2P') => {
        setMode(selectedMode);
        setLobbyTimer(45); // Reset lobby timer

        if (selectedMode === '1P') {
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
                    <div className="text-2xl font-mono text-slate-500">Selección automática en {setupTimer}s</div>
                </div>
            )}

            {gameState === 'LOBBY' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-in fade-in">
                    <h1 className="text-6xl font-black text-orange-500 uppercase italic tracking-tighter">Carrera de Dedos</h1>
                    <p className="text-xl text-slate-400">
                        {mode === '2P'
                            ? `Esperando a Jugador 2... ${lobbyTimer}s`
                            : 'Escaneen para unirse. Presiona START cuando estén listos.'}
                    </p>

                    <div className="flex gap-8 items-center justify-center w-full">
                        {players.map(p => (
                            <div key={p.id} className={`flex flex-col items-center gap-4 transition-all duration-500 ${p.connected ? 'scale-110' : 'opacity-50'}`}>
                                <div className={`p-4 bg-white rounded-3xl ${p.connected ? 'shadow-[0_0_50px_rgba(249,115,22,0.6)]' : ''}`}>
                                    <div className="w-72 h-72 flex items-center justify-center">
                                        {p.type === 'human' && !p.connected ? (
                                            <QRCode
                                                value={getJoinUrl(p.id)}
                                                size={350}
                                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                viewBox={`0 0 256 256`}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={p.type === 'bot' ? '/media/car-red.png' : (p.id === 2 ? '/media/car-yellow.png' : '/media/car-blue.png')}
                                                    alt="Avatar"
                                                    className="w-24 h-24 object-contain"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className={`px-6 py-2 rounded-full font-black text-xl uppercase ${p.connected ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                    {p.connected ? (p.type === 'bot' ? 'LISTO (SAB)' : 'LISTO') : p.name}
                                </div>
                            </div>
                        ))}
                    </div>

                    {players.filter(p => p.type === 'human').some(p => p.connected) && (
                        mode === '2P' && !players.find(p => p.id === 2)?.connected ? (
                            <div className="mt-12 text-slate-500 animate-pulse">Esperando conexión de Jugador 2...</div>
                        ) : (
                            <div className="animate-bounce mt-12 bg-white/10 px-8 py-4 rounded-full border border-white/20 backdrop-blur-md">
                                <p className="text-2xl font-bold uppercase tracking-widest">Presiona <span className="text-yellow-400">COMENZAR</span> (Joystick 1)</p>
                            </div>
                        )
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
                                            src={p.type === 'bot' ? '/media/car-red.png' : (p.id === 2 ? '/media/car-yellow.png' : '/media/car-blue.png')}
                                            alt={p.name}
                                            className="w-24 h-auto object-contain"
                                        />
                                    </div>
                                    <div className={`text-xl font-black px-4 py-1 rounded-xl mt-2 border-4 border-white/50 shadow-xl uppercase whitespace-nowrap min-w-[120px] text-center ${p.type === 'bot' ? 'bg-purple-600' : (p.id === 1 ? 'bg-orange-600' : 'bg-blue-600')
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

            {(gameState === 'WON' || gameState === 'LOST') && (
                <GameResultOverlay
                    isOpen={true}
                    isWin={gameState === 'WON'}
                    title={gameState === 'WON' ? '¡GANASTE!' : '¡PERDISTE!'}
                    subtitle={gameState === 'WON' ? '¡VELOCIDAD PURA!' : 'INTÉNTALO DE NUEVO'}
                    statusMessage={gameState === 'WON' ? 'Generando tu premio...' : undefined}
                />
            )}
        </div>
    );
}
