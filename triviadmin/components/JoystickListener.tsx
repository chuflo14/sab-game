'use client';

import { useEffect } from 'react';
import { subscribeToJoystick } from '@/lib/realtime';

export default function JoystickListener() {
    useEffect(() => {
        // Only run on client side and if machine ID exists
        if (typeof window === 'undefined') return;

        const mid = localStorage.getItem('MACHINE_ID');
        if (!mid) {
            console.log("JoystickListener: No MACHINE_ID found, skipping subscription.");
            return;
        }

        console.log("JoystickListener: Initializing global listener for:", mid);

        const channel = subscribeToJoystick(mid, (payload) => {
            if (payload.type === 'KEYDOWN') {
                console.log("JoystickListener: Dispatching global keydown:", payload.key);
                // Dispatch a standard keyboard event that React and other listeners can catch
                const event = new KeyboardEvent('keydown', {
                    key: payload.key,
                    code: `Key${payload.key.toUpperCase()}`,
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                window.dispatchEvent(event);
            }
            if (payload.type === 'START') {
                console.log("JoystickListener: Dispatching START as 'S' key");
                const event = new KeyboardEvent('keydown', {
                    key: 'S',
                    code: 'KeyS',
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                window.dispatchEvent(event);
            }
        });

        return () => {
            console.log("JoystickListener: Cleaning up.");
            channel.unsubscribe();
        };
    }, []);

    return null;
}
