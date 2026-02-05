'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeToJoystick, sendJoystickEvent } from '@/lib/realtime';
import { fetchChangoConfig, logGameEvent, generateWinningTicket, fetchPrizes } from '@/lib/actions';
import { ChangoConfig, Prize } from '@/lib/types';
import GameResultOverlay from './GameResultOverlay';
import { Trophy } from 'lucide-react';

export default function PenaltiesGame() {
    const router = useRouter();
    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'RESULT'>('IDLE');
    const [cursorPosition, setCursorPosition] = useState(50); // 0 to 100
    const [direction, setDirection] = useState<1 | -1>(1);
    const [result, setResult] = useState<'GOAL' | 'MISS' | 'POST' | null>(null);
    const [score, setScore] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [config, setConfig] = useState<ChangoConfig | null>(null);
    const [prizes, setPrizes] = useState<Prize[]>([]);

    // Game Loop Ref
    const requestRef = useRef<number>();
    const lastTimeRef = useRef<number>();
    const gameStartTime = useRef(new Date());
    const isMoving = useRef(false);

    // Audio Refs
    const crowdRef = useRef<HTMLAudioElement | null>(null);
    const whistleRef = useRef<HTMLAudioElement | null>(null);
    const kickRef = useRef<HTMLAudioElement | null>(null);
    const goalRef = useRef<HTMLAudioElement | null>(null);
    const missRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Init Audio
        crowdRef.current = new Audio('https://cdn.freesound.org/previews/195/195396_2634676-lq.mp3'); // Crowd ambience
        crowdRef.current.loop = true;
        crowdRef.current.volume = 0.3;

        whistleRef.current = new Audio('https://cdn.freesound.org/previews/415/415082_5121236-lq.mp3'); // Whistle
        kickRef.current = new Audio('https://cdn.freesound.org/previews/563/563606_10522067-lq.mp3'); // Kick
        goalRef.current = new Audio('https://cdn.freesound.org/previews/495/495005_6090639-lq.mp3'); // Goal cheer
        missRef.current = new Audio('https://cdn.freesound.org/previews/337/337189_5682181-lq.mp3'); // Miss sigh

        const init = async () => {
            gameStartTime.current = new Date();
            const [prizeData, configData] = await Promise.all([
                fetchPrizes(),
                fetchChangoConfig()
            ]);
            setConfig(configData);
            setPrizes(prizeData);

            // Notify Joystick
            const mid = localStorage.getItem('MACHINE_ID');
            if (mid) {
                sendJoystickEvent(mid, { type: 'STATE_CHANGE', state: 'PLAYING', game: 'PENALTIES' });
            }

            // Start Game
            startGame();
        };

        // Delay slighty to allow hydration
        setTimeout(init, 500);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (crowdRef.current) crowdRef.current.pause();
        };
    }, []);

    const startGame = () => {
        setGameState('PLAYING');
        setScore(0);
        setAttempts(0);
        crowdRef.current?.play().catch(() => { });
        startRound();
    };

    const startRound = () => {
        setResult(null);
        setCursorPosition(50);
        isMoving.current = true;
        lastTimeRef.current = performance.now();
        requestRef.current = requestAnimationFrame(animate);
    };

    const animate = (time: number) => {
        if (!isMoving.current) return;

        if (lastTimeRef.current !== undefined) {
            const deltaTime = time - lastTimeRef.current;

            // Difficulty Speed
            const difficulty = config?.penalties_difficulty || 5;
            const speed = 0.05 + (difficulty * 0.02);

            setCursorPosition(prev => {
                let next = prev + (speed * deltaTime * direction); // direction needs to be ref or check logic

                // Bounce logic needs access to current direction state, 
                // but setState callback doesn't give it easily. 
                // Better to use Ref for position logic in loop.
                return prev;
            });

            // Ref-based update for smoother loop
            updatePhysics(deltaTime);
        }

        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    };

    // Use Refs for physics loop to avoid dependency closure staleness
    const posRef = useRef(50);
    const dirRef = useRef(1);

    const updatePhysics = (deltaTime: number) => {
        const difficulty = config?.penalties_difficulty || 5;
        const speed = (0.05 + (difficulty * 0.02));

        let next = posRef.current + (speed * deltaTime * dirRef.current);

        if (next >= 100) {
            next = 100;
            dirRef.current = -1;
        } else if (next <= 0) {
            next = 0;
            dirRef.current = 1;
        }

        posRef.current = next;
        setCursorPosition(next);
    };

    const handleShoot = useCallback(() => {
        if (!isMoving.current || gameState !== 'PLAYING') return;

        isMoving.current = false;
        cancelAnimationFrame(requestRef.current!);
        kickRef.current?.play().catch(() => { });

        const pos = posRef.current;
        const center = 50;
        // Difficulty Zone
        const difficulty = config?.penalties_difficulty || 5;
        const zoneWidth = Math.max(5, 20 - difficulty); // Harder = smaller zone

        const diff = Math.abs(pos - center);
        const isGoal = diff <= zoneWidth;
        const isPost = !isGoal && diff <= zoneWidth + 5;

        const currentAttempt = attempts + 1;
        setAttempts(currentAttempt);

        if (isGoal) {
            setResult('GOAL');
            setScore(prev => prev + 1);
            goalRef.current?.play().catch(() => { });
        } else if (isPost) {
            setResult('POST');
            missRef.current?.play().catch(() => { }); // Clang sound would be better
        } else {
            setResult('MISS');
            missRef.current?.play().catch(() => { });
        }

        const maxShots = config?.penalties_max_shots || 5;

        // Check End Game
        if (currentAttempt >= maxShots) {
            setTimeout(() => endGame(score + (isGoal ? 1 : 0)), 2000);
        } else {
            setTimeout(startRound, 2000); // Next shot
        }

    }, [gameState, config, attempts, score]);

    const endGame = useCallback(async (finalScore: number) => {
        setGameState('RESULT');
        whistleRef.current?.play().catch(() => { });

        const mid = localStorage.getItem('MACHINE_ID');
        if (mid) {
            sendJoystickEvent(mid, { type: 'GAME_OVER' });
        }

        const maxShots = config?.penalties_max_shots || 5;
        const winThreshold = Math.ceil(maxShots / 2);

        const isWin = finalScore >= winThreshold;
        let ticket = null;

        if (isWin && prizes.length > 0) {
            const prize = prizes[Math.floor(Math.random() * prizes.length)];
            ticket = await generateWinningTicket(prize.id, 'penalties');
        }

        logGameEvent({
            gameType: 'penalties',
            startedAt: gameStartTime.current,
            finishedAt: new Date(),
            result: isWin ? 'WIN' : 'LOSE',
            ticketId: ticket?.id,
            machineId: mid || undefined
        });

        setTimeout(() => {
            if (ticket) {
                router.push(`/result?ticketId=${ticket.id}`);
            } else {
                router.push('/');
            }
        }, 4000);
    }, [config, prizes, router]);


    // Joystick Listener
    useEffect(() => {
        const mid = localStorage.getItem('MACHINE_ID');
        if (!mid) return;

        const sub = subscribeToJoystick(mid, (event) => {
            if (event.type === 'KEYDOWN' && event.key === 'SHOOT') {
                handleShoot();
            }
        });

        return () => sub.unsubscribe();
    }, [handleShoot]);

    const difficulty = config?.penalties_difficulty || 5;
    const zoneWidth = Math.max(5, 20 - difficulty);

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-5xl mx-auto p-4 relative h-[80vh]">

            {/* Scoreboard */}
            <div className="absolute top-0 w-full flex justify-between items-center px-8 py-4 bg-slate-900/80 rounded-b-3xl border-x border-b border-white/10 backdrop-blur-md z-20">
                <div className="text-right">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">INTENTOS</p>
                    <p className="text-3xl font-black text-white">{attempts} / {config?.penalties_max_shots || 5}</p>
                </div>
                <div className="flex flex-col items-center">
                    <Trophy className="w-8 h-8 text-yellow-500 mb-1" />
                    <span className="text-yellow-500 font-black tracking-widest text-xs">PENALES</span>
                </div>
                <div className="text-left">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">GOLES</p>
                    <p className="text-3xl font-black text-green-500">{score}</p>
                </div>
            </div>

            {/* Goal / Field Visuals */}
            <div className="relative w-full aspect-video bg-gradient-to-b from-sky-400 to-sky-200 rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl">
                {/* Grass */}
                <div className="absolute bottom-0 w-full h-[30%] bg-[#4c9a2a] border-t-4 border-white/50"></div>

                {/* Goal Post (CSS art) */}
                <div className="absolute top-[20%] left-[15%] w-[70%] h-[50%] border-x-[12px] border-t-[12px] border-white/90"></div>
                <div className="absolute top-[20%] left-[15%] w-[70%] h-[50%] bg-black/10 backdrop-blur-[1px]" style={{ backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>

                {/* Goalkeeper (Simple Box for now, maybe Image) */}
                <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-24 h-32 bg-red-600 rounded-full shadow-lg flex items-center justify-center border-4 border-white animate-bounce" style={{ animationDuration: '2s' }}>
                    <span className="text-4xl">🧤</span>
                </div>

                {/* Ball Indicator (Result) */}
                {result && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 animate-in zoom-in duration-300">
                        {result === 'GOAL' && <div className="text-8xl drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]">⚽ GOOOOL!</div>}
                        {result === 'MISS' && <div className="text-8xl drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]">❌ FUERA</div>}
                        {result === 'POST' && <div className="text-8xl drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]">🪵 PALO</div>}
                    </div>
                )}
            </div>

            {/* Power Bar */}
            <div className="w-full max-w-3xl mt-12 bg-slate-800 h-16 rounded-full relative overflow-hidden border-4 border-slate-700 shadow-xl">
                {/* Success Zone */}
                <div
                    className="absolute top-0 bottom-0 bg-green-500/80 border-x-4 border-white/50"
                    style={{
                        left: `${50 - zoneWidth}%`,
                        width: `${zoneWidth * 2}%`
                    }}
                >
                    <div className="w-full h-full animate-pulse bg-green-400/30"></div>
                </div>

                {/* Cursor */}
                <div
                    className="absolute top-0 bottom-0 w-4 bg-white shadow-[0_0_20px_white] z-10 transition-transform duration-75 ease-linear"
                    style={{
                        left: `${cursorPosition}%`
                    }}
                >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white"></div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-white"></div>
                </div>
            </div>

            <div className="mt-4 text-center">
                <p className="text-white/50 uppercase tracking-widest text-sm animate-pulse">Presiona PATEAR en el Joystick</p>
            </div>

            <GameResultOverlay
                isOpen={gameState === 'RESULT'}
                isWin={score >= Math.ceil((config?.penalties_max_shots || 5) / 2)}
                title={score >= Math.ceil((config?.penalties_max_shots || 5) / 2) ? '¡VICTORIA!' : 'FIN DEL JUEGO'}
                subtitle={`${score} GOLES ANOTADOS`}
                statusMessage="Procesando resultados..."
            />
        </div>
    );
}
