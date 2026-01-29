
const https = require('https');

const url = 'https://ccxwkeriarlrzyicypee.supabase.co/storage/v1/object/public/media/ads/1769617035236-p09u6m.png';

console.log(`Checking URL: ${url}`);

https.get(url, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);

    res.on('data', (d) => {
        // Just verify we get some data
        // process.stdout.write(d); 
    });

    res.resume(); // Consume data to finish request

}).on('error', (e) => {
    console.error('Error fetching URL:', e);
});
