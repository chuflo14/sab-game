import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    // 1. Get Token and TRIM (Critical fix)
    const rawToken = process.env.MP_PROD_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || '';
    const token = rawToken.trim();

    console.log('--- PAYMENT CREATE START ---');
    console.log(`DEBUG: Token Source: ${process.env.MP_PROD_ACCESS_TOKEN ? 'PROD_VAR' : 'OLD_VAR'}`);
    console.log(`DEBUG: Token Length (Trimmed): ${token.length}`);
    console.log(`DEBUG: Token Prefix: ${token.substring(0, 10)}...`);

    try {
        if (!token || token.length < 10) {
            throw new Error('MISSING_OR_INVALID_TOKEN');
        }

        const body = await request.json();
        const machineId = body.machineId;
        console.log(`DEBUG: MachineID: ${machineId}`);

        // 2. Initialize MP inside handler to ensure fresh environment access
        const client = new MercadoPagoConfig({
            accessToken: token,
            options: { timeout: 10000 }
        });

        // 3. Determine Amount
        let amount = 1000;
        try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            if (machineId) {
                const { data: machine } = await supabase
                    .from('machines')
                    .select('token_price')
                    .eq('id', machineId)
                    .single();
                if (machine?.token_price) amount = machine.token_price;
            } else {
                const { data: jsonData } = await supabase.rpc('get_payment_config_json').single();
                if ((jsonData as any)?.game_price) amount = (jsonData as any).game_price;
            }
        } catch (dbError) {
            console.error('DEBUG: DB Fetch Error (falling back to 1000):', dbError);
        }

        console.log(`DEBUG: Final Amount: ${amount}`);

        // 4. Create Preference with MINIMAL payload (Removing fields that often cause 403 Policy rejected)
        const preference = new Preference(client);
        const externalReference = `game-${Date.now()}`;

        const payload = {
            body: {
                items: [
                    {
                        id: 'game-credit',
                        title: 'Ficha de Juego - SABGAME',
                        quantity: 1,
                        unit_price: Number(amount),
                    }
                ],
                external_reference: externalReference,
                // Removed expires and back_urls to test "PolicyAgent" issue
            }
        };

        console.log('DEBUG: Sending payload to MP...');
        const result = await preference.create(payload);

        if (!result.id) throw new Error('NO_PREFERENCE_ID_RETURNED');

        console.log(`DEBUG: Success! Preference ID: ${result.id}`);

        return NextResponse.json({
            id: result.id,
            init_point: result.init_point,
            external_reference: externalReference,
            amount: amount,
        });

    } catch (error: any) {
        console.error('--- PAYMENT CREATE ERROR ---');
        console.error('Error Details:', error);

        const status = error.status || 500;
        const code = error.code || error.cause || 'UNKNOWN';

        return NextResponse.json(
            { error: error.message || 'Internal Error', code: code },
            { status: status }
        );
    }
}
