
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const results: any = {};

    // 1. Check Env Vars (masked)
    const prodToken = process.env.MP_PROD_ACCESS_TOKEN;
    const devToken = process.env.MP_ACCESS_TOKEN;

    results.context = {
        node_env: process.env.NODE_ENV,
        vercel_env: process.env.VERCEL_ENV,
        vercel_url: process.env.VERCEL_URL,
        timestamp: new Date().toISOString()
    };

    results.env = {
        MP_PROD_ACCESS_TOKEN: prodToken ? {
            params: 'Present',
            length: prodToken.length,
            prefix: prodToken.substring(0, 10),
            trimmedLength: prodToken.trim().length
        } : 'Missing',
        MP_ACCESS_TOKEN: devToken ? {
            params: 'Present',
            length: devToken.length,
            prefix: devToken.substring(0, 10),
            trimmedLength: devToken.trim().length
        } : 'Missing'
    };

    // 2. Determine Active Token
    const rawToken = prodToken || devToken || '';
    const token = rawToken.trim();
    results.activeToken = {
        source: prodToken ? 'MP_PROD_ACCESS_TOKEN' : (devToken ? 'MP_ACCESS_TOKEN' : 'None'),
        finalLength: token.length
    };

    // 3. Try payment fetch (using ID from recent logs)
    const PAYMENT_ID = '144937719388';
    try {
        if (!token) throw new Error('No Token');

        const client = new MercadoPagoConfig({ accessToken: token, options: { timeout: 5000 } });
        const paymentClient = new Payment(client);

        const payment = await paymentClient.get({ id: PAYMENT_ID });
        results.paymentCheck = {
            id: payment.id,
            status: payment.status,
            external_reference: payment.external_reference,
            date_created: payment.date_created
        };
    } catch (error: any) {
        results.paymentCheck = {
            error: error.message || error,
            status: error.status
        };
    }

    return NextResponse.json(results);
}
