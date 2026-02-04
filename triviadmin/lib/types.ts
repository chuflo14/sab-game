export type GameType = 'trivia' | 'ruleta' | 'chango';


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
    tokenPrice: number; // Price per token for this specific machine
    lastSeenAt?: Date;
    games_counter?: number; // Running total of games since last reset
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
