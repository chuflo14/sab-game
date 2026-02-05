
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // Ideally use SERVICE_ROLE_KEY if RLS blocks writes, but anon might work if policies allow or if we are using service role env var

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSimonGame() {
    console.log('Adding Simon game...');

    const game = {
        slug: 'simon',
        name: 'Simón',
        description: 'Juego de memoria visual y auditiva',
        route: '/play/simon',
        image_url: 'https://images.unsplash.com/photo-1555864326-5cf22ef123cf?q=80&w=2067&auto=format&fit=crop', // A placeholder
        active: true
    };

    // Check if exists
    const { data: existing } = await supabase.from('games').select('*').eq('slug', 'simon').single();
    if (existing) {
        console.log('Simon game already exists:', existing);
        return;
    }

    const { data, error } = await supabase.from('games').insert(game).select().single();

    if (error) {
        console.error('Error adding game:', error);
    } else {
        console.log('Successfully added Simon game:', data);
    }
}

addSimonGame();
