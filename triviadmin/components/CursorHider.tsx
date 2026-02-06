'use client';

import { useEffect, useRef } from 'react';

export default function CursorHider() {
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const hideCursor = () => {
            document.documentElement.style.cursor = 'none';
        };

        const showCursor = () => {
            document.documentElement.style.cursor = 'auto';
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(hideCursor, 10000);
        };

        // Initialize listener
        window.addEventListener('mousemove', showCursor);
        window.addEventListener('mousedown', showCursor);
        window.addEventListener('keydown', showCursor);
        window.addEventListener('touchstart', showCursor);

        // Start timer initially
        showCursor();

        return () => {
            window.removeEventListener('mousemove', showCursor);
            window.removeEventListener('mousedown', showCursor);
            window.removeEventListener('keydown', showCursor);
            window.removeEventListener('touchstart', showCursor);
            if (timerRef.current) clearTimeout(timerRef.current);
            document.documentElement.style.cursor = 'auto'; // Restore on unmount
        };
    }, []);

    return null;
}
