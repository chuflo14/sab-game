'use client';

interface GameResultOverlayProps {
    isOpen: boolean;
    isWin: boolean;
    title: string;
    subtitle?: string;
    statusMessage?: string;
}

export default function GameResultOverlay({
    isOpen,
    isWin,
    title,
    subtitle = "Resultado",
    statusMessage
}: GameResultOverlayProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-50 animate-in fade-in duration-500">
            <div className="bg-white/[0.03] border border-white/10 p-12 rounded-[3rem] text-center max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden">
                {/* Shine Effect */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl" />

                <div className="text-yellow-500/40 uppercase tracking-[0.4em] text-xs font-black mb-4">
                    {subtitle}
                </div>

                <h2 className="text-7xl font-black text-white mb-8 uppercase tracking-tighter drop-shadow-2xl leading-none">
                    {title}
                </h2>

                {isWin ? (
                    <div className="bg-yellow-500 text-black py-4 px-8 rounded-2xl font-black text-xl mb-6 shadow-[0_0_30px_rgba(234,179,8,0.4)] animate-bounce">
                        ¡FELICIDADES!
                    </div>
                ) : (
                    <div className="bg-white/5 text-white/60 py-4 px-8 rounded-2xl font-bold text-xl mb-6 border border-white/10">
                        ¡Inténtalo de nuevo!
                    </div>
                )}

                {statusMessage && (
                    <p className="text-white/30 animate-pulse text-sm uppercase tracking-[0.3em] font-bold">
                        {statusMessage}
                    </p>
                )}

                {/* Decorative Line */}
                <div className="mt-8 h-px w-full bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
            </div>
        </div>
    );
}
