const { MercadoPagoConfig, Payment } = require('mercadopago');
require('dotenv').config({ path: '.env.local' });

const rawToken = process.env.MP_PROD_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || '';
const trimmedToken = rawToken.trim();

const PAYMENT_ID = '144937719388'; // From user logs

async function testToken(name, token) {
    console.log(`\nTesting ${name}...`);
    console.log(`Token Length: ${token.length}`);
    console.log(`Token: '${token.substring(0, 10)}...'`);

    const client = new MercadoPagoConfig({ accessToken: token });
    const payment = new Payment(client);

    try {
        const result = await payment.get({ id: PAYMENT_ID });
        console.log(`SUCCESS [${name}]: Found Payment ${result.id}. Status: ${result.status}`);
        return true;
    } catch (error) {
        console.error(`FAILURE [${name}]:`, error.message || error);
        if (error.status) console.error(`Status Code: ${error.status}`);
        return false;
    }
}

async function run() {
    console.log('--- DIAGNOSTIC START ---');
    console.log(`Raw Token from env: '${rawToken}'`);

    await testToken('RAW', rawToken);
    await testToken('TRIMMED', trimmedToken);

    console.log('--- DIAGNOSTIC END ---');
}

run();
