'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeToJoystick, sendJoystickEvent } from '@/lib/realtime';
import { fetchChangoConfig, logGameEvent, generateWinningTicket, fetchPrizes } from '@/lib/actions';
import { Prize } from '@/lib/types';
import GameResultOverlay from './GameResultOverlay';

type Color = 'GREEN' | 'RED' | 'YELLOW' | 'BLUE';
type GameStatus = 'IDLE' | 'PLAYING_SEQUENCE' | 'WAITING_INPUT' | 'SUCCESS' | 'GAME_OVER' | 'WIN';

const COLORS: Color[] = ['GREEN', 'RED', 'YELLOW', 'BLUE'];

const SOUNDS = {
    GREEN: 'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3', // E4
    RED: 'https://cdn.freesound.org/previews/320/320654_5260872-lq.mp3',   // A3
    YELLOW: 'https://cdn.freesound.org/previews/320/320653_5260872-lq.mp3', // C#4
    BLUE: 'https://cdn.freesound.org/previews/320/320652_5260872-lq.mp3',    // E3
    ERROR: 'https://cdn.freesound.org/previews/173/173327_3226756-lq.mp3'
};

export default function SimonGame() {
    const router = useRouter();
    const [sequence, setSequence] = useState<Color[]>([]);
    // User sequence tracked via ref to avoid re-renders during rapid input
    const [status, setStatus] = useState<GameStatus>('IDLE');
    const [activeColor, setActiveColor] = useState<Color | null>(null);
    const [score, setScore] = useState(0);
    const [message, setMessage] = useState('ESPERANDO...');
    const [prizes, setPrizes] = useState<Prize[]>([]);

    // Refs for safe access in timeouts/intervals
    const sequenceRef = useRef<Color[]>([]);
    const userSequenceRef = useRef<Color[]>([]);
    const statusRef = useRef<GameStatus>('IDLE');
    const gameStartTime = useRef(new Date());

    const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

    const playSound = useCallback((color: string) => {
        const audio = audioRefs.current[color];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.error("Audio play failed", e));
        }
    }, []);

    const playSequence = useCallback(async (seq: Color[]) => {
        setStatus('PLAYING_SEQUENCE');
        statusRef.current = 'PLAYING_SEQUENCE';
        setMessage('MEMORIZA');
        userSequenceRef.current = [];

        // Speed calculation (gets faster as score increases)
        const baseSpeed = 1000;
        const speed = Math.max(300, baseSpeed - (score * 50));

        for (let i = 0; i < seq.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Pause between
            const color = seq[i];
            setActiveColor(color);
            playSound(color);
            await new Promise(resolve => setTimeout(resolve, speed));
            setActiveColor(null);
        }

        setStatus('WAITING_INPUT');
        statusRef.current = 'WAITING_INPUT';
        setMessage('TU TURNO');
    }, [score, playSound]);

    // Define dependencies for useEffect
    const startNewRound = useCallback(() => {
        const nextColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        const newSeq = [...sequenceRef.current, nextColor];
        setSequence(newSeq);
        sequenceRef.current = newSeq;

        playSequence(newSeq);
    }, [playSequence]);

    useEffect(() => {
        // Preload sounds
        Object.entries(SOUNDS).forEach(([key, src]) => {
            audioRefs.current[key] = new Audio(src);
        });

        const init = async () => {
            gameStartTime.current = new Date();
            const [prizeData] = await Promise.all([
                fetchPrizes(),
                fetchChangoConfig()
            ]);
            setPrizes(prizeData);

            // Notify Joystick
            const mid = localStorage.getItem('MACHINE_ID');
            if (mid) {
                sendJoystickEvent(mid, { type: 'STATE_CHANGE', state: 'PLAYING', game: 'SIMON' });
            }

            // Start Game after short delay
            setTimeout(startNewRound, 2000);
        };
        init();
    }, [startNewRound]); // Added dependency

    const handleGameOver = useCallback(() => {
        setStatus('GAME_OVER');
        statusRef.current = 'GAME_OVER';
        setMessage('¡ERROR!');
        playSound('ERROR');

        const mid = localStorage.getItem('MACHINE_ID');
        if (mid) {
            sendJoystickEvent(mid, { type: 'GAME_OVER' });
        }

        logGameEvent({
            gameType: 'simon',
            startedAt: gameStartTime.current,
            finishedAt: new Date(),
            result: 'LOSE',
            machineId: mid || undefined
        });

        setTimeout(() => router.push('/'), 3000);
    }, [router, playSound]);

    const handleWin = useCallback(async () => {
        setStatus('WIN');
        statusRef.current = 'WIN';
        const mid = localStorage.getItem('MACHINE_ID');

        let ticket = null;
        if (prizes.length > 0) {
            const prize = prizes[Math.floor(Math.random() * prizes.length)];
            ticket = await generateWinningTicket(prize.id, 'simon');
        }

        if (mid) {
            sendJoystickEvent(mid, { type: 'GAME_OVER' });
        }

        logGameEvent({
            gameType: 'simon',
            startedAt: gameStartTime.current,
            finishedAt: new Date(),
            result: 'WIN',
            ticketId: ticket?.id,
            machineId: mid || undefined
        });

        setTimeout(() => {
            if (ticket) {
                router.push(`/result?ticketId=${ticket.id}`);
            } else {
                router.push('/');
            }
        }, 3000);
    }, [prizes, router]);

    const handleInput = useCallback((color: Color) => {
        if (statusRef.current !== 'WAITING_INPUT') return;

        setActiveColor(color);
        playSound(color);
        setTimeout(() => setActiveColor(null), 300);

        const newUserSeq = [...userSequenceRef.current, color];
        userSequenceRef.current = newUserSeq;

        // Check correctness
        const index = newUserSeq.length - 1;
        if (newUserSeq[index] !== sequenceRef.current[index]) {
            handleGameOver();
            return;
        }

        // Check completion of current sequence
        if (newUserSeq.length === sequenceRef.current.length) {
            const newScore = sequenceRef.current.length;
            setScore(newScore);
            setStatus('SUCCESS');
            statusRef.current = 'SUCCESS';
            setMessage('¡BIEN!');

            // Win Condition (e.g. 10 rounds)
            if (newScore >= 10) { // Configurable ideally
                handleWin();
            } else {
                setTimeout(startNewRound, 1500);
            }
        }
    }, [startNewRound, handleGameOver, handleWin, playSound]);

    // Joystick Listener
    useEffect(() => {
        const mid = localStorage.getItem('MACHINE_ID');
        if (!mid) return;

        const sub = subscribeToJoystick(mid, (event) => {
            if (event.type === 'KEYDOWN' && event.key) {
                // Ensure key is valid Color
                if (COLORS.includes(event.key as Color)) {
                    handleInput(event.key as Color);
                }
            }
        });

        return () => { sub.unsubscribe(); };
    }, [handleInput]);

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-4">
            {/* Score / Status */}
            <div className="mb-8 text-center bg-slate-900/50 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                <h2 className="text-4xl font-black text-white uppercase tracking-widest mb-2">{message}</h2>
                <div className="text-xl font-bold text-yellow-500 uppercase tracking-wider">Nivel {sequence.length}</div>
            </div>

            {/* Game Grid */}
            <div className="grid grid-cols-2 gap-4 md:gap-8 p-4 relative">
                {/* Result Overlay */}
                <GameResultOverlay
                    isOpen={status === 'WIN' || status === 'GAME_OVER'}
                    isWin={status === 'WIN'}
                    title={status === 'WIN' ? '¡MEMORIA PERFECTA!' : '¡ERROR!'}
                    subtitle={status === 'WIN' ? 'PARTIDA COMPLETADA' : 'SECUENCIA INCORRECTA'}
                    statusMessage={status === 'WIN' ? 'Generando premio...' : 'Inténtalo de nuevo'}
                />

                {/* GREEN - Top Left */}
                <div
                    onClick={() => handleInput('GREEN')}
                    className={`
                        w-32 h-32 md:w-64 md:h-64 rounded-tl-[100%] bg-green-600 border-8 border-slate-900 cursor-pointer
                        transition-all duration-100 flex items-center justify-center
                        ${activeColor === 'GREEN' ? 'brightness-150 scale-105 shadow-[0_0_50px_rgba(34,197,94,0.6)]' : 'brightness-75 opacity-80'}
                    `}
                />

                {/* RED - Top Right */}
                <div
                    onClick={() => handleInput('RED')}
                    className={`
                        w-32 h-32 md:w-64 md:h-64 rounded-tr-[100%] bg-red-600 border-8 border-slate-900 cursor-pointer
                        transition-all duration-100 flex items-center justify-center
                        ${activeColor === 'RED' ? 'brightness-150 scale-105 shadow-[0_0_50px_rgba(239,68,68,0.6)]' : 'brightness-75 opacity-80'}
                    `}
                />

                {/* YELLOW - Bottom Left */}
                <div
                    onClick={() => handleInput('YELLOW')}
                    className={`
                        w-32 h-32 md:w-64 md:h-64 rounded-bl-[100%] bg-yellow-500 border-8 border-slate-900 cursor-pointer
                        transition-all duration-100 flex items-center justify-center
                        ${activeColor === 'YELLOW' ? 'brightness-150 scale-105 shadow-[0_0_50px_rgba(234,179,8,0.6)]' : 'brightness-75 opacity-80'}
                    `}
                />

                {/* BLUE - Bottom Right */}
                <div
                    onClick={() => handleInput('BLUE')}
                    className={`
                        w-32 h-32 md:w-64 md:h-64 rounded-br-[100%] bg-blue-600 border-8 border-slate-900 cursor-pointer
                        transition-all duration-100 flex items-center justify-center
                        ${activeColor === 'BLUE' ? 'brightness-150 scale-105 shadow-[0_0_50px_rgba(37,99,235,0.6)]' : 'brightness-75 opacity-80'}
                    `}
                />

                {/* Center Hub */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-40 md:h-40 bg-slate-900 rounded-full flex items-center justify-center border-8 border-slate-800 z-10 shadow-2xl">
                    <span className="text-xl md:text-3xl font-black text-slate-700">SAB</span>
                </div>
            </div>
        </div>
    );
}
