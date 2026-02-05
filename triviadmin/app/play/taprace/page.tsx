
import { fetchChangoConfig } from '@/lib/actions';
import TapRaceGame from '@/components/TapRaceGame';
import BackgroundMusic from '@/components/BackgroundMusic';

export const dynamic = 'force-dynamic';

export default async function TapRacePage() {
    const config = await fetchChangoConfig();

    return (
        <div className="min-h-screen bg-black">
            {/* Music */}
            <BackgroundMusic src={config?.taprace_music_url} />
            <TapRaceGame />
        </div>
    );
}
