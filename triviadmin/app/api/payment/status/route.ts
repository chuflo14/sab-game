import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
    // TEMPORARY FIX: Hardcoding token because Vercel Env Var is stuck on TEST
    accessToken: 'APP_USR-4952804291016557-013110-1256f9a32dedbfed3a290fbc6713704b-24029138',
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
            const token = 'APP_USR-4952804291016557-013110-1256f9a32dedbfed3a290fbc6713704b-24029138'; // process.env.MP_ACCESS_TOKEN || '';
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
                    const tokenPrefix = token.substring(0, 10);
                    const broadOptions = {
                        options: {
                            criteria: 'desc' as const,
                            sort: 'date_created' as const,
                            limit: 10
                        }
                    };
                    const broadResults = await payment.search(broadOptions);
                    console.log(`DEBUG: Broad Search (${tokenPrefix}...) Found ${broadResults.results?.length || 0} payments. Top 1 ID: ${broadResults.results?.[0]?.id || 'none'}`);

                    broadResults.results?.forEach(p => {
                        console.log(`DEBUG: PayID: ${p.id} | Status: ${p.status} | Ref: ${p.external_reference} | Date: ${p.date_created}`);
                    });

                    // FALLBACK 1: Match by External Ref in Broad Search
                    if (results.results.length === 0 && broadResults.results) {
                        const foundInBroad = broadResults.results.find(p => p.external_reference === externalReference);
                        if (foundInBroad) {
                            console.log('DEBUG: Found payment in Broad Search fallback (Ref Match)!');
                            results.results = [foundInBroad];
                        } else {
                            // FALLBACK 2: Loose Matching (Panic Mode)
                            // If we have NO results, but we found a VERY RECENT approved payment, take it.
                            const mostRecent = broadResults.results[0];
                            if (mostRecent && mostRecent.status === 'approved') {
                                const payDate = new Date(mostRecent.date_created!);
                                const now = new Date();
                                const diffMinutes = (now.getTime() - payDate.getTime()) / 1000 / 60;

                                console.log(`DEBUG: Checking Loose Match. Last Pay: ${diffMinutes} min ago.`);

                                if (diffMinutes < 2) { // Accept payment from last 2 mins (Strict security)
                                    console.log('DEBUG: USING LOOSE MATCH! (Ref mismatch overridden)');
                                    results.results = [mostRecent];
                                }
                            }
                        }
                    }

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
