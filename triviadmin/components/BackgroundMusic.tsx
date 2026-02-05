'use client';

import { useEffect, useRef } from 'react';

interface BackgroundMusicProps {
    src?: string;
    volume?: number;
}

export default function BackgroundMusic({ src, volume = 0.3 }: BackgroundMusicProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!src) return;

        const audio = new Audio(src);
        audio.loop = true;
        audio.volume = volume;
        audioRef.current = audio;

        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    // Playing
                })
                .catch((error) => {
                    console.log("Auto-play was prevented:", error);
                });
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [src, volume]);

    // Optional: Invisible UI or small control if debugging needed
    return null;
}
