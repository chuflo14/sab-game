import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || '',
    options: { timeout: 5000 }
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const preferenceId = searchParams.get('id');

    if (!preferenceId) {
        return NextResponse.json({ error: 'Missing preference id' }, { status: 400 });
    }

    try {
        // Search for payments related to this preference
        // In a real robust system, we would use Webhooks to update our DB and check DB.
        // But for "polling" against API for a single kiosk session, we can search payments.

        // However, `preference_id` is not directly searchable in `payment.search` easily without external_reference.
        // Wait: The preference ID is what we gave the frontend.
        // It's better if the frontend tracks "external_reference" OR we use the preference ID to look up our local DB if we saved it.
        // Strategy: We will just search for the MOST RECENT approved payment for our integration to keep it dead simple for now?
        // NO, that's risky.

        // Better Strategy:
        // 1. The Preference was created with `external_reference`.
        // 2. We should ideally pass that `external_reference` to the frontend or return it.
        // 3. Frontend sends `external_reference` to check status.

        // Let's modify this to accept `external_reference` instead of `id` (pref id).

        const externalReference = searchParams.get('external_reference');

        if (externalReference) {
            const payment = new Payment(client);
            const results = await payment.search({
                options: {
                    criteria: 'desc',
                    sort: 'date_created',
                    range: 'date_created',
                    begin_date: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // Look back 15 mins only
                    end_date: new Date().toISOString(),
                    external_reference: externalReference,
                    status: 'approved' // Only care about approved
                }
            });

            if (results.results && results.results.length > 0) {
                return NextResponse.json({ status: 'approved', payment_id: results.results[0].id });
            }
        }

        return NextResponse.json({ status: 'pending' });

    } catch (error: any) {
        console.error('Error checking payment:', error);
        return NextResponse.json({ status: 'pending', error: error.message });
    }
}
