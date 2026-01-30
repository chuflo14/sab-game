import { fetchAds, fetchChangoConfig } from '@/lib/actions';
import KioskLoop from '@/components/KioskLoop';

export const dynamic = 'force-dynamic';

export default async function KioskPage() {
    const allAds = await fetchAds();
    const config = await fetchChangoConfig();
    const activeAds = allAds.filter(ad => ad.active);

    console.log('KioskPage: API Ads Count:', allAds.length);
    console.log('KioskPage: Active Ads:', JSON.stringify(activeAds, null, 2));

    return (
        <main className="min-h-screen bg-black">
            <KioskLoop ads={activeAds} config={config} />
        </main>
    );
}
