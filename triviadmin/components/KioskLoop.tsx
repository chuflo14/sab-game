'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Maximize2, Minimize2 } from 'lucide-react';
import { AdMedia, ChangoConfig } from '@/lib/types';

interface KioskLoopProps {
    ads: AdMedia[];
    config: ChangoConfig;
}

export default function KioskLoop({ ads, config }: KioskLoopProps) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setIsFullscreen(true);
            }).catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    }, []);

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
        console.log("KioskLoop: handleStart called. Cooldown:", cooldownTimeLeft);
        if (cooldownTimeLeft > 0) {
            console.log("KioskLoop: Blocked by cooldown.");
            return;
        }
        console.log("KioskLoop: Navigating...");


        console.log("KioskLoop: Navigating to /play (Menu)");
        router.push('/play');
    }, [cooldownTimeLeft, router]);

    // Keyboard listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toUpperCase();
            console.log("KioskLoop: Key down detected:", key);
            // Strict key check for hardware buttons (S, A, B)
            if (['S', 'A', 'B'].includes(key)) {
                console.log("KioskLoop: Valid key (S,A,B) detected, triggering start.");
                handleStart();
            }

            if (key === 'ESCAPE') {
                if (document.fullscreenElement && document.exitFullscreen) {
                    document.exitFullscreen();
                    setIsFullscreen(false);
                }
            }
        };

        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        console.log("KioskLoop: Keydown listener attached to window.");
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            console.log("KioskLoop: Keydown listener detached.");
        };
    }, [handleStart]);

    // Ad rotation
    useEffect(() => {
        if (sortedAds.length === 0) return;

        const currentAd = sortedAds[currentIndex];

        const duration = (currentAd.durationSec || 10) * 1000;



        const timer = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % sortedAds.length);
        }, duration);

        return () => clearTimeout(timer);
    }, [currentIndex, sortedAds, config]);

    const currentAd = sortedAds[currentIndex];

    const [clientSideTimestamp, setClientSideTimestamp] = useState<number | null>(null);

    useEffect(() => {
        setClientSideTimestamp(Date.now());
    }, []);

    // Helper to bypass static cache for local uploads and force refresh
    const getMediaUrl = useCallback((url: string) => {
        if (!clientSideTimestamp) return url;

        const separator = url.includes('?') ? '&' : '?';

        if (url.startsWith('/media/')) {
            return `/api/ad-image?path=${encodeURIComponent(url)}&t=${clientSideTimestamp}`;
        }

        // Ensure remote URLs also get cache busted if needed, or if we suspect CDN caching issues
        return `${url}${separator}t=${clientSideTimestamp}`;
    }, [clientSideTimestamp]);

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
                        key={currentAd.id}
                        src={mediaSrc}
                        alt={currentAd.name || "Advertisement"}
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover animate-in fade-in duration-1000 pointer-events-none"
                        onError={(e) => {
                            console.error("Error loading ad image:", mediaSrc);
                            e.currentTarget.style.display = 'none';
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
                    key={currentAd.id}
                    src={mediaSrc}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover animate-in fade-in duration-1000 pointer-events-none"
                    autoPlay
                    // muted removed to allow audio
                    loop
                    playsInline
                />
            )}

            {/* Fullscreen Toggle Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                }}
                className="absolute top-4 right-4 z-50 p-3 bg-black/50 hover:bg-black/70 text-white/50 hover:text-white rounded-full backdrop-blur-md transition-all duration-300 border border-white/10"
            >
                {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
            </button>

            {/* Touch to start overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />

            <div className="absolute bottom-6 md:bottom-10 left-0 right-0 text-center pointer-events-none space-y-4 px-4">
                {cooldownTimeLeft > 0 ? (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-3 md:gap-4 bg-black/80 backdrop-blur-md px-4 py-3 md:px-8 md:py-4 rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl">
                            <div className="text-2xl md:text-4xl font-black text-red-500 tabular-nums w-12 md:w-16 text-center">
                                {cooldownTimeLeft}
                            </div>
                            <div className="h-8 md:h-10 w-[1px] bg-white/20" />
                            <div className="text-left">
                                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Siguiente Juego en</p>
                                <p className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest">Espere por favor...</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <span className="inline-block px-8 py-4 md:px-14 md:py-6 bg-yellow-500 text-black font-black text-2xl md:text-5xl uppercase tracking-[0.1em] md:tracking-[0.2em] rounded-full animate-bounce shadow-lg shadow-yellow-500/40 transform group-hover:scale-105 transition-all">
                        Tocar para Jugar
                    </span>
                )}
            </div>
        </div>
    );
}
