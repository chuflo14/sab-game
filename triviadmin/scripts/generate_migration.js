
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

let sql = '';

const escapeStr = (str) => {
    if (str === null || str === undefined) return 'NULL';
    return `'${str.replace(/'/g, "''")}'`;
};

const escapeBool = (val) => val === true ? 'TRUE' : 'FALSE';
const escapeNum = (val) => val === undefined || val === null ? 'NULL' : val;
const escapeDate = (val) => val ? `'${val}'` : 'NULL';
const escapeJson = (val) => val ? `'${JSON.stringify(val)}'` : 'NULL';

// Users
if (db.users) {
    sql += `-- Users\n`;
    sql += `INSERT INTO public.users (id, username, pin, role, active) VALUES\n`;
    sql += db.users.map(u => `(${escapeStr(u.id)}, ${escapeStr(u.username)}, ${escapeStr(u.pin)}, ${escapeStr(u.role)}, ${escapeBool(u.active)})`).join(',\n') + ';\n\n';
}

// Stores
if (db.stores) {
    sql += `-- Stores\n`;
    sql += `INSERT INTO public.stores (id, name, address, whatsapp, probability, active) VALUES\n`;
    sql += db.stores.map(s => `(${escapeStr(s.id)}, ${escapeStr(s.name)}, ${escapeStr(s.address)}, ${escapeStr(s.whatsapp)}, ${escapeNum(s.probability)}, ${escapeBool(s.active)})`).join(',\n') + ';\n\n';
}

// Prizes
if (db.prizes) {
    sql += `-- Prizes\n`;
    sql += `INSERT INTO public.prizes (id, name, description, stock, active) VALUES\n`;
    sql += db.prizes.map(p => `(${escapeStr(p.id)}, ${escapeStr(p.name)}, ${escapeStr(p.description)}, ${escapeNum(p.stock)}, ${escapeBool(true)})`).join(',\n') + ';\n\n';
}

// Ads
if (db.ads) {
    sql += `-- Ads\n`;
    sql += `INSERT INTO public.ads (id, name, type, url, duration_sec, priority, active, created_at) VALUES\n`;
    sql += db.ads.map(a => `(${escapeStr(a.id)}, ${escapeStr(a.name)}, ${escapeStr(a.type)}, ${escapeStr(a.url)}, ${escapeNum(a.durationSec)}, ${escapeBool(a.priority)}, ${escapeBool(a.active)}, ${escapeDate(a.createdAt)})`).join(',\n') + ';\n\n';
}

// Questions
if (db.questions) {
    sql += `-- Questions\n`;
    sql += `INSERT INTO public.questions (id, question, options, correct_key, active) VALUES\n`;
    sql += db.questions.map(q => `(${escapeStr(q.id)}, ${escapeStr(q.question || q.text)}, ${escapeJson(q.options)}, ${escapeStr(q.correctKey)}, ${escapeBool(q.active)})`).join(',\n') + ';\n\n';
}

// Machines
if (db.machines) {
    sql += `-- Machines\n`;
    sql += `INSERT INTO public.machines (id, name, location, is_operational, last_seen_at) VALUES\n`;
    sql += db.machines.map(m => `(${escapeStr(m.id)}, ${escapeStr(m.name)}, ${escapeStr(m.location)}, ${escapeBool(m.isOperational)}, ${escapeDate(m.lastSeenAt)})`).join(',\n') + ';\n\n';
}

// Chango Config
if (db.changoConfig) {
    const c = db.changoConfig;
    sql += `-- Chango Config\n`;
    sql += `INSERT INTO public.chango_config (id, difficulty, time_limit, game_cooldown_seconds, result_duration_seconds, priority_ad_duration_seconds, qr_display_seconds, updated_at) VALUES\n`;
    sql += `('default', ${escapeNum(c.difficulty)}, ${escapeNum(c.timeLimit)}, ${escapeNum(c.gameCooldownSeconds)}, ${escapeNum(c.resultDurationSeconds)}, ${escapeNum(c.priorityAdDurationSeconds)}, ${escapeNum(c.qrDisplaySeconds)}, ${escapeDate(c.updatedAt)});\n\n`;
}

// Wheel Segments
if (db.wheelSegments) {
    sql += `-- Wheel Segments\n`;
    sql += `INSERT INTO public.wheel_segments (id, slot_index, label, color, probability, prize_id, store_id, active) VALUES\n`;
    sql += db.wheelSegments.map(w => `(${escapeStr(w.id)}, ${escapeNum(w.slotIndex)}, ${escapeStr(w.label)}, ${escapeStr(w.color)}, ${escapeNum(w.probability)}, ${escapeStr(w.prizeId)}, ${escapeStr(w.storeId)}, ${escapeBool(w.active)})`).join(',\n') + ';\n\n';
}

// Tickets
if (db.tickets && db.tickets.length > 0) {
    sql += `-- Tickets\n`;

    // Fix legacy storeId '1' -> Sansol ID
    const sansolStore = db.stores?.find(s => s.name.toLowerCase().includes('sansol'));
    const sansolId = sansolStore ? sansolStore.id : null;

    const ticketValues = db.tickets.map(t => {
        let sId = t.storeId;
        if (sId === '1' && sansolId) sId = sansolId;
        return `(${escapeStr(t.id)}, ${escapeStr(t.code || t.token)}, ${escapeStr(t.gameType || 'trivia')}, ${escapeStr(t.prizeId)}, ${escapeStr(sId)}, ${escapeDate(t.createdAt)}, ${escapeDate(t.redeemedAt || (t.redeemed ? new Date().toISOString() : null))}, ${escapeStr(t.redeemedBy)})`;
    });

    const chunkSize = 50;
    for (let i = 0; i < ticketValues.length; i += chunkSize) {
        sql += `INSERT INTO public.tickets (id, token, game_type, prize_id, store_id, created_at, redeemed_at, redeemed_by) VALUES\n` + ticketValues.slice(i, i + chunkSize).join(',\n') + ';\n';
    }
}

// Game Events
if (db.gameEvents && db.gameEvents.length > 0) {
    sql += `-- Game Events\n`;
    const eventValues = db.gameEvents.map(e => `(${escapeStr(e.id)}, ${escapeStr(e.gameType)}, ${escapeDate(e.startedAt)}, ${escapeDate(e.finishedAt)}, ${escapeStr(e.result)}, ${escapeStr(e.ticketId)}, ${escapeStr(e.machineId)})`);

    const chunkSize = 50;
    for (let i = 0; i < eventValues.length; i += chunkSize) {
        sql += `INSERT INTO public.game_events (id, game_type, started_at, finished_at, result, ticket_id, machine_id) VALUES\n` + eventValues.slice(i, i + chunkSize).join(',\n') + ';\n';
    }
}

fs.writeFileSync(path.resolve(__dirname, '../migration.sql'), sql);
console.log('Migration SQL generated');
