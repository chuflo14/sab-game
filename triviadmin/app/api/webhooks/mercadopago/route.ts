import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

// Initialize MP
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || '',
    options: { timeout: 5000 }
});

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const searchParams = url.searchParams;

        // MP sends topic/id or type/data.id depending on version
        // We handle both typically, but topic=payment is most common for IPN
        // Or type=payment for Webhooks

        const topic = searchParams.get('topic') || searchParams.get('type');
        const id = searchParams.get('id') || searchParams.get('data.id');

        console.log(`Webhook Received: Topic=${topic}, ID=${id}`);

        if ((topic === 'payment' || topic === 'merchant_order') && id) {

            // 1. Verify existence with MP (Critical Security Step)
            const paymentClient = new Payment(client);
            const payment = await paymentClient.get({ id: id });

            if (payment) {
                console.log(`Webhook: Payment ${id} verified. Status: ${payment.status}`);

                // 2. Transfrom data for DB
                const paymentData = {
                    id: payment.id?.toString(),
                    amount: payment.transaction_amount,
                    status: payment.status,
                    external_reference: payment.external_reference,
                    payment_method: payment.payment_method_id,
                    machine_id: null as string | null, // Need to parse from external_ref or metadata?
                    // MP doesn't always accept metadata in all checkouts, but external_ref we used.
                    // We can try to extract machine ID if we encoded it, or update later.
                    updated_at: new Date().toISOString()
                };

                // Extract Machine ID from external reference if possible?
                // Ref format: "game-12345678" or just random?
                // In create route we used: externalReference = `game-${Date.now()}`;
                // We didn't embed machine ID. We should have! 
                // FUTURE IMPROVEMENT: Embed machine ID in external_reference like: `game-${machineId}-${timestamp}`

                // 3. Upsert to Supabase
                const { error } = await supabase
                    .from('payments')
                    .upsert(paymentData, { onConflict: 'id' });

                if (error) {
                    console.error('Webhook: DB Write Error', error);
                    return NextResponse.json({ error: 'DB Error' }, { status: 500 });
                }

                return NextResponse.json({ status: 'success', message: 'Payment recorded' });
            }
        }

        return NextResponse.json({ status: 'ignored' });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
