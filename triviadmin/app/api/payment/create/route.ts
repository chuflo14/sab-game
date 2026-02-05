import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
// import { supabase } from '@/lib/supabaseClient';

// Initialize Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_PROD_ACCESS_TOKEN || '',
    options: { timeout: 5000 }
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    // DEBUG: Check Token Prefix
    const token = process.env.MP_PROD_ACCESS_TOKEN || '';
    console.log(`DEBUG: Using MP Token starting with: ${token.substring(0, 8)}...`);

    try {
        const body = await request.json();
        const machineId = body.machineId;

        // Default amount
        let amount = 1000;

        console.error('DEBUG: Entering Payment Route for machine:', machineId || 'NONE');

        // Initialize Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        try {
            // First Priority: Machine-specific price
            if (machineId) {
                console.log(`DEBUG: Fetching price for machine: ${machineId}`);
                const { data: machine, error: mError } = await supabase
                    .from('machines')
                    .select('token_price')
                    .eq('id', machineId)
                    .single();

                if (!mError && machine && machine.token_price) {
                    amount = machine.token_price;
                    console.log(`DEBUG: Using machine-specific amount: ${amount}`);
                } else if (mError) {
                    console.warn(`DEBUG: Could not find machine ${machineId}, error:`, mError);
                }
            }

            // Second Priority: Global config (if machine price not found or not provided)
            if (amount === 1000) {
                console.log('DEBUG: Attempting RPC call to get_payment_config_json...');
                const { data: jsonData, error: dbError } = await supabase
                    .rpc('get_payment_config_json')
                    .single();

                if (!dbError && jsonData) {
                    const config = jsonData as { game_price: number } | null;
                    if (config && typeof config.game_price === 'number') {
                        amount = config.game_price;
                        console.log(`DEBUG: Updated amount from global DB: ${amount}`);
                    }
                }
            }
        } catch (dbErr) {
            console.error('DEBUG: CAUGHT inner DB Error:', dbErr);
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
