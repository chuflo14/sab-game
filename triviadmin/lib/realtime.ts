import { supabase } from './supabaseClient';

export type JoystickEvent =
    | { type: 'START' }
    | { type: 'KEYDOWN'; key: string }
    | { type: 'TAP'; playerId: number }
    | { type: 'JOIN'; playerId: number }
    | { type: 'STATE_CHANGE'; state: 'READY' | 'CONNECTION_SUCCESS' | 'PAYING' | 'PAYMENT_APPROVED' | 'PLAYING' | 'WAITING' | 'WAITING_SELECTION'; game?: 'MENU' | 'TRIVIA' | 'RULETA' | 'CHANGO' | 'SIMON' | 'TAPRACE' | 'TAPRACE_SETUP'; paymentUrl?: string }
    | { type: 'GAME_OVER' }
    | { type: 'TIMEOUT' };

export const subscribeToJoystick = (machineId: string, onEvent: (payload: JoystickEvent) => void, onStatus?: (status: string) => void) => {
    const channel = supabase.channel(`joystick:${machineId}`, {
        config: {
            broadcast: { self: true },
        },
    });

    channel
        .on('broadcast', { event: 'joystick_input' }, ({ payload }) => {
            onEvent(payload as JoystickEvent);
        })
        .subscribe((status) => {
            if (onStatus) onStatus(status);
        });

    return channel;
};

export const sendJoystickEvent = async (machineId: string, payload: JoystickEvent) => {
    const channel = supabase.channel(`joystick:${machineId}`);
    await channel.subscribe();
    return channel.send({
        type: 'broadcast',
        event: 'joystick_input',
        payload,
    });
};
