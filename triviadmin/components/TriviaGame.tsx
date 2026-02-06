'use client';

import { TriviaQuestion as Question, Prize, ChangoConfig } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { generateWinningTicket, logGameEvent } from '@/lib/actions';
import GameResultOverlay from './GameResultOverlay';
import { sendJoystickEvent } from '@/lib/realtime';

interface TriviaGameProps {
    questions: Question[];
}

export default function TriviaGame({ questions }: TriviaGameProps) {
    const router = useRouter();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(10);
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswering, setIsAnswering] = useState(false);
    const gameStartTime = useRef(new Date());

    const [config, setConfig] = useState<ChangoConfig | null>(null);

    useEffect(() => {
        // We use ChangoConfig as the general config for now
        import('@/lib/actions').then(mod => {
            Promise.all([
                mod.fetchPrizes(),
                mod.fetchChangoConfig()
            ]).then(([prizesData, configData]) => {
                setPrizes(prizesData);
                setConfig(configData);
            });
        });

        // Report state to joystick
        const mid = localStorage.getItem('MACHINE_ID');
        if (mid) {
            sendJoystickEvent(mid, { type: 'STATE_CHANGE', state: 'PLAYING', game: 'TRIVIA' });
        }
    }, []);

    const handleGameOver = useCallback(async () => {
        if (!config) return; // Wait for config to load
        setGameState('lost');

        const mid = localStorage.getItem('MACHINE_ID');
        if (mid) {
            sendJoystickEvent(mid, { type: 'GAME_OVER' });
        }

        await logGameEvent({
            gameType: 'trivia',
            startedAt: gameStartTime.current,
            finishedAt: new Date(),
            result: 'LOSE',
            machineId: mid || undefined
        });
        const cooldownSec = config?.gameCooldownSeconds || 0;
        if (cooldownSec > 0) {
            localStorage.setItem('game_cooldown_until', (Date.now() + cooldownSec * 1000).toString());
        }
        setTimeout(() => {
            router.push('/');
        }, (config?.resultDurationSeconds || 1.5) * 1000);
    }, [router, config]);

    const handleWin = useCallback(async () => {
        setGameState('won');

        const generateTicketPromise = (async () => {
            try {
                const prize = prizes.length > 0 ? prizes[Math.floor(Math.random() * prizes.length)] : null;
                if (prize) {
                    const ticket = await generateWinningTicket(prize.id, 'trivia');
                    await logGameEvent({
                        gameType: 'trivia',
                        startedAt: gameStartTime.current,
                        finishedAt: new Date(),
                        result: 'WIN',
                        ticketId: ticket.id,
                        machineId: localStorage.getItem('MACHINE_ID') || undefined
                    });

                    const mid = localStorage.getItem('MACHINE_ID');
                    if (mid) {
                        sendJoystickEvent(mid, { type: 'GAME_OVER' });
                    }

                    return ticket;
                }
                return null;
            } catch (error) {
                console.error("Error generating ticket", error);
                return null;
            }
        })();

        const cooldownSec = config?.gameCooldownSeconds || 0;
        if (cooldownSec > 0) {
            localStorage.setItem('game_cooldown_until', (Date.now() + cooldownSec * 1000).toString());
        }

        setTimeout(async () => {
            const ticket = await generateTicketPromise;
            if (ticket) {
                router.push(`/result?ticketId=${ticket.id}`);
            } else {
                router.push('/');
            }
        }, (config?.resultDurationSeconds || 1.5) * 1000);
    }, [router, prizes, config]);

    const handleAnswer = useCallback((answerKey: 'S' | 'A' | 'B') => {
        if (isAnswering || gameState !== 'playing') return;

        setIsAnswering(true);
        setSelectedAnswer(answerKey);

        const isCorrect = questions[currentQuestionIndex].correctKey === answerKey;

        if (isCorrect && currentQuestionIndex === questions.length - 1) {
            handleWin();
        } else {
            setTimeout(() => {
                if (isCorrect) {
                    setCurrentQuestionIndex(prev => prev + 1);
                    setTimeLeft(10);
                    setIsAnswering(false);
                    setSelectedAnswer(null);
                } else {
                    handleGameOver();
                }
            }, 1000);
        }
    }, [questions, currentQuestionIndex, handleWin, handleGameOver, isAnswering, gameState]);

    useEffect(() => {
        if (gameState !== 'playing') return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) return 0;
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState]);

    // Monitor time left for game over
    useEffect(() => {
        if (timeLeft === 0 && gameState === 'playing') { // Fix: Check logic to correctly trigger game over
            handleGameOver();
        }
    }, [timeLeft, gameState, handleGameOver]);

    useEffect(() => {
        if (gameState !== 'playing') return;
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toUpperCase();
            console.log("TriviaGame: Key pressed:", key); // DEBUG
            if (['S', 'A', 'B'].includes(key)) {
                toast.success(`Trivia: Key pressed ${key}`); // DEBUG
            }
            if (key === 'S' || key === 'A' || key === 'B') {
                handleAnswer(key as 'S' | 'A' | 'B');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, handleAnswer]);

    if (questions.length === 0) {
        return (
            <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-white/40 uppercase tracking-[0.4em] font-black">
                No hay preguntas configuradas
            </div>
        );
    }

    const question = questions[currentQuestionIndex];

    return (
        <div className="h-screen w-screen relative overflow-hidden flex flex-col items-center justify-center bg-slate-950 text-white">
            <GameResultOverlay
                isOpen={gameState !== 'playing'}
                isWin={gameState === 'won'}
                title={gameState === 'won' ? '¡LO LOGRASTE!' : '¡PERDISTE!'}
                subtitle={gameState === 'won' ? '¡FELICITACIONES!' : 'JUEGO TERMINADO'}
                statusMessage={gameState === 'won' ? 'Generando tu ticket premiado...' : '¡Inténtalo en otra oportunidad!'}
            />

            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at center, #EAB308 0%, transparent 70%)' }} />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            </div>

            <div className="relative z-10 w-full max-w-5xl px-8 flex flex-col items-center">
                <div className="flex justify-between w-full mb-6 md:mb-12 items-end">
                    <div className="space-y-1 md:space-y-2">
                        <span className="text-yellow-500 font-black text-[10px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.5em]">Trivia Riojana</span>
                        <div className="flex items-center gap-2 md:gap-4">
                            <span className="text-4xl md:text-6xl font-black tracking-tighter">{currentQuestionIndex + 1}</span>
                            <div className="h-6 md:h-10 w-1 bg-yellow-500/30 rounded-full" />
                            <span className="text-[10px] md:text-xl font-bold text-white/40 uppercase tracking-widest leading-none">Pregunta <br /> de {questions.length}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 md:gap-2">
                        <span className="text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] md:tracking-[0.3em]">Tiempo restante</span>
                        <div className={`text-4xl md:text-6xl font-black tabular-nums transition-colors ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {timeLeft}s
                        </div>
                    </div>
                </div>

                <div className="w-full bg-white/[0.03] backdrop-blur-2xl p-6 md:p-12 rounded-3xl md:rounded-[3.5rem] border border-white/10 shadow-2xl mb-8 md:mb-12 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50" />
                    <h2 className="text-2xl md:text-5xl font-black leading-tight uppercase tracking-tight">
                        {question.question}
                    </h2>
                </div>

                <div className="flex flex-col gap-6 w-full max-w-2xl">
                    {(['S', 'A', 'B'] as const).map((key) => {
                        const isCorrect = question.correctKey === key;
                        const isSelected = selectedAnswer === key;

                        let stateStyles = 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1';
                        if (isAnswering) {
                            if (isSelected) {
                                stateStyles = isCorrect ? 'border-green-500 bg-green-500/20 text-green-300' : 'border-red-500 bg-red-500/20 text-red-300';
                            } else if (isCorrect) {
                                stateStyles = 'border-green-500 bg-green-500/10 text-green-300 opacity-50';
                            } else {
                                stateStyles = 'border-white/5 bg-white/0 opacity-20';
                            }
                        }

                        return (
                            <button
                                key={key}
                                onClick={() => handleAnswer(key)}
                                className={`group relative p-6 md:p-8 rounded-[2rem] border-2 transition-all duration-300 flex items-center justify-between gap-4 cursor-pointer select-none active:scale-95 ${stateStyles}`}
                            >
                                <div className="flex items-center gap-6 text-left">
                                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-3xl md:text-5xl font-black transition-all bg-white/10 ${isSelected ? 'scale-110 bg-white/20' : 'group-hover:scale-105'}`}>
                                        {key}
                                    </div>
                                    <span className="text-2xl md:text-4xl font-black uppercase tracking-tight leading-none">
                                        {question.options[key]}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
