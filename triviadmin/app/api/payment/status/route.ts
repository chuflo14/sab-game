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
        const externalReference = searchParams.get('external_reference');

        if (externalReference) {
            console.log(`Checking status for ref: ${externalReference}`);

            const payment = new Payment(client);

            // Search with broader criteria (Unfiltered status)
            const searchOptions = {
                options: {
                    criteria: 'desc' as const,
                    begin_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Look back 24 hours
                    end_date: new Date().toISOString(),
                    external_reference: externalReference
                }
            };

            console.log('Search options:', JSON.stringify(searchOptions));

            const results = await payment.search(searchOptions);

            console.log(`Found ${results.results?.length || 0} results`);

            if (results.results && results.results.length > 0) {
                const pay = results.results[0];
                console.log(`Payment Found: ${pay.id} | Status: ${pay.status} | Detail: ${pay.status_detail}`);

                if (pay.status === 'approved') {
                    return NextResponse.json(
                        { status: 'approved', payment_id: pay.id },
                        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
                    );
                }
            }
        }

        return NextResponse.json({ status: 'pending' });

    } catch (error: any) {
        console.error('Error checking payment:', error);
        return NextResponse.json({ status: 'pending', error: error.message });
    }
}
