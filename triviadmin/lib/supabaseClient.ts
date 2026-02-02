
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Standard client for client-side usage (Anon)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client for server-side usage (Service Role)
// Only available if SUPABASE_SERVICE_ROLE_KEY is set (e.g. in Vercel)
export const getServiceSupabase = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
        return createClient(supabaseUrl, serviceRoleKey);
    }
    // Fallback to anon if not available (e.g. local dev without service key)
    console.warn('SUPABASE_SERVICE_ROLE_KEY not found, using anon key. Permissions might be limited.');
    return supabase;
};
