import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const externalReference = searchParams.get('external_reference');

    // 1. Get Token with Fallback
    const token = process.env.MP_PROD_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || '';

    console.log('--- PAYMENT STATUS START ---');
    console.log(`DEBUG: Token Source: ${process.env.MP_PROD_ACCESS_TOKEN ? 'PROD_VAR' : 'OLD_VAR'}`);
    console.log(`DEBUG: Token Prefix: ${token.substring(0, 10)}... (Len: ${token.length})`);

    if (!externalReference) {
        return NextResponse.json({ error: 'Missing external_reference' }, { status: 400 });
    }

    try {
        if (!token || token.length < 10) {
            throw new Error('MISSING_OR_INVALID_TOKEN');
        }

        // 2. Initialize MP inside handler
        const client = new MercadoPagoConfig({
            accessToken: token,
            options: { timeout: 10000 }
        });

        const payment = new Payment(client);

        console.log(`DEBUG: Polling status for Ref: ${externalReference}`);

        // 3. Search for payment
        const searchOptions = {
            options: {
                criteria: 'desc' as const,
                external_reference: externalReference
            }
        };

        const results = await payment.search(searchOptions);
        const count = results.results?.length || 0;
        console.log(`DEBUG: Search results: ${count}`);

        if (count > 0) {
            const pay = results.results![0];
            console.log(`DEBUG: Found Payment ${pay.id} - Status: ${pay.status}`);

            if (pay.status === 'approved') {
                return NextResponse.json(
                    { status: 'approved', payment_id: pay.id },
                    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
                );
            }
        }

        return NextResponse.json({ status: 'pending' });

    } catch (error: any) {
        console.error('--- PAYMENT STATUS ERROR ---');
        console.error('Error Details:', error);

        // If it's a 401/403, we return it to the UI for better debugging
        const status = error.status || 500;
        return NextResponse.json(
            { status: 'error', error: error.message, code: error.code || 'UNKNOWN' },
            { status: status }
        );
    }
}
