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
    const externalReference = searchParams.get('external_reference');

    if (!preferenceId && !externalReference) {
        return NextResponse.json({ error: 'Missing id or external_reference' }, { status: 400 });
    }

    try {

        if (externalReference) {
            const token = process.env.MP_ACCESS_TOKEN || '';
            console.log(`DEBUG: Checking status for ref: ${externalReference}`);
            console.log(`DEBUG: Token being used starts with: ${token.substring(0, 10)}... (Length: ${token.length})`);

            const payment = new Payment(client);

            // Search with broader criteria (Unfiltered status)
            const searchOptions = {
                options: {
                    criteria: 'desc' as const,
                    external_reference: externalReference
                }
            };

            console.log('Search options:', JSON.stringify(searchOptions, null, 2));

            const results = await payment.search(searchOptions);

            console.log(`DEBUG: Payment Search found ${results.results?.length || 0} results for ref: ${externalReference}`);

            if (results.results && results.results.length === 0) {
                console.log('DEBUG: No results found with External Ref. Trying broad search...');
                try {
                    const broadOptions = {
                        options: {
                            criteria: 'desc' as const,
                            sort: 'date_created' as const,
                            begin_date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                            end_date: new Date().toISOString(),
                            limit: 5
                        }
                    };
                    const broadResults = await payment.search(broadOptions);
                    console.log(`DEBUG: Broad Search Found ${broadResults.results?.length || 0} payments`);
                    broadResults.results?.forEach(p => {
                        console.log(`DEBUG: PayID: ${p.id} | Status: ${p.status} | Ref: ${p.external_reference} | Date: ${p.date_created}`);
                    });
                } catch (err) {
                    console.error('DEBUG: Broad search failed', err);
                }
            }

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
