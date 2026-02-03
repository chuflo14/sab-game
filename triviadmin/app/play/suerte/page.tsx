import LuckGame from '@/components/LuckGame';
import { fetchChangoConfig } from '@/lib/actions';
import BackgroundMusic from '@/components/BackgroundMusic';

export const dynamic = 'force-dynamic';

export default async function SuertePage() {
    const config = await fetchChangoConfig();

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
            <BackgroundMusic src={config?.chango_music_url} />
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-30 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at center, #3b82f6 0%, transparent 70%)' }}
            />

            <div className="relative z-10 w-full flex flex-col items-center gap-4">
                <h1 className="text-6xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                    Dedo <span className="text-yellow-500">de Chango</span>
                </h1>
                <p className="text-yellow-500/60 uppercase tracking-widest font-bold text-xl mb-12 text-center">
                    ¡Inflá el globo lo más rápido posible!
                </p>

                <LuckGame />
            </div>

            {/* Bottom Decoration */}

        </div>
    );
}
