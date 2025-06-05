import fs from 'fs';
import path from 'path';
import { Request } from 'express';
import { IAnalytics, SessionRecord, FavoriteRecord, Role } from '../models/IAnalytics';

const DATA_FILE = path.resolve(__dirname, '../data/analytics.json');

function load(): IAnalytics {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ sessions: [], favorites: [] }, null, 2), 'utf8');
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw) as IAnalytics;
  } catch {
    return { sessions: [], favorites: [] };
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
    byHour: { hour: string; avg: number }[];
  };
  favorites: { itemId: string; count: number }[];
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
    users = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/users.json'), 'utf8'));
  } catch {}
  try {
    modules = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/modules.json'), 'utf8'));
  } catch {}

  const now = new Date();
  const monthLabel = now.toISOString().slice(0,7); // YYYY-MM

  const sessionsToday = new Set<string>();
  const sessionsWeek = new Set<string>();
  const sessionsMonth = new Set<string>();

  const cafDurations: number[] = [];
  const managerDurations: number[] = [];
  const hourBuckets: Record<string, number[]> = {};
  for (let h = 6; h <= 20; h += 2) {
    const label = `${h.toString().padStart(2,'0')}:00`;
    hourBuckets[label] = [];
  }

  file.sessions.forEach((s) => {
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
      const hour = login.getHours();
      const bucket = Math.max(6, Math.min(20, hour + (hour % 2 ? -1 : 0)));
      const label = `${bucket.toString().padStart(2,'0')}:00`;
      hourBuckets[label].push(1);
    }
  });

  const avg = (list: number[]) => (list.length ? list.reduce((a,b)=>a+b,0)/list.length : 0);

  const byHour = Object.entries(hourBuckets).map(([hour,list])=>({hour, avg: avg(list)}));

  const favMap: Record<string, Set<string>> = {};
  file.favorites.forEach(f => {
    if (!favMap[f.itemId]) favMap[f.itemId] = new Set();
    favMap[f.itemId].add(f.userId);
  });
  const favorites = Object.entries(favMap)
    .map(([itemId, set]) => ({ itemId, count: set.size }))
    .sort((a,b)=>b.count-a.count)
    .slice(0,5);

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
