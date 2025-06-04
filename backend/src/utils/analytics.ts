import fs from 'fs';
import path from 'path';
import { Request } from 'express';

export interface AnalyticsEvent {
  timestamp: number;
  ip: string;
  route: string;
}

interface AnalyticsFile {
  events: AnalyticsEvent[];
}

const DATA_FILE = path.resolve(__dirname, '../data/analytics.json');

function load(): AnalyticsFile {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ events: [] }, null, 2), 'utf8');
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw) as AnalyticsFile;
  } catch {
    return { events: [] };
  }
}

function save(data: AnalyticsFile) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export function recordEvent(req: Request): void {
  if (req.path.startsWith('/api/analytics')) return; // ignore
  const data = load();
  data.events.push({ timestamp: Date.now(), ip: req.ip || 'unknown', route: req.path });
  save(data);
}

export function getEvents(): AnalyticsEvent[] {
  return load().events;
}

export interface AnalyticsMetrics {
  traffic: {
    uniqueVisitorsToday: number;
    uniqueVisitorsWeek: number;
    uniqueVisitorsMonth: number;
    pageViews: number;
    bounceRate: number;
    bounceDiff: number;
    avgSessionDuration: string;
    sessionsPerUser: number;
    peakHours: { hour: string; sessions: number }[];
  };
  behavior: {
    topPages: { page: string; views: number }[];
    visitsByHour: { hour: string; sessions: number }[];
  };
  tickets: { weeks: { week: string; created: number; resolved: number }[] };
  accounts: { bySite: { site: string; count: number }[] };
}

function secondsToTime(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export function computeAnalytics(): AnalyticsMetrics {
  const events = getEvents();
  const now = Date.now();
  const dayMs = 86400000;
  const weekMs = 7 * dayMs;
  const monthMs = 30 * dayMs;

  const today = new Set<string>();
  const week = new Set<string>();
  const month = new Set<string>();
  const pageMap: Record<string, number> = {};
  const hourMap: Record<string, number> = {};

  interface Session {
    last: number;
    start: number;
    count: number;
  }
  const sessions = new Map<string, Session>();

  events.forEach(ev => {
    pageMap[ev.route] = (pageMap[ev.route] || 0) + 1;
    const h = new Date(ev.timestamp).toISOString().slice(11, 13) + ':00';
    hourMap[h] = (hourMap[h] || 0) + 1;

    if (now - ev.timestamp < dayMs) today.add(ev.ip);
    if (now - ev.timestamp < weekMs) week.add(ev.ip);
    if (now - ev.timestamp < monthMs) month.add(ev.ip);

    const s = sessions.get(ev.ip);
    if (!s || ev.timestamp - s.last > 30 * 60 * 1000) {
      sessions.set(ev.ip, { last: ev.timestamp, start: ev.timestamp, count: 1 });
    } else {
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
  let ticketWeeks: Record<string, { created: number; resolved: number }> = {};
  try {
    const ticketsRaw = fs.readFileSync(path.resolve(__dirname, '../data/tickets.json'), 'utf8');
    const tickets = JSON.parse(ticketsRaw) as Array<{ date: string; status: string } & any>;
    tickets.forEach(t => {
      const weekStart = new Date(t.date);
      weekStart.setUTCHours(0, 0, 0, 0);
      const day = weekStart.getUTCDay();
      const diff = weekStart.getUTCDate() - day;
      weekStart.setUTCDate(diff);
      const key = weekStart.toISOString().slice(0, 10);
      ticketWeeks[key] = ticketWeeks[key] || { created: 0, resolved: 0 };
      ticketWeeks[key].created += 1;
      if (t.status === 'closed') ticketWeeks[key].resolved += 1;
    });
  } catch {
    // ignore
  }

  const ticketData = Object.entries(ticketWeeks)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([week, { created, resolved }]) => ({ week, created, resolved }));

  // accounts by site
  let siteMap: Record<string, number> = {};
  try {
    const usersRaw = fs.readFileSync(path.resolve(__dirname, '../data/users.json'), 'utf8');
    const users = JSON.parse(usersRaw) as Array<{ role: string; site?: string; sites?: string[] }>;
    users.forEach(u => {
      const sites = u.role === 'manager' ? u.sites || [] : [u.site];
      sites.forEach(s => {
        if (s) siteMap[s] = (siteMap[s] || 0) + 1;
      });
    });
  } catch {
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
