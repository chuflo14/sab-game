const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ccxwkeriarlrzyicypee.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjeHdrZXJpYXJscnp5aWN5cGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDAwNjEsImV4cCI6MjA4NTI3NjA2MX0.LM-MpV1YiOulPWfJI7GYq0TxMlsb0Oa6ooyjsfrrWYQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
    console.log("Testing rpc('get_payment_config_json') with ANON key...");
    const { data, error } = await supabase.rpc('get_payment_config_json').single();

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Success:", data);
    }
}

testRpc();
