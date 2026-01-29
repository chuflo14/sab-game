'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { fetchAds, fetchChangoConfig } from '@/lib/actions';
import { AdMedia } from '@/lib/types';
import { useEffect, useState, useRef } from 'react';

export default function PreGamePage() {
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

    const handleFinish = () => {
        router.replace(nextRoute);
    };

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
                    router.replace(nextRoute);
                }
            } catch (e) {
                console.error(e);
                router.replace(nextRoute);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [nextRoute, router]);

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
    }, [timeLeft, selectedAd]);

    if (loading) return <div className="h-screen bg-black" />;
    if (!selectedAd) return null; // Redirecting...

    const mediaSrc = getMediaUrl(selectedAd.url);

    return (
        <div className="h-screen w-screen bg-black flex items-center justify-center overflow-hidden relative">
            {selectedAd.type === 'video' ? (
                 
                <video
                    ref={videoRef}
                    src={mediaSrc}
                    className="w-full h-full object-cover animate-in fade-in zoom-in duration-500"
                    autoPlay
                    onEnded={handleFinish}
                />
            ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={mediaSrc}
                    className="w-full h-full object-cover animate-in fade-in zoom-in duration-500"
                    alt="Publicidad"
                    onError={handleFinish} // Skip on error
                />
            )}

            {/* Progress / Skip controls */}
            <div className="absolute top-8 right-8 flex items-center gap-4 z-50">
                {selectedAd.type === 'image' && (
                    <div className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center text-xs font-bold font-mono">
                        {timeLeft}
                    </div>
                )}

                <button
                    onClick={handleFinish}
                    className="text-white/50 hover:text-white border border-white/20 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                    Omitir
                </button>
            </div>

            {/* Loading indicator for video buffering */}
            <div className="absolute bottom-8 left-8">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                        {selectedAd.name || 'Publicidad'}
                    </span>
                </div>
            </div>
        </div>
    );
}
