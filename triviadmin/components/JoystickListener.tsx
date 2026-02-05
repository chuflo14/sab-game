'use client';

import { useEffect, useRef } from 'react';
import { subscribeToJoystick } from '@/lib/realtime';
import { toast } from 'sonner';

export default function JoystickListener() {
    // Keep track of the currently subscribed machine ID
    const activeMachineIdRef = useRef<string | null>(null);
    const channelRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkAndSubscribe = () => {
            const currentMid = localStorage.getItem('MACHINE_ID');

            // If ID matches what we are already subscribed to, do nothing
            if (currentMid === activeMachineIdRef.current) {
                return;
            }

            // If ID changed (or we weren't subscribed), handle it
            console.log(`JoystickListener: Machine ID changed from ${activeMachineIdRef.current} to ${currentMid}`);

            // 1. Unsubscribe from old
            if (channelRef.current) {
                console.log("JoystickListener: Unsubscribing from old channel...");
                channelRef.current.unsubscribe();
                channelRef.current = null;
                activeMachineIdRef.current = null;
            }

            // 2. Subscribe to new if exists
            if (currentMid) {
                console.log("JoystickListener: Subscribing to new ID:", currentMid);

                const channel = subscribeToJoystick(currentMid, (payload) => {
                    console.log("JoystickListener: Event received:", payload);

                    if (payload.type === 'KEYDOWN') {
                        console.log("JoystickListener: Dispatching global keydown:", payload.key);
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
                        toast.success("¡Comando START recibido!");
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

                channelRef.current = channel;
                activeMachineIdRef.current = currentMid;
                toast.success(`Joystick Conectado: ${currentMid.slice(0, 4)}...`);
            }
        };

        // Initial check
        checkAndSubscribe();

        // Check every 2 seconds for changes (e.g. if set via URL or other component)
        const interval = setInterval(checkAndSubscribe, 2000);

        return () => {
            clearInterval(interval);
            if (channelRef.current) {
                channelRef.current.unsubscribe();
            }
        };
    }, []);

    return null;
}
