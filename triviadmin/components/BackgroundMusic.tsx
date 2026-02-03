'use client';

import { useEffect, useRef, useState } from 'react';

interface BackgroundMusicProps {
    src?: string;
    volume?: number;
}

export default function BackgroundMusic({ src, volume = 0.3 }: BackgroundMusicProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

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
                    setIsPlaying(true);
                })
                .catch((error) => {
                    console.log("Auto-play was prevented:", error);
                    setIsPlaying(false);
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
