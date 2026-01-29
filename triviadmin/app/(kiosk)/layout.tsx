import { ReactNode } from "react";

export default function KioskLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen w-full bg-black text-white overflow-hidden flex flex-col items-center justify-center font-sans">
            {/* TODO: Add cursor-none logic later if needed */}
            <main className="w-full h-full flex-1 flex flex-col">
                {children}
            </main>
        </div>
    );
}
