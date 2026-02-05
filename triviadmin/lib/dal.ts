import { supabase } from './supabaseClient';
import {
    AdMedia,
    TriviaQuestion,
    Ticket,
    User,
    Store,
    ChangoConfig,
    WheelSegment,
    Machine,
    GameEvent,
    Prize,
    Game,
    MachineGame
} from './types';

// Users DAL
export const getUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    // Map snake_case to camelCase
    return data.map((u: any) => ({
        ...u,
        machineIds: u.machine_ids || []
    })) as User[];
};
export const addUser = async (user: User): Promise<User> => {
    const dbUser = {
        ...user,
        machine_ids: user.machineIds // Map to snake_case
    };
    delete (dbUser as any).machineIds;

    const { data, error } = await supabase.from('users').insert(dbUser).select().single();
    if (error) throw error;
    return {
        ...data,
        machineIds: data.machine_ids || []
    } as User;
};
export const updateUser = async (id: string, updates: Partial<User>): Promise<User | undefined> => {
    const dbUpdates: any = { ...updates };
    if (updates.machineIds) {
        dbUpdates.machine_ids = updates.machineIds;
        delete dbUpdates.machineIds;
    }

    const { data, error } = await supabase.from('users').update(dbUpdates).eq('id', id).select().single();
    if (error) return undefined;
    return {
        ...data,
        machineIds: data.machine_ids || []
    } as User;
};
export const deleteUser = async (id: string): Promise<void> => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
};

// Ads DAL
export const getAds = async (): Promise<AdMedia[]> => {
    const { data, error } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    // Map snake_case created_at to camelCase createdAt for types compatibility
    return data.map((a: any) => ({
        ...a,
        durationSec: a.duration_sec,
        createdAt: new Date(a.created_at),
        machineIds: a.machine_ids || []
    })) as AdMedia[];
};
export const addAd = async (ad: AdMedia): Promise<AdMedia> => {
    const dbAd = {
        id: ad.id,
        name: ad.name,
        type: ad.type,
        url: ad.url,
        duration_sec: ad.durationSec,
        priority: ad.priority,
        active: ad.active,
        created_at: ad.createdAt,
        machine_ids: ad.machineIds
    };
    const { data, error } = await supabase.from('ads').insert(dbAd).select().single();
    if (error) throw error;
    return {
        ...ad,
        durationSec: data.duration_sec,
        createdAt: new Date(data.created_at),
        machineIds: data.machine_ids
    };
};
export const updateAd = async (id: string, updates: Partial<AdMedia>): Promise<AdMedia | undefined> => {
    const dbUpdates: any = { ...updates };
    if (updates.durationSec !== undefined) {
        dbUpdates.duration_sec = updates.durationSec;
        delete dbUpdates.durationSec;
    }
    if (updates.createdAt !== undefined) {
        delete dbUpdates.createdAt;
    }
    if (updates.machineIds !== undefined) {
        dbUpdates.machine_ids = updates.machineIds;
        delete dbUpdates.machineIds;
    }

    const { data, error } = await supabase.from('ads').update(dbUpdates).eq('id', id).select().single();
    if (error) return undefined;
    return {
        ...data,
        durationSec: data.duration_sec,
        createdAt: new Date(data.created_at),
        machineIds: data.machine_ids
    } as AdMedia;
};
export const deleteAd = async (id: string): Promise<void> => {
    const { error } = await supabase.from('ads').delete().eq('id', id);
    if (error) throw error;
};

// Questions DAL
export const getQuestions = async (): Promise<TriviaQuestion[]> => {
    const { data, error } = await supabase.from('questions').select('*');
    if (error) throw error;
    return data.map((q: any) => ({ ...q, correctKey: q.correct_key })) as TriviaQuestion[];
};
export const addQuestion = async (q: TriviaQuestion): Promise<TriviaQuestion> => {
    const dbQ = { ...q, correct_key: q.correctKey };
    delete (dbQ as any).correctKey;
    const { data, error } = await supabase.from('questions').insert(dbQ).select().single();
    if (error) throw error;
    return { ...data, correctKey: data.correct_key } as TriviaQuestion;
};
export const updateQuestion = async (id: string, updates: Partial<TriviaQuestion>): Promise<TriviaQuestion | undefined> => {
    const dbUpdates: any = { ...updates };
    if (updates.correctKey) {
        dbUpdates.correct_key = updates.correctKey;
        delete dbUpdates.correctKey;
    }
    const { data, error } = await supabase.from('questions').update(dbUpdates).eq('id', id).select().single();
    if (error) return undefined;
    return { ...data, correctKey: data.correct_key } as TriviaQuestion;
};
export const deleteQuestion = async (id: string): Promise<void> => {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) throw error;
};

// Machines DAL
// Machines DAL
export const getMachines = async (): Promise<Machine[]> => {
    const { data, error } = await supabase.from('machines').select('*');
    if (error) throw error;
    return data.map((m: any) => ({
        ...m,
        short_id: m.short_id,
        isOperational: m.is_operational,
        qr_enabled: m.qr_enabled,
        joystick_enabled: m.joystick_enabled,
        tokenPrice: m.token_price || 1000,
        lastSeenAt: new Date(m.last_seen_at),
        games_counter: m.games_counter || 0
    })) as Machine[];
};

export const getMachineById = async (id: string): Promise<Machine | undefined> => {
    const { data, error } = await supabase.from('machines').select('*').eq('id', id).single();
    if (error) return undefined;

    // Fetch enabled games
    const { data: gamesData } = await supabase.from('machine_games').select('game_id').eq('machine_id', id).eq('active', true);
    // Be careful with join or separate query. Separate is safer for types.
    // Also, we might want the slugs if the frontend uses slugs. But ID is safer.
    // Let's assume frontend maps ID to Slug using the global games list.
    const enabledGames = gamesData ? gamesData.map((g: any) => g.game_id) : [];

    return {
        ...data,
        short_id: data.short_id,
        isOperational: data.is_operational,
        qr_enabled: data.qr_enabled,
        joystick_enabled: data.joystick_enabled,
        tokenPrice: data.token_price || 1000,
        lastSeenAt: new Date(data.last_seen_at),
        games_counter: data.games_counter || 0,
        enabledGames
    } as Machine;
};

export const getMachineByShortId = async (shortId: string): Promise<Machine | undefined> => {
    const { data, error } = await supabase.from('machines').select('*').eq('short_id', shortId).single();
    if (error) return undefined;
    return {
        ...data,
        short_id: data.short_id,
        isOperational: data.is_operational,
        qr_enabled: data.qr_enabled,
        joystick_enabled: data.joystick_enabled,
        tokenPrice: data.token_price || 1000,
        lastSeenAt: new Date(data.last_seen_at),
        games_counter: data.games_counter || 0
    } as Machine;
};

export const addMachine = async (m: Machine): Promise<Machine> => {
    const dbM = {
        id: m.id,
        short_id: m.short_id,
        name: m.name,
        location: m.location,
        is_operational: m.isOperational,
        qr_enabled: m.qr_enabled ?? true, // Default to true if not specified
        joystick_enabled: m.joystick_enabled ?? true,
        token_price: m.tokenPrice || 1000,
        last_seen_at: m.lastSeenAt,
        games_counter: m.games_counter || 0
    };
    const { data, error } = await supabase.from('machines').insert(dbM).select().single();
    if (error) throw error;
    return {
        ...data,
        short_id: data.short_id,
        isOperational: data.is_operational,
        qr_enabled: data.qr_enabled,
        joystick_enabled: data.joystick_enabled,
        tokenPrice: data.token_price || 1000,
        lastSeenAt: new Date(data.last_seen_at),
        games_counter: data.games_counter || 0
    } as Machine;
};
export const updateMachine = async (id: string, updates: Partial<Machine>): Promise<Machine | undefined> => {
    const dbUpdates: any = { ...updates };
    if (updates.isOperational !== undefined) {
        dbUpdates.is_operational = updates.isOperational;
        delete dbUpdates.isOperational;
    }
    if (updates.qr_enabled !== undefined) {
        dbUpdates.qr_enabled = updates.qr_enabled;
        // No need to delete qr_enabled as it matches DB column name
    }
    if (updates.joystick_enabled !== undefined) {
        dbUpdates.joystick_enabled = updates.joystick_enabled;
    }
    if (updates.lastSeenAt !== undefined) {
        dbUpdates.last_seen_at = updates.lastSeenAt;
        delete dbUpdates.lastSeenAt;
    }
    if (updates.games_counter !== undefined) {
        dbUpdates.games_counter = updates.games_counter;
        delete dbUpdates.gamesCounter; // Just in case
    }
    if (updates.tokenPrice !== undefined) {
        dbUpdates.token_price = updates.tokenPrice;
        delete dbUpdates.tokenPrice;
    }
    // short_id handled automatically if present in updates object key match
    const { data, error } = await supabase.from('machines').update(dbUpdates).eq('id', id).select().single();
    if (error) return undefined;
    return {
        ...data,
        short_id: data.short_id,
        isOperational: data.is_operational,
        qr_enabled: data.qr_enabled,
        joystick_enabled: data.joystick_enabled,
        tokenPrice: data.token_price || 1000,
        lastSeenAt: new Date(data.last_seen_at),
        games_counter: data.games_counter || 0
    } as Machine;
};
export const deleteMachine = async (id: string): Promise<void> => {
    const { error } = await supabase.from('machines').delete().eq('id', id);
    if (error) throw error;
};

// Stores DAL
export const getStores = async (): Promise<Store[]> => {
    const { data, error } = await supabase.from('stores').select('*');
    if (error) throw error;
    return data as Store[];
};
export const addStore = async (s: Store): Promise<Store> => {
    const { data, error } = await supabase.from('stores').insert(s).select().single();
    if (error) throw error;
    return data as Store;
};
export const updateStore = async (id: string, updates: Partial<Store>): Promise<Store | undefined> => {
    const { data, error } = await supabase.from('stores').update(updates).eq('id', id).select().single();
    if (error) return undefined;
    return data as Store;
};
export const deleteStore = async (id: string): Promise<void> => {
    const { error } = await supabase.from('stores').delete().eq('id', id);
    if (error) throw error;
};

// Prizes DAL
export const getPrizes = async (): Promise<Prize[]> => {
    const { data, error } = await supabase.from('prizes').select('*');
    if (error) throw error;
    return data as Prize[];
};

// Tickets DAL
export const addTicket = async (t: Ticket): Promise<Ticket> => {
    const dbT = {
        id: t.id,
        token: t.token,
        game_type: t.gameType,
        prize_id: t.prizeId,
        store_id: t.storeId,
        created_at: t.createdAt,
        redeemed_at: t.redeemedAt,
        redeemed_by: t.redeemedBy
    };
    const { data, error } = await supabase.from('tickets').insert(dbT).select().single();
    if (error) throw error;
    return {
        ...data,
        gameType: data.game_type,
        prizeId: data.prize_id,
        storeId: data.store_id,
        createdAt: new Date(data.created_at),
        redeemedAt: data.redeemed_at ? new Date(data.redeemed_at) : undefined,
        redeemedBy: data.redeemed_by
    } as Ticket;
};
export const getTicketById = async (id: string): Promise<Ticket | undefined> => {
    const { data, error } = await supabase.from('tickets').select('*').eq('id', id).single();
    if (error) return undefined;
    return {
        ...data,
        gameType: data.game_type,
        prizeId: data.prize_id,
        storeId: data.store_id,
        createdAt: new Date(data.created_at),
        redeemedAt: data.redeemed_at ? new Date(data.redeemed_at) : undefined,
        redeemedBy: data.redeemed_by
    } as Ticket;
};
export const getTickets = async (): Promise<Ticket[]> => {
    // Limit to recent tickets or pagination? For now fetch all
    const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    return data.map((d: any) => ({
        ...d,
        gameType: d.game_type,
        prizeId: d.prize_id,
        storeId: d.store_id,
        createdAt: new Date(d.created_at),
        redeemedAt: d.redeemed_at ? new Date(d.redeemed_at) : undefined,
        redeemedBy: d.redeemed_by
    })) as Ticket[];
};
export const clearTickets = async (): Promise<void> => {
    const { error } = await supabase.from('tickets').delete().neq('id', '0'); // Delete all
    if (error) throw error;
};

// Roulette DAL
export const getWheelSegments = async (): Promise<WheelSegment[]> => {
    const { data, error } = await supabase.from('wheel_segments').select('*').order('slot_index', { ascending: true });
    if (error) throw error;
    return data.map((w: any) => ({
        ...w,
        slotIndex: w.slot_index,
        prizeId: w.prize_id,
        storeId: w.store_id
    })) as WheelSegment[];
};
export const updateWheelSegment = async (id: string, updates: Partial<WheelSegment>): Promise<WheelSegment | undefined> => {
    const dbUpdates: any = { ...updates };
    if (updates.slotIndex !== undefined) {
        dbUpdates.slot_index = updates.slotIndex;
        delete dbUpdates.slotIndex;
    }
    if (updates.prizeId !== undefined) {
        dbUpdates.prize_id = updates.prizeId;
        delete dbUpdates.prizeId;
    }
    if (updates.storeId !== undefined) {
        dbUpdates.store_id = updates.storeId;
        delete dbUpdates.storeId;
    }

    const { data, error } = await supabase.from('wheel_segments').update(dbUpdates).eq('id', id).select().single();
    if (error) return undefined;
    return {
        ...data,
        slotIndex: data.slot_index,
        prizeId: data.prize_id,
        storeId: data.store_id
    } as WheelSegment;
};

// Chango DAL
export const getChangoConfig = async (): Promise<ChangoConfig> => {
    // Use JSON RPC to bypass RLS completely (returns json, not table row)
    const { data: jsonData, error } = await supabase.rpc('get_payment_config_json').single();

    if (error || !jsonData) {
        // Return default if missing or error
        return {
            id: 'default',
            difficulty: 3,
            timeLimit: 20,
            updatedAt: new Date()
        } as ChangoConfig;
    }

    const data = jsonData as any;

    return {
        ...data,
        timeLimit: data.time_limit,
        gameCooldownSeconds: data.game_cooldown_seconds,
        resultDurationSeconds: data.result_duration_seconds,
        priorityAdDurationSeconds: data.priority_ad_duration_seconds,
        qrDisplaySeconds: data.qr_display_seconds,
        paymentTimeoutSeconds: data.payment_timeout_seconds,
        paymentSuccessSeconds: data.payment_success_seconds,
        updatedAt: new Date(data.updated_at)
    } as ChangoConfig;
};
export const updateChangoConfig = async (updates: Partial<ChangoConfig>): Promise<ChangoConfig> => {
    const dbUpdates: any = { ...updates, updated_at: new Date() };
    delete dbUpdates.updatedAt;

    if (updates.timeLimit !== undefined) {
        dbUpdates.time_limit = updates.timeLimit;
        delete dbUpdates.timeLimit;
    }
    if (updates.gameCooldownSeconds !== undefined) {
        dbUpdates.game_cooldown_seconds = updates.gameCooldownSeconds;
        delete dbUpdates.gameCooldownSeconds;
    }
    if (updates.resultDurationSeconds !== undefined) {
        dbUpdates.result_duration_seconds = updates.resultDurationSeconds;
        delete dbUpdates.resultDurationSeconds;
    }
    if (updates.priorityAdDurationSeconds !== undefined) {
        dbUpdates.priority_ad_duration_seconds = updates.priorityAdDurationSeconds;
        delete dbUpdates.priorityAdDurationSeconds;
    }
    if (updates.qrDisplaySeconds !== undefined) {
        dbUpdates.qr_display_seconds = updates.qrDisplaySeconds;
        delete dbUpdates.qrDisplaySeconds;
    }
    if (updates.paymentTimeoutSeconds !== undefined) {
        dbUpdates.payment_timeout_seconds = updates.paymentTimeoutSeconds;
        delete dbUpdates.paymentTimeoutSeconds;
    }
    if (updates.paymentSuccessSeconds !== undefined) {
        dbUpdates.payment_success_seconds = updates.paymentSuccessSeconds;
        delete dbUpdates.paymentSuccessSeconds;
    }

    const { data, error } = await supabase.from('chango_config').update(dbUpdates).eq('id', 'default').select().single();
    if (error) throw error;
    return {
        ...data,
        timeLimit: data.time_limit,
        gameCooldownSeconds: data.game_cooldown_seconds,
        resultDurationSeconds: data.result_duration_seconds,
        priorityAdDurationSeconds: data.priority_ad_duration_seconds,
        qrDisplaySeconds: data.qr_display_seconds,
        paymentTimeoutSeconds: data.payment_timeout_seconds,
        paymentSuccessSeconds: data.payment_success_seconds,
        updatedAt: new Date(data.updated_at)
    } as ChangoConfig;
};

// Events DAL
export const getGameEvents = async (): Promise<GameEvent[]> => {
    const { data, error } = await supabase.from('game_events').select('*').order('started_at', { ascending: false }).limit(200);
    if (error) throw error;
    return data.map((e: any) => ({
        ...e,
        gameType: e.game_type,
        startedAt: new Date(e.started_at),
        finishedAt: e.finished_at ? new Date(e.finished_at) : undefined,
        ticketId: e.ticket_id,
        machineId: e.machine_id
    })) as GameEvent[];
};
export const addGameEvent = async (event: GameEvent): Promise<GameEvent> => {
    const dbE = {
        id: event.id,
        game_type: event.gameType,
        started_at: event.startedAt,
        finished_at: event.finishedAt,
        result: event.result,
        ticket_id: event.ticketId,
        machine_id: event.machineId
    };
    const { data, error } = await supabase.from('game_events').insert(dbE).select().single();
    if (error) throw error;
    return {
        ...data,
        gameType: data.game_type,
        startedAt: new Date(data.started_at),
        finishedAt: data.finished_at ? new Date(data.finished_at) : undefined,
        ticketId: data.ticket_id,
        machineId: data.machine_id
    } as GameEvent;
};
export const clearGameEvents = async (): Promise<void> => {
    const { error } = await supabase.from('game_events').delete().neq('id', '0');
    if (error) throw error;
};

// Games DAL
export const getGames = async (): Promise<Game[]> => {
    const { data, error } = await supabase.from('games').select('*').order('name');
    if (error) throw error;
    return data.map((g: any) => ({
        ...g,
        imageUrl: g.image_url,
        createdAt: new Date(g.created_at)
    })) as Game[];
};

export const getMachineGames = async (machineId: string): Promise<MachineGame[]> => {
    const { data, error } = await supabase.from('machine_games').select('*').eq('machine_id', machineId);
    if (error) throw error;
    return data.map((mg: any) => ({
        machineId: mg.machine_id,
        gameId: mg.game_id,
        active: mg.active,
        createdAt: new Date(mg.created_at)
    })) as MachineGame[];
};

export const upsertMachineGame = async (machineId: string, gameId: string, active: boolean): Promise<void> => {
    // Check if exists
    const { data: existing } = await supabase.from('machine_games').select('*').match({ machine_id: machineId, game_id: gameId }).single();

    if (existing) {
        const { error } = await supabase.from('machine_games').update({ active }).match({ machine_id: machineId, game_id: gameId });
        if (error) throw error;
    } else {
        const { error } = await supabase.from('machine_games').insert({ machine_id: machineId, game_id: gameId, active });
        if (error) throw error;
    }
};
