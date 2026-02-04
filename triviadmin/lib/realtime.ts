import { supabase } from './supabaseClient';

export type JoystickEvent =
    | { type: 'START' }
    | { type: 'KEYDOWN'; key: string }
    | { type: 'STATE_CHANGE'; state: 'READY' | 'PAYING' | 'PLAYING' | 'WAITING'; game?: 'TRIVIA' | 'RULETA' | 'CHANGO' | 'MENU'; paymentUrl?: string }
    | { type: 'GAME_OVER' }
    | { type: 'TIMEOUT' };

export const subscribeToJoystick = (machineId: string, onEvent: (payload: JoystickEvent) => void) => {
    const channel = supabase.channel(`joystick:${machineId}`, {
        config: {
            broadcast: { self: true },
        },
    });

    channel
        .on('broadcast', { event: 'joystick_input' }, ({ payload }) => {
            onEvent(payload as JoystickEvent);
        })
        .subscribe();

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
