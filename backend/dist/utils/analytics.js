"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeAnalytics = exports.getAnalyticsFile = exports.recordFavorite = exports.endSession = exports.startSession = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_FILE = path_1.default.resolve(__dirname, '../data/analytics.json');
function load() {
    if (!fs_1.default.existsSync(DATA_FILE)) {
        fs_1.default.writeFileSync(DATA_FILE, JSON.stringify({ sessions: [], favorites: [], averages: {} }, null, 2), 'utf8');
    }
    const raw = fs_1.default.readFileSync(DATA_FILE, 'utf8');
    try {
        const parsed = JSON.parse(raw);
        // handle legacy format or missing fields
        if (Array.isArray(parsed.events)) {
            parsed.sessions = [];
            parsed.favorites = [];
            delete parsed.events;
            save(parsed);
        }
        const sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];
        const favorites = Array.isArray(parsed.favorites) ? parsed.favorites : [];
        const averages = typeof parsed.averages === 'object' && parsed.averages !== null ? parsed.averages : {};
        if (sessions !== parsed.sessions || favorites !== parsed.favorites || averages !== parsed.averages) {
            save({ sessions, favorites, averages });
        }
        return { sessions, favorites, averages };
    }
    catch {
        return { sessions: [], favorites: [], averages: {} };
    }
}
function save(data) {
    fs_1.default.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}
async function getParisTime() {
    try {
        const res = await fetch('https://worldtimeapi.org/api/timezone/Europe/Paris');
        const data = await res.json();
        return data.datetime;
    }
    catch {
        return new Date().toISOString();
    }
}
async function startSession(userId, role) {
    const data = load();
    const login = await getParisTime();
    data.sessions.push({ userId, role, login });
    save(data);
}
exports.startSession = startSession;
async function endSession(userId) {
    const data = load();
    const logout = await getParisTime();
    for (let i = data.sessions.length - 1; i >= 0; i--) {
        const s = data.sessions[i];
        if (s.userId === userId && !s.logout) {
            s.logout = logout;
            const duration = Math.ceil((new Date(logout).getTime() - new Date(s.login).getTime()) / 60000);
            const stats = data.averages?.[userId] || { avg: 0, count: 0 };
            const newAvg = (stats.avg * stats.count + duration) / (stats.count + 1);
            data.averages = data.averages || {};
            data.averages[userId] = { avg: newAvg, prevAvg: stats.avg, count: stats.count + 1 };
            break;
        }
    }
    save(data);
}
exports.endSession = endSession;
async function recordFavorite(userId, itemId) {
    const data = load();
    const date = await getParisTime();
    data.favorites.push({ userId, itemId, date });
    save(data);
}
exports.recordFavorite = recordFavorite;
function getAnalyticsFile() {
    return load();
}
exports.getAnalyticsFile = getAnalyticsFile;
function parseDate(str) {
    return new Date(str);
}
function totalItems(mods) {
    const walk = (items) => items.reduce((n, it) => n + 1 + walk(it.children || []), 0);
    return mods.reduce((n, m) => n + walk(m.items || []), 0);
}
function computeAnalytics() {
    const file = load();
    let users = [];
    let modules = [];
    try {
        users = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(__dirname, '../data/users.json'), 'utf8'));
    }
    catch { }
    try {
        modules = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(__dirname, '../data/modules.json'), 'utf8'));
    }
    catch { }
    const userRoles = {};
    users.forEach(u => { userRoles[u.id] = u.role; });
    const itemTitles = {};
    const collectTitles = (items) => {
        items.forEach(it => {
            itemTitles[it.id] = it.title || it.name || it.id;
            if (Array.isArray(it.children))
                collectTitles(it.children);
        });
    };
    modules.forEach(m => collectTitles(m.items || []));
    const now = new Date();
    const monthLabel = now.toISOString().slice(0, 7); // YYYY-MM
    const sessionsToday = new Set();
    const sessionsWeek = new Set();
    const sessionsMonth = new Set();
    const cafDurations = [];
    const managerDurations = [];
    const hourBuckets = {};
    for (let h = 6; h <= 20; h += 2) {
        const label = `${h.toString().padStart(2, '0')}:00`;
        hourBuckets[label] = [];
    }
    const sessionsArr = Array.isArray(file.sessions) ? file.sessions : [];
    sessionsArr.forEach((s) => {
        const login = parseDate(s.login);
        const logout = s.logout ? parseDate(s.logout) : null;
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        if (login >= startOfDay)
            sessionsToday.add(s.userId);
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        if (login >= startOfWeek)
            sessionsWeek.add(s.userId);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (login >= startOfMonth)
            sessionsMonth.add(s.userId);
        if (logout) {
            const durationMin = Math.ceil((logout.getTime() - login.getTime()) / 60000);
            if (s.role === 'caf')
                cafDurations.push(durationMin);
            else if (s.role === 'manager')
                managerDurations.push(durationMin);
            const hour = login.getHours();
            const bucket = Math.max(6, Math.min(20, hour + (hour % 2 ? -1 : 0)));
            const label = `${bucket.toString().padStart(2, '0')}:00`;
            hourBuckets[label].push(1);
        }
    });
    const avg = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0);
    const byHour = Object.entries(hourBuckets).map(([hour, list]) => ({ hour, avg: avg(list) }));
    const favMap = {};
    let favLists = [];
    try {
        favLists = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(__dirname, '../data/favorites.json'), 'utf8'));
    }
    catch { }
    favLists.forEach(f => {
        if (userRoles[f.userId] !== 'caf')
            return;
        (f.items || []).forEach((id) => {
            if (!favMap[id])
                favMap[id] = new Set();
            favMap[id].add(f.userId);
        });
    });
    const favorites = Object.entries(favMap)
        .map(([itemId, set]) => ({ itemId, title: itemTitles[itemId] || itemId, count: set.size }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    const siteMap = {};
    users.forEach(u => {
        const sites = u.role === 'manager' ? (u.sites || []) : [u.site];
        sites.forEach((s) => { if (s)
            siteMap[s] = (siteMap[s] || 0) + 1; });
    });
    return {
        counts: { accounts: users.length, modules: modules.length, items: totalItems(modules) },
        visitors: {
            today: sessionsToday.size,
            week: sessionsWeek.size,
            month: { count: sessionsMonth.size, label: monthLabel },
        },
        sessions: {
            caf: cafDurations.length,
            manager: managerDurations.length,
            avgDurationCaf: avg(cafDurations),
            avgDurationManager: avg(managerDurations),
            byHour,
        },
        favorites,
        sites: Object.entries(siteMap).map(([site, count]) => ({ site, count })),
    };
}
exports.computeAnalytics = computeAnalytics;
