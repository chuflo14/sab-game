import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { supabase } from '@/lib/supabaseClient';

// Initialize Mercado Pago
// NOTE: Ideally use server-side environmental variables only for Access Token
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || '',
    options: { timeout: 5000 }
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _body = await request.json();
        // Allow overriding amount via body for testing, but ideally fetch from DB
        let amount = 1000;

        // Fetch price from DB using Supabase RPC for maximum security/reliability
        // Fetch price from DB using Supabase RPC for maximum security/reliability
        try {
            console.log('Attempting RPC call...');
            const { data: jsonData, error: dbError } = await supabase
                .rpc('get_payment_config_json')
                .single();

            if (dbError) {
                console.warn('RPC returned error object:', dbError);
                throw dbError;
            }

            console.log('RPC success:', jsonData);

            // Cast to unknown first if needed, or just access safely
            const config = jsonData as { game_price: number } | null;

            if (config?.game_price) {
                amount = config.game_price;
            }
        } catch (dbErr) {
            console.warn('CAUGHT inner DB Error:', dbErr);
            // Fallback to default amount (1000)
        }

        console.log(`Creating payment preference for amount: ${amount}`);

        const externalReference = `game-${Date.now()}`;

        const preference = new Preference(client);

        const result = await preference.create({
            body: {
                items: [
                    {
                        id: 'game-credit',
                        title: 'Ficha de Juego - SAB Game',
                        quantity: 1,
                        unit_price: Number(amount),
                    }
                ],
                // We don't strictly need back_urls for a kiosk, but good practice
                back_urls: {
                    success: 'https://sabgame.com/success', // Dummy URLs since we poll
                    failure: 'https://sabgame.com/failure',
                    pending: 'https://sabgame.com/pending',
                },
                // IMPORTANT: External reference to track safely if needed
                external_reference: externalReference,
                expires: true,
                expiration_date_from: new Date().toISOString(),
                expiration_date_to: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min expiration
            }
        });

        if (!result.id) {
            throw new Error('Failed to create preference');
        }

        return NextResponse.json({
            id: result.id,
            init_point: result.init_point,
            sandbox_init_point: result.sandbox_init_point,
            external_reference: externalReference,
            amount: amount, // Return the actual amount used
        });
    } catch (error: any) {
        console.error('Error creating payment preference:', error);

        // Extract MP specific error
        const status = error.status || 500;
        const message = error.message || 'Internal Server Error';
        const cause = error.cause || error.code || 'UNKNOWN_ERROR';

        return NextResponse.json(
            { error: message, code: cause, details: error },
            { status: status }
        );
    }
}
