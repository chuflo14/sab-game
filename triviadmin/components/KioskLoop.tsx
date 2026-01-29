'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdMedia, ChangoConfig } from '@/lib/types';

interface KioskLoopProps {
    ads: AdMedia[];
    config: ChangoConfig;
}

export default function KioskLoop({ ads, config }: KioskLoopProps) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);

    // Sort ads: Priority true first, then others.
    const sortedAds = useMemo(() => {
        return [...ads].sort((a, b) => {
            if (a.priority === b.priority) return 0;
            return a.priority ? -1 : 1;
        });
    }, [ads]);

    const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);

    // Check cooldown on mount and interval
    useEffect(() => {
        const checkCooldown = () => {
            const until = localStorage.getItem('game_cooldown_until');
            if (until) {
                const diff = parseInt(until) - Date.now();
                if (diff > 0) {
                    setCooldownTimeLeft(Math.ceil(diff / 1000));
                } else {
                    setCooldownTimeLeft(0);
                    localStorage.removeItem('game_cooldown_until');
                }
            }
        };

        checkCooldown(); // Initial check
        const timer = setInterval(checkCooldown, 1000);
        return () => clearInterval(timer);
    }, []);

    // Navigation handler
    const handleStart = useCallback(() => {
        if (cooldownTimeLeft > 0) return;
        router.push('/play');
    }, [cooldownTimeLeft, router]);

    // Keyboard listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toUpperCase();
            // Strict key check for hardware buttons (S, A, B)
            if (['S', 'A', 'B'].includes(key)) {
                handleStart();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleStart]);

    // Ad rotation
    useEffect(() => {
        if (sortedAds.length === 0) return;

        const currentAd = sortedAds[currentIndex];

        let duration = (currentAd.durationSec || 10) * 1000;

        // Override for priority ads if global config exists
        if (currentAd.priority && config.priorityAdDurationSeconds) {
            duration = config.priorityAdDurationSeconds * 1000;
        }

        const timer = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % sortedAds.length);
        }, duration);

        return () => clearTimeout(timer);
    }, [currentIndex, sortedAds, config]);

    if (sortedAds.length === 0) {
        return (
            <div
                className="h-screen bg-black flex flex-col items-center justify-center text-white cursor-pointer"
                onClick={handleStart}
            >
                <h1 className="text-4xl font-black uppercase tracking-widest mb-4">SAB GAME</h1>
                <p className="text-sm opacity-50 animate-pulse">Toque para comenzar</p>
            </div>
        );
    }

    const currentAd = sortedAds[currentIndex];

    // Helper to bypass static cache for local uploads
    const getMediaUrl = (url: string) => {
        if (url.startsWith('/media/')) {
            return `/api/ad-image?path=${encodeURIComponent(url)}`;
        }
        return url;
    };

    const mediaSrc = getMediaUrl(currentAd.url);

    return (
        <div
            className="h-screen w-screen bg-black overflow-hidden relative cursor-pointer group"
            onClick={handleStart}
        >
            {currentAd.type === 'image' ? (
                <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        key={currentAd.id} // Key to force re-render on change
                        src={mediaSrc}
                        alt={currentAd.name || "Advertisement"}
                        className="w-full h-full object-cover animate-in fade-in duration-1000"
                        onError={(e) => {
                            console.error("Error loading ad image:", mediaSrc);
                            e.currentTarget.style.display = 'none';
                            // Find the error container and show it
                            const errorDiv = document.getElementById(`error-${currentAd.id}`);
                            if (errorDiv) errorDiv.style.display = 'flex';
                        }}
                    />
                    <div
                        id={`error-${currentAd.id}`}
                        className="absolute inset-0 hidden flex-col items-center justify-center bg-zinc-900 text-red-500"
                    >
                        <p className="font-bold uppercase tracking-widest mb-2">Error cargando imagen</p>
                        <p className="text-xs font-mono bg-black/50 p-2 rounded max-w-lg break-all">{currentAd.url}</p>
                    </div>
                </>
            ) : (
                <video
                    key={currentAd.id} // Key to force reload on change
                    src={mediaSrc}
                    className="w-full h-full object-cover animate-in fade-in duration-1000"
                    autoPlay
                    muted
                    loop
                    playsInline
                />
            )}

            {/* Touch to start overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />

            <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none space-y-2">
                {cooldownTimeLeft > 0 ? (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-4 bg-black/80 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/10 shadow-2xl">
                            <div className="text-4xl font-black text-red-500 tabular-nums w-16 text-center">
                                {cooldownTimeLeft}
                            </div>
                            <div className="h-10 w-[1px] bg-white/20" />
                            <div className="text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Siguiente Juego en</p>
                                <p className="text-xs font-bold text-white uppercase tracking-widest">Espere por favor...</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <span className="inline-block px-6 py-2 bg-yellow-500 text-black font-black text-xl uppercase tracking-[0.2em] rounded-full animate-bounce shadow-lg shadow-yellow-500/20 transform group-hover:scale-110 transition-transform">
                        Tocar para Jugar
                    </span>
                )}
            </div>
        </div>
    );
}
