"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeAnalytics = exports.getEvents = exports.recordEvent = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_FILE = path_1.default.resolve(__dirname, '../data/analytics.json');
function load() {
    if (!fs_1.default.existsSync(DATA_FILE)) {
        fs_1.default.writeFileSync(DATA_FILE, JSON.stringify({ events: [] }, null, 2), 'utf8');
    }
    const raw = fs_1.default.readFileSync(DATA_FILE, 'utf8');
    try {
        return JSON.parse(raw);
    }
    catch {
        return { events: [] };
    }
}
function save(data) {
    fs_1.default.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}
function recordEvent(req) {
    if (req.path.startsWith('/api/analytics'))
        return; // ignore
    const data = load();
    data.events.push({ timestamp: Date.now(), ip: req.ip || 'unknown', route: req.path });
    save(data);
}
exports.recordEvent = recordEvent;
function getEvents() {
    return load().events;
}
exports.getEvents = getEvents;
function secondsToTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
}
function computeAnalytics() {
    const events = getEvents();
    const now = Date.now();
    const dayMs = 86400000;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;
    const today = new Set();
    const week = new Set();
    const month = new Set();
    const pageMap = {};
    const hourMap = {};
    const sessions = new Map();
    events.forEach(ev => {
        pageMap[ev.route] = (pageMap[ev.route] || 0) + 1;
        const h = new Date(ev.timestamp).toISOString().slice(11, 13) + ':00';
        hourMap[h] = (hourMap[h] || 0) + 1;
        if (now - ev.timestamp < dayMs)
            today.add(ev.ip);
        if (now - ev.timestamp < weekMs)
            week.add(ev.ip);
        if (now - ev.timestamp < monthMs)
            month.add(ev.ip);
        const s = sessions.get(ev.ip);
        if (!s || ev.timestamp - s.last > 30 * 60 * 1000) {
            sessions.set(ev.ip, { last: ev.timestamp, start: ev.timestamp, count: 1 });
        }
        else {
            s.last = ev.timestamp;
            s.count++;
        }
    });
    const sessionList = Array.from(sessions.values());
    const bounce = sessionList.filter(s => s.count === 1).length;
    const sessionDurationTotal = sessionList.reduce((n, s) => n + (s.last - s.start), 0);
    const sessionCount = sessionList.length || 1;
    const avgDuration = sessionDurationTotal / sessionCount / 1000; // sec
    const topPages = Object.entries(pageMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([page, views]) => ({ page, views }));
    const visitsByHour = Object.entries(hourMap)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([hour, sessions]) => ({ hour, sessions }));
    const traffic = {
        uniqueVisitorsToday: today.size,
        uniqueVisitorsWeek: week.size,
        uniqueVisitorsMonth: month.size,
        pageViews: events.length,
        bounceRate: Math.round((bounce / sessionCount) * 100),
        bounceDiff: 0,
        avgSessionDuration: secondsToTime(avgDuration),
        sessionsPerUser: month.size ? sessionCount / month.size : 0,
        peakHours: visitsByHour,
    };
    // compute tickets
    let ticketWeeks = {};
    try {
        const ticketsRaw = fs_1.default.readFileSync(path_1.default.resolve(__dirname, '../data/tickets.json'), 'utf8');
        const tickets = JSON.parse(ticketsRaw);
        tickets.forEach(t => {
            const weekStart = new Date(t.date);
            weekStart.setUTCHours(0, 0, 0, 0);
            const day = weekStart.getUTCDay();
            const diff = weekStart.getUTCDate() - day;
            weekStart.setUTCDate(diff);
            const key = weekStart.toISOString().slice(0, 10);
            ticketWeeks[key] = ticketWeeks[key] || { created: 0, resolved: 0 };
            ticketWeeks[key].created += 1;
            if (t.status === 'closed')
                ticketWeeks[key].resolved += 1;
        });
    }
    catch {
        // ignore
    }
    const ticketData = Object.entries(ticketWeeks)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([week, { created, resolved }]) => ({ week, created, resolved }));
    // accounts by site
    let siteMap = {};
    try {
        const usersRaw = fs_1.default.readFileSync(path_1.default.resolve(__dirname, '../data/users.json'), 'utf8');
        const users = JSON.parse(usersRaw);
        users.forEach(u => {
            const sites = u.role === 'manager' ? u.sites || [] : [u.site];
            sites.forEach(s => {
                if (s)
                    siteMap[s] = (siteMap[s] || 0) + 1;
            });
        });
    }
    catch {
        // ignore
    }
    const accounts = {
        bySite: Object.entries(siteMap).map(([site, count]) => ({ site, count })),
    };
    return {
        traffic,
        behavior: { topPages, visitsByHour },
        tickets: { weeks: ticketData },
        accounts,
    };
}
exports.computeAnalytics = computeAnalytics;
