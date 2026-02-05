import { fetchChangoConfig } from '@/lib/actions';
import SimonGame from '@/components/SimonGame';
import BackgroundMusic from '@/components/BackgroundMusic';

export const dynamic = 'force-dynamic';

export default async function SimonPage() {
    const config = await fetchChangoConfig();

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Music */}
            <BackgroundMusic src={config?.simon_music_url} />

            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle at center, #3b82f6 0%, transparent 70%)' }}
                />
            </div>

            <div className="relative z-10 w-full flex flex-col items-center gap-4">
                <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_30px_rgba(59,130,246,0.3)] mb-4">
                    SIMÓN <span className="text-blue-500">DICE</span>
                </h1>
                <p className="text-blue-500/40 uppercase tracking-[0.4em] font-bold text-xl mb-8">
                    Sigue la secuencia de colores
                </p>

                <SimonGame />
            </div>
        </div>
    );
}
