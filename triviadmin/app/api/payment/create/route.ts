import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
// import { supabase } from '@/lib/supabaseClient';

// Initialize Mercado Pago
const client = new MercadoPagoConfig({
    // TEMPORARY FIX: Hardcoding token because Vercel Env Var is stuck on TEST
    accessToken: 'APP_USR-4952804291016557-013110-1256f9a32dedbfed3a290fbc6713704b-24029138',
    options: { timeout: 5000 }
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _body = await request.json();
        // Allow overriding amount via body for testing, but ideally fetch from DB
        // Allow overriding amount via body for testing, but ideally fetch from DB

        let amount = 1000;

        console.error('DEBUG: Entering Payment Route');

        // Initialize Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        console.log('DEBUG: Supabase Config:', {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseKey,
            startUrl: supabaseUrl ? supabaseUrl.substring(0, 10) : 'none'
        });

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        try {
            console.log('DEBUG: Attempting RPC call to get_payment_config_json...');
            const { data: jsonData, error: dbError } = await supabase
                .rpc('get_payment_config_json')
                .single();

            if (dbError) {
                console.error('DEBUG: RPC returned error object:', dbError);
                // Don't throw, just log. We will use default amount.
            } else {
                console.log('DEBUG: RPC success:', jsonData);

                // Safe cast and check
                const config = jsonData as { game_price: number } | null;
                if (config && typeof config.game_price === 'number') {
                    amount = config.game_price;
                    console.log(`DEBUG: Updated amount from DB: ${amount}`);
                }
            }
        } catch (dbErr) {
            console.error('DEBUG: CAUGHT inner DB Error:', dbErr);
            // Fallback to default amount (500 or 1000) will happen automatically since 'amount' is already init
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
