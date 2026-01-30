import { createClient } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        const supabase = createClient();

        // 1. Fetch ticket
        const { data: ticket, error: fetchError } = await supabase
            .from('tickets')
            .select('*')
            .or(`token.eq.${token},id.eq.${token}`)
            .single();

        if (fetchError || !ticket) {
            return NextResponse.json({ error: 'Ticket no encontrado o inválido.' }, { status: 404 });
        }

        // 2. Check if already redeemed
        if (ticket.redeemed_at) {
            return NextResponse.json({
                error: 'QR ya fue utilizado.',
                redeemed_at: ticket.redeemed_at
            }, { status: 400 });
        }

        // 3. Mark as redeemed
        const { data: updatedTicket, error: updateError } = await supabase
            .from('tickets')
            .update({
                redeemed_at: new Date().toISOString(),
                // If we had authentication for the redeemer, we would set redeemed_by here
                // redeemed_by: user_id 
            })
            .eq('id', ticket.id)
            .select()
            .single();

        if (updateError) {
            console.error('Error redeeming ticket:', updateError);
            return NextResponse.json({ error: 'Error al procesar el canje.' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Ticket canjeado exitosamente.',
            ticket: updatedTicket
        });

    } catch (error) {
        console.error('Redeem API Error:', error);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
