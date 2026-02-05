import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const rawToken = process.env.MP_PROD_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || '';
    const token = rawToken.trim();

    try {
        const url = new URL(request.url);
        const searchParams = url.searchParams;

        const topic = searchParams.get('topic') || searchParams.get('type');
        const id = searchParams.get('id') || searchParams.get('data.id');

        console.log(`--- WEBHOOK RECEIVED ---`);
        console.log(`DEBUG: Topic=${topic}, ID=${id} | Token Len=${token.length}`);

        if ((topic === 'payment' || topic === 'merchant_order') && id) {

            if (!token || token.length < 10) throw new Error('MISSING_TOKEN');

            const client = new MercadoPagoConfig({
                accessToken: token,
                options: { timeout: 15000 }
            });

            // If topic is payment, we verify. If merchant_order, we might need a different verify or just ignore.
            if (topic === 'payment') {
                const paymentClient = new Payment(client);

                try {
                    const payment = await paymentClient.get({ id: id });
                    if (payment) {
                        console.log(`Webhook: Payment ${id} verified. Status: ${payment.status}`);

                        const supabase = createClient(
                            process.env.NEXT_PUBLIC_SUPABASE_URL!,
                            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                        );

                        const paymentData = {
                            id: payment.id?.toString(),
                            amount: payment.transaction_amount,
                            status: payment.status,
                            external_reference: payment.external_reference,
                            payment_method: payment.payment_method_id,
                            updated_at: new Date().toISOString()
                        };

                        const { error } = await supabase
                            .from('payments')
                            .upsert(paymentData, { onConflict: 'id' });

                        if (error) console.error('Webhook: DB Write Error', error);
                        return NextResponse.json({ status: 'success', message: 'Handled' });
                    }
                } catch (getErr: any) {
                    console.error(`Webhook: Error fetching payment ${id}:`, getErr.message || getErr);
                    // If it's 404, maybe it's too new? No, MP sent the webhook.
                    // This strongly suggests token mismatch.
                }
            }
        }

        return NextResponse.json({ status: 'ignored' });

    } catch (error: any) {
        console.error('--- WEBHOOK ERROR ---');
        console.error('Details:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
