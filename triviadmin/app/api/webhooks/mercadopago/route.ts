import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const token = process.env.MP_PROD_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || '';

    try {
        const url = new URL(request.url);
        const searchParams = url.searchParams;

        const topic = searchParams.get('topic') || searchParams.get('type');
        const id = searchParams.get('id') || searchParams.get('data.id');

        console.log(`Webhook Received: Topic=${topic}, ID=${id}`);

        if ((topic === 'payment' || topic === 'merchant_order') && id) {

            if (!token || token.length < 10) throw new Error('MISSING_TOKEN');

            const client = new MercadoPagoConfig({
                accessToken: token,
                options: { timeout: 10000 }
            });

            const paymentClient = new Payment(client);
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
