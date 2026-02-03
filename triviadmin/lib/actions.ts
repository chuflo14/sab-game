'use server';

import { revalidatePath } from 'next/cache';
import * as dal from './dal';
import {
    User,
    Machine,
    AdMedia,
    TriviaQuestion,
    Store,
    WheelSegment,
    ChangoConfig,
    Ticket,
    GameEvent
} from './types';

import { cookies } from 'next/headers';
import path from 'path';
import { supabase } from './supabaseClient';

// Admin Auth
export async function authenticateUser(username: string, pin: string) {
    const users = await dal.getUsers();
    // Case insensitive username matching
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.pin === pin);

    if (user && user.active) {
        console.log('Login successful for:', user.username, 'Role:', user.role); // Debug Log
        const sessionData = {
            userId: user.id,
            username: user.username,
            role: user.role
        };

        const cookieStore = await cookies();
        cookieStore.set('sb_session', JSON.stringify(sessionData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
        });

        return { success: true, role: user.role };
    }

    return { success: false, message: 'Credenciales inválidas o usuario inactivo' };
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('sb_session');
}

export async function uploadAdMedia(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) return { success: false, error: 'No file uploaded' };

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const ext = path.extname(file.name);
        // Sanitize filename to avoid special chars that might cause issues
        const safeName = Math.random().toString(36).substring(7);
        const fileName = `ads/${Date.now()}-${safeName}${ext}`;

        const { error } = await supabase.storage
            .from('MEDIA')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error('Upload Error details:', error);
            return { success: false, error: `Upload failed: ${error.message}` };
        }

        const { data: publicData } = supabase.storage
            .from('MEDIA')
            .getPublicUrl(fileName);

        return { success: true, url: publicData.publicUrl };
    } catch (err: any) {
        console.error('Unexpected upload error:', err);
        return { success: false, error: `Unexpected error: ${err.message}` };
    }
}

// User Actions
export async function fetchUsers() {
    return await dal.getUsers();
}
export async function createUser(data: User) {
    const newUser = await dal.addUser(data);
    revalidatePath('/admin/users');
    return newUser;
}
export async function updateUserAction(id: string, data: Partial<User>) {
    const updated = await dal.updateUser(id, data);
    revalidatePath('/admin/users');
    return updated;
}
export async function deleteUserAction(id: string) {
    await dal.deleteUser(id);
    revalidatePath('/admin/users');
}

// Stats Actions
export async function getAliadoStats(machineIds: string[]) {
    if (!machineIds || machineIds.length === 0) return [];

    const config = await dal.getChangoConfig();
    const gamePrice = config.game_price || 0;

    const stats = await Promise.all(machineIds.map(async (mId) => {
        // Fetch only game_type to minimize data transfer
        const { data, error } = await supabase
            .from('game_events')
            .select('game_type')
            .eq('machine_id', mId);

        if (error) {
            console.error(`Error fetching games for machine ${mId}:`, error);
            return {
                machineId: mId,
                triviaCount: 0,
                ruletaCount: 0,
                changoCount: 0,
                totalPlays: 0,
                totalRevenue: 0
            };
        }

        const triviaCount = data.filter((g: any) => g.game_type === 'trivia').length;
        const ruletaCount = data.filter((g: any) => g.game_type === 'ruleta').length;
        const changoCount = data.filter((g: any) => g.game_type === 'chango').length;
        const totalPlays = data.length;

        return {
            machineId: mId,
            triviaCount,
            ruletaCount,
            changoCount,
            totalPlays,
            totalRevenue: totalPlays * gamePrice
        };
    }));

    return stats;
}

// Ad Actions
export async function fetchAds() {
    return await dal.getAds();
}
export async function createAd(data: AdMedia) {
    const newAd = await dal.addAd(data);
    revalidatePath('/admin/ads');
    return newAd;
}
export async function updateAdAction(id: string, data: Partial<AdMedia>) {
    const updated = await dal.updateAd(id, data);
    revalidatePath('/admin/ads');
    return updated;
}
export async function deleteAdAction(id: string) {
    await dal.deleteAd(id);
    revalidatePath('/admin/ads');
}

// Question Actions
export async function fetchQuestions() {
    return await dal.getQuestions();
}
export async function createQuestion(data: TriviaQuestion) {
    const newQ = await dal.addQuestion(data);
    revalidatePath('/admin/trivia');
    return newQ;
}
export async function updateQuestionAction(id: string, data: Partial<TriviaQuestion>) {
    const updated = await dal.updateQuestion(id, data);
    revalidatePath('/admin/questions');
    revalidatePath('/admin/trivia');
    return updated;
}
export async function deleteQuestionAction(id: string) {
    // In a real app we'd have a deleteDal, for now we set active false or similar
    // Request specifically asked for CRUD, so let's add delete to DAL
    await dal.deleteQuestion(id);
    revalidatePath('/admin/questions');
    revalidatePath('/admin/trivia');
}
export async function toggleQuestionStatusAction(id: string) {
    const q = (await dal.getQuestions()).find(q => q.id === id);
    if (q) {
        await dal.updateQuestion(id, { active: !q.active });
        revalidatePath('/admin/questions');
        revalidatePath('/admin/trivia');
    }
}

export async function fetchRandomQuestions(limit: number) {
    const questions = await dal.getQuestions();
    const activeQuestions = questions.filter(q => q.active);
    return activeQuestions.sort(() => 0.5 - Math.random()).slice(0, limit);
}

// Machine Actions
export async function fetchMachines() {
    return await dal.getMachines();
}
export async function createMachine(data: Machine) {
    const newM = await dal.addMachine(data);
    revalidatePath('/admin/machines');
    return newM;
}
export async function updateMachineAction(id: string, data: Partial<Machine>) {
    const updated = await dal.updateMachine(id, data);
    revalidatePath('/admin/machines');
    return updated;
}
export async function deleteMachineAction(id: string) {
    await dal.deleteMachine(id);
    revalidatePath('/admin/machines');
}

// Store Actions
export async function fetchStores() {
    return await dal.getStores();
}
export async function createStore(data: Store) {
    const newS = await dal.addStore(data);
    revalidatePath('/admin/stores');
    return newS;
}
export async function updateStoreAction(id: string, data: Partial<Store>) {
    // If probability is being updated, we need to redistribute weights
    if (data.probability !== undefined) {
        const stores = await dal.getStores();
        const activeStores = stores.filter(s => s.active && s.id !== id); // Exclude current
        const targetStore = stores.find(s => s.id === id);

        if (targetStore) {
            const newProb = Math.max(0, Math.min(100, data.probability));

            // 1. Update target store first
            await dal.updateStore(id, { ...data, probability: newProb });

            // 2. Distribute remainder (100 - newProb) among others
            const remainder = 100 - newProb;

            if (activeStores.length > 0) {
                const totalOtherWeight = activeStores.reduce((sum, s) => sum + (s.probability || 0), 0);

                let distributedSum = 0;
                for (let i = 0; i < activeStores.length; i++) {
                    const store = activeStores[i];
                    let share = 0;

                    if (totalOtherWeight === 0) {
                        // If others have 0, split remainder equally
                        share = remainder / activeStores.length;
                    } else {
                        // Proportional split
                        share = ((store.probability || 0) / totalOtherWeight) * remainder;
                    }

                    // Round to integer for cleaner UI, handle summation error on last item
                    let newShare = Math.round(share);

                    // If it's the last item, take the exact difference to ensure sum is 100
                    if (i === activeStores.length - 1) {
                        newShare = remainder - distributedSum;
                    }

                    // Ensure non-negative
                    newShare = Math.max(0, newShare);

                    await dal.updateStore(store.id, { probability: newShare });
                    distributedSum += newShare;
                }
            }
            revalidatePath('/admin/stores');
            return;
        }
    }

    const updated = await dal.updateStore(id, data);
    revalidatePath('/admin/stores');
    return updated;
}

export async function deleteStoreAction(id: string) {
    await dal.deleteStore(id);
    revalidatePath('/admin/stores');
}

export async function getStoreDetails(id: string) {
    const stores = await dal.getStores();
    return stores.find(s => s.id === id);
}

// Wheel Actions
export async function fetchWheelSegments() {
    return await dal.getWheelSegments();
}
export async function updateWheelSegmentAction(id: string, data: Partial<WheelSegment>) {
    const updated = await dal.updateWheelSegment(id, data);
    revalidatePath('/admin/wheel');
    return updated;
}

export async function bulkUpdateWheelSegmentsAction(updates: { id: string, updates: Partial<WheelSegment> }[]) {
    const { updateWheelSegment } = await import('./dal');
    for (const item of updates) {
        await updateWheelSegment(item.id, item.updates);
    }
    revalidatePath('/admin/wheel');
}

export async function fetchRouletteSegments() {
    return await dal.getWheelSegments();
}

// Chango Actions
export async function fetchChangoConfig() {
    return await dal.getChangoConfig();
}
export async function updateChangoConfigAction(data: Partial<ChangoConfig>) {
    const updated = await dal.updateChangoConfig(data);
    revalidatePath('/admin/chango');
    revalidatePath('/admin/times');
    return updated;
}

// Ticket & Prize Actions
export async function generateWinningTicket(prizeId: string, gameType: Ticket['gameType'], forcedStoreId?: string): Promise<Ticket> {
    const stores = await dal.getStores();
    const activeStores = stores.filter(s => s.active);
    let selectedStoreId: string | null = null;

    if (forcedStoreId) {
        // If a specific store is forced (e.g. from Roulette segment), use it if valid
        const valid = activeStores.find(s => s.id === forcedStoreId);
        if (valid) selectedStoreId = forcedStoreId;
    }

    if (!selectedStoreId && activeStores.length > 0) {
        // Weighted Random Selection
        const totalWeight = activeStores.reduce((sum, store) => sum + (store.probability || 1), 0);
        let randomValue = Math.random() * totalWeight;

        for (const store of activeStores) {
            randomValue -= (store.probability || 1);
            if (randomValue <= 0) {
                selectedStoreId = store.id;
                break;
            }
        }
    }

    const newTicket: Ticket = {
        id: crypto.randomUUID(),
        token: Math.random().toString(36).substring(2, 10).toUpperCase(),
        gameType: gameType,
        prizeId: prizeId,
        storeId: selectedStoreId,
        createdAt: new Date(),
        redeemedAt: undefined
    };

    await dal.addTicket(newTicket);
    return newTicket;
}

export async function getTicket(id: string) {
    return await dal.getTicketById(id);
}

export async function fetchPrizes() {
    return await dal.getPrizes();
}

// Dashboard Metrics
export async function fetchMetrics() {
    const [events, tickets, machines] = await Promise.all([
        dal.getGameEvents(),
        dal.getTickets(),
        dal.getMachines()
    ]);

    return {
        gamesByType: {
            trivia: events.filter(e => e.gameType === 'trivia').length,
            ruleta: events.filter(e => e.gameType === 'ruleta').length,
            chango: events.filter(e => e.gameType === 'chango').length
        },
        tickets: {
            total: tickets.length,
            redeemed: tickets.filter(t => !!t.redeemedAt).length,
            pending: tickets.filter(t => !t.redeemedAt).length
        },
        machines: {
            total: machines.length,
            operational: machines.filter(m => m.isOperational).length
        }
    };
}

export async function resetDashboardStats() {
    await dal.clearGameEvents();
    await dal.clearTickets();
    revalidatePath('/admin');
}

// Game Logging
export async function logGameEvent(event: Omit<GameEvent, 'id'>) {
    const newEvent: GameEvent = {
        ...event,
        id: crypto.randomUUID(),
    };
    return await dal.addGameEvent(newEvent);
}
