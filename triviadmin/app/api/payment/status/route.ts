import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const externalReference = searchParams.get('external_reference');
    const preferenceId = searchParams.get('preference_id');

    // 1. Get Token and TRIM (Crucial for Vercel env vars with spaces)
    const rawToken = process.env.MP_PROD_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || '';
    const token = rawToken.trim();

    console.log('--- PAYMENT STATUS START ---');
    console.log(`DEBUG: Token Source: ${process.env.MP_PROD_ACCESS_TOKEN ? 'PROD_VAR' : 'OLD_VAR'}`);
    console.log(`DEBUG: Token Length (trimmed): ${token.length}`);

    if (!externalReference) {
        return NextResponse.json({ error: 'Missing external_reference' }, { status: 400 });
    }

    try {
        if (!token || token.length < 10) {
            throw new Error('MISSING_OR_INVALID_TOKEN');
        }

        const client = new MercadoPagoConfig({
            accessToken: token,
            options: { timeout: 15000 }
        });

        const paymentHandler = new Payment(client);

        console.log(`DEBUG: Polling status for Ref: ${externalReference}`);

        // 2. Primary Search: By External Reference
        const results = await paymentHandler.search({
            options: {
                external_reference: externalReference,
                criteria: 'desc',
                sort: 'date_created'
            }
        });

        const count = results.results?.length || 0;
        let finalPay = count > 0 ? results.results![0] : null;

        // 3. Fallback 1: Broad Search (Loose Match)
        // This addresses MP indexing delays. If we see a very recent approved payment, we take it.
        if (!finalPay) {
            console.log(`DEBUG: Search results for Ref ${externalReference} (Pref: ${preferenceId || 'None'}): 0. Trying Broad Search fallback...`);
            const broad = await paymentHandler.search({
                options: {
                    limit: 5,
                    sort: 'date_created',
                    criteria: 'desc'
                }
            });

            if (broad.results && broad.results.length > 0) {
                const recent = broad.results[0];
                const payDate = new Date(recent.date_created!);
                const now = new Date();
                const diffMin = (now.getTime() - payDate.getTime()) / (1000 * 60);

                console.log(`DEBUG: Broad Match candidate: ID ${recent.id} (${recent.status}) - ${diffMin.toFixed(1)}m ago`);

                // If it's approved and recent (< 1 min), we accept it.
                if (recent.status === 'approved' && diffMin < 1) {
                    console.log('DEBUG: LOOSE MATCH APPLIED!');
                    finalPay = recent;
                }
            }
        }

        if (finalPay) {
            console.log(`DEBUG: Final Status: ${finalPay.status} (ID: ${finalPay.id})`);
            if (finalPay.status === 'approved') {
                return NextResponse.json(
                    { status: 'approved', payment_id: finalPay.id },
                    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
                );
            }
        }

        return NextResponse.json({ status: 'pending' });

    } catch (error: any) {
        console.error('--- PAYMENT STATUS ERROR ---');
        console.error('Details:', error);

        return NextResponse.json(
            { status: 'error', error: error.message, code: error.code || 'UNKNOWN' },
            { status: error.status || 500 }
        );
    }
}
