require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const mpAccessToken = process.env.MP_ACCESS_TOKEN;

console.log('--- Configurations ---');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? 'Found' : 'Missing');
console.log('MP Access Token:', mpAccessToken ? 'Found' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);
const client = new MercadoPagoConfig({ accessToken: mpAccessToken, options: { timeout: 5000 } });

async function run() {
    let amount = 1000;

    console.log('\n--- Step 1: Supabase RPC ---');
    try {
        const { data: jsonData, error: dbError } = await supabase
            .rpc('get_payment_config_json')
            .single();

        if (dbError) {
            console.error('RPC Error:', dbError);
            // Don't throw here to simulate route behavior? 
            // The route throws, catches, and continues.
            console.log('Proceeding with default amount.');
        } else {
            console.log('RPC Success:', jsonData);
            if (jsonData && jsonData.game_price) {
                amount = jsonData.game_price;
                console.log('Updated amount from DB:', amount);
            }
        }
    } catch (err) {
        console.error('RPC Exception:', err);
    }

    console.log('\n--- Step 2: Mercado Pago Preference ---');
    try {
        const preference = new Preference(client);
        const externalReference = `test-${Date.now()}`;

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
                back_urls: {
                    success: 'https://sabgame.com/success',
                    failure: 'https://sabgame.com/failure',
                    pending: 'https://sabgame.com/pending',
                },
                external_reference: externalReference,
                expires: true,
                expiration_date_from: new Date().toISOString(),
                expiration_date_to: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            }
        });

        console.log('MP Success. ID:', result.id);
        console.log('Init Point:', result.init_point);
    } catch (mpError) {
        console.error('MP Error:', mpError);
    }
}

run();
