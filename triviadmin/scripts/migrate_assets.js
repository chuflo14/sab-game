
require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ccxwkeriarlrzyicypee.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjeHdrZXJpYXJscnp5aWN5cGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDAwNjEsImV4cCI6MjA4NTI3NjA2MX0.LM-MpV1YiOulPWfJI7GYq0TxMlsb0Oa6ooyjsfrrWYQ';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const publicDir = path.resolve(__dirname, '../public');

async function migrateAssets() {
    console.log('Starting asset migration...');
    const { data: ads, error } = await supabase.from('ads').select('*');
    if (error) {
        console.error('Error fetching ads:', error);
        return;
    }

    for (const ad of ads) {
        if (ad.url && ad.url.startsWith('/media/ads/')) {
            const localPath = path.join(publicDir, ad.url); // e.g. /media/ads/file.png
            if (fs.existsSync(localPath)) {
                console.log(`Uploading ${ad.name} (${ad.url})...`);
                const fileContent = fs.readFileSync(localPath);

                // Determine content type
                const ext = path.extname(localPath).toLowerCase();
                let contentType = 'application/octet-stream';
                if (ext === '.png') contentType = 'image/png';
                else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
                else if (ext === '.mp4') contentType = 'video/mp4';

                const fileName = `ads/${path.basename(ad.url)}`;

                const { error: uploadError } = await supabase.storage
                    .from('media')
                    .upload(fileName, fileContent, {
                        contentType: contentType,
                        upsert: true
                    });

                if (uploadError) {
                    console.error('  Upload failed:', uploadError.message);
                    continue;
                }

                const { data: publicData } = supabase.storage
                    .from('media')
                    .getPublicUrl(fileName);

                const publicUrl = publicData.publicUrl;
                console.log('  Uploaded to:', publicUrl);

                // Update DB
                const { error: updateError } = await supabase
                    .from('ads')
                    .update({ url: publicUrl })
                    .eq('id', ad.id);

                if (updateError) {
                    console.error('  DB Update failed:', updateError.message);
                } else {
                    console.log('  DB Updated.');
                }

            } else {
                console.warn(`  File not found locally: ${localPath}`);
            }
        } else {
            console.log(`Skipping ${ad.name}, already remote or invalid: ${ad.url}`);
        }
    }
    console.log('Asset migration complete.');
}

migrateAssets();
