
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Try to use service role key if available, otherwise anon key (which might fail for uploads depending on RLS)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase environment variables.');
    console.log('Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON) are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MEDIA_DIR = path.join(process.cwd(), 'public', 'media', 'ads');
const BUCKET_NAME = 'media';
const STORAGE_PREFIX = 'banners';

function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
        case '.png': return 'image/png';
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.mp4': return 'video/mp4';
        case '.gif': return 'image/gif';
        case '.webp': return 'image/webp';
        default: return 'application/octet-stream';
    }
}

async function syncAds() {
    if (!fs.existsSync(MEDIA_DIR)) {
        console.error(`Local directory not found: ${MEDIA_DIR}`);
        return;
    }

    const files = fs.readdirSync(MEDIA_DIR);

    console.log(`Found ${files.length} files in ${MEDIA_DIR}`);

    for (const file of files) {
        const filePath = path.join(MEDIA_DIR, file);
        const fileStat = fs.statSync(filePath);

        if (fileStat.isFile()) {
            const storagePath = `${STORAGE_PREFIX}/${file}`;
            const contentType = getMimeType(file);

            console.log(`Checking ${file}...`);
            console.log(`  - Force uploading...`);
            const fileContent = fs.readFileSync(filePath);
            const { data, error } = await supabase
                .storage
                .from(BUCKET_NAME)
                .upload(storagePath, fileContent, {
                    contentType: contentType,
                    upsert: true
                });

            if (error) {
                console.error(`  - Upload failed:`, error.message);
            } else {
                console.log(`  - Upload success!`);
            }
        }
    }
}

syncAds();
