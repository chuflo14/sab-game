
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

async function addTapRaceGame() {
    console.log('Adding Tap Race game...');

    const game = {
        slug: 'taprace',
        name: 'Carrera',
        description: 'Juego de velocidad - Button Masher Multijugador',
        route: '/play/taprace',
        image_url: 'https://images.unsplash.com/photo-1599831936359-25f0393aa90d?q=80&w=2070&auto=format&fit=crop',
        active: true
    };

    const { data: existing } = await supabase.from('games').select('*').eq('slug', 'taprace').single();
    if (existing) {
        console.log('Tap Race game already exists:', existing);
        return;
    }

    const { data, error } = await supabase.from('games').insert(game).select().single();

    if (error) {
        console.error('Error adding game:', error);
    } else {
        console.log('Successfully added Tap Race game:', data);
    }
}

addTapRaceGame();
