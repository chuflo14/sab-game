'use client';

import { Prize, ChangoConfig } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { generateWinningTicket, fetchPrizes, fetchChangoConfig, logGameEvent } from '@/lib/actions';
import GameResultOverlay from './GameResultOverlay';

export default function LuckGame() {
    const router = useRouter();
    const [inflation, setInflation] = useState(0);
    const [cooldown, setCooldown] = useState(0);
    const [targetInflation, setTargetInflation] = useState(0);
    const [isBurst, setIsBurst] = useState(false);
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('playing');
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [lastKey, setLastKey] = useState<string | null>(null);
    const [isPumping, setIsPumping] = useState(false);
    const [timeLeft, setTimeLeft] = useState(10);
    const hasGeneratedTicket = useRef(false);
    const gameStartTime = useRef(new Date());

    const [config, setConfig] = useState<ChangoConfig | null>(null);

    useEffect(() => {
        const initGame = async () => {
            gameStartTime.current = new Date();
            const [prizesData, configData] = await Promise.all([
                fetchPrizes(),
                fetchChangoConfig()
            ]);
            setPrizes(prizesData);
            setConfig(configData);

            // Difficulty 1-10 mapped to target inflation
            // 5 -> 50 + 100 = 150 (Significant reduction from 280)
            // 3 -> 50 + 60 = 110 (Significant reduction from 200)
            const diff = configData?.difficulty || 5;
            setTargetInflation(50 + (diff * 20));
            if (configData?.timeLimit) {
                setTimeLeft(configData.timeLimit);
            }
            if (configData?.gameCooldownSeconds) {
                setCooldown(configData.gameCooldownSeconds);
            }
        };
        initGame();
    }, []);

    // Timer logic
    useEffect(() => {
        if (gameState !== 'playing') return;

        if (timeLeft <= 0) {
            setGameState('lost');
            if (cooldown > 0) {
                localStorage.setItem('game_cooldown_until', (Date.now() + cooldown * 1000).toString());
            }
            logGameEvent({
                gameType: 'chango',
                startedAt: gameStartTime.current,
                finishedAt: new Date(),
                result: 'LOSE',
                machineId: localStorage.getItem('MACHINE_ID') || undefined
            });
            setTimeout(() => router.push('/'), (config?.resultDurationSeconds || 1.5) * 1000);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState, timeLeft, router, cooldown, config]);

    const handleInflate = useCallback(() => {
        if (gameState !== 'playing' || isBurst) return;
        console.log("LuckGame: handleInflate triggered. Current inflation:", inflation);
        setInflation(prev => prev + 1);

        // Trigger pump animation
        setIsPumping(true);
        setTimeout(() => setIsPumping(false), 100);
    }, [gameState, isBurst, inflation]);

    const handleWin = useCallback(() => {
        if (hasGeneratedTicket.current) return;
        hasGeneratedTicket.current = true;

        if (cooldown > 0) {
            localStorage.setItem('game_cooldown_until', (Date.now() + cooldown * 1000).toString());
        }

        setIsBurst(true);
        setGameState('won');

        // Start generating ticket immediately in the background
        const generateTicketPromise = (async () => {
            const win = prizes.length > 0;
            if (win) {
                const prize = prizes[Math.floor(Math.random() * prizes.length)];
                try {
                    const ticket = await generateWinningTicket(prize.id, 'chango');
                    // Log the event
                    await logGameEvent({
                        gameType: 'chango',
                        startedAt: gameStartTime.current,
                        finishedAt: new Date(),
                        result: 'WIN',
                        ticketId: ticket.id,
                        machineId: localStorage.getItem('MACHINE_ID') || undefined
                    });
                    return ticket;
                } catch (e) {
                    console.error("Error generating ticket", e);
                    return null;
                }
            }
            return null;
        })();

        // Wait 2 seconds before proceeding to ticket screen
        setTimeout(async () => {
            const ticket = await generateTicketPromise;
            if (ticket) {
                router.push(`/result?ticketId=${ticket.id}`);
            } else {
                router.push('/');
            }
        }, (config?.resultDurationSeconds || 1.5) * 1000);
    }, [prizes, router, config, cooldown]);

    useEffect(() => {
        if (gameState === 'playing' && targetInflation > 0 && inflation >= targetInflation) {
            handleWin();
        }
    }, [inflation, targetInflation, gameState, handleWin]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState !== 'playing') return;
            const key = e.key.toUpperCase();
            if (['S', 'A', 'B'].includes(key)) {
                setLastKey(key);
                handleInflate();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, lastKey, handleInflate]);

    const scale = targetInflation > 0 ? 1 + (inflation / targetInflation) * 1.5 : 1;

    return (
        <div className="flex flex-col items-center justify-center gap-8 p-4 md:p-8 min-h-[500px] w-full overflow-hidden">
            {/* Timer Display */}
            <div className={`
                text-5xl md:text-7xl font-black mb-4 transition-colors duration-300
                ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-white'}
                ${gameState !== 'playing' ? 'opacity-0' : 'opacity-100'}
            `}>
                {timeLeft}s
            </div>

            {/* Game UI - Responsive Scaled Container */}
            <div className="relative w-full max-w-2xl h-[300px] md:h-[450px] flex flex-col items-center justify-end pb-12">
                {/* Scaling Wrapper for Game Elements */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 scale-[0.4] sm:scale-[0.6] md:scale-100 origin-bottom transition-transform duration-300 w-[600px] h-[450px] flex justify-center items-end">
                    <GameResultOverlay
                        isOpen={gameState === 'won' || gameState === 'lost'}
                        isWin={gameState === 'won'}
                        title={gameState === 'won' ? '¡LO REVENTASTE!' : '¡PERDISTE!'}
                        subtitle={gameState === 'won' ? '¡FELICITACIONES!' : 'JUEGO TERMINADO'}
                        statusMessage={gameState === 'won' ? 'Generando tu ticket premiado...' : '¡Inténtalo en otra oportunidad!'}
                    />

                    {/* SVG Hose (Manguera Realistic) */}
                    <svg
                        className="absolute z-10 pointer-events-none"
                        style={{
                            width: '400px',
                            height: '200px',
                            bottom: '20px',
                            left: 'calc(50% - 100px)'
                        }}
                        viewBox="0 0 400 200"
                    >
                        {/* Hose Shadow */}
                        <path
                            d="M 10 160 Q 150 210, 300 180"
                            fill="none"
                            stroke="rgba(0,0,0,0.5)"
                            strokeWidth="16"
                            strokeLinecap="round"
                        />
                        {/* Hose Body */}
                        <path
                            d="M 10 160 Q 150 210, 300 180"
                            fill="none"
                            stroke="#1a1a1a"
                            strokeWidth="14"
                            strokeLinecap="round"
                        />
                        {/* Hose Highlight */}
                        <path
                            d="M 10 160 Q 150 210, 300 180"
                            fill="none"
                            stroke="#333"
                            strokeWidth="4"
                            strokeLinecap="round"
                            className="opacity-40"
                            style={{ transform: 'translateY(-2px)' }}
                        />
                        {/* Connector at Pump */}
                        <rect x="0" y="150" width="20" height="20" fill="#333" rx="4" />
                        {/* Connector at Balloon */}
                        <rect x="290" y="170" width="20" height="20" fill="#b91c1c" rx="4" transform="rotate(-20 300 180)" />
                    </svg>

                    {/* Premium CSS Balloon */}
                    <div
                        className={`absolute z-20 transition-all duration-300 ease-out origin-bottom-left ${isBurst ? 'animate-ping opacity-0' : ''}`}
                        style={{
                            transform: `scale(${scale})`,
                            width: '80px',
                            height: '100px',
                            bottom: '50px',
                            left: 'calc(50% + 155px)'
                        }}
                    >
                        {/* Balloon Body */}
                        <div className="absolute inset-0 rounded-[50%_50%_50%_50%_/_40%_40%_60%_60%] shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.5),10px_10px_30px_rgba(0,0,0,0.3)]"
                            style={{
                                background: 'radial-gradient(circle at 30% 30%, #ff6b6b, #ee5253, #9b1c1c)',
                            }}
                        >
                            {/* Shine */}
                            <div className="absolute top-[15%] left-[20%] w-[25%] h-[15%] bg-white/30 rounded-full blur-[2px] rotate-[-20deg]" />
                        </div>

                        {/* Balloon Knot */}
                        <div className="absolute bottom-[-2px] left-[-10px] w-5 h-4 bg-[#8b0000] rounded-sm -rotate-[25deg]" />
                    </div>

                    {/* Balloon Pump (Inflador) */}
                    <div className="relative w-32 flex flex-col items-center mr-72">
                        {/* Pump Handle (Animated) */}
                        <div
                            className="absolute w-24 h-4 bg-zinc-800 rounded-full z-10 transition-transform duration-75"
                            style={{
                                transform: `translateY(${isPumping ? '0px' : '-50px'})`,
                                boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                            }}
                        >
                            {/* Plunger Rod */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-16 bg-zinc-400" />
                        </div>

                        {/* Pump Body */}
                        <div className="w-16 h-32 bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-400 rounded-t-lg shadow-xl relative overflow-hidden">
                            {/* Metallic reflections */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                            <div className="absolute left-1/4 top-0 w-px h-full bg-white/20" />

                            {/* Pump Outlet Hole */}
                            <div className="absolute top-24 right-0 w-3 h-3 bg-black rounded-full translate-x-1" />
                        </div>

                        {/* Pump Base */}
                        <div className="w-32 h-6 bg-zinc-900 rounded-full shadow-2xl" />
                    </div>

                    {/* Burst Effect (Visual only) */}
                    {isBurst && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center">
                            <div className="absolute w-[400px] h-[400px] bg-yellow-400/30 rounded-full blur-3xl animate-ping" />
                            <div className="text-9xl animate-out zoom-out duration-300 scale-[2]">💥</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls Info */}
            <div className="mt-4 md:mt-40 flex flex-col items-center gap-6 z-30">
                <div className="flex gap-6 md:gap-8">
                    {['S', 'A', 'B'].map(k => (
                        <div
                            key={k}
                            onClick={() => {
                                if (gameState === 'playing') {
                                    setLastKey(k);
                                    handleInflate();
                                }
                            }}
                            className={`
                            w-20 h-20 md:w-28 md:h-28 rounded-2xl md:rounded-3xl border-4 flex items-center justify-center text-4xl md:text-6xl font-black transition-all cursor-pointer select-none active:scale-90 shadow-lg
                            ${lastKey === k ? 'bg-yellow-500 border-white text-black scale-110 shadow-yellow-500/50' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}
                        `}>
                            {k}
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-2">
                    <div className={`text-lg md:text-xl uppercase tracking-widest font-black text-center transition-colors ${gameState === 'lost' ? 'text-red-500' : 'text-zinc-300'}`}>
                        ¡Pulsa <span className="text-yellow-400 text-2xl mx-1">S, A, B</span> repetidamente para inflar!
                    </div>
                </div>

                {/* Progress tracking hidden in production */}
            </div>
        </div>
    );
}
