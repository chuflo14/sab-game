'use client';

import { Ticket, Store, ChangoConfig } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import QRCode from 'react-qr-code';

interface ResultDisplayProps {
    ticket: Ticket;
    store: Store | undefined;
    config: ChangoConfig;
}

export default function ResultDisplay({ ticket, store, config }: ResultDisplayProps) {
    const router = useRouter();
    // Use configured QR time or default to 20
    const initialTime = config.qrDisplaySeconds || 20;
    const [timeLeft, setTimeLeft] = useState(initialTime);

    // Safety ref to prevent double execution
    const cooldownSet = useRef(false);

    const handleFinish = useCallback(() => {
        if (!cooldownSet.current) {
            cooldownSet.current = true;

            // Set cooldown
            const cooldownSeconds = config.gameCooldownSeconds || 10;
            if (cooldownSeconds > 0) {
                const until = Date.now() + (cooldownSeconds * 1000);
                localStorage.setItem('game_cooldown_until', until.toString());
            }

            router.push('/');
        }
    }, [config.gameCooldownSeconds, router]);

    useEffect(() => {
        if (timeLeft <= 0) {
            handleFinish();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, handleFinish]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8 text-center animate-in fade-in zoom-in duration-500">
            <h1 className="text-4xl md:text-6xl font-black text-green-500 uppercase tracking-tighter mb-4">
                ¡GANASTE!
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-6 md:mb-8">
                Tu premio te espera.
            </p>

            <div className="bg-white p-4 md:p-6 rounded-2xl mb-6 md:mb-8 shadow-2xl shadow-green-500/20">
                <div className="w-[200px] h-[200px] md:w-[256px] md:h-[256px]">
                    <QRCode value={ticket.token || ticket.id} size={256} className="w-full h-full" />
                </div>
                <p className="text-black font-mono font-bold text-xl md:text-2xl mt-4 tracking-widest">{ticket.token}</p>
            </div>

            {store ? (
                <div className="bg-neutral-900 border border-neutral-800 p-4 md:p-6 rounded-xl max-w-lg w-full mb-6 md:mb-8">
                    <h2 className="text-xs md:text-sm font-bold text-gray-400 mb-2 md:mb-4 uppercase tracking-wider">Retira en:</h2>
                    <p className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">{store.name}</p>
                    <p className="text-lg md:text-xl text-gray-400 mb-4">{store.address}</p>

                    <div className="flex gap-4 justify-center">
                        <div className="flex items-center gap-2 text-green-400 bg-green-900/20 px-4 py-2 rounded-full border border-green-900/50 text-xs md:text-base">
                            <span>WhatsApp:</span>
                            <span className="font-mono font-bold">{store.whatsapp}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-red-900/20 border border-red-900/50 p-4 md:p-6 rounded-xl max-w-lg w-full mb-6 md:mb-8 text-red-200">
                    <p className="font-bold">No hay tiendas activas configuradas.</p>
                    <p className="text-sm opacity-70">Contacta al administrador.</p>
                </div>
            )}

            {/* Visual Timer Bar */}
            <div className="w-full max-w-md bg-neutral-800 h-2 rounded-full overflow-hidden mb-4">
                <div
                    className="bg-yellow-500 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / initialTime) * 100}%` }}
                />
            </div>

            <div className="text-4xl font-black text-yellow-500 flex items-center gap-3">
                <span className="text-gray-500 text-lg uppercase tracking-widest">Reiniciando en</span>
                <span className="w-12 text-center">{timeLeft}s</span>
            </div>
        </div>
    );
}
