'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Maximize2, Minimize2 } from 'lucide-react';
import { updateMachineHeartbeat } from '@/lib/actions';
import { AdMedia, ChangoConfig } from '@/lib/types';
import QRCode from 'react-qr-code';
import { sendJoystickEvent, subscribeToJoystick } from '@/lib/realtime';

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

    const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);
    const [isDebug, setIsDebug] = useState(false);
    const [currentMachineId, setCurrentMachineId] = useState<string | null>(null);
    const [isOperational, setIsOperational] = useState<boolean>(true);
    const [isJoystickEnabled, setIsJoystickEnabled] = useState<boolean>(true);

    // Sort and Filter ads (Moved after state declaration to use currentMachineId)
    const sortedAds = useMemo(() => {
        const filtered = ads.filter(ad => {
            // Show if no specific targeting
            if (!ad.machineIds || ad.machineIds.length === 0) return true;
            // Show if machine ID matches
            if (currentMachineId && ad.machineIds.includes(currentMachineId)) return true;
            return false;
        });

        return [...filtered].sort((a, b) => {
            if (a.priority === b.priority) return 0;
            return a.priority ? -1 : 1;
        });
    }, [ads, currentMachineId]);

    // Check for reset or set query param
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

        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const setMachineId = params.get('set_machine_id');
            const reset = params.get('reset');
            const debugParam = params.get('debug');

            if (debugParam === 'true') {
                setIsDebug(true);
            }

            if (setMachineId) {
                localStorage.setItem('MACHINE_ID', setMachineId);
                console.log(`Machine ID set to: ${setMachineId}`);
                setCurrentMachineId(setMachineId); // Update state

                // Remove param from URL without reload
                const newUrl = window.location.pathname + (debugParam === 'true' ? '?debug=true' : '');
                window.history.replaceState({}, '', newUrl);
            } else if (reset === 'true') {
                localStorage.removeItem('MACHINE_ID');
                console.log('Machine ID cleared');
                setCurrentMachineId(null); // Update state

                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            } else {
                // Initialize from Storage if no param
                setCurrentMachineId(localStorage.getItem('MACHINE_ID'));
            }

            const currentId = localStorage.getItem('MACHINE_ID');
            if (currentId) {
                console.log("Current Machine ID:", currentId);
            }
        }

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

    // Machine Heartbeat logic
    useEffect(() => {
        if (!currentMachineId) return;

        const sendHeartbeat = async () => {
            console.log("KioskLoop: Sending heartbeat and checking status for machine:", currentMachineId);
            const { getMachineById } = await import('@/lib/dal');
            try {
                await updateMachineHeartbeat(currentMachineId);
                const m = await getMachineById(currentMachineId);
                if (m) {
                    setIsOperational(m.isOperational !== false);
                    setIsJoystickEnabled(m.joystick_enabled !== false);
                }
            } catch (err) {
                console.warn('Heartbeat/Status check failed:', err);
            }
        };

        // Send initial heartbeat
        sendHeartbeat();

        // Send heartbeat every 30 seconds
        const heartbeatTimer = setInterval(sendHeartbeat, 30000);

        return () => clearInterval(heartbeatTimer);
    }, [currentMachineId]);

    // Use ref to hold the latest handleStart to avoid re-subscribing when cooldown changes
    const handleStartRef = useRef(handleStart);
    useEffect(() => {
        handleStartRef.current = handleStart;
    }, [handleStart]);

    // Joystick Realtime Logic - Report State & Respond to JOIN
    useEffect(() => {
        if (!currentMachineId || !isJoystickEnabled) return;

        console.log("KioskLoop: Javascript reporting state READY");
        // Report state to joystick (Initial)
        sendJoystickEvent(currentMachineId, { type: 'STATE_CHANGE', state: 'READY' });

        // Listen for new connections (JOIN) and resend state
        const sub = subscribeToJoystick(currentMachineId, (event) => {
            if (event.type === 'JOIN') {
                console.log(`KioskLoop: Player ${event.playerId} joined, resending READY state`);
                sendJoystickEvent(currentMachineId, { type: 'STATE_CHANGE', state: 'READY' });
            } else if (event.type === 'KEYDOWN' || event.type === 'TAP') {
                console.log("KioskLoop: Joystick input received, triggering start.");
                if (handleStartRef.current) {
                    handleStartRef.current();
                }
            }
        });

        // Heartbeat: Broadcast READY state periodically
        const stateInterval = setInterval(() => {
            // console.log("KioskLoop: Broadcasting READY state (Heartbeat)");
            sendJoystickEvent(currentMachineId, { type: 'STATE_CHANGE', state: 'READY' });
        }, 3000);

        return () => {
            sub.unsubscribe();
            clearInterval(stateInterval);
        };
    }, [currentMachineId, isJoystickEnabled]);

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
    const getMediaUrl = useCallback((url: string, forceFresh = false) => {
        if (!clientSideTimestamp) return url;

        const separator = url.includes('?') ? '&' : '?';

        if (url.startsWith('/media/')) {
            return `/api/ad-image?path=${encodeURIComponent(url)}${forceFresh ? `&t=${clientSideTimestamp}` : ''}`;
        }

        // Only add timestamp if explicitly forced, otherwise let the Service Worker/Browser cache handle it
        return forceFresh ? `${url}${separator}t=${clientSideTimestamp}` : url;
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
                <>
                    <video
                        key={currentAd.id}
                        src={mediaSrc}
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover animate-in fade-in duration-1000 pointer-events-none"
                        autoPlay
                        // muted removed to allow audio
                        loop
                        playsInline
                        preload="auto"
                        onError={(e) => {
                            console.error("Error loading ad video:", mediaSrc);
                            const video = e.currentTarget;
                            video.style.display = 'none';
                            const errorDiv = document.getElementById(`error-${currentAd.id}`);
                            if (errorDiv) errorDiv.style.display = 'flex';
                        }}
                    />
                    <div
                        id={`error-${currentAd.id}`}
                        className="absolute inset-0 hidden flex-col items-center justify-center bg-zinc-900 text-red-500"
                    >
                        <p className="font-bold uppercase tracking-widest mb-2">Error cargando video</p>
                        <p className="text-xs font-mono bg-black/50 p-2 rounded max-w-lg break-all">{currentAd.url}</p>
                    </div>
                </>
            )}

            {/* PRE-CACHE NEXT MEDIA */}
            {sortedAds.length > 1 && (
                <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
                    {(() => {
                        const nextIndex = (currentIndex + 1) % sortedAds.length;
                        const nextAd = sortedAds[nextIndex];
                        const nextSrc = getMediaUrl(nextAd.url);

                        if (nextAd.type === 'video') {
                            return (
                                <video
                                    key={`preload-${nextAd.id}`}
                                    src={nextSrc}
                                    preload="auto"
                                    muted
                                    crossOrigin="anonymous"
                                />
                            );
                        } else {
                            return (
                                <img
                                    key={`preload-${nextAd.id}`}
                                    src={nextSrc}
                                    crossOrigin="anonymous"
                                    alt="preload"
                                />
                            );
                        }
                    })()}
                    {/* Pre-cache one more ahead to be safe */}
                    {sortedAds.length > 2 && (() => {
                        const farIndex = (currentIndex + 2) % sortedAds.length;
                        const farAd = sortedAds[farIndex];
                        const farSrc = getMediaUrl(farAd.url);
                        return farAd.type === 'video' ?
                            <video key={`preload-far-${farAd.id}`} src={farSrc} preload="auto" muted crossOrigin="anonymous" /> :
                            <img key={`preload-far-${farAd.id}`} src={farSrc} crossOrigin="anonymous" alt="preload" />;
                    })()}
                </div>
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

            {/* DEBUG OVERLAY - Only visible if ?debug=true in URL */}
            {isDebug && (
                <div className="absolute top-20 left-4 z-50 bg-black/80 backdrop-blur-md p-4 rounded-xl border border-red-500/30 text-xs font-mono text-green-400 max-w-sm pointer-events-none">
                    <p className="text-white font-bold mb-2 border-b border-white/20 pb-1">DEBUG MODE</p>
                    <p>Machine ID: <span className="text-yellow-400">{localStorage.getItem('MACHINE_ID') || 'NONE (Global)'}</span></p>
                    <p>Total Ads: {ads.length}</p>
                    <p>Filtered Ads: {sortedAds.length}</p>
                    <div className="mt-2 space-y-1">
                        {ads.map(ad => {
                            const myId = localStorage.getItem('MACHINE_ID');
                            const isMatch = !ad.machineIds || ad.machineIds.length === 0 || (myId && ad.machineIds.includes(myId));
                            return (
                                <div key={ad.id} className={isMatch ? 'text-green-500' : 'text-red-500 opacity-50'}>
                                    [{isMatch ? 'SHOW' : 'HIDE'}] {ad.name || 'Unnamed'}
                                    {ad.machineIds && ad.machineIds.length > 0 ? ` (Targeted: ${ad.machineIds.length})` : ' (Global)'}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

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
                    <div className="flex flex-col items-center gap-4">
                        {currentMachineId && isJoystickEnabled ? (
                            <>
                                <span className="inline-block px-8 py-4 md:px-14 md:py-6 bg-blue-600 text-white font-black text-2xl md:text-5xl uppercase tracking-[0.1em] md:tracking-[0.2em] rounded-full animate-bounce shadow-lg shadow-blue-600/40 transform group-hover:scale-105 transition-all">
                                    Escanear QR para Jugar
                                </span>

                                <div className="pointer-events-auto bg-white p-4 rounded-xl shadow-2xl flex flex-col items-center gap-2 group/qr transition-transform hover:scale-105 mt-4 w-96">
                                    <QRCode
                                        value={`${window.location.origin}/joystick/${currentMachineId}`}
                                        size={300}
                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                        viewBox={`0 0 256 256`}
                                    />
                                    <span className="text-sm font-bold text-black uppercase tracking-tight">Joystick QR</span>
                                </div>
                            </>
                        ) : (
                            <span className="inline-block px-8 py-4 md:px-14 md:py-6 bg-yellow-500 text-black font-black text-2xl md:text-5xl uppercase tracking-[0.1em] md:tracking-[0.2em] rounded-full animate-bounce shadow-lg shadow-yellow-500/40 transform group-hover:scale-105 transition-all">
                                Tocar para Jugar
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Out of Service Overlay */}
            {!isOperational && (
                <div className="absolute inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
                    <div className="w-32 h-32 bg-red-500/20 rounded-full flex items-center justify-center mb-12 animate-pulse">
                        <div className="w-16 h-16 bg-red-500 rounded-2xl rotate-45" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-6 leading-none">
                        MÁQUINA FUERA <br /> DE SERVICIO
                    </h1>
                    <div className="h-2 w-32 bg-red-500 mx-auto mb-8" />
                    <p className="text-xl md:text-2xl font-bold text-slate-400 uppercase tracking-[0.2em] max-w-2xl mb-12">
                        O EN MANTENIMIENTO <br />
                        <span className="text-white">COMUNICARSE CON SABGAME</span>
                    </p>
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-6 py-2 border border-slate-800 rounded-full">
                        ID: {currentMachineId || 'GLOBAL'}
                    </div>
                </div>
            )}
        </div>
    );
}
