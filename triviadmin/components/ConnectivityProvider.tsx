'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ConnectivityContextType {
    isOnline: boolean;
}

const ConnectivityContext = createContext<ConnectivityContextType>({ isOnline: true });

export const useConnectivity = () => useContext(ConnectivityContext);

export const ConnectivityProvider = ({ children }: { children: React.ReactNode }) => {
    const [isOnline, setIsOnline] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Initial check
        if (typeof window !== 'undefined') {
            setIsOnline(navigator.onLine);

            const handleOnline = () => {
                console.log('Connectivity: Device is online');
                setIsOnline(true);
                // Force a hard reload to ensure all assets and server actions are fresh
                // This is crucial for Raspberry Pi kiosks to "return" to the game automatically
                window.location.reload();
            };

            const handleOffline = () => {
                console.log('Connectivity: Device is offline');
                setIsOnline(false);
            };

            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }
    }, [router]);

    return (
        <ConnectivityContext.Provider value={{ isOnline }}>
            {children}
        </ConnectivityContext.Provider>
    );
};
