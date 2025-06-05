export type Role = 'admin' | 'manager' | 'caf' | 'user';

export interface SessionRecord {
  userId: string;
  role: Role;
  login: string;
  logout?: string;
}

export interface FavoriteRecord {
  userId: string;
  itemId: string;
  date: string;
}

export interface IAnalytics {
  sessions: SessionRecord[];
  favorites: FavoriteRecord[];
  averages?: Record<string, { avg: number; prevAvg?: number; count: number }>;
}
