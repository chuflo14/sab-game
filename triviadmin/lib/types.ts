// Game Types
export type GameType = 'trivia' | 'ruleta' | 'chango' | 'simon' | 'taprace';

// ... (skipping lines)

export interface ChangoConfig {
    id: 'default';
    difficulty: number; // 1..10 (Chango)
    timeLimit: number; // in seconds
    gameCooldownSeconds?: number;
    resultDurationSeconds?: number;
    priorityAdDurationSeconds?: number;
    qrDisplaySeconds?: number;
    game_price?: number;
    enable_payments?: boolean;
    paymentTimeoutSeconds?: number;
    paymentSuccessSeconds?: number;

    // Music URLs
    trivia_music_url?: string;
    ruleta_music_url?: string;
    chango_music_url?: string;
    simon_music_url?: string;
    simon_max_levels?: number;
    simon_speed_ms?: number;
    simon_level_time_sec?: number;
    taprace_music_url?: string;

    // Tap Race Config
    taprace_duration?: number; // seconds
    taprace_difficulty?: number; // clicks to win (e.g. 50, 100)
    taprace_bot_speed?: number; // 1-10

    updatedAt: Date;
}

// ... (skipping lines)

export interface ChangoConfig {
    id: 'default';
    difficulty: number; // 1..10 (Chango)
    timeLimit: number; // in seconds
    gameCooldownSeconds?: number;
    resultDurationSeconds?: number;
    priorityAdDurationSeconds?: number;
    qrDisplaySeconds?: number;
    game_price?: number;
    enable_payments?: boolean;
    paymentTimeoutSeconds?: number;
    paymentSuccessSeconds?: number;

    // Music URLs
    trivia_music_url?: string;
    ruleta_music_url?: string;
    chango_music_url?: string;
    simon_music_url?: string;
    penalties_music_url?: string;

    // Penalties Config
    penalties_difficulty?: number; // 1..10 (Speed/Zone Size)
    penalties_max_shots?: number; // e.g. 5

    updatedAt: Date;
}


export interface User {
    id: string;
    username: string;
    pin?: string;
    role: 'ADMIN' | 'REDEEMER' | 'KIOSK' | 'ALIADO';
    active: boolean;
    machineIds?: string[]; // Allowed machines for ALIADO role
}

export interface Machine {
    id: string;
    short_id?: string; // User-friendly ID for setup
    name: string;
    location?: string;
    isOperational: boolean;
    qr_enabled?: boolean; // Machine-specific QR payment toggle
    joystick_enabled?: boolean; // Machine-specific Joystick toggle
    tokenPrice: number; // Price per token for this specific machine
    lastSeenAt?: Date;
    games_counter?: number; // Running total of games since last reset
    enabledGames?: string[]; // IDs of enabled games
}

export interface Game {
    id: string;
    slug: string;
    name: string;
    description?: string;
    route: string;
    imageUrl?: string;
    active: boolean;
    createdAt: Date;
}

export interface MachineGame {
    machineId: string;
    gameId: string;
    active: boolean;
    createdAt: Date;
}

export interface AdMedia {
    id: string;
    name: string;
    type: 'image' | 'video';
    url: string;
    durationSec: number;
    priority: boolean;
    active: boolean;
    createdAt: Date;
    machineIds?: string[]; // IDs of machines this ad should target. Empty = All
    uploadedBy?: string; // User ID who uploaded this ad
}

export interface TriviaQuestion {
    id: string;
    question: string;
    options: {
        S: string;
        A: string;
        B: string;
    };
    correctKey: 'S' | 'A' | 'B';
    active: boolean;
}

export interface Prize {
    id: string;
    name: string;
    description?: string;
    active: boolean;
}

export interface WheelSegment {
    id: string;
    slotIndex: number; // 1..8
    label: string;
    probability: number; // 0..1
    prizeId?: string;
    storeId?: string; // Link to specific store
    active: boolean;
    color: string; // Keep color for UI
}

export interface ChangoConfig {
    id: 'default';
    difficulty: number; // 1..10
    timeLimit: number; // in seconds
    gameCooldownSeconds?: number; // Wait time between games
    resultDurationSeconds?: number; // Duration of result screen
    priorityAdDurationSeconds?: number; // Duration of priority ad (interstitial)
    qrDisplaySeconds?: number; // Duration of QR display on win
    game_price?: number; // Price of the game credit
    enable_payments?: boolean; // Enable/Disable payments
    paymentTimeoutSeconds?: number; // Timeout for payment screen
    paymentSuccessSeconds?: number; // Duration of success message
    trivia_music_url?: string;
    ruleta_music_url?: string;
    chango_music_url?: string;
    simon_music_url?: string;
    updatedAt: Date;
}

export interface Ticket {
    id: string;
    token: string;
    gameType: GameType;
    prizeId?: string;
    storeId?: string | null;
    createdAt: Date;
    redeemedAt?: Date;
    redeemedBy?: string; // User ID of redeemer
}

export interface Store {
    id: string;
    name: string;
    whatsapp: string;
    address: string;
    mapsUrl?: string;
    probability?: number;
    active: boolean;
}

export interface GameEvent {
    id: string;
    gameType: GameType;
    machineId?: string;
    startedAt: Date;
    finishedAt?: Date;
    result: 'WIN' | 'LOSE';
    ticketId?: string;
}

// Legacy compatibility (to be cleaned up or mapped)
export type Question = TriviaQuestion;
export type RouletteSegment = WheelSegment;
export type AppSettings = ChangoConfig;
export type Ad = AdMedia;
