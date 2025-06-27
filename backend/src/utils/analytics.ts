import fs from 'fs';
import path from 'path';
import { Request } from 'express';
import { IAnalytics, SessionRecord, FavoriteRecord, Role } from '../models/IAnalytics';

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'analytics.json');

function load(): IAnalytics {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ sessions: [], favorites: [], averages: {} }, null, 2),
      'utf8',
    );
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf8');
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
  } catch {
    return { sessions: [], favorites: [], averages: {} };
  }
}

function save(data: IAnalytics) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function getParisTime(): Promise<string> {
  try {
    const res = await fetch('https://worldtimeapi.org/api/timezone/Europe/Paris');
    const data: any = await res.json();
    return data.datetime;
  } catch {
    return new Date().toISOString();
  }
}

export async function startSession(userId: string, role: Role): Promise<void> {
  const data = load();
  const login = await getParisTime();
  data.sessions.push({ userId, role, login });
  save(data);
}

export async function endSession(userId: string): Promise<void> {
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

export async function recordFavorite(userId: string, itemId: string): Promise<void> {
  const data = load();
  const date = await getParisTime();
  data.favorites.push({ userId, itemId, date });
  save(data);
}

export function getAnalyticsFile(): IAnalytics {
  return load();
}

export interface AnalyticsSummary {
  counts: {
    accounts: number;
    modules: number;
    items: number;
  };
  visitors: {
    today: number;
    week: number;
    month: { count: number; label: string };
  };
  sessions: {
    caf: number;
    manager: number;
    avgDurationCaf: number;
    avgDurationManager: number;
    // percent represents the share of logins for the hour slot (last 100 sessions)
    byHour: { hour: number; percent: number }[];
  };
  favorites: { itemId: string; title: string; count: number }[];
  sites: { site: string; count: number }[];
}

function parseDate(str: string): Date {
  return new Date(str);
}

function totalItems(mods: any[]): number {
  const walk = (items: any[]): number => items.reduce((n, it) => n + 1 + walk(it.children || []), 0);
  return mods.reduce((n, m) => n + walk(m.items || []), 0);
}

export function computeAnalytics(): AnalyticsSummary {
  const file = load();
  let users: any[] = [];
  let modules: any[] = [];
  try {
    users = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'users.json'), 'utf8'));
  } catch {}
  try {
    modules = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'modules.json'), 'utf8'));
  } catch {}

  const userRoles: Record<string,string> = {};
  users.forEach(u => { userRoles[u.id] = u.role; });

  const itemTitles: Record<string,string> = {};
  const collectTitles = (items: any[]) => {
    items.forEach(it => {
      itemTitles[it.id] = it.title || it.name || it.id;
      if (Array.isArray(it.children)) collectTitles(it.children);
    });
  };
  modules.forEach(m => collectTitles(m.items || []));

  const now = new Date();
  const monthLabel = now.toISOString().slice(0,7); // YYYY-MM

  const sessionsToday = new Set<string>();
  const sessionsWeek = new Set<string>();
  const sessionsMonth = new Set<string>();

  const cafDurations: number[] = [];
  const managerDurations: number[] = [];

  const sessionsArr = Array.isArray(file.sessions) ? file.sessions : [];
  sessionsArr.forEach((s) => {
    const login = parseDate(s.login);
    const logout = s.logout ? parseDate(s.logout) : null;

    const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0);
    if (login >= startOfDay) sessionsToday.add(s.userId);

    const startOfWeek = new Date(now); const day = startOfWeek.getDay(); const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); startOfWeek.setDate(diff); startOfWeek.setHours(0,0,0,0);
    if (login >= startOfWeek) sessionsWeek.add(s.userId);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); if (login >= startOfMonth) sessionsMonth.add(s.userId);

    if (logout) {
      const durationMin = Math.ceil((logout.getTime() - login.getTime()) / 60000);
      if (s.role === 'caf') cafDurations.push(durationMin); else if (s.role === 'manager') managerDurations.push(durationMin);
      // duration is only recorded for completed sessions
    }
  });

  const avg = (list: number[]) =>
    list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;

  const sortedSessions = [...sessionsArr].sort(
    (a, b) => new Date(b.login).getTime() - new Date(a.login).getTime(),
  );
  const lastSessions = sortedSessions.slice(0, 100);

  const repartition: Record<number, number> = {};
  for (let h = 8; h <= 18; h++) repartition[h] = 0;

  lastSessions.forEach(s => {
    const d = parseDate(s.login);
    let h = d.getUTCHours() + d.getUTCMinutes() / 60;
    if (h < 8) h = 8;
    if (h > 18.999) h = 18;
    const hInf = Math.floor(h);
    const hSup = Math.ceil(h);
    const wInf = hSup - h;
    const wSup = h - hInf;
    if (hInf >= 8 && hInf <= 18) repartition[hInf] += wInf;
    if (hSup >= 8 && hSup <= 18) repartition[hSup] += wSup;
  });

  const totalConsidered = Object.values(repartition).reduce((a, b) => a + b, 0) || 1;
  const byHour = Array.from({ length: 11 }, (_, i) => {
    const hour = 8 + i;
    const percent = Math.round((repartition[hour] / totalConsidered) * 1000) / 10;
    return { hour, percent };
  });

  const favMap: Record<string, Set<string>> = {};
  let favLists: any[] = [];
  try {
    favLists = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, 'favorites.json'), 'utf8'),
    );
  } catch {}
  favLists.forEach(f => {
    if (userRoles[f.userId] !== 'caf') return;
    (f.items || []).forEach((id: string) => {
      if (!favMap[id]) favMap[id] = new Set<string>();
      favMap[id].add(f.userId);
    });
  });
  const favorites = Object.entries(favMap)
    .map(([itemId, set]) => ({ itemId, title: itemTitles[itemId] || itemId, count: set.size }))
    .sort((a,b)=>b.count-a.count)
    .slice(0,10);

  const siteMap: Record<string, number> = {};
  users.forEach(u => {
    const sites = u.role === 'manager' ? (u.sites || []) : [u.site];
    sites.forEach((s: string)=>{ if(s) siteMap[s] = (siteMap[s]||0)+1; });
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
    sites: Object.entries(siteMap).map(([site,count])=>({site,count})),
  };
}
