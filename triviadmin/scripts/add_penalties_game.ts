
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addPenaltiesGame() {
    console.log('Adding Penalties game...');

    const game = {
        slug: 'penalties',
        name: 'Penales',
        description: 'Juego de precisión y timing',
        route: '/play/penalties',
        image_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2070&auto=format&fit=crop',
        active: true
    };

    const { data: existing } = await supabase.from('games').select('*').eq('slug', 'penalties').single();
    if (existing) {
        console.log('Penalties game already exists:', existing);
        return;
    }

    const { data, error } = await supabase.from('games').insert(game).select().single();

    if (error) {
        console.error('Error adding game:', error);
    } else {
        console.log('Successfully added Penalties game:', data);
    }
}

addPenaltiesGame();
