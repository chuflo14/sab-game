
import { fetchChangoConfig } from '@/lib/actions';
import PenaltiesGame from '@/components/PenaltiesGame';
import BackgroundMusic from '@/components/BackgroundMusic';

export const dynamic = 'force-dynamic';

export default async function PenaltiesPage() {
    const config = await fetchChangoConfig();

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Music */}
            <BackgroundMusic src={config?.penalties_music_url} />

            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'radial-gradient(circle at center, #10b981 0%, transparent 70%)' }}
                />
            </div>

            <div className="relative z-10 w-full flex flex-col items-center gap-4">
                <PenaltiesGame />
            </div>
        </div>
    );
}
