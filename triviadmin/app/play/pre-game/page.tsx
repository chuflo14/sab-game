'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { fetchAds } from '@/lib/actions';
import { AdMedia } from '@/lib/types';
import { useEffect, useState, useRef, useCallback } from 'react';
import { sendJoystickEvent } from '@/lib/realtime';

import { Suspense } from 'react';

function PreGameContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const nextRoute = searchParams.get('next') || '/';

    const [selectedAd, setSelectedAd] = useState<AdMedia | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);

    // Helper to bypass static cache for local uploads
    const getMediaUrl = (url: string) => {
        if (url.startsWith('/media/')) {
            return `/api/ad-image?path=${encodeURIComponent(url)}`;
        }
        return url;
    };

    const handleFinish = useCallback(() => {
        router.replace(nextRoute);
    }, [router, nextRoute]);

    useEffect(() => {
        const init = async () => {
            try {
                const ads = await fetchAds();
                const priorityAds = ads.filter(a => a.active && a.priority);

                if (priorityAds.length > 0) {
                    // Pick one random priority ad
                    const randomAd = priorityAds[Math.floor(Math.random() * priorityAds.length)];
                    setSelectedAd(randomAd);
                    if (randomAd.type === 'image') {
                        setTimeLeft(randomAd.durationSec || 5);
                    }
                } else {
                    // No priority ads, skip directly
                    handleFinish();
                }
            } catch (e) {
                console.error(e);
                handleFinish();
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [handleFinish]);

    // Timer for images
    useEffect(() => {
        if (!selectedAd || selectedAd.type !== 'image') return;

        if (timeLeft <= 0) {
            handleFinish();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, selectedAd, handleFinish]);

    const [mediaLoaded, setMediaLoaded] = useState(false);

    useEffect(() => {
        if (!loading && (!selectedAd || selectedAd.type === 'video')) {
            // Videos trigger onLoadedData, images triggers onLoad
            // But if no ad found, logic handles finish.
        }
    }, [loading, selectedAd]);

    useEffect(() => {
        const mid = localStorage.getItem('MACHINE_ID');
        if (mid) {
            sendJoystickEvent(mid, { type: 'STATE_CHANGE', state: 'WAITING_SELECTION' });
        }
    }, []);


    if (loading) {
        return (
            <div className="h-screen w-screen bg-black flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                <p className="text-yellow-500/50 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Cargando contenido...</p>
            </div>
        );
    }

    if (!selectedAd) return null; // Redirecting...

    const mediaSrc = getMediaUrl(selectedAd.url);

    return (
        <div className="h-screen w-screen bg-black flex items-center justify-center overflow-hidden relative">
            {selectedAd.type === 'video' ? (
                <video
                    ref={videoRef}
                    src={mediaSrc}
                    className={`w-full h-full object-cover duration-500 ${mediaLoaded ? 'opacity-100 animate-in fade-in zoom-in' : 'opacity-0'}`}
                    autoPlay
                    onEnded={handleFinish}
                    onLoadedData={() => setMediaLoaded(true)}
                />
            ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={mediaSrc}
                    className={`w-full h-full object-cover duration-500 ${mediaLoaded ? 'opacity-100 animate-in fade-in zoom-in' : 'opacity-0'}`}
                    alt="Publicidad"
                    onLoad={() => setMediaLoaded(true)}
                    onError={handleFinish} // Skip on error
                />
            )}

            {!mediaLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 z-40 bg-black">
                    <div className="w-16 h-16 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                    <p className="text-yellow-500/50 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Cargando...</p>
                </div>
            )}

            {/* Progress / Skip controls */}
            <div className="absolute top-8 right-8 flex items-center gap-4 z-50">
                {selectedAd.type === 'image' && (
                    <div className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center text-xs font-bold font-mono">
                        {timeLeft}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PreGamePage() {
    return (
        <Suspense fallback={<div className="h-screen bg-black" />}>
            <PreGameContent />
        </Suspense>
    );
}
