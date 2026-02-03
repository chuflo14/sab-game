'use client';

import { WheelSegment as RouletteSegment, ChangoConfig } from '@/lib/types'; // added ChangoConfig
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import { generateWinningTicket, logGameEvent } from '@/lib/actions';
import GameResultOverlay from './GameResultOverlay';

interface RouletteWheelProps {
    segments: RouletteSegment[];
}

export default function RouletteWheel({ segments }: RouletteWheelProps) {
    const router = useRouter();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<RouletteSegment | null>(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const gameStartTime = useRef(new Date());
    const [config, setConfig] = useState<ChangoConfig | null>(null);

    useEffect(() => {
        import('@/lib/actions').then(mod => {
            mod.fetchChangoConfig().then(setConfig);
        });
    }, []);

    // ... (rest of component unchanged until handleConfirmResult)

    const rotationRef = useRef(0);
    const velocityRef = useRef(0);
    const requestRef = useRef<number | null>(null);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvas;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 20;

        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotationRef.current);

        const angleStep = (Math.PI * 2) / segments.length;

        segments.forEach((segment, i) => {
            const startAngle = i * angleStep;
            const endAngle = (i + 1) * angleStep;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, startAngle, endAngle);
            ctx.fillStyle = segment.color || '#333';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw label
            ctx.save();
            ctx.rotate(startAngle + angleStep / 2);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 48px sans-serif'; // Increased font size from 20px
            ctx.textAlign = 'right';
            ctx.fillText(segment.label.toUpperCase(), radius - 60, 15); // Adjusted offset
            ctx.restore();
        });

        ctx.restore();

        // Draw center point
        ctx.beginPath();
        ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw indicator (Fixed at bottom)
        ctx.beginPath();
        ctx.moveTo(centerX - 20, height - 10);
        ctx.lineTo(centerX + 20, height - 10);
        ctx.lineTo(centerX, height - 50);
        ctx.closePath();
        ctx.fillStyle = 'yellow';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
    }, [segments]);

    const animate = useCallback(() => {
        const friction = 0.985;
        rotationRef.current += (velocityRef.current || 0);
        velocityRef.current = (velocityRef.current || 0) * friction;

        draw();

        if ((velocityRef.current || 0) < 0.001) {
            velocityRef.current = 0;
            setIsSpinning(false);

            // Calculate which segment stopped at the bottom (1.5 PI)
            const totalRotation = rotationRef.current % (Math.PI * 2);
            const normalizedRotation = totalRotation < 0 ? (totalRotation + Math.PI * 2) : totalRotation;
            const indicatorAngle = 1.5 * Math.PI;

            // The segment index is based on: (indicatorAngle - normalizedRotation)
            let relativeAngle = (indicatorAngle - normalizedRotation);
            if (relativeAngle < 0) relativeAngle += Math.PI * 2;

            const index = Math.floor(relativeAngle / ((Math.PI * 2) / segments.length)) % segments.length;
            setResult(segments[index]);
            cancelAnimationFrame(requestRef.current!);
        } else {
            requestRef.current = requestAnimationFrame(animate);
        }
    }, [draw, segments]);

    const spin = useCallback(() => {
        if (isSpinning || result) return;
        gameStartTime.current = new Date();
        velocityRef.current = 0.5 + Math.random() * 0.3;
        setIsSpinning(true);
        requestRef.current = requestAnimationFrame(animate);
    }, [isSpinning, result, animate]);

    useEffect(() => {
        draw();
    }, [draw]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isSpinning || result) return;
            const key = e.key.toUpperCase();
            if (['S', 'A', 'B'].includes(key)) {
                spin();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSpinning, result, spin]);

    // Timeout logic (30 seconds)
    useEffect(() => {
        if (isSpinning || result) return;

        if (timeLeft <= 0) {
            router.push('/');
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isSpinning, result, timeLeft, router]);

    const handleConfirmResult = useCallback(async () => {
        if (!result) return;

        const isWin = !!result.prizeId;

        if (!config && process.env.NODE_ENV === 'development') console.warn("Config not loaded"); // Debug

        const cooldownSec = config?.gameCooldownSeconds || 0;
        if (cooldownSec > 0) {
            const until = (Date.now() + cooldownSec * 1000).toString();
            console.log("Setting Cooldown:", cooldownSec, "Until:", until); // Debug
            localStorage.setItem('game_cooldown_until', until);
        }

        if (isWin) {
            const generateTicketPromise = (async () => {
                const ticket = await generateWinningTicket(result.prizeId!, 'ruleta');
                await logGameEvent({
                    gameType: 'ruleta',
                    startedAt: gameStartTime.current,
                    finishedAt: new Date(),
                    result: 'WIN',
                    ticketId: ticket.id,
                    machineId: localStorage.getItem('MACHINE_ID') || undefined
                });
                return ticket;
            })();

            setTimeout(async () => {
                const ticket = await generateTicketPromise;
                router.push(`/result?ticketId=${ticket.id}`);
            }, (config?.resultDurationSeconds || 1.5) * 1000);
        } else {
            await logGameEvent({
                gameType: 'ruleta',
                startedAt: gameStartTime.current,
                finishedAt: new Date(),
                result: 'LOSE',
                machineId: localStorage.getItem('MACHINE_ID') || undefined
            });
            setTimeout(() => {
                router.push('/');
            }, (config?.resultDurationSeconds || 1.5) * 1000);
        }
    }, [result, config, router]);

    useEffect(() => {
        if (result && !isSpinning) {
            handleConfirmResult();
        }
    }, [result, isSpinning, handleConfirmResult]);

    return (
        <div className="flex flex-col items-center justify-center gap-8 md:gap-12 max-w-2xl mx-auto w-full p-4">
            <GameResultOverlay
                isOpen={!!result && !isSpinning}
                isWin={!!result?.prizeId}
                title={result?.prizeId ? '¡LO LOGRASTE!' : '¡MALA SUERTE!'}
                subtitle={result?.prizeId ? '¡FELICITACIONES!' : 'JUEGO TERMINADO'}
                statusMessage={result?.prizeId ? 'Generando tu ticket premiado...' : '¡Inténtalo en otra oportunidad!'}
            />

            <div className="relative group w-full max-w-[600px] aspect-square transition-all duration-300">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <canvas
                    ref={canvasRef}
                    width={800} // Increased resolution
                    height={800}
                    onClick={spin}
                    className="relative w-full h-full bg-white/5 rounded-full shadow-2xl backdrop-blur-sm border-4 md:border-8 border-white/10 cursor-pointer active:scale-[0.98] transition-transform"
                />
            </div>

            <div className="flex flex-col items-center gap-6 w-full">
                <button
                    onClick={spin}
                    disabled={isSpinning || !!result}
                    className={`w-full max-w-sm px-8 py-6 md:px-12 md:py-8 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-black uppercase tracking-[0.1em] md:tracking-[0.2em] rounded-2xl md:rounded-3xl shadow-xl shadow-yellow-500/20 transform transition-all active:scale-95 disabled:grayscale disabled:opacity-50 disabled:translate-y-0 hover:-translate-y-1 text-xl md:text-3xl ${isSpinning ? 'cursor-not-allowed' : ''}`}
                >
                    {isSpinning ? 'GIRANDO...' : result ? 'FIN DEL JUEGO' : 'GIRAR'}
                </button>

                {!isSpinning && !result && (
                    <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-yellow-500 transition-all duration-1000 ease-linear"
                                style={{ width: `${(timeLeft / 30) * 100}%` }}
                            />
                        </div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                            El juego vuelve al inicio en {timeLeft}s
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
