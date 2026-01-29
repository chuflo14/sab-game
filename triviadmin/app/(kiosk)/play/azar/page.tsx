import { fetchRouletteSegments } from '@/lib/actions';
import RouletteWheel from '@/components/RouletteWheel';

export const dynamic = 'force-dynamic';

export default async function AzarPage() {
    const allSegments = await fetchRouletteSegments();
    const activeSegments = allSegments.filter(s => s.active);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Premium Background Effects */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'radial-gradient(circle at center, #EAB308 0%, transparent 70%)' }}
                />
            </div>

            <div className="relative z-10 w-full flex flex-col items-center gap-4">
                <h1 className="text-7xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                    La Ruleta <span className="text-yellow-500">del Chacho</span>
                </h1>
                <p className="text-yellow-500/40 uppercase tracking-[0.4em] font-bold text-xl">
                    El azar puro con un toque divertido y nuestro
                </p>

                {activeSegments.length >= 2 ? (
                    <RouletteWheel segments={activeSegments} />
                ) : (
                    <div className="bg-black/40 backdrop-blur-md p-12 rounded-3xl border border-white/10 text-center max-w-lg mt-12">
                        <h2 className="text-3xl font-bold text-white mb-4">Ruleta no disponible</h2>
                        <p className="text-gray-400">El administrador debe configurar al menos 2 sectores activos para jugar.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
